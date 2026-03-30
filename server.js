require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initialize } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
initialize();

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
  console.log(`\n🚀 Creative Agency Platform running at http://localhost:${PORT}`);
  console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`\n   Default Admin: ${process.env.ADMIN_EMAIL}`);
  console.log(`   Default Pass:  ${process.env.ADMIN_PASSWORD}\n`);
});
