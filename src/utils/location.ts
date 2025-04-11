
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
      ip,
      country: locationData.country,
      city: locationData.city,
      region: locationData.region,
      coordinates: locationData.loc, // "lat,long"
      device: browserData.device,
      browser: browserData.browser,
      timestamp: new Date().toISOString(),
      user_status: 'anonymous'  // Default to anonymous
    };

    // Write the data to the user_analytics table
    const { error } = await supabase
      .from('user_analytics')
      .insert([analyticsData]);

    if (error) {
      console.error("⚠️ Error writing user analytics data:", error);
    }

    return analyticsData;
  } catch (error) {
    console.error("⚠️ Error fetching user location:", error);
    return null;
  }
};

// Function to update user status from anonymous to registered
export const updateUserStatus = async (ip: string) => {
  try {
    const { error } = await supabase
      .from('user_analytics')
      .update({ user_status: 'registered' })
      .eq('ip', ip)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("⚠️ Error updating user status:", error);
    }
  } catch (error) {
    console.error("⚠️ Error in updateUserStatus:", error);
  }
};
