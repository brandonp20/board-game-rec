const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const path = require('path');
const dotenv = require('dotenv');

// Add this to the existing routes in games.js
router.get('/api/games/search', async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = `
      SELECT game, bgg_id, image_path, avg_rating 
      FROM board_games_mod
      WHERE game ILIKE $1
      ORDER BY avg_rating DESC
      LIMIT 10;
    `;
    
    const result = await pool.query(searchQuery, [`%${query}%`]);
    res.json(result.rows);
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

console.log(`Loaded environment variables from: ${envFile}`);

router.post('/api/games/personalized', async (req, res) => {
  try {
    const { 
      selectedGames,
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      year_min,
      year_max,
      min_age
    } = req.body;
    
    const similarGamesQuery = `
      WITH favorite_game_stats AS (
        SELECT 
          AVG(CAST(cat_thematic AS FLOAT)) as thematic_avg,
          AVG(CAST(cat_strategy AS FLOAT)) as strategy_avg,
          AVG(CAST(cat_war AS FLOAT)) as war_avg,
          AVG(CAST(cat_family AS FLOAT)) as family_avg,
          AVG(CAST(cat_cgs AS FLOAT)) as cgs_avg,
          AVG(CAST(cat_abstract AS FLOAT)) as abstract_avg,
          AVG(CAST(cat_party AS FLOAT)) as party_avg,
          AVG(CAST(cat_childrens AS FLOAT)) as childrens_avg,
          AVG(game_weight) as avg_weight,
          STDDEV(game_weight) as weight_stddev
        FROM board_games_mod
        WHERE bgg_id = ANY($1)
      ),
      game_preferences AS (
        SELECT 
          c2.game_id,
          COUNT(*) as num_shared_ratings,
          AVG(c2.rating) as avg_user_rating
        FROM collections c1
        JOIN collections c2 ON c1.username = c2.username
        WHERE c1.game_id = ANY($1)
        AND c2.game_id != ALL($1)
        AND c2.rating IS NOT NULL
        AND c1.rating IS NOT NULL
        GROUP BY c2.game_id
      ),
      filtered_games AS (
        SELECT 
          b.*,
          COALESCE(gp.num_shared_ratings, 0) as rating_overlap_count,
          COALESCE(gp.avg_user_rating, 0) as similar_users_rating,
          (
            CASE WHEN b.cat_thematic = 1 AND fgs.thematic_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_strategy = 1 AND fgs.strategy_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_war = 1 AND fgs.war_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_family = 1 AND fgs.family_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_cgs = 1 AND fgs.cgs_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_abstract = 1 AND fgs.abstract_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_party = 1 AND fgs.party_avg > 0.5 THEN 1 ELSE 0 END +
            CASE WHEN b.cat_childrens = 1 AND fgs.childrens_avg > 0.5 THEN 1 ELSE 0 END
          ) * 2 as category_score,
          CASE 
            WHEN ABS(b.game_weight - fgs.avg_weight) <= fgs.weight_stddev THEN 1.5
            WHEN ABS(b.game_weight - fgs.avg_weight) <= fgs.weight_stddev * 2 THEN 1.0
            ELSE 0.5
          END as weight_similarity
        FROM board_games_mod b
        CROSS JOIN favorite_game_stats fgs
        LEFT JOIN game_preferences gp ON b.bgg_id = gp.game_id
        WHERE game_weight >= $2 
        AND game_weight <= $3
        AND avg_rating >= $4 
        AND avg_rating <= $5
        AND mfg_playtime >= $6 
        AND mfg_playtime <= $7
        AND year_published >= $8
        AND year_published <= $9
        AND mfg_age_rec >= $10
      )
      SELECT 
        game,
        image_path,
        game_weight,
        avg_rating,
        mfg_playtime,
        good_players,
        bgg_id,
        rating_overlap_count,
        similar_users_rating,
        category_score,
        weight_similarity,
        (category_score + (rating_overlap_count * similar_users_rating / 10)) * weight_similarity as final_score
      FROM filtered_games
      ORDER BY final_score DESC, avg_rating DESC
      LIMIT 100;
    `;

    const gameIds = selectedGames.map(g => g.bgg_id);
    const values = [
      gameIds,
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      year_min || 1900,
      year_max || 2024,
      min_age || 0
    ];

    const result = await pool.query(similarGamesQuery, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Personalization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
      players_max,
      year_min,
      year_max,
      min_age,
      categories
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
        AND year_published >= $9
        AND year_published <= $10
        AND mfg_age_rec >= $11
        AND ($12::text[] IS NULL OR $12::text[] = '{}' OR (
          CASE WHEN 'cat_thematic' = ANY($12::text[]) THEN cat_thematic = 1 ELSE true END AND
          CASE WHEN 'cat_strategy' = ANY($12::text[]) THEN cat_strategy = 1 ELSE true END AND
          CASE WHEN 'cat_war' = ANY($12::text[]) THEN cat_war = 1 ELSE true END AND
          CASE WHEN 'cat_family' = ANY($12::text[]) THEN cat_family = 1 ELSE true END AND
          CASE WHEN 'cat_cgs' = ANY($12::text[]) THEN cat_cgs = 1 ELSE true END AND
          CASE WHEN 'cat_abstract' = ANY($12::text[]) THEN cat_abstract = 1 ELSE true END AND
          CASE WHEN 'cat_party' = ANY($12::text[]) THEN cat_party = 1 ELSE true END AND
          CASE WHEN 'cat_childrens' = ANY($12::text[]) THEN cat_childrens = 1 ELSE true END
        ))
      ORDER BY 
        avg_rating DESC
      LIMIT 100;
    `;

    const values = [
      weight_min,
      weight_max,
      rating_min,
      rating_max,
      playtime_min,
      playtime_max,
      players_min,
      players_max,
      year_min || 1900,
      year_max || 2024,
      min_age || 0,
      categories || []
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