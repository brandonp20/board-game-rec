import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SimpleShareButton = ({ filterState }) => {
  const [showCopied, setShowCopied] = useState(false);
  const [error, setError] = useState(null);

  const generateShareUrl = () => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filterState).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            const validValues = value.filter(v => v !== null && v !== undefined);
            if (validValues.length > 0) {
              params.append(key, validValues.join(','));
            }
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const url = new URL(window.location.href);
      url.search = params.toString();
      return url.toString();
    } catch (err) {
      console.error('Error generating share URL:', err);
      setError('Failed to generate share URL');
      return window.location.href;
    }
  };

  const handleShare = async () => {
    try {
      setError(null);
      const shareUrl = generateShareUrl();

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Board Game Finder Filters',
            text: 'Check out these board game recommendations!',
            url: shareUrl
          });
          return;
        } catch (err) {
          console.log('Share API not available or cancelled, falling back to clipboard');
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to share. Please try again.');
      setTimeout(() => setError(null), 2000);
    }
  };

  return (
    <div className="relative ml-2">
      <Button
        onClick={handleShare}
        variant="outline"
        size="sm"
        className="gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"
      >
        {showCopied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-green-500">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </>
        )}
      </Button>

      {(showCopied || error) && (
        <div className="absolute bottom-full mb-2 right-0 w-max">
          <div className={`px-4 py-2 rounded-md shadow-lg ${
            error 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {error || 'Share link copied to clipboard!'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleShareButton;