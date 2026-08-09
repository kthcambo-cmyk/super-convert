// Polyfills for Node.js / pkg compatibility (pdfjs-dist & DOM environments)
if (typeof process.getBuiltinModule === 'undefined') {
  process.getBuiltinModule = function (id) {
    try { return require(id); } catch (_) { return null; }
  };
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const assistantRoutes = require('./routes/assistantRoutes');
const { initCleanupCron } = require('./services/cleanupService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const isPkg = typeof process.pkg !== 'undefined';
const baseRuntimeDir = isPkg ? path.dirname(process.execPath) : __dirname;
const uploadsDir = path.join(baseRuntimeDir, 'uploads');
const processedDir = path.join(baseRuntimeDir, 'processed');
const publicDir = path.join(__dirname, 'public');

// Serve static frontend UI
app.use(express.static(publicDir));

// Mount assistant API routes
app.use('/api', assistantRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Advanced AI File Assistant',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for all unmatched GET requests
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Initialize cleanup cron for temporary files (60 minutes TTL)
if (process.env.NODE_ENV !== 'test') {
  initCleanupCron([uploadsDir, processedDir], 60);

  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Advanced AI File Assistant is live!`);
      console.log(`🌐 Dashboard URL: http://localhost:${port}`);
      console.log(`======================================================\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is currently in use. Trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server startup error:', err);
      }
    });
  };

  startServer(Number(PORT));
}

module.exports = app;
