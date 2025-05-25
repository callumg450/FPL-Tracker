import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Point to the client/dist directory where Vite will build the frontend
app.use(express.static(join(__dirname, 'src/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'src/client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server is running on port ${PORT}`);
});
