const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

// Home page
router.get('/', (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order').all();
  const heroContent = db.prepare("SELECT * FROM content WHERE section_key = 'hero_heading'").get();
  const whyChoose = db.prepare("SELECT * FROM content WHERE section_key = 'why_choose_us'").get();
  
  res.render('public/home', {
      projects,
    title: 'BRANDDIGIX - We Design Your Digital Identity',
    currentPage: 'home',
    services,
    heroContent,
    whyChoose
  });
});

// About page
router.get('/about', (req, res) => {
  const intro = db.prepare("SELECT * FROM content WHERE section_key = 'about_intro'").get();
  const mission = db.prepare("SELECT * FROM content WHERE section_key = 'about_mission'").get();
  const vision = db.prepare("SELECT * FROM content WHERE section_key = 'about_vision'").get();
  const story = db.prepare("SELECT * FROM content WHERE section_key = 'about_story'").get();
  const whyChoose = db.prepare("SELECT * FROM content WHERE section_key = 'why_choose_us'").get();
  const company = db.prepare("SELECT * FROM content WHERE section_key = 'company_overview'").get();

  res.render('public/about', {
    title: 'About Us - BRANDDIGIX',
    currentPage: 'about',
    intro, mission, vision, story, whyChoose, company
  });
});

// Services page
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order').all();
  
  res.render('public/services', {
    title: 'Our Services - BRANDDIGIX',
    currentPage: 'services',
    services
  });
});

// Booking page
router.get('/booking', (req, res) => {
  const services = db.prepare('SELECT id, name FROM services WHERE is_active = 1 ORDER BY sort_order').all();
  const preselected = req.query.service || '';
  
  res.render('public/booking', {
    title: 'Book a Service - BRANDDIGIX',
    currentPage: 'booking',
    services,
    preselected
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Contact Us - BRANDDIGIX',
    currentPage: 'contact'
  });
});

module.exports = router;
