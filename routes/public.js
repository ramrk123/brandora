const express = require('express');
const router = express.Router();
const { Service, Content, Project } = require('../database/models');

// Home page
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ is_active: true }).sort({ sort_order: 1 });
    const heroContent = await Content.findOne({ section_key: 'hero_heading' });
    const whyChoose = await Content.findOne({ section_key: 'why_choose_us' });
    const projects = await Project.find().sort({ created_at: -1 }).limit(6);

    res.render('public/home', {
      projects,
      title: 'BRANDDIGIX - We Design Your Digital Identity',
      currentPage: 'home',
      services,
      heroContent,
      whyChoose
    });
  } catch (err) {
    res.status(500).send('Error loading homepage');
  }
});

// About page
router.get('/about', async (req, res) => {
  try {
    const intro = await Content.findOne({ section_key: 'about_intro' });
    const mission = await Content.findOne({ section_key: 'about_mission' });
    const vision = await Content.findOne({ section_key: 'about_vision' });
    const story = await Content.findOne({ section_key: 'about_story' });
    const whyChoose = await Content.findOne({ section_key: 'why_choose_us' });
    const company = await Content.findOne({ section_key: 'company_overview' });

    res.render('public/about', {
      title: 'About Us - BRANDDIGIX',
      currentPage: 'about',
      intro, mission, vision, story, whyChoose, company
    });
  } catch (err) {
    res.status(500).send('Error loading about page');
  }
});

// Services page
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find({ is_active: true }).sort({ sort_order: 1 });
    res.render('public/services', {
      title: 'Our Services - BRANDDIGIX',
      currentPage: 'services',
      services
    });
  } catch (err) {
    res.status(500).send('Error loading services page');
  }
});

// Booking page
router.get('/booking', async (req, res) => {
  try {
    const services = await Service.find({ is_active: true }).sort({ sort_order: 1 });
    const preselected = req.query.service || '';
    res.render('public/booking', {
      title: 'Book a Service - BRANDDIGIX',
      currentPage: 'booking',
      services,
      preselected
    });
  } catch (err) {
    res.status(500).send('Error loading booking page');
  }
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Contact Us - BRANDDIGIX',
    currentPage: 'contact'
  });
});

module.exports = router;
