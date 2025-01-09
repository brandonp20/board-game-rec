import React from 'react';

const EnhancedRollButton = ({ onClick, loading }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full bg-gradient-to-r from-indigo-600 to-purple-600 
        hover:from-indigo-700 hover:to-purple-700 
        text-white py-4 rounded-lg 
        transition-all duration-300
        transform hover:scale-[1.02] active:scale-[0.98] 
        shadow-lg hover:shadow-xl
        flex items-center justify-center gap-3
        group relative overflow-hidden
      `}
    >
      {/* Background sparkle effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-500/20 to-red-500/20 animate-gradient-shift"></div>
      </div>

      {/* Dice icon */}
      <svg 
        className={`w-6 h-6 transform group-hover:rotate-[360deg] transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24"
      >
        <rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor" className="group-hover:fill-white/90"/>
        <circle cx="7" cy="7" r="1.5" fill="black"/>
        <circle cx="12" cy="12" r="1.5" fill="black"/>
        <circle cx="17" cy="7" r="1.5" fill="black"/>
        <circle cx="7" cy="17" r="1.5" fill="black"/>
        <circle cx="17" cy="17" r="1.5" fill="black"/>
      </svg>

      {/* Button text */}
      <span className="text-lg font-semibold tracking-wide">
        {loading ? 'Finding Games...' : 'Roll for Adventure!'}
      </span>

      {/* Duplicate dice icon for symmetry */}
      <svg 
        className={`w-6 h-6 transform group-hover:-rotate-[360deg] transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}
        viewBox="0 0 24 24"
      >
        <rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor" className="group-hover:fill-white/90"/>
        <circle cx="7" cy="7" r="1.5" fill="black"/>
        <circle cx="12" cy="12" r="1.5" fill="black"/>
        <circle cx="17" cy="7" r="1.5" fill="black"/>
        <circle cx="7" cy="17" r="1.5" fill="black"/>
        <circle cx="17" cy="17" r="1.5" fill="black"/>
      </svg>
    </button>
  );
};

export default EnhancedRollButton;