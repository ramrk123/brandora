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
      title: 'BRANDDIGIX - Premium Logo Design & Website Development Agency',
      metaDescription: 'BRANDDIGIX helps businesses build a powerful digital identity with expert logo design, UI/UX, and fast web development. Transform your brand today.',
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
      title: 'Our Story & Creative Mission - About BRANDDIGIX',
      metaDescription: 'Learn about the experts behind BRANDDIGIX. Our mission is to deliver world-class design and technology solutions that help our clients grow.',
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
      title: 'Logo Design, UI/UX & Web Development Services - BRANDDIGIX',
      metaDescription: 'Explore our range of creative services from professional logo design to advanced web development. We help you stand out in the digital crowd.',
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
      title: 'Start Your Project - Book a Design Consultation | BRANDDIGIX',
      metaDescription: 'Ready to elevate your brand? Book a consultation with BRANDDIGIX today and start your journey toward a stunning digital identity.',
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
    title: 'Contact Our Creative Team | BRANDDIGIX Support',
    metaDescription: 'Have questions? Get in touch with BRANDDIGIX for logo design, web development, or general inquiries. We are here to help.',
    currentPage: 'contact'
  });
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://branddigix-com.onrender.com/sitemap.xml`);
});

// sitemap.xml
router.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const now = new Date().toISOString();
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://branddigix-com.onrender.com/</loc><lastmod>${now}</lastmod><priority>1.0</priority></url>
  <url><loc>https://branddigix-com.onrender.com/about</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>
  <url><loc>https://branddigix-com.onrender.com/services</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>
  <url><loc>https://branddigix-com.onrender.com/contact</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>
  <url><loc>https://branddigix-com.onrender.com/booking</loc><lastmod>${now}</lastmod><priority>0.6</priority></url>
</urlset>`);
});

module.exports = router;
