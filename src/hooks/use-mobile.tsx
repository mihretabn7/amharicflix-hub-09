
import { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is mobile size
 * @returns boolean indicating if the current viewport is mobile size
 */
export function useIsMobile(): boolean {
  // Initialize with false to avoid hydration issues
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed
    };

    // Set initial value
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  return isMobile;
}

export default useIsMobile;
