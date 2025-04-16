import React, { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is mobile size
 * @returns boolean indicating if the current viewport is mobile size
 */
export function useIsMobile(): boolean {
  // Initialize with false and update only on client-side
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mark component as mounted
    setMounted(true);
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Only return the actual state when component is mounted (client-side)
  // Otherwise return false as default
  return mounted ? isMobile : false;
}

export default useIsMobile;
