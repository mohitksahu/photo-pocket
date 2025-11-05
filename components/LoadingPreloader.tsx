'use client';

import { useEffect, useState } from 'react';

export default function LoadingPreloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide preloader after initial page load
    const handleLoad = () => {
      setIsLoading(false);
    };

    // Use a combination of window load and a timeout to ensure preloader shows briefly
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show for at least 1 second

    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(timeout);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      style={{ background: '#0A0A0A' }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-64 h-64 object-contain"
        style={{ filter: 'drop-shadow(0 0 20px rgba(255, 154, 0, 0.5))' }}
      >
        <source src="/White Loading Typography Animation Video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
