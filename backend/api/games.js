const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const path = require('path');
const dotenv = require('dotenv');

// Dynamically determine the correct .env file
const envFile = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, 'prod_env/.env')
  : path.resolve(__dirname, '.env');

dotenv.config({ path: envFile });

console.log(`Loaded environment variables from: ${envFile}`);


// Set up the pool with SSL mode required for Neon
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Optional: Only use if you're sure about the security setup.
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to the database');
  }
});

router.post('/api/games', async (req, res) => {
  try {
    const {
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      players_min,
      players_max
    } = req.body;

    const query = `
      WITH player_range AS (
        SELECT array_agg(n::text) as range
        FROM generate_series($7::int, $8::int) n
      )
      SELECT 
        game,
        COALESCE(image_path, '') as image_path,
        CAST(game_weight AS FLOAT) as game_weight,
        CAST(avg_rating AS FLOAT) as avg_rating,
        mfg_playtime,
        good_players,
        bgg_id
      FROM 
        board_games_mod,
        player_range
      WHERE 
        game_weight >= $1 
        AND game_weight <= $2
        AND avg_rating >= $3 
        AND avg_rating <= $4
        AND mfg_playtime >= $5 
        AND mfg_playtime <= $6
        AND good_players IS NOT NULL
        AND good_players && player_range.range
      ORDER BY 
        avg_rating DESC
      LIMIT 50;
    `;

    const values = [
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      players_min,
      players_max
    ];

    console.log('Executing query with values:', values);
    
    const result = await pool.query(query, values);
    console.log(`Found ${result.rows.length} games`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;