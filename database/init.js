const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'creative_agency.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT DEFAULT 'Admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    service_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    icon TEXT DEFAULT 'palette',
    price_display TEXT DEFAULT 'Contact for Quote',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    service_id INTEGER,
    service_name TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_key TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    body TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default admin
function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'branddigix@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run(adminEmail, hash, 'BRANDDIGIX');
    console.log('✅ Default admin created:', adminEmail);
  }
}

// Seed default services
function seedServices() {
  const count = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
  if (count === 0) {
    const services = [
      {
        name: 'Logo Creation',
        slug: 'logo-creation',
        description: 'Stand out with a unique, professional logo that captures your brand essence. We craft memorable logos that make lasting impressions and establish strong visual identities for businesses of all sizes.',
        benefits: 'Unique custom designs|Multiple revisions included|Vector files for all formats|Brand guideline document|Fast turnaround time',
        icon: 'pen-tool',
        sort_order: 1
      },
      {
        name: 'UI/UX Design',
        slug: 'ui-ux-design',
        description: 'Create intuitive, beautiful digital experiences that users love. Our UI/UX design process combines research, strategy, and creativity to build interfaces that drive engagement and conversions.',
        benefits: 'User research & analysis|Wireframing & prototyping|Interactive mockups|Usability testing|Design system creation',
        icon: 'layout',
        sort_order: 2
      },
      {
        name: 'Website Development',
        slug: 'website-development',
        description: 'Get a fast, responsive, and modern website built with the latest technologies. From landing pages to complex web applications, we deliver high-performance digital solutions.',
        benefits: 'Responsive design|SEO optimized|Fast loading speed|Cross-browser compatible|Easy content management',
        icon: 'code',
        sort_order: 3
      },
      {
        name: 'Theme Design',
        slug: 'theme-design',
        description: 'Specialized theme designs for restaurants, coffee shops, salons, and more. We create industry-specific designs that resonate with your target audience and elevate your brand.',
        benefits: 'Industry-specific designs|Menu & booking integration|Photo gallery included|Social media ready|Mobile optimized',
        icon: 'palette',
        sort_order: 4
      },
      {
        name: 'Custom Design Services',
        slug: 'custom-design',
        description: 'Need something unique? From business cards to full brand identity packages, social media kits to marketing materials – we bring your creative vision to life.',
        benefits: 'Tailored to your needs|Unlimited concepts|Print & digital ready|Source files included|Dedicated designer',
        icon: 'star',
        sort_order: 5
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO services (name, slug, description, benefits, icon, sort_order)
      VALUES (@name, @slug, @description, @benefits, @icon, @sort_order)
    `);

    for (const service of services) {
      stmt.run(service);
    }
    console.log('✅ Default services created');
  }
}

// Seed default content
function seedContent() {
  const count = db.prepare('SELECT COUNT(*) as c FROM content').get().c;
  if (count === 0) {
    const content = [
      {
        section_key: 'hero_heading',
        title: 'We Design Your Digital Identity',
        subtitle: 'From logos to full websites – we build your brand',
        body: ''
      },
      {
        section_key: 'about_intro',
        title: 'About BRANDDIGIX',
        subtitle: 'Crafting Digital Excellence Since Day One',
        body: 'We are a passionate creative agency dedicated to transforming your digital presence. With a focus on innovation, quality, and customer satisfaction, we deliver design solutions that make your brand stand out in the digital landscape.'
      },
      {
        section_key: 'about_mission',
        title: 'Our Mission',
        subtitle: '',
        body: 'To empower businesses with stunning digital identities that drive growth, build trust, and create lasting connections with their audience. We believe every brand deserves a world-class digital presence.'
      },
      {
        section_key: 'about_vision',
        title: 'Our Vision',
        subtitle: '',
        body: 'To become the go-to creative partner for businesses worldwide, known for our exceptional design quality, innovative approach, and unwavering commitment to client success.'
      },
      {
        section_key: 'about_story',
        title: 'Our Story',
        subtitle: '',
        body: 'Born from a passion for design and technology, BRANDDIGIX started with a simple belief: every business, no matter its size, deserves a premium digital identity. What began as a one-person mission has grown into a dedicated creative studio serving clients across industries.'
      },
      {
        section_key: 'company_overview',
        title: 'BRANDDIGIX',
        subtitle: 'Your Creative Partner',
        body: 'BRANDDIGIX is a full-service creative agency specializing in logo design, UI/UX, website development, and theme design. We combine artistic creativity with technical expertise to deliver solutions that not only look stunning but also perform exceptionally.'
      },
      {
        section_key: 'why_choose_us',
        title: 'Why Choose Us',
        subtitle: 'What Makes Us Different',
        body: 'Premium quality at competitive prices|Fast turnaround without compromising quality|Dedicated support from concept to launch|Modern designs that follow latest trends|100% satisfaction guarantee'
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO content (section_key, title, subtitle, body)
      VALUES (@section_key, @title, @subtitle, @body)
    `);

    for (const item of content) {
      stmt.run(item);
    }
    console.log('✅ Default content created');
  }
}

function initialize() {
  seedAdmin();
  seedServices();
  seedContent();
}

module.exports = { db, initialize };
