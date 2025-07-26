/**
 * Detects if the user is on a mobile device
 * @returns true if mobile device, false otherwise
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'opera mini'
  ];
  
  const isMobileUserAgent = mobileKeywords.some(keyword => 
    userAgent.includes(keyword)
  );
  
  const isSmallScreen = window.innerWidth <= 768;
  
  const isTouchDevice = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;
  
  const isMobile = isMobileUserAgent || (isSmallScreen && isTouchDevice);
  
  console.log('Device Detection:', {
    userAgent: userAgent,
    isMobileUserAgent,
    isSmallScreen,
    isTouchDevice,
    screenWidth: window.innerWidth,
    maxTouchPoints: navigator.maxTouchPoints,
    finalResult: isMobile
  });
  
  return isMobile;
}

/**
 * Gets the default view mode based on device type
 * @returns 'list' for mobile devices, 'grid' for desktop
 */
export function getDefaultViewMode(): 'grid' | 'list' {
  const defaultMode = isMobileDevice() ? 'list' : 'grid';
  console.log('Default view mode selected:', defaultMode);
  return defaultMode;
}
