require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initialize } = require('./database/init');

const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Performance: Minify & Compress all responses
app.use(compression());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serves static files with 1-Year aggressive browser caching for speed
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true
}));

// Initialize database then start server
async function startServer() {
  await initialize();

  // Routes
  app.use('/', require('./routes/public'));
  app.use('/api', require('./routes/api'));
  app.use('/admin', require('./routes/admin'));

  // 404 handler
  app.use((req, res) => {
    res.status(404).render('public/404', {
      title: '404 - Page Not Found',
      currentPage: ''
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 BRANDDIGIX Platform running at http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`🗄️  Database: PostgreSQL (Cloud)`);
    console.log(`\n   Admin Email: ${process.env.ADMIN_EMAIL || 'branddigix@gmail.com'}`);
    console.log(`   Admin Pass:  ${process.env.ADMIN_PASSWORD || 'admin123'}\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
