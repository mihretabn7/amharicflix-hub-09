
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Set the initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Create the media query list
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Define the handler function
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }
    
    // Add the event listener
    mql.addEventListener("change", handleResize)
    
    // Call the handler right away for initial state
    handleResize(mql)
    
    // Clean up
    return () => mql.removeEventListener("change", handleResize)
  }, [])

  return isMobile
}
