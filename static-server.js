import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = join(__dirname, 'src/client/dist');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// First, try to serve any static files
app.use(express.static(DIST_DIR));

// Set up security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Then handle all other routes by serving index.html
app.get('*', (req, res) => {
  // Log incoming requests to help with debugging
  console.log(`Serving index.html for path: ${req.path}`);
  
  res.sendFile(join(DIST_DIR, 'index.html'), err => {
    if (err) {
      console.error(`Error serving index.html: ${err}`);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static file server running on port ${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
});
