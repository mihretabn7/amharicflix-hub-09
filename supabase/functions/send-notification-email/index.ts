
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  notificationId?: string;
  userId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client using service role key for elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse request body
    const { to, subject, body, notificationId, userId }: EmailNotification = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // This is where you would integrate with your email provider
    // For example, using SendGrid, Resend, or another service
    // Here we're simulating a successful email send

    // For demonstration, let's log what would be sent
    console.log(`Would send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    // If we have a notification ID, mark it as sent in the database
    if (notificationId && userId) {
      const { error } = await supabaseAdmin
        .from("email_notifications")
        .insert({
          notification_id: notificationId,
          user_id: userId,
          email_sent: true,
        });

      if (error) {
        console.error("Error recording email notification:", error);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing email notification:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to process email notification" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
