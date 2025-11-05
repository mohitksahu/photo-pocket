'use client';

import { useEffect, useState } from 'react';
import { addRouteChangeListener } from './RouteChangeProvider';

export default function LoadingPreloader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show preloader on initial mount
    setIsLoading(true);
    const initialTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    // Listen to route changes
    const unsubscribe = addRouteChangeListener((isChanging: boolean) => {
      setIsLoading(isChanging);
    });

    return unsubscribe;
  }, []);

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
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
