
import { supabase } from "@/integrations/supabase/client";

export const getUserDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let device = "Unknown";

  if (/mobile/i.test(userAgent)) {
    device = "Mobile";
  } else if (/tablet/i.test(userAgent)) {
    device = "Tablet";
  } else {
    device = "Desktop";
  }

  return {
    device,
    browser: navigator.userAgent,
  };
};

export const fetchUserLocation = async () => {
  try {
    // ✅ First, Get the User's Public IP
    const ipResponse = await fetch("https://api64.ipify.org?format=json");
    const { ip } = await ipResponse.json();

    console.log("🛰️ User's IP:", ip);

    // ✅ Then, Use an IP Geolocation API
    const geoResponse = await fetch(`https://ipinfo.io/${ip}/json?token=88049e7d9b2938`);
    const locationData = await geoResponse.json();
    const browserData = getUserDeviceInfo();
    console.log("🌍 User's Location Data:", locationData);

    const analyticsData = {
      ip: ip,
      country: locationData.country,
      city: locationData.city,
      region: locationData.region,
      coordinates: locationData.loc, // "lat,long"
      device: browserData.device,
      browser: browserData.browser,
      timestamp: new Date().toISOString(),
    };

    // Write the data to the user_analytics table
    const { error } = await supabase.from('user_analytics').insert(analyticsData);

    if (error) {
      console.error("⚠️ Error writing user analytics data:", error);
    }

    return analyticsData;
  } catch (error) {
    console.error("⚠️ Error fetching user location:", error);
    return null;
  }
};

// Track anonymous view with country information
export const trackAnonymousView = async (movieId: string) => {
  try {
    // Get IP and location data
    const ipResponse = await fetch("https://api64.ipify.org?format=json");
    const { ip } = await ipResponse.json();
    
    const geoResponse = await fetch(`https://ipinfo.io/${ip}/json?token=88049e7d9b2938`);
    const locationData = await geoResponse.json();
    const browserData = getUserDeviceInfo();

    // Insert anonymous view
    const { error } = await supabase.from('anonymous_views').insert({
      movie_id: movieId,
      ip_address: ip,
      country_code: locationData.country,
      browser_info: JSON.stringify({
        name: browserData.browser.split(' ')[0],
        version: browserData.browser.split(' ')[1],
        userAgent: browserData.browser
      }),
      device_info: JSON.stringify({
        type: browserData.device,
        os: navigator.platform
      })
    });

    if (error) {
      console.error("Error tracking anonymous view:", error);
    }
  } catch (error) {
    console.error("Error in trackAnonymousView:", error);
  }
};
