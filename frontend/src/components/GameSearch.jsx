/* GameSearch.jsx */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Search, Layout } from 'lucide-react';

const GameSearch = ({ onGamesSelected, selectedGames }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchGames = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const endpoint = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api/games/search?query=${encodedQuery}`
        : `http://localhost:3000/api/games/search?query=${encodedQuery}`;
        
      const response = await fetch(endpoint);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching games:', error);
    }
  };

  const handleGameSelect = (game) => {
    if (selectedGames.length < 3 && !selectedGames.find(g => g.bgg_id === game.bgg_id)) {
      const newSelectedGames = [...selectedGames, game];
      onGamesSelected(newSelectedGames);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeGame = (gameId) => {
    const newSelectedGames = selectedGames.filter(g => g.bgg_id !== gameId);
    onGamesSelected(newSelectedGames);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchGames(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

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

      {/* Selected Games Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedGames.map(game => (
          <Card 
            key={game.bgg_id} 
            className="overflow-hidden hover:shadow-2xl transition-all duration-300 animate-fadeIn relative group cursor-pointer"
            onClick={() => removeGame(game.bgg_id)}
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
                    <h3 className="font-bold text-[1.1rem] text-white">{game.game}</h3>
                  </div>
                  {/* Hover overlay with remove hint */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <span className="text-white font-medium">Click to remove</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Layout className="h-12 w-12" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameSearch;