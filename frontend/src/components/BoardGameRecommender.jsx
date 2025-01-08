import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Slider from '@mui/material/Slider';
import { Layout, Star,Scale, Clock, Users } from 'lucide-react'; 

const BoardGameRecommender = () => {
  const [gameWeight, setGameWeight] = useState([1, 5]);
  const [avgRating, setAvgRating] = useState([0, 10]);
  const [playtime, setPlaytime] = useState([0, 500]);
  const [players, setPlayers] = useState([2, 6]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [sortAscending, setSortAscending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [yearRange, setYearRange] = useState([1900, 2024]);
  const [minAge, setMinAge] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleWeightChange = (event, newValue) => {
    setGameWeight(newValue);
  };

  const handleRatingChange = (event, newValue) => {
    setAvgRating(newValue);
  };

  const handlePlaytimeChange = (event, newValue) => {
    setPlaytime(newValue);
  };

  const handlePlayersChange = (event, newValue) => {
    setPlayers(newValue);
  };

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const requestBody = {
        weight_min: gameWeight[0],
        weight_max: gameWeight[1],
        rating_min: avgRating[0],
        rating_max: avgRating[1],
        playtime_min: playtime[0],
        playtime_max: playtime[1],
        players_min: players[0],
        players_max: players[1],
        year_min: yearRange[0],
        year_max: yearRange[1],
        min_age: minAge,
        categories: selectedCategory === 'all' ? [] : [`cat_${selectedCategory}`]
      };

      console.log('Sending request:', requestBody);

      const response = await fetch('http://localhost:3001/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (Array.isArray(data)) {
        setGames(data);
      } else {
        console.error('Received non-array data:', data);
        setGames([]);
        setError('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
      setError('Failed to fetch games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(1);
    }
    return 'N/A';
  };

  const formatPlayerCount = (playerArray) => {
    if (!playerArray || !Array.isArray(playerArray) || playerArray.length === 0) return 'Unknown';
    if (playerArray.length === 1) return `${playerArray[0]} players`;
    return `${playerArray[0]}-${playerArray[playerArray.length - 1]} players`;
  };

  const sliderStyle = {
    color: '#4F46E5',
    height: 15,
    '& .MuiSlider-thumb': {
      backgroundColor: '#ffffff',
      border: '2px solid currentColor',
      height: 25,
      width: 25,
    },
    '& .MuiSlider-track': {
      height: 15
    },
    '& .MuiSlider-rail': {
      height: 15
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Board Game Finder</h1>
          <p className="text-gray-600">Find your next favorite board game</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 shadow-xl relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          )}
          <CardContent className="space-y-8 pt-8 px-8">

              {/* Category Selector */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="text-3xl text-gray-900">Show me</span>
                  <div className="relative inline-flex items-center group">
                  <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 group-hover:animate-gradient">
                      {selectedCategory === 'all' ? 'All' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </span>
                    <button
                      onClick={() => document.getElementById('category-select').click()}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      ▾
                    </button>
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="thematic">Thematic</option>
                      <option value="strategy">Strategy</option>
                      <option value="war">War</option>
                      <option value="family">Family</option>
                      <option value="collectible">Collectible</option>
                      <option value="abstract">Abstract</option>
                      <option value="party">Party</option>
                      <option value="childrens">Children's</option>
                    </select>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"></div>
                  </div>
                  <span className="text-3xl text-gray-900">games with...</span>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 gap-8 w-full mx-auto">
                  {/* Game Weight Slider */}
                  <div className="w-full flex flex-col items-center">
                    <label className="text-m font-medium text-gray-900 text-center block mb-4">
                      Game Complexity
                    </label>
                    <div className="w-3/4">
                      <Slider
                        value={gameWeight}
                        onChange={(e, newValue) => setGameWeight(newValue)}
                        min={1}
                        max={5}
                        step={0.5}
                        valueLabelDisplay="auto"
                        sx={sliderStyle}
                      />
                      <div className="text-s text-gray-500 text-center mt-2">
                        Weight: {gameWeight[0]} - {gameWeight[1]}
                      </div>
                    </div>
                  </div>

                  {/* Playtime Slider */}
                  <div className="w-full flex flex-col items-center">
                    <label className="text-m font-medium text-gray-900 text-center block mb-4">
                      Playtime Range
                    </label>
                    <div className="w-3/4">
                      <Slider
                        value={playtime}
                        onChange={(e, newValue) => setPlaytime(newValue)}
                        min={0}
                        max={500}
                        step={15}
                        valueLabelDisplay="auto"
                        sx={sliderStyle}
                      />
                      <div className="text-s text-gray-500 text-center mt-2">
                        {playtime[0]} - {playtime[1]} minutes
                      </div>
                    </div>
                  </div>

                  {/* Player Count Slider */}
                  <div className="w-full flex flex-col items-center">
                    <label className="text-m font-medium text-gray-900 text-center block mb-4">
                      Player Count
                    </label>
                    <div className="w-3/4">
                      <Slider
                        value={players}
                        onChange={(e, newValue) => setPlayers(newValue)}
                        min={1}
                        max={12}
                        step={1}
                        valueLabelDisplay="auto"
                        sx={sliderStyle}
                      />
                      <div className="text-s text-gray-500 text-center mt-2">
                        {players[0]} - {players[1]} players
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters Toggle */}
                <Button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-100 text-sm text-black-500 hover:text-black-500 bg-transparent border-0 hover:bg-gray-100"
                >
                  {showAdvanced ? 'Advanced Options -' : 'Advanced Options +'}
                </Button>

                {/* Advanced Filters */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 w-100 bg-transparent">
                    <div className="flex gap-8">
                      <div className="flex-1 space-y-2">
                        <label className="text-s font-medium text-gray-500">
                          Rating
                        </label>
                        <Slider
                          size="small"
                          value={avgRating}
                          onChange={(e, newValue) => setAvgRating(newValue)}
                          min={0}
                          max={10}
                          step={0.5}
                          valueLabelDisplay="auto"
                          sx={sliderStyle}
                        />
                        <div className="text-xs text-gray-400">
                          {avgRating[0]} - {avgRating[1]} stars
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <label className="text-s font-medium text-gray-500">
                          Year Published
                        </label>
                        <Slider
                          size="small"
                          value={yearRange}
                          onChange={(e, newValue) => setYearRange(newValue)}
                          min={1900}
                          max={2025}
                          step={1}
                          valueLabelDisplay="auto"
                          sx={sliderStyle}
                        />
                        <div className="text-xs text-gray-400">
                          {yearRange[0]} - {yearRange[1]}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <label className="text-s font-medium text-gray-500">
                          Minimum Age
                        </label>
                        <Slider
                          size="small"
                          value={minAge}
                          onChange={(e, newValue) => setMinAge(newValue)}
                          min={0}
                          max={18}
                          step={1}
                          valueLabelDisplay="auto"
                          sx={sliderStyle}
                        />
                        <div className="text-xs text-gray-400">
                          {minAge}+ years
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={fetchGames} 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                disabled={loading}
              >
                {loading ? 'Finding Games...' : '🎲 Roll the Dice'}
              </Button>

            {error && (
              <div className="text-red-500 text-center mt-2 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sort and Results Section */}
        <div className="flex gap-2 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="weight">Sort by Complexity</option>
            <option value="playtime">Sort by Playtime</option>
            <option value="name">Sort by Name</option>
          </select>
          <Button
            onClick={() => setSortAscending(!sortAscending)}
            className="flex items-center gap-1"
          >
            {sortAscending ? '↑ Ascending' : '↓ Descending'}
          </Button>
        </div>

        {/* Results Section */}
        {games.length > 0 && (
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Found {games.length} games</h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(games) && [...games].sort((a, b) => {
            const direction = sortAscending ? 1 : -1;
            switch (sortBy) {
              case 'weight':
                return direction * (a.game_weight - b.game_weight);
              case 'playtime':
                return direction * (a.mfg_playtime - b.mfg_playtime);
              case 'name':
                return direction * a.game.localeCompare(b.game);
              case 'rating':
              default:
                return direction * (a.avg_rating - b.avg_rating);
            }
          }).map((game) => (
            <Card 
              key={game.game} 
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 animate-fadeIn"
            >
              <div className="aspect-video relative bg-gray-100">
                {game.image_path ? (
                  <img
                    src={game.image_path}
                    alt={game.game}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/400/300";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Layout className="h-12 w-12" />
                  </div>
                )}
              </div>
              <CardContent className="p-6">
              <a 
                  href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block hover:text-indigo-600 transition-colors"
                >
                  <h3 className="font-bold text-xl mb-3 text-gray-900 hover:text-indigo-600">{game.game}</h3>
                </a>
                <div className="space-y-3 text-sm mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-indigo-500" />
                      <span className="text-gray-600 text-medium">Complexity</span>
                    </div>
                    <span className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      {formatNumber(game.game_weight)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-600">Rating</span>
                    </div>
                    <span className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500">
                      {formatNumber(game.avg_rating)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">Playtime</span>
                    </div>
                    <span className="font-medium text-lg text-green-600">{game.mfg_playtime || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">Players</span>
                    </div>
                    <span className="font-medium text-lg text-blue-600">{formatPlayerCount(game.good_players)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {games.length === 0 && !loading && (
          <Card className="p-12 text-center backdrop-blur-sm bg-white/90">
            <div className="flex flex-col items-center gap-4">
            <Layout className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No games found matching your criteria. Try adjusting the filters!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BoardGameRecommender;