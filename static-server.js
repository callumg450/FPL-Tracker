import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from the client build directory
app.use(express.static(join(__dirname, 'src/client/dist')));

// Handle client-side routing
app.get('/*', (req, res, next) => {
  // Don't interfere with static files
  if (req.path.includes('.')) {
    return next();
  }
  res.sendFile(join(__dirname, 'src/client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Static file server running on port ${PORT}`);
});
