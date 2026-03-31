const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = require('path').join(__dirname, '../public/uploads/projects');
    if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true });
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
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Please fill in all fields' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Invalid email or password' });
  }

  const token = generateToken(admin);
  res.cookie('admin_token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  });

  res.redirect('/admin/dashboard');
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

router.get('/dashboard', (req, res) => {
  const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
  const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'Pending'").get().c;
  const inProgressBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'In Progress'").get().c;
  const completedBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'Completed'").get().c;
  const totalContacts = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c;
  const unreadContacts = db.prepare('SELECT COUNT(*) as c FROM contacts WHERE is_read = 0').get().c;
  const totalServices = db.prepare('SELECT COUNT(*) as c FROM services WHERE is_active = 1').get().c;
  const servicesList = db.prepare('SELECT name FROM services WHERE is_active = 1 ORDER BY sort_order').all();

  const recentBookings = db.prepare(`
    SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5
  `).all();

  const recentContacts = db.prepare(`
    SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5
  `).all();

  // Service popularity
  const serviceStats = db.prepare(`
    SELECT service_name, COUNT(*) as count 
    FROM bookings 
    GROUP BY service_name 
    ORDER BY count DESC
  `).all();

  const recentProjects = db.prepare(`
    SELECT * FROM projects ORDER BY created_at DESC LIMIT 5
  `).all();

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
});

// Customer management
router.get('/customers', (req, res) => {
  const search = req.query.search || '';
  const serviceFilter = req.query.service || '';
  
  let query = `SELECT DISTINCT name, email, district, contact_number, 
    GROUP_CONCAT(DISTINCT service_name) as services,
    COUNT(*) as booking_count,
    MAX(created_at) as last_booking
    FROM bookings WHERE 1=1`;
  const params = [];

  if (search) {
    query += ` AND (name LIKE ? OR email LIKE ? OR district LIKE ? OR contact_number LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (serviceFilter) {
    query += ` AND service_name = ?`;
    params.push(serviceFilter);
  }

  query += ` GROUP BY email ORDER BY last_booking DESC`;

  const customers = db.prepare(query).all(...params);
  const services = db.prepare('SELECT DISTINCT service_name FROM bookings').all();

  res.render('admin/customers', {
    title: 'Customers - Admin',
    currentPage: 'customers',
    admin: req.admin,
    customers,
    services: services.map(s => s.service_name),
    search,
    serviceFilter
  });
});

// Booking management
router.get('/bookings', (req, res) => {
  const status = req.query.status || '';
  const search = req.query.search || '';
  
  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR service_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const bookings = db.prepare(query).all(...params);

  res.render('admin/bookings', {
    title: 'Bookings - Admin',
    currentPage: 'bookings',
    admin: req.admin,
    bookings,
    statusFilter: status,
    search
  });
});

// Update booking status
router.post('/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Delete booking
router.delete('/bookings/:id', (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Services management
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY sort_order').all();

  res.render('admin/services', {
    title: 'Services - Admin',
    currentPage: 'services',
    admin: req.admin,
    services
  });
});

// Add service
router.post('/services', (req, res) => {
  const { name, description, benefits, icon, price_display } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM services').get().m || 0;

  db.prepare(`
    INSERT INTO services (name, slug, description, benefits, icon, price_display, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description, benefits || '', icon || 'palette', price_display || 'Contact for Quote', maxOrder + 1);

  res.json({ success: true });
});

// Update service
router.put('/services/:id', (req, res) => {
  const { name, description, benefits, icon, price_display, is_active } = req.body;

  db.prepare(`
    UPDATE services SET name = ?, description = ?, benefits = ?, icon = ?, price_display = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, benefits || '', icon || 'palette', price_display || 'Contact for Quote', is_active !== undefined ? is_active : 1, req.params.id);

  res.json({ success: true });
});

// Delete service
router.delete('/services/:id', (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Content management
router.get('/content', (req, res) => {
  const content = db.prepare('SELECT * FROM content ORDER BY id').all();

  res.render('admin/content', {
    title: 'Content - Admin',
    currentPage: 'content',
    admin: req.admin,
    content
  });
});

// Update content
router.put('/content/:key', (req, res) => {
  const { title, subtitle, body } = req.body;

  db.prepare(`
    UPDATE content SET title = ?, subtitle = ?, body = ?, updated_at = CURRENT_TIMESTAMP
    WHERE section_key = ?
  `).run(title || '', subtitle || '', body || '', req.params.key);

  res.json({ success: true });
});

// Messages / Contact submissions
router.get('/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();

  res.render('admin/messages', {
    title: 'Messages - Admin',
    currentPage: 'messages',
    admin: req.admin,
    messages
  });
});

// Mark message as read
router.put('/messages/:id/read', (req, res) => {
  db.prepare('UPDATE contacts SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Delete message
router.delete('/messages/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Projects Management
router.get('/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  const services = db.prepare('SELECT name FROM services ORDER BY sort_order').all();
  res.render('admin/projects', { title: 'Projects - Admin', currentPage: 'projects', admin: req.admin, projects, services });
});

router.post('/projects', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send('Image required');
  db.prepare('INSERT INTO projects (title, service_name, image_url) VALUES (?, ?, ?)').run(
    req.body.title, req.body.service_name, '/uploads/projects/' + req.file.filename
  );
  res.redirect('/admin/projects');
});

router.delete('/projects/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
