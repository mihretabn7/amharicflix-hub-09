import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { amount, donationType, email, first_name, last_name } = await req.json();
    
    const chapaApiKey = Deno.env.get("CHAPA_SECRET_KEY") || "CHAPUBK_TEST-E52DynL44VgoLGfMXq8KlGfWtlnvlC9Y";
    const tx_ref = `amharicflix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload = {
      amount: amount,
      currency: "ETB",
      email: email,
      first_name: first_name || "User",
      last_name: last_name || "Support",
      tx_ref: tx_ref,
      callback_url: `${req.headers.get("origin")}/payment-success`,
      return_url: `${req.headers.get("origin")}/payment-success`,
      customization: {
        title: "AmharicFlix Support",
        description: `${donationType} donation to AmharicFlix`,
        logo: "https://your-domain.com/logo.png"
      }
    };

    console.log("Creating Chapa payment with payload:", payload);

    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chapaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    console.log("Chapa API response:", data);

    if (data.status === "success") {
      return new Response(
        JSON.stringify({
          success: true,
          checkout_url: data.data.checkout_url,
          tx_ref: tx_ref,
        }),
        { headers }
      );
    } else {
      throw new Error(data.message || "Failed to create payment");
    }
  } catch (error) {
    console.error("Error creating Chapa payment:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 400, headers }
    );
  }
});