const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Dynamically set the path to the appropriate .env file
const envFile = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, 'prod_env/.env')
  : path.resolve(__dirname, '.env');

// Load environment variables from the appropriate .env file
dotenv.config({ path: envFile });

console.log(`Running in ${process.env.NODE_ENV} mode`);
console.log(`Loaded environment variables from: ${envFile}`);
console.log('Current Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
const gamesRouter = require('./api/games');
app.use('/api/games', gamesRouter);

// Serve static files from the frontend
const staticPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(staticPath));

// Fallback for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
