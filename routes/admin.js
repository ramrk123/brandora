const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary for permanent image storage
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'branddigix-projects',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }] 
  }
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
    const admin = await db.getOne('SELECT * FROM admins WHERE email = $1', [email]);

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
  } catch(err) {
    console.error('Login error:', err);
    res.render('admin/login', { title: 'Admin Login', error: 'Server error. Try again.' });
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
    const totalBookings = (await db.getOne('SELECT COUNT(*) as c FROM bookings')).c;
    const pendingBookings = (await db.getOne("SELECT COUNT(*) as c FROM bookings WHERE status = 'Pending'")).c;
    const inProgressBookings = (await db.getOne("SELECT COUNT(*) as c FROM bookings WHERE status = 'In Progress'")).c;
    const completedBookings = (await db.getOne("SELECT COUNT(*) as c FROM bookings WHERE status = 'Completed'")).c;
    const totalContacts = (await db.getOne('SELECT COUNT(*) as c FROM contacts')).c;
    const unreadContacts = (await db.getOne('SELECT COUNT(*) as c FROM contacts WHERE is_read = 0')).c;
    const totalServices = (await db.getOne('SELECT COUNT(*) as c FROM services WHERE is_active = 1')).c;
    const servicesList = await db.getAll('SELECT name FROM services WHERE is_active = 1 ORDER BY sort_order');

    const recentBookings = await db.getAll('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5');
    const recentContacts = await db.getAll('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5');

    const serviceStats = await db.getAll(`
      SELECT service_name, COUNT(*) as count
      FROM bookings
      GROUP BY service_name
      ORDER BY count DESC
    `);

    const recentProjects = await db.getAll('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5');

    res.render('admin/dashboard', {
      title: 'Dashboard - Admin',
      currentPage: 'dashboard',
      admin: req.admin,
      stats: {
        totalBookings: parseInt(totalBookings),
        pendingBookings: parseInt(pendingBookings),
        inProgressBookings: parseInt(inProgressBookings),
        completedBookings: parseInt(completedBookings),
        totalContacts: parseInt(totalContacts),
        unreadContacts: parseInt(unreadContacts),
        totalServices: parseInt(totalServices)
      },
      recentBookings,
      recentContacts,
      serviceStats,
      recentProjects,
      servicesList
    });
  } catch(err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customer management
router.get('/customers', async (req, res) => {
  try {
    const search = req.query.search || '';
    const serviceFilter = req.query.service || '';

    let query = `SELECT name, email, district, contact_number,
      STRING_AGG(DISTINCT service_name, ', ') as services,
      COUNT(*) as booking_count,
      MAX(created_at) as last_booking
      FROM bookings WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1} OR district ILIKE $${paramIndex + 2} OR contact_number ILIKE $${paramIndex + 3})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 4;
    }

    if (serviceFilter) {
      query += ` AND service_name = $${paramIndex}`;
      params.push(serviceFilter);
      paramIndex++;
    }

    query += ` GROUP BY name, email, district, contact_number ORDER BY last_booking DESC`;

    const customers = await db.getAll(query, params);
    const services = await db.getAll('SELECT DISTINCT service_name FROM bookings');

    res.render('admin/customers', {
      title: 'Customers - Admin',
      currentPage: 'customers',
      admin: req.admin,
      customers,
      services: services.map(s => s.service_name),
      search,
      serviceFilter
    });
  } catch(err) {
    console.error('Customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Booking management
router.get('/bookings', async (req, res) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1} OR service_name ILIKE $${paramIndex + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    query += ' ORDER BY created_at DESC';

    const bookings = await db.getAll(query, params);

    res.render('admin/bookings', {
      title: 'Bookings - Admin',
      currentPage: 'bookings',
      admin: req.admin,
      bookings,
      statusFilter: status,
      search
    });
  } catch(err) {
    console.error('Bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.post('/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  await db.run('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
  res.json({ success: true });
});

// Delete booking
router.delete('/bookings/:id', async (req, res) => {
  await db.run('DELETE FROM bookings WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Services management
router.get('/services', async (req, res) => {
  const services = await db.getAll('SELECT * FROM services ORDER BY sort_order');
  res.render('admin/services', {
    title: 'Services - Admin',
    currentPage: 'services',
    admin: req.admin,
    services
  });
});

// Add service
router.post('/services', async (req, res) => {
  const { name, description, benefits, icon, price_display } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const maxOrder = await db.getOne('SELECT COALESCE(MAX(sort_order), 0) as m FROM services');

  await db.run(
    'INSERT INTO services (name, slug, description, benefits, icon, price_display, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [name, slug, description, benefits || '', icon || 'palette', price_display || 'Contact for Quote', (maxOrder.m || 0) + 1]
  );

  res.json({ success: true });
});

// Update service
router.put('/services/:id', async (req, res) => {
  const { name, description, benefits, icon, price_display, is_active } = req.body;

  await db.run(
    'UPDATE services SET name = $1, description = $2, benefits = $3, icon = $4, price_display = $5, is_active = $6, updated_at = NOW() WHERE id = $7',
    [name, description, benefits || '', icon || 'palette', price_display || 'Contact for Quote', is_active !== undefined ? is_active : 1, req.params.id]
  );

  res.json({ success: true });
});

// Delete service
router.delete('/services/:id', async (req, res) => {
  await db.run('DELETE FROM services WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Content management
router.get('/content', async (req, res) => {
  const content = await db.getAll('SELECT * FROM content ORDER BY id');
  res.render('admin/content', {
    title: 'Content - Admin',
    currentPage: 'content',
    admin: req.admin,
    content
  });
});

// Update content
router.put('/content/:key', async (req, res) => {
  const { title, subtitle, body } = req.body;
  await db.run(
    'UPDATE content SET title = $1, subtitle = $2, body = $3, updated_at = NOW() WHERE section_key = $4',
    [title || '', subtitle || '', body || '', req.params.key]
  );
  res.json({ success: true });
});

// Messages / Contact submissions
router.get('/messages', async (req, res) => {
  const messages = await db.getAll('SELECT * FROM contacts ORDER BY created_at DESC');
  res.render('admin/messages', {
    title: 'Messages - Admin',
    currentPage: 'messages',
    admin: req.admin,
    messages
  });
});

// Mark message as read
router.put('/messages/:id/read', async (req, res) => {
  await db.run('UPDATE contacts SET is_read = 1 WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Delete message
router.delete('/messages/:id', async (req, res) => {
  await db.run('DELETE FROM contacts WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Projects Management
router.get('/projects', async (req, res) => {
  const projects = await db.getAll('SELECT * FROM projects ORDER BY created_at DESC');
  const services = await db.getAll('SELECT name FROM services ORDER BY sort_order');
  res.render('admin/projects', { title: 'Projects - Admin', currentPage: 'projects', admin: req.admin, projects, services });
});

router.post('/projects', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('Image required');
  try {
    // req.file.path is the cloud URL provided by cloudinary
    await db.run(
      'INSERT INTO projects (title, service_name, image_url) VALUES ($1, $2, $3)',
      [req.body.title, req.body.service_name, req.file.path]
    );
    res.redirect('/admin/projects');
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('Error uploading project');
  }
});

router.delete('/projects/:id', async (req, res) => {
  await db.run('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
