const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Admin, Service, Content } = require('./models');

// Configure MongoDB URI (local fallback for development)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/branddigix';

// --- init logic ---

const initDB = async () => {
  try {
    console.log('⏳ Connecting to MongoDB at:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');

    // 1. Seed Default Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'branddigix@gmail.com';
    const adminExists = await Admin.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      await Admin.create({ email: adminEmail, password: hashedPassword, name: 'BRANDDIGIX' });
      console.log('✅ Initial Admin created:', adminEmail);
    }

    // 2. Seed Default Content
    const contentCount = await Content.countDocuments();
    if (contentCount === 0) {
      await Content.insertMany([
        { section_key: 'hero_heading', title: 'We Design Your Digital Identity', subtitle: 'From logos to full websites – we build your brand' },
        { section_key: 'about_intro', title: 'About BRANDDIGIX', subtitle: 'Discover the passion behind our designs' },
        { section_key: 'why_choose_us', title: 'Why Choose Us', subtitle: 'Excellence in every pixel' }
      ]);
      console.log('✅ Default Content seeded');
    }

    // 3. Seed Default Services if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount <= 1) { // Also catch if only the fallback logo one exists
      const servicesData = [
        {
          name: 'Logo Creation',
          slug: 'logo-creation',
          description: 'Stand out with a professional logo.',
          benefits: 'Custom Design|Unlimited Revisions',
          icon: 'pen-tool',
          sort_order: 1
        },
        {
          name: 'Website Development',
          slug: 'website-development',
          description: 'High-performance, modern websites built for your business.',
          benefits: 'Responsive Design|SEO Optimized|CMS Integrated',
          icon: 'code',
          sort_order: 2
        },
        {
          name: 'UIUX Design',
          slug: 'uiux-design',
          description: 'User-centric designs that convert visitors into customers.',
          benefits: 'User Research|Wireframing|Prototyping',
          icon: 'layout',
          sort_order: 3
        },
        {
          name: 'Theme Creation',
          slug: 'theme-creation',
          description: 'Specialized themes for Cafes, Restaurants, and Luxury brands.',
          benefits: 'Industry Specific|Mobile Ready|One-Click Install',
          icon: 'palette',
          sort_order: 4
        }
      ];

      for (const s of servicesData) {
        await Service.findOneAndUpdate({ slug: s.slug }, s, { upsert: true });
      }
      console.log('✅ All 4 services synchronized and seeded');
    }

  } catch (err) {
    console.error('❌ MongoDB Initialization error:', err.message);
    // process.exit(1);
  }
};

module.exports = initDB;
