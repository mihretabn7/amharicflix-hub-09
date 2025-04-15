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

let userLocationPromise: Promise<any> | null = null;

export const fetchUserLocation = async () => {
  if (userLocationPromise) {
    return userLocationPromise;
  }
  userLocationPromise = (async () => {
    try {
      // Check localStorage cache (24h)
      const cached = localStorage.getItem('user_location');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 86400000) {
          return data;
        }
      }

      // Fetch from ipinfo
      const response = await fetch(`https://ipinfo.io/json?token=88049e7d9b2938`);
      const locationData = await response.json();
      const browserData = getUserDeviceInfo();

      const analyticsData = {
        ip: locationData.ip,
        country: locationData.country,
        city: locationData.city,
        region: locationData.region,
        coordinates: locationData.loc,
        device: browserData.device,
        browser: browserData.browser,
        timestamp: new Date().toISOString(),
        user_status: 'anonymous'
      };

      // Check if already written today for this IP
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing, error: selectError } = await supabase
        .from('user_analytics')
        .select('id, timestamp')
        .eq('ip', analyticsData.ip)
        .gte('timestamp', today)
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error("Error checking analytics existence:", selectError);
      }

      if (!existing) {
        const { error } = await supabase
          .from('user_analytics')
          .insert([analyticsData]);
        if (error) {
          console.error("⚠️ Error writing user analytics data:", error);
        }
      }

      // Cache in localStorage
      localStorage.setItem('user_location', JSON.stringify({ data: analyticsData, timestamp: Date.now() }));

      return analyticsData;
    } catch (error) {
      console.error("⚠️ Error fetching user location:", error);
      userLocationPromise = null;
      return null;
    }
  })();
  return userLocationPromise;
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
