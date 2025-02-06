import { useEffect } from 'react';

export const useUrlParams = (initialState, setters) => {
  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Helper to safely parse array parameters
    const parseArrayParam = (param, defaultValue) => {
      const value = params.get(param);
      if (!value) return defaultValue;
      return value.split(',').map(Number);
    };

    // Helper to safely parse numeric parameters
    const parseNumParam = (param, defaultValue) => {
      const value = params.get(param);
      return value ? Number(value) : defaultValue;
    };

    // Helper to safely parse string parameters
    const parseStringParam = (param, defaultValue) => {
      return params.get(param) || defaultValue;
    };

    // Helper to safely parse boolean parameters
    const parseBoolParam = (param, defaultValue) => {
      const value = params.get(param);
      return value ? value === 'true' : defaultValue;
    };

    // Only update state if parameter exists
    if (params.has('weight')) {
      setters.setGameWeight(parseArrayParam('weight', initialState.gameWeight));
    }
    if (params.has('rating')) {
      setters.setAvgRating(parseArrayParam('rating', initialState.avgRating));
    }
    if (params.has('playtime')) {
      setters.setPlaytime(parseArrayParam('playtime', initialState.playtime));
    }
    if (params.has('players')) {
      setters.setPlayers(parseArrayParam('players', initialState.players));
    }
    if (params.has('year')) {
      setters.setYearRange(parseArrayParam('year', initialState.yearRange));
    }
    if (params.has('age')) {
      setters.setMinAge(parseNumParam('age', initialState.minAge));
    }
    if (params.has('category')) {
      setters.setSelectedCategory(parseStringParam('category', initialState.selectedCategory));
    }
    if (params.has('playerMatch')) {
      setters.setPlayerMatchType(parseStringParam('playerMatch', initialState.playerMatchType));
    }
    if (params.has('advanced')) {
      setters.setShowAdvanced(parseBoolParam('advanced', initialState.showAdvanced));
    }
  }, []); // Run once on mount
};