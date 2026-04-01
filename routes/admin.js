const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Admin, Service, Booking, Contact, Project, Content } = require('../database/models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/projects');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const { authenticateAdmin, generateToken } = require('../middleware/auth');

// Admin login page
router.get('/login', (req, res) => {
  if (req.cookies?.admin_token) {
    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(req.cookies.admin_token, process.env.JWT_SECRET || 'branddigix_secret_key_2024');
      return res.redirect('/admin/dashboard');
    } catch (e) { /* continue to login */ }
  }
  res.render('admin/login', { title: 'Admin Login', error: null });
});

// Admin login POST
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Please fill in all fields' });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid email or password' });
    }

    const token = generateToken(admin);
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    res.redirect('/admin/dashboard');
  } catch (err) {
    res.render('admin/login', { title: 'Admin Login', error: 'Server error' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
});

// ==================== PROTECTED ROUTES ====================
router.use(authenticateAdmin);

// Dashboard overview
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

router.get('/dashboard', async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const inProgressBookings = await Booking.countDocuments({ status: 'In Progress' });
    const completedBookings = await Booking.countDocuments({ status: 'Completed' });
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ is_read: false });
    const totalServices = await Service.countDocuments({ is_active: true });
    
    const servicesList = await Service.find({ is_active: true }).sort({ sort_order: 1 });
    const recentBookings = await Booking.find().sort({ created_at: -1 }).limit(5);
    const recentContacts = await Contact.find().sort({ created_at: -1 }).limit(5);
    const recentProjects = await Project.find().sort({ created_at: -1 }).limit(5);

    // Simulated serviceStats (aggregation needed for real stats)
    const stats = await Booking.aggregate([
      { $group: { _id: "$service_name", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const serviceStats = stats.map(s => ({ service_name: s._id, count: s.count }));

    res.render('admin/dashboard', {
      title: 'Dashboard - Admin',
      currentPage: 'dashboard',
      admin: req.admin,
      stats: { totalBookings, pendingBookings, inProgressBookings, completedBookings, totalContacts, unreadContacts, totalServices },
      recentBookings,
      recentContacts,
      serviceStats,
      recentProjects,
      servicesList
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard Loading Error');
  }
});

// Customer management (Unique Emails in Bookings)
router.get('/customers', async (req, res) => {
  try {
    const search = req.query.search || '';
    const serviceFilter = req.query.service || '';

    // MongoDB Aggregation for customers
    let matchStage = {};
    if (search) {
      matchStage.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { district: new RegExp(search, 'i') }
      ];
    }
    if (serviceFilter) {
      matchStage.service_name = serviceFilter;
    }

    const customers = await Booking.aggregate([
      { $match: matchStage },
      { $group: {
          _id: "$email",
          name: { $first: "$name" },
          email: { $first: "$email" },
          district: { $first: "$district" },
          contact_number: { $first: "$contact_number" },
          services: { $addToSet: "$service_name" },
          booking_count: { $sum: 1 },
          last_booking: { $max: "$created_at" }
      }},
      { $sort: { last_booking: -1 } }
    ]);

    const distinctServices = await Booking.distinct('service_name');

    res.render('admin/customers', {
      title: 'Customers - Admin',
      currentPage: 'customers',
      admin: req.admin,
      customers,
      services: distinctServices,
      search,
      serviceFilter
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

// Booking management
router.get('/bookings', async (req, res) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { service_name: new RegExp(search, 'i') }
      ];
    }

    const bookings = await Booking.find(query).sort({ created_at: -1 });

    res.render('admin/bookings', {
      title: 'Bookings - Admin',
      currentPage: 'bookings',
      admin: req.admin,
      bookings,
      statusFilter: status,
      search
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

// Update booking status
router.post('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await Booking.findByIdAndUpdate(req.params.id, { status, updated_at: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update Failed' });
  }
});

// Delete booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete Failed' });
  }
});

// Services management
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ sort_order: 1 });
    res.render('admin/services', {
      title: 'Services - Admin',
      currentPage: 'services',
      admin: req.admin,
      services
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

// Add service
router.post('/services', async (req, res) => {
  try {
    const { name, description, benefits, icon, price_display } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const lastService = await Service.findOne().sort({ sort_order: -1 });
    const sort_order = lastService ? lastService.sort_order + 1 : 1;

    await Service.create({ name, slug, description, benefits: benefits || '', icon: icon || 'palette', price_display: price_display || 'Contact for Quote', sort_order });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Create Failed' });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
  try {
    const { name, description, benefits, icon, price_display, is_active } = req.body;
    await Service.findByIdAndUpdate(req.params.id, { name, description, benefits, icon, price_display, is_active, updated_at: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update Failed' });
  }
});

// Delete service
router.delete('/services/:id', async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete Failed' });
  }
});

// Projects Management
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ created_at: -1 });
    const services = await Service.find({ is_active: true }).sort({ sort_order: 1 });
    res.render('admin/projects', { title: 'Projects - Admin', currentPage: 'projects', admin: req.admin, projects, services });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.post('/projects', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Image required');
    await Project.create({
      title: req.body.title,
      service_name: req.body.service_name,
      image_url: '/uploads/projects/' + req.file.filename
    });
    res.redirect('/admin/projects');
  } catch (err) {
    res.status(500).send('Upload Failed');
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete Failed' });
  }
});

// Content management
router.get('/content', async (req, res) => {
  try {
    const content = await Content.find().sort({ section_key: 1 });
    res.render('admin/content', {
      title: 'Content - Admin',
      currentPage: 'content',
      admin: req.admin,
      content
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.put('/content/:key', async (req, res) => {
  try {
    const { title, subtitle, body } = req.body;
    await Content.findOneAndUpdate({ section_key: req.params.key }, { title, subtitle, body, updated_at: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update Failed' });
  }
});

// Messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ created_at: -1 });
    res.render('admin/messages', {
      title: 'Messages - Admin',
      currentPage: 'messages',
      admin: req.admin,
      messages
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.put('/messages/:id/read', async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update Failed' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete Failed' });
  }
});

module.exports = router;
