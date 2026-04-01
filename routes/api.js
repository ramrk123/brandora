const express = require('express');
const router = express.Router();
const { Service, Booking, Contact } = require('../database/models');

// Submit booking
router.post('/booking', async (req, res) => {
  try {
    const { name, district, contact_number, email, service_id, message } = req.body;

    // Validation
    if (!name || !district || !contact_number || !email || !service_id) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Get service info
    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(400).json({ error: 'Invalid service selected' });
    }

    const newBooking = await Booking.create({
      name,
      district,
      contact_number,
      email,
      service_id,
      service_name: service.name,
      message: message || ''
    });

    res.json({
      success: true,
      message: 'Your booking has been submitted successfully! We will contact you soon.',
      booking_id: newBooking._id
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

    await Contact.create({
      name,
      email,
      subject: subject || '',
      message
    });

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
    const services = await Service.find({ is_active: true }).sort({ sort_order: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

module.exports = router;
