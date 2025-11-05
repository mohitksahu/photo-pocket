'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Global state for route changes
let routeChangeListeners: ((isChanging: boolean) => void)[] = [];

export function addRouteChangeListener(callback: (isChanging: boolean) => void) {
  routeChangeListeners.push(callback);
  return () => {
    routeChangeListeners = routeChangeListeners.filter(cb => cb !== callback);
  };
}

export function triggerRouteChange() {
  routeChangeListeners.forEach(callback => callback(true));
  setTimeout(() => {
    routeChangeListeners.forEach(callback => callback(false));
  }, 800);
}

export function RouteChangeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    
    if (previousPathRef.current !== currentPath && previousPathRef.current !== '') {
      triggerRouteChange();
    }
    
    previousPathRef.current = currentPath;
  }, [pathname, searchParams]);

  return children;
}
