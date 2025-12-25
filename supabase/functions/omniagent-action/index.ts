import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ===========================================
// CORS CONFIGURATION - Environment-based origins
// ===========================================
const PRODUCTION_ORIGINS = ['https://ymbgmsvmesejppjgothe.lovableproject.com'];
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];
const ALLOWED_ORIGINS = Deno.env.get('ENVIRONMENT') === 'production' 
  ? PRODUCTION_ORIGINS 
  : [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : PRODUCTION_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// ===========================================
// INPUT VALIDATION SCHEMAS
// ===========================================
const ActionTypes = z.enum([
  'send_email',
  'schedule_meeting',
  'search_knowledge',
  'create_task',
  'get_weather'
]);

const ActionRequestSchema = z.object({
  action: ActionTypes,
  params: z.record(z.unknown()).optional().default({}),
});

// Simulated external actions for demonstration
const executeAction = async (actionType: string, params: Record<string, unknown>) => {
  console.log("Executing action:", actionType, params);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  switch (actionType) {
    case "send_email":
      return {
        success: true,
        message: `Email prepared for ${params.to || "recipient"}`,
        details: "Email queued for delivery"
      };
    
    case "schedule_meeting":
      return {
        success: true,
        message: `Meeting scheduled for ${params.date || "requested date"}`,
        details: `Duration: ${params.duration || "30 minutes"}`
      };
    
    case "search_knowledge":
      return {
        success: true,
        message: "Knowledge base searched",
        results: params.query ? [`Results for: ${params.query}`] : []
      };
    
    case "create_task":
      return {
        success: true,
        message: `Task "${params.title || "New Task"}" created`,
        taskId: `task_${Date.now()}`
      };
    
    case "get_weather":
      return {
        success: true,
        message: `Weather for ${params.location || "your location"}`,
        details: "Currently unavailable - external API required"
      };
    
    default:
      return {
        success: false,
        message: "Unknown action type"
      };
  }
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===========================================
    // JWT AUTHENTICATION
    // ===========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[omniagent-action] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[omniagent-action] Missing required configuration');
      return new Response(
        JSON.stringify({ success: false, error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's JWT
    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser();
    if (authError || !user) {
      console.error('[omniagent-action] Invalid JWT:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===========================================
    // INPUT VALIDATION
    // ===========================================
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = ActionRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('[omniagent-action] Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Please specify a valid action type" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, params } = validationResult.data;
    console.log("Action request received:", { action, params, userId: user.id });
    
    const result = await executeAction(action, params);
    console.log("Action result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[omniagent-action] Error:", error);
    
    // Generic error message - never expose internal details
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Unable to complete that action. Please try again."
      }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('Origin')), "Content-Type": "application/json" } }
    );
  }
});
