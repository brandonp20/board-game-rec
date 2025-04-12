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

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json([]);
    }
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
      good_players: Array.isArray(game.good_players) ? game.good_players.map(String) : [], // Ensure strings
      min_players: parseInt(game.min_players) || null,
      max_players: parseInt(game.max_players) || null,
      year_published: parseInt(game.year_published) || null,
    }));
    
    // console.log('Processed result:', processedResults[0]); // Debug processed result
    res.json(processedResults);
  } catch (error) {
    console.error('Search query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/personalized', async (req, res) => {
  try {
    const {
      selectedGames,
      weight_min, weight_max,
      rating_min, rating_max,
      playtime_min, playtime_max,
      players_min, players_max,
      year_min, year_max,
      min_age = 0,
      searchText,
      page = 1, limit = 24,
      player_match_type = 'best',
      categories = []
    } = req.body;
    
    if (!Array.isArray(selectedGames) || selectedGames.length === 0 || selectedGames.length > 3) {
      return res.status(400).json({ error: 'Invalid selection for personalization.', details: 'Please select 1 to 3 games.' });
   }
    const selectedGameIds = selectedGames.map(g => parseInt(g.bgg_id, 10)).filter(id => !isNaN(id));
    if (selectedGameIds.length !== selectedGames.length) {
        return res.status(400).json({ error: 'Invalid game IDs in selection.' });
    }


   const offset = (page - 1) * limit;
   let paramIndex = 1;
   const values = [];

   // Add selected game IDs
   values.push(selectedGameIds); // $1
   paramIndex++;

   // Add core filter values
   values.push(parseFloat(weight_min) || 1, parseFloat(weight_max) || 5); // $2, $3
   paramIndex += 2;
   values.push(parseFloat(rating_min) || 0, parseFloat(rating_max) || 10); // $4, $5
   paramIndex += 2;
   values.push(parseInt(playtime_min, 10) || 0, parseInt(playtime_max, 10) || 9999); // $6, $7 (use large max)
   paramIndex += 2;
   values.push(parseInt(players_min, 10) || 1, parseInt(players_max, 10) || 99); // $8, $9 (use large max)
   paramIndex += 2;
   values.push(parseInt(year_min, 10) || 1900, parseInt(year_max, 10) || new Date().getFullYear() + 1); // $10, $11
   paramIndex += 2;
   values.push(parseInt(min_age, 10) || 0); // $12
   paramIndex++;


   let textSearchCondition = '';
   if (searchText && searchText.trim() !== '') {
     textSearchCondition = `AND b.game ILIKE $${paramIndex} `; // Note: includes leading space
     values.push(`%${searchText.trim()}%`);
     paramIndex++;
   }

   let categoryCondition = '';
    if (Array.isArray(categories) && categories.length > 0) {
      // Basic validation/sanitization for category names
      const validCategories = categories
          .map(cat => cat.startsWith('cat_') ? cat : `cat_${cat}`) // Ensure prefix
          .filter(cat => /^[a-zA-Z_]+$/.test(cat)); // Allow only letters and underscores
      if (validCategories.length > 0) {
           categoryCondition = `AND (${validCategories.map(cat => `${cat} = 1`).join(' AND ')}) `;
      }
    }


   // Add limit and offset at the end
   const limitParamIndex = paramIndex++;
   const offsetParamIndex = paramIndex++;
   values.push(parseInt(limit, 10) || 24); // Use paramIndex for limit
   values.push(parseInt(offset, 10) || 0);  // Use paramIndex + 1 for offset

   const similarGamesQuery = `
     WITH
     favorite_game_stats AS (
       SELECT
         AVG(game_weight) as avg_weight,
         COALESCE(STDDEV(game_weight), 0.5) as weight_stddev, -- Provide default stddev if only one game selected
         AVG(cat_thematic::int) as avg_cat_thematic,
         AVG(cat_strategy::int) as avg_cat_strategy,
         AVG(cat_war::int) as avg_cat_war,
         AVG(cat_family::int) as avg_cat_family,
         AVG(cat_cgs::int) as avg_cat_cgs, -- Assuming cgs is collectible
         AVG(cat_abstract::int) as avg_cat_abstract,
         AVG(cat_party::int) as avg_cat_party,
         AVG(cat_childrens::int) as avg_cat_childrens
       FROM board_games_mod
       WHERE bgg_id = ANY($1::int[]) -- Use $1 for selected game IDs
     )
     SELECT
       b.game, b.bgg_id, b.image_path, b.game_weight,
       b.avg_rating, b.bayes_avg_rating, b.mfg_playtime,
       b.good_players, b.year_published
     FROM board_games_mod b
     CROSS JOIN favorite_game_stats fgs
     WHERE
       b.game_weight BETWEEN $2 AND $3
       AND b.avg_rating BETWEEN $4 AND $5
       AND b.mfg_playtime BETWEEN $6 AND $7
       AND b.year_published BETWEEN $10 AND $11
       AND b.mfg_age_rec >= $12 -- Added min_age filter
       AND (
         CASE WHEN '${player_match_type}' = 'best' -- Safely use player_match_type (validate if needed)
              THEN EXISTS (
                SELECT 1 FROM unnest(b.good_players) gp
                WHERE gp ~ '^[0-9]+$' AND gp::int BETWEEN $8 AND $9
              )
              ELSE b.min_players <= $9 AND b.max_players >= $8
         END
       )
       ${categoryCondition} -- Inject category condition string
       ${textSearchCondition} -- Inject text search condition string
       AND b.bgg_id != ALL($1::int[]) -- Exclude the selected games themselves
     ORDER BY
       -- 1. Closeness to favorite weight (using stddev range)
       CASE
         WHEN ABS(b.game_weight - fgs.avg_weight) <= fgs.weight_stddev THEN 3
         WHEN ABS(b.game_weight - fgs.avg_weight) <= fgs.weight_stddev * 2 THEN 2
         ELSE 1
       END DESC,
       -- 2. Category similarity score
       (
         (COALESCE(b.cat_thematic, 0) * fgs.avg_cat_thematic) +
         (COALESCE(b.cat_strategy, 0) * fgs.avg_cat_strategy) +
         (COALESCE(b.cat_war, 0) * fgs.avg_cat_war) +
         (COALESCE(b.cat_family, 0) * fgs.avg_cat_family) +
         (COALESCE(b.cat_cgs, 0) * fgs.avg_cat_cgs) +
         (COALESCE(b.cat_abstract, 0) * fgs.avg_cat_abstract) +
         (COALESCE(b.cat_party, 0) * fgs.avg_cat_party) +
         (COALESCE(b.cat_childrens, 0) * fgs.avg_cat_childrens)
       ) DESC,
       -- 3. Bayesian average rating (better for ranking)
       b.bayes_avg_rating DESC NULLS LAST
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}; -- Use dynamic indices
   `;

   console.log('Personalized Query:', similarGamesQuery);
   console.log('Personalized Values:', values);

   const result = await pool.query(similarGamesQuery, values);
   res.json(result.rows);
 } catch (error) {
   console.error('Personalization error:', error);
   res.status(500).json({ error: 'Internal server error', details: error.message });
 }
});

router.post('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 24,
      weight_min, weight_max,
      rating_min, rating_max,
      playtime_min, playtime_max,
      players_min, players_max,
      year_min, year_max,
      min_age = 0,
      searchText,   // <-- Get searchText
      player_match_type = 'best',
      categories = []
    } = req.body;

    const offset = (page - 1) * limit;
    let paramIndex = 1;
    const values = [];

    // Add core filters
    values.push(parseFloat(weight_min) || 1, parseFloat(weight_max) || 5); // $1, $2
    paramIndex += 2;
    values.push(parseFloat(rating_min) || 0, parseFloat(rating_max) || 10); // $3, $4
    paramIndex += 2;
    values.push(parseInt(playtime_min, 10) || 0, parseInt(playtime_max, 10) || 9999); // $5, $6
    paramIndex += 2;
    values.push(parseInt(year_min, 10) || 1900, parseInt(year_max, 10) || new Date().getFullYear() + 1); // $7, $8
    paramIndex += 2;
    values.push(parseInt(min_age, 10) || 0); // $9
    paramIndex++;
    values.push(parseInt(players_min, 10) || 1, parseInt(players_max, 10) || 99); // $10, $11
    paramIndex += 2;

    // Player match condition (dynamic part of the query string)
    // We build the player condition string separately to avoid complex parameter index shifting within it
    const playerCondition = player_match_type === 'best'
        ? `good_players && (SELECT array_agg(p::text) FROM generate_series($10::int, $11::int) p)` // Use existing $10, $11
        : `min_players <= $11 AND max_players >= $10`; // Use existing $10, $11

    // Text search condition
    let textSearchCondition = '';
    if (searchText && searchText.trim() !== '') {
        textSearchCondition = `AND game ILIKE $${paramIndex} `;
        values.push(`%${searchText.trim()}%`);
        paramIndex++;
    }

    // Category condition
    let categoryCondition = '';
     if (Array.isArray(categories) && categories.length > 0) {
         const validCategories = categories
           .map(cat => cat.startsWith('cat_') ? cat : `cat_${cat}`)
           .filter(cat => /^[a-zA-Z_]+$/.test(cat));
         if (validCategories.length > 0) {
            categoryCondition = `AND (${validCategories.map(cat => `${cat} = 1`).join(' AND ')}) `;
         }
     }


    // Add limit and offset at the end
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;
    values.push(parseInt(limit, 10) || 24);
    values.push(parseInt(offset, 10) || 0);

    const mainQuery = `
      SELECT
        game, bgg_id, game_weight, avg_rating, bayes_avg_rating,
        mfg_playtime, good_players, year_published, image_path, mfg_age_rec
      FROM board_games_mod
      WHERE
        game_weight BETWEEN $1 AND $2
        AND avg_rating BETWEEN $3 AND $4
        AND mfg_playtime BETWEEN $5 AND $6
        AND year_published BETWEEN $7 AND $8
        AND mfg_age_rec >= $9
        AND (${playerCondition}) -- Inject player condition string
        ${categoryCondition} -- Inject category condition string
        ${textSearchCondition} -- Inject text search condition string
      ORDER BY bayes_avg_rating DESC NULLS LAST, avg_rating DESC NULLS LAST -- Primary sort by Bayesian avg
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}; -- Use dynamic indices
    `;

    console.log('Normal Query:', mainQuery);
    console.log('Normal Values:', values);

    const result = await pool.query(mainQuery, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
