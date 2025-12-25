import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simulated external actions for demonstration
const executeAction = async (actionType: string, params: Record<string, unknown>) => {
  console.log("Executing action:", actionType, params);
  
  // Simulate processing time
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
        message: "Unknown action type",
        suggestion: "Please specify a valid action"
      };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "No action specified. Please tell me what you'd like to do."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Action request received:", { action, params });
    
    const result = await executeAction(action, params || {});
    
    console.log("Action result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in omniagent-action:", error);
    
    // Never expose system errors
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "I apologize, but I couldn't complete that action right now. Would you like to try something else?",
        suggestion: "Please try again or describe what you need in a different way."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
