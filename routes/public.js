const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Home page
router.get('/', async (req, res) => {
  try {
    const services = await db.getAll('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order');
    const heroContent = await db.getOne("SELECT * FROM content WHERE section_key = 'hero_heading'");
    const whyChoose = await db.getOne("SELECT * FROM content WHERE section_key = 'why_choose_us'");

    let projects = [];
    try { projects = await db.getAll('SELECT * FROM projects ORDER BY created_at DESC LIMIT 6'); } catch(e){}

    res.render('public/home', {
      projects,
      title: 'BRANDDIGIX - We Design Your Digital Identity',
      currentPage: 'home',
      services,
      heroContent,
      whyChoose
    });
  } catch(err) {
    console.error('Home error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// About page
router.get('/about', async (req, res) => {
  try {
    const intro = await db.getOne("SELECT * FROM content WHERE section_key = 'about_intro'");
    const mission = await db.getOne("SELECT * FROM content WHERE section_key = 'about_mission'");
    const vision = await db.getOne("SELECT * FROM content WHERE section_key = 'about_vision'");
    const story = await db.getOne("SELECT * FROM content WHERE section_key = 'about_story'");
    const whyChoose = await db.getOne("SELECT * FROM content WHERE section_key = 'why_choose_us'");
    const company = await db.getOne("SELECT * FROM content WHERE section_key = 'company_overview'");

    res.render('public/about', {
      title: 'About Us - BRANDDIGIX',
      currentPage: 'about',
      intro, mission, vision, story, whyChoose, company
    });
  } catch(err) {
    console.error('About error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Services page
router.get('/services', async (req, res) => {
  try {
    const services = await db.getAll('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order');
    res.render('public/services', {
      title: 'Our Services - BRANDDIGIX',
      currentPage: 'services',
      services
    });
  } catch(err) {
    console.error('Services error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Booking page
router.get('/booking', async (req, res) => {
  try {
    const services = await db.getAll('SELECT id, name FROM services WHERE is_active = 1 ORDER BY sort_order');
    const preselected = req.query.service || '';
    res.render('public/booking', {
      title: 'Book a Service - BRANDDIGIX',
      currentPage: 'booking',
      services,
      preselected
    });
  } catch(err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Contact Us - BRANDDIGIX',
    currentPage: 'contact'
  });
});

// Debug route (Internal Use)
router.get('/check-db', async (req, res) => {
  try {
    const result = await db.getOne('SELECT NOW() as now');
    res.json({ 
      success: true, 
      time: result.now,
      env_keys: Object.keys(process.env).sort()
    });
  } catch (err) {
    res.json({ 
      success: false, 
      error: err.message, 
      code: err.code,
      env_keys: Object.keys(process.env).sort(),
      stack: err.stack 
    });
  }
});

module.exports = router;
