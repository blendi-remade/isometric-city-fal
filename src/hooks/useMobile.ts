'use client';

import { useState, useEffect } from 'react';
import { isMobile, isTablet, isMobileOnly } from 'react-device-detect';

interface UseMobileReturn {
  isMobileDevice: boolean;
  isTabletDevice: boolean;
  isMobileOnly: boolean;
  isSmallScreen: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export function useMobile(): UseMobileReturn {
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenWidth(width);
      setScreenHeight(height);
      setIsSmallScreen(width < 768);
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is a legacy property
        navigator.msMaxTouchPoints > 0
      );
    };

    updateDimensions();
    checkTouch();

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  return {
    isMobileDevice: isMobile || isSmallScreen,
    isTabletDevice: isTablet,
    isMobileOnly: isMobileOnly,
    isSmallScreen,
    isTouchDevice,
    screenWidth,
    screenHeight,
    orientation,
  };
}

// Simple context-free check for SSR
export function getIsMobileSSR(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || isMobile;
}
