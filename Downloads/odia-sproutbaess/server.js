require('dotenv').config();
const express = require('express');
const { engine } = require('express-handlebars');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & performance
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Handlebars template engine
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    formatPrice: (p) => `₹${p}`,
    array: (...args) => args.slice(0, -1),
    range: (n) => Array.from({ length: n }, (_, i) => i),
    math: (a, op, b) => {
      a = parseFloat(a); b = parseFloat(b);
      if (op === '*') return a * b;
      if (op === '+') return a + b;
      if (op === '-') return a - b;
      if (op === '/') return a / b;
    },
    lookup: (arr, i) => arr && arr[i],
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', require('./routes/index'));
app.use('/shop', require('./routes/shop'));
app.use('/cart', require('./routes/cart'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`🙏 Jai Jagannath! Server running on http://localhost:${PORT}`);
});

module.exports = app;
