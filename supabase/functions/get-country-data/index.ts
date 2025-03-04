
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const IPINFO_TOKEN = "88049e7d9b2938";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const { ip } = await req.json();
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: "IP address is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Call ipinfo.io API with the provided token
    const ipInfoResponse = await fetch(`https://ipinfo.io/${ip}/json?token=${IPINFO_TOKEN}`);
    const ipData = await ipInfoResponse.json();

    return new Response(
      JSON.stringify({
        country: ipData.country || "Unknown",
        region: ipData.region || null,
        city: ipData.city || null,
        loc: ipData.loc || null,
        timezone: ipData.timezone || null,
        org: ipData.org || null
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
