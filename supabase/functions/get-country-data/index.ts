
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
    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') ||
                    req.headers.get('cf-connecting-ip');
    
    // If no IP is provided in the request, extract it from headers
    let ip;
    
    if (req.method === 'POST') {
      const body = await req.json();
      ip = body.ip || clientIp;
    } else {
      ip = clientIp;
    }
    
    if (!ip) {
      return new Response(
        JSON.stringify({ 
          error: "Could not determine client IP address",
          country: "Unknown"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Processing request for IP: ${ip}`);

    // If multiple IPs (e.g., from proxy chains), take the first one
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    // Call ipinfo.io API with the provided token
    const ipInfoResponse = await fetch(`https://ipinfo.io/${ip}/json?token=${IPINFO_TOKEN}`);
    
    if (!ipInfoResponse.ok) {
      throw new Error(`ipinfo.io API error: ${ipInfoResponse.status}`);
    }
    
    const ipData = await ipInfoResponse.json();
    console.log('IP location data:', JSON.stringify(ipData));

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
    console.error("Error processing request:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        country: "Unknown" 
      }),
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
