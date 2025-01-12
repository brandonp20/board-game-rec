// src/components/GameSearch.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Search, X, Scale, Clock, Users, Layout} from 'lucide-react';

const GameSearch = ({ onGamesSelected, useSelectedGames }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchGames = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/games/search?query=${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching games:', error);
    }
  };

  const handleGameSelect = (game) => {
    if (selectedGames.length < 3 && !selectedGames.find(g => g.bgg_id === game.bgg_id)) {
      const newSelectedGames = [...selectedGames, game];
      setSelectedGames(newSelectedGames);
      onGamesSelected(newSelectedGames);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeGame = (gameId) => {
    const newSelectedGames = selectedGames.filter(g => g.bgg_id !== gameId);
    setSelectedGames(newSelectedGames);
    onGamesSelected(newSelectedGames);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchGames(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleGamesSelected = (games) => {
    setSelectedGames(games);
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

  return (
    <div className="w-full max-w-xl mx-auto px-2 sm:px-0">
      <div className="relative z-[9999]">
        <div className="flex items-center border-2 rounded-lg focus-within:border-indigo-500 bg-white">
          <Search className="h-5 w-5 ml-2 sm:ml-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Add your favorites..."
            className="w-full p-3 focus:outline-none"
            disabled={selectedGames.length >= 3}
          />
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div className="fixed inset-x-0 mx-2 sm:mx-0 sm:absolute sm:w-full mt-1 bg-white border rounded-lg shadow-lg z-[9999] max-h-[25vh] overflow-y-auto">
            {searchResults.map(game => (
              <div
                key={game.bgg_id}
                className="p-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleGameSelect(game)}
              >
                {game.game}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {selectedGames.map(game => (
          <Card key={game.bgg_id} className="bg-white overflow-hidden">
            <div className="flex items-start p-3 gap-4">
              {/* Game Image */}
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {game.image_path ? (
                  <img
                    src={game.image_path}
                    alt={game.game}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/96/96";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Layout className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Game Details */}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{game.game}</h3>
                  <button
                    onClick={() => removeGame(game.bgg_id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Scale className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-600">Weight: {formatNumber(game.game_weight)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">{game.mfg_playtime || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">{formatPlayerCount(game.good_players)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameSearch;