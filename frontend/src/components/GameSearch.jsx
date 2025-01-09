// src/components/GameSearch.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Search, X } from 'lucide-react';

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
      const response = await fetch(`http://localhost:3001/api/games/search?query=${query}`);
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

      <div className="mt-4 flex flex-wrap gap-2 px-1">
        {selectedGames.map(game => (
          <div key={game.bgg_id} className="flex items-center bg-indigo-100 rounded-full px-3 py-1">
            <span>{game.game}</span>
            <button
              onClick={() => removeGame(game.bgg_id)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameSearch;