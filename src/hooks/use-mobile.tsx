
import { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is mobile size
 * @returns boolean indicating if the current viewport is mobile size
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed
    };

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
