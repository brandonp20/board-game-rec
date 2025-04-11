const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const path = require('path');
const dotenv = require('dotenv');

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

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = `
      SELECT 
        game,
        bgg_id,
        image_path,
        avg_rating,
        game_weight,
        mfg_playtime,
        good_players,
        min_players,
        max_players
      FROM board_games_mod
      WHERE game ILIKE $1
      ORDER BY avg_rating DESC
      LIMIT 10;
    `;
    
    console.log('Executing search query:', searchQuery); // Debug query
    const result = await pool.query(searchQuery, [`%${query}%`]);
    console.log('Search query raw results:', result.rows[0]); // Debug first result
    
    // Ensure all fields are present and properly formatted
    const processedResults = result.rows.map(game => ({
      ...game,
      game_weight: parseFloat(game.game_weight) || null,
      mfg_playtime: parseInt(game.mfg_playtime) || null,
      good_players: Array.isArray(game.good_players) ? game.good_players : [],
      min_players: parseInt(game.min_players) || null,
      max_players: parseInt(game.max_players) || null,
    }));
    
    // console.log('Processed result:', processedResults[0]); // Debug processed result
    res.json(processedResults);
  } catch (error) {
    console.error('Search query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dynamically determine the correct .env file
const envFile = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, 'prod_env/.env')
  : path.resolve(__dirname, '.env');

dotenv.config({ path: envFile });

// console.log(`Loaded environment variables from: ${envFile}`);
router.post('/personalized', async (req, res) => {
  try {
    const { 
      selectedGames,
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      players_min,
      players_max,
      year_min,
      year_max,
      page = 1,
      limit = 24,
      player_match_type = 'best',
      categories = []
    } = req.body;
    
    const offset = (page - 1) * limit;
    
    const similarGamesQuery = `
      WITH 
      favorite_game_stats AS (
        SELECT 
          AVG(game_weight) as avg_weight,
          STDDEV(game_weight) as weight_stddev,
          -- Calculate average category presence for selected games
          AVG(cat_thematic::int) as avg_cat_thematic,
          AVG(cat_strategy::int) as avg_cat_strategy,
          AVG(cat_war::int) as avg_cat_war,
          AVG(cat_family::int) as avg_cat_family,
          AVG(cat_cgs::int) as avg_cat_cgs,
          AVG(cat_abstract::int) as avg_cat_abstract,
          AVG(cat_party::int) as avg_cat_party,
          AVG(cat_childrens::int) as avg_cat_childrens
        FROM board_games_mod
        WHERE bgg_id = ANY($1)
      )
      SELECT 
        b.game,
        b.bgg_id,
        b.image_path,
        b.game_weight,
        b.avg_rating,
        b.bayes_avg_rating, -- Add bayes_avg_rating to results
        b.mfg_playtime,
        b.good_players
      FROM board_games_mod b
      CROSS JOIN favorite_game_stats fgs
      WHERE 
        game_weight BETWEEN $2 AND $3
        AND avg_rating BETWEEN $4 AND $5
        AND mfg_playtime BETWEEN $6 AND $7
        AND year_published BETWEEN $10 AND $11
        AND (
          CASE WHEN $8::int IS NOT NULL 
            THEN 
              CASE WHEN '${player_match_type}' = 'best'
                THEN EXISTS (
                  SELECT 1 
                  FROM unnest(good_players) gp 
                  -- Add checks for NULL and numeric format before casting
                  WHERE gp IS NOT NULL AND gp ~ '^[0-9]+$' AND gp::int BETWEEN $8 AND $9
                )
                ELSE min_players <= $9 AND max_players >= $8
              END
            ELSE true
          END
        )
        ${categories.length > 0 
          ? `AND (${categories.map(cat => `${cat} = 1`).join(' AND ')})`
          : ''}
        AND bgg_id != ALL($1)
      ORDER BY 
        CASE 
          WHEN ABS(b.game_weight - fgs.avg_weight) <= fgs.weight_stddev THEN 3
          WHEN ABS(b.game_weight - fgs.avg_weight) <= fgs.weight_stddev * 2 THEN 2
          ELSE 1
        END DESC,
        -- Add category similarity score (simple count of matching categories weighted by avg presence)
        (
          (b.cat_thematic * fgs.avg_cat_thematic) +
          (b.cat_strategy * fgs.avg_cat_strategy) +
          (b.cat_war * fgs.avg_cat_war) +
          (b.cat_family * fgs.avg_cat_family) +
          (b.cat_cgs * fgs.avg_cat_cgs) +
          (b.cat_abstract * fgs.avg_cat_abstract) +
          (b.cat_party * fgs.avg_cat_party) +
          (b.cat_childrens * fgs.avg_cat_childrens)
        ) DESC,
        b.bayes_avg_rating DESC -- Sort by Bayesian average rating
      LIMIT $12;
    `;

    // Ensure numeric types for database query
    const values = [
      selectedGames.map(g => parseInt(g.bgg_id, 10)).filter(id => !isNaN(id)), // Ensure bgg_id are integers
      parseFloat(weight_min) || 1, // Default to 1 if parsing fails
      parseFloat(weight_max) || 5, // Default to 5 if parsing fails
      parseFloat(rating_min) || 0, // Default to 0 if parsing fails
      parseFloat(rating_max) || 10, // Default to 10 if parsing fails
      parseInt(playtime_min, 10) || 0, // Default to 0 if parsing fails
      parseInt(playtime_max, 10) || 500, // Default to 500 if parsing fails
      parseInt(players_min, 10) || 1, // Default to 1 if parsing fails
      parseInt(players_max, 10) || 12, // Default to 12 if parsing fails
      parseInt(year_min, 10) || 1900, // Default to 1900 if parsing fails
      parseInt(year_max, 10) || 2024, // Default to 2024 if parsing fails
      parseInt(limit, 10) || 24 // Default to 24 if parsing fails
    ];

    console.log('Query values:', values);
    
    const result = await pool.query(similarGamesQuery, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Personalization error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { page = 1, limit = 24 } = req.body;
    const offset = (page - 1) * limit;
    
    const {
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      players_min,
      players_max,
      year_min = 1900,
      year_max = 2024,
      min_age = 0,
      player_match_type = 'best',
      categories = []
    } = req.body;

    const mainQuery = `
      WITH player_count AS (
        SELECT array_agg(n::text) as requested_players
        FROM generate_series($10::int, $11::int) n
      )
      SELECT 
        game,
        bgg_id,
        game_weight,
        avg_rating,
        mfg_playtime,
        good_players,
        year_published,
        image_path
      FROM board_games_mod
      CROSS JOIN player_count
      WHERE 
        game_weight BETWEEN $1 AND $2
        AND avg_rating BETWEEN $3 AND $4
        AND mfg_playtime BETWEEN $5 AND $6
        AND year_published BETWEEN $7 AND $8
        AND mfg_age_rec >= $9
        AND ${
          player_match_type === 'best' 
          ? `
            good_players && (SELECT requested_players FROM player_count)
            AND NOT EXISTS (
              SELECT 1 
              FROM unnest((SELECT requested_players FROM player_count)) as p 
              WHERE p::text NOT IN (SELECT unnest(good_players))
            )
          `
          : `min_players <= $11 AND max_players >= $10`
        }
        ${categories.length > 0 
          ? `AND (${categories.map(cat => `${cat} = 1`).join(' AND ')})`
          : ''}
      ORDER BY avg_rating DESC
      OFFSET $12 LIMIT $13
    `;
    
    const values = [
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      year_min,
      year_max,
      min_age,
      players_min,
      players_max,
      offset,
      limit
    ];

    console.log('Query:', mainQuery);
    console.log('Values:', values);

    const result = await pool.query(mainQuery, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
