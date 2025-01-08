import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Slider from '@mui/material/Slider';
import { Layout, Star } from 'lucide-react'; 

const BoardGameRecommender = () => {
  const [gameWeight, setGameWeight] = useState([1, 5]);
  const [avgRating, setAvgRating] = useState([0, 10]);
  const [playtime, setPlaytime] = useState([0, 500]);
  const [players, setPlayers] = useState([2, 6]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        players_max: players[1]
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
    height: 8,
    '& .MuiSlider-thumb': {
      backgroundColor: '#ffffff',
      border: '2px solid currentColor',
      height: 20,
      width: 20,
    },
    '& .MuiSlider-track': {
      height: 8
    },
    '& .MuiSlider-rail': {
      height: 8
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

        {/* Filters Card */}
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
          <CardContent className="space-y-6 pt-8">
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Game Weight Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Game Complexity
                </label>
                <div className="flex items-center gap-2">
                  <Slider
                      value={gameWeight}
                      onChange={(e, newValue) => setGameWeight(newValue)}
                      min={1}
                      max={5}
                      step={0.5}
                      valueLabelDisplay="auto"
                      sx={sliderStyle}
                    />
                    <span className="text-sm text-gray-500"></span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Current: {gameWeight[0]} - {gameWeight[1]}
                  </div>
                </div>

                {/* Rating Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Minimum Rating
                  </label>
                  <Slider
                    value={avgRating}
                    onChange={(e, newValue) => setAvgRating(newValue)}
                    min={0}
                    max={10}
                    step={0.5}
                    valueLabelDisplay="auto"
                    sx={sliderStyle}
                  />
                  <div className="text-xs text-gray-500 text-center">
                    {avgRating[0]} - {avgRating[1]} stars
                  </div>
                </div>

                {/* Playtime Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Playtime Range
                  </label>
                  <Slider
                    value={playtime}
                    onChange={(e, newValue) => setPlaytime(newValue)}
                    min={0}
                    max={500}
                    step={15}
                    valueLabelDisplay="auto"
                    sx={sliderStyle}
                  />
                  <div className="text-xs text-gray-500 text-center">
                    {playtime[0]} - {playtime[1]} minutes
                  </div>
                </div>

                {/* Player Count Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Player Count
                  </label>
                  <Slider
                    value={players}
                    onChange={(e, newValue) => setPlayers(newValue)}
                    min={1}
                    max={12}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={sliderStyle}
                  />
                <div className="text-xs text-gray-500 text-center">
                  {players[0]} - {players[1]} players
                </div>
              </div>
            </div>

            <Button 
              onClick={fetchGames} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? 'Finding Games...' : 'Find Games'}
            </Button>

            {error && (
              <div className="text-red-500 text-center mt-2 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {games.length > 0 && (
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Found {games.length} games</h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(games) && games.map((game) => (
            <Card key={game.game} className="overflow-hidden hover:shadow-2xl transition-shadow duration-300">
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
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Complexity:</span>
                    <span className="font-medium text-gray-900">{formatNumber(game.game_weight)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium text-gray-900 flex items-center gap-1">
                      {formatNumber(game.avg_rating)}
                      <Star className="h-4 w-4 text-yellow-500 inline" fill="currentColor"/>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Playtime:</span>
                    <span className="font-medium text-gray-900">{game.mfg_playtime || 'N/A'} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Players:</span>
                    <span className="font-medium text-gray-900">{formatPlayerCount(game.good_players)}</span>
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