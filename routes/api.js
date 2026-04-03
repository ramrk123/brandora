const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Submit booking
router.post('/booking', async (req, res) => {
  try {
    const { name, district, contact_number, email, service_id, message } = req.body;

    if (!name || !district || !contact_number || !email || !service_id) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(contact_number)) {
      return res.status(400).json({ error: 'Please enter a valid contact number' });
    }

    const service = await db.getOne('SELECT name FROM services WHERE id = $1', [service_id]);
    if (!service) {
      return res.status(400).json({ error: 'Invalid service selected' });
    }

    const result = await db.query(
      'INSERT INTO bookings (name, district, contact_number, email, service_id, service_name, message) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [name, district, contact_number, email, service_id, service.name, message || '']
    );

    res.json({
      success: true,
      message: 'Your booking has been submitted successfully! We will contact you soon.',
      booking_id: result.rows[0].id
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Submit contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    await db.run(
      'INSERT INTO contacts (name, email, subject, message) VALUES ($1, $2, $3, $4)',
      [name, email, subject || '', message]
    );

    res.json({
      success: true,
      message: 'Thank you for reaching out! We will get back to you soon.'
    });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Get services (JSON)
router.get('/services', async (req, res) => {
  try {
    const services = await db.getAll('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order');
    res.json(services);
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

module.exports = router;
