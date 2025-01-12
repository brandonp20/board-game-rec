import GameSearch from './GameSearch';
import EnhancedRollButton from './EnhancedRollButton';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import Slider from '@mui/material/Slider';
import { Layout, Star,Scale, Clock, Users, Filter } from 'lucide-react'; 

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
  const [playerMatchType, setPlayerMatchType] = useState('best');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const fetchGames = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setGames([]);
    }
    setError(null);
  
    try {
      const endpoint = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/games`
      : 'http://localhost:3000/api/games';

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
        categories: selectedCategory === 'all' ? [] : [`cat_${selectedCategory}`],
        player_match_type: playerMatchType,
        page: isLoadMore ? page + 1 : 1,
        limit: 24
      }
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Server error: ${response.status}`);
      }
  
      const data = await response.json();
      if (data.length < 24) {
        setHasMore(false);
      }
  
      if (isLoadMore) {
        setGames(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      } else {
        setGames(data);
        setPage(1);
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to fetch games. Please try again.');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Board Game Finder
        </h1>
        <p className="text-lg sm:text-xl text-gray-600">Discover your next favorite game</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 shadow-xl relative overflow-visible">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          )}
          
          <CardContent className="space-y-6 sm:space-y-10 p-4 sm:p-8 overflow-visible">
            {/* Category Selector */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 px-2 text-center">
                <span className="text-2xl sm:text-3xl text-gray-900">Show me</span>
                <div className="relative inline-flex items-center group">
                  <span className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 group-hover:animate-gradient">
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
                <span className="text-2xl sm:text-3xl text-gray-900">games with...</span>
              </div>
            </div>

            {/* Main Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mt-4 sm:mt-8">
              {/* Game Weight */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="h-5 w-5 text-indigo-500" />
                  <label className="text-lg font-medium text-gray-700">
                    Complexity
                  </label>
                </div>
                <Slider
                  value={gameWeight}
                  onChange={handleWeightChange}
                  min={1}
                  max={5}
                  step={0.5}
                  valueLabelDisplay="auto"
                  sx={sliderStyle}
                />
                <div className="text-sm text-gray-500 text-center mt-2">
                  {gameWeight[0]} - {gameWeight[1]}
                </div>
              </div>

              {/* Playtime */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-indigo-500" />
                  <label className="text-lg font-medium text-gray-700">
                    Playtime
                  </label>
                </div>
                <Slider
                  value={playtime}
                  onChange={handlePlaytimeChange}
                  min={0}
                  max={500}
                  step={15}
                  valueLabelDisplay="auto"
                  sx={sliderStyle}
                />
                <div className="text-sm text-gray-500 text-center mt-2">
                  {playtime[0]} - {playtime[1]} minutes
                </div>
              </div>

              {/* Player Count */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        <label className="text-lg font-medium text-gray-700">Players</label>
                      </div>
                      <select 
                        value={playerMatchType}
                        onChange={(e) => setPlayerMatchType(e.target.value)}
                        className="bg-white border border-indigo-200 text-gray-600 rounded-lg px-3 py-1 text-sm 
                        hover:border-indigo-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
                        focus:outline-none transition-colors cursor-pointer appearance-none pr-8 relative"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366F1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="best">Best with</option>
                        <option value="playable">Playable with</option>
                      </select>
                    </div>
                    <Slider
                      value={players}
                      onChange={handlePlayersChange}
                      min={1}
                      max={12}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={sliderStyle}
                    />
                    <div className="text-sm text-gray-500 text-center">
                      {players[0]} - {players[1]} players
                    </div>
                  </div>
                </div>
            </div>

            {/* Advanced Options and Favorites Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100"
                >
                  <Filter className="h-4 w-4" />
                  {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                </Button>
  
              </div>

              {/* Advanced Filters Panel */}
              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                  {/* Rating Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-5 w-5 text-indigo-500" />
                      <label className="text-lg font-medium text-gray-700">
                        Rating
                      </label>
                    </div>
                    <Slider
                      value={avgRating}
                      onChange={(e, newValue) => setAvgRating(newValue)}
                      min={0}
                      max={10}
                      step={0.5}
                      valueLabelDisplay="auto"
                      sx={sliderStyle}
                    />
                    <div className="text-sm text-gray-500 text-center mt-2">
                      {avgRating[0]} - {avgRating[1]} stars
                    </div>
                  </div>

                  {/* Year Published Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Layout className="h-5 w-5 text-indigo-500" />
                      <label className="text-lg font-medium text-gray-700">
                        Year Published
                      </label>
                    </div>
                    <Slider
                      value={yearRange}
                      onChange={(e, newValue) => setYearRange(newValue)}
                      min={1900}
                      max={2025}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={sliderStyle}
                    />
                    <div className="text-sm text-gray-500 text-center mt-2">
                      {yearRange[0]} - {yearRange[1]}
                    </div>
                  </div>

                  {/* Minimum Age Card */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-indigo-500" />
                      <label className="text-lg font-medium text-gray-700">
                        Minimum Age
                      </label>
                    </div>
                    <Slider
                      value={minAge}
                      onChange={(e, newValue) => setMinAge(newValue)}
                      min={0}
                      max={18}
                      step={1}
                      valueLabelDisplay="auto"
                      sx={sliderStyle}
                    />
                    <div className="text-sm text-gray-500 text-center mt-2">
                      {minAge}+ years
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center w-full relative z-[1]">
              <div className="w-1/2">
                <EnhancedRollButton 
                  onClick={() => {
                    setPage(1); // Reset page number
                    setHasMore(true); // Reset hasMore flag
                    fetchGames(false); // Force new fetch
                  }}  
                  loading={loading} />
              </div>
            </div>
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
            <h2 className="text-2xl font-semibold text-gray-900">Games You'll Love:</h2>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative z-[1]">
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
                  <>
                    <img
                      src={game.image_path}
                      alt={game.game}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/400/300";
                      }}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    {/* Game title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <a 
                        href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block hover:text-indigo-200 transition-colors"
                      >
                        <h3 className="font-bold text-[1.1rem] text-white">{game.game}</h3>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Layout className="h-12 w-12" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
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
                      <span className="text-gray-600">Best with:</span>
                    </div>
                    <span className="font-medium text-lg text-blue-600">{formatPlayerCount(game.good_players)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {games.length > 0 && hasMore && (
          <div className="flex justify-center mt-8 mb-12">
            <Button
              onClick={() => {
                setIsLoadingMore(true);
                fetchGames(true);
              }}
              disabled={isLoadingMore}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg shadow-md transition-all duration-200"
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                'Load More Games'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )};

export default BoardGameRecommender;