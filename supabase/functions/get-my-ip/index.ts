
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Fetch IP from ipify
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    
    if (!ipResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch IP" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    const ipData = await ipResponse.json();
    
    // Now use the IP to get country data
    const IPINFO_TOKEN = "88049e7d9b2938";
    const countryResponse = await fetch(`https://ipinfo.io/${ipData.ip}/json?token=${IPINFO_TOKEN}`);
    
    if (!countryResponse.ok) {
      return new Response(
        JSON.stringify({ ip: ipData.ip, error: "Failed to fetch country data" }),
        {
          status: 200, // Still return 200 with the IP
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    const countryData = await countryResponse.json();
    
    return new Response(
      JSON.stringify({
        ip: ipData.ip,
        country: countryData.country || "Unknown",
        region: countryData.region || null,
        city: countryData.city || null,
        loc: countryData.loc || null,
        timezone: countryData.timezone || null,
        org: countryData.org || null
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
