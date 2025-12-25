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
const PreviousActionSchema = z.object({
  type: z.string().max(50).optional(),
  target: z.string().max(500).optional(),
  result: z.string().max(500).optional(),
}).passthrough();

const VisionRequestSchema = z.object({
  screenshot: z.string().min(1).max(15000000), // ~11MB base64 max
  goal: z.string().min(1).max(1000),
  previousActions: z.array(PreviousActionSchema).max(50).optional().default([]),
  language: z.enum(['en', 'hi']).optional().default('en'),
});

// Action types the agent can suggest
const ACTION_TYPES = {
  CLICK: "click",
  TYPE: "type", 
  SCROLL: "scroll",
  WAIT: "wait",
  NAVIGATE: "navigate",
  READ: "read",
  NONE: "none"
};

const VISION_AGENT_PROMPT = `You are a Vision-Based Desktop Agent. You analyze screenshots of user interfaces and determine the next best action to help the user achieve their goal.

CAPABILITIES:
1. CLICK - Click on buttons, links, inputs, or any interactive element
2. TYPE - Enter text into input fields, search boxes, or text areas
3. SCROLL - Scroll up, down, left, or right to reveal more content
4. WAIT - Wait for content to load or animations to complete
5. NAVIGATE - Go to a specific URL or page
6. READ - Extract and read information from the screen

ANALYSIS PROCESS:
1. Identify the current UI state (what app/website, what screen)
2. Locate interactive elements (buttons, inputs, links, menus)
3. Understand the layout and hierarchy
4. Determine the most logical next action based on the user's goal

RESPONSE FORMAT (JSON):
{
  "ui_state": {
    "application": "Name of app/website",
    "current_screen": "Description of current view",
    "elements_found": ["list", "of", "interactive", "elements"]
  },
  "analysis": "Brief analysis of what's visible and relevant",
  "suggested_action": {
    "type": "click|type|scroll|wait|navigate|read",
    "target": "Description of element to interact with",
    "coordinates": {"x": 0, "y": 0},
    "value": "Text to type or URL to navigate (if applicable)",
    "confidence": 0.95,
    "reasoning": "Why this action helps achieve the goal"
  },
  "alternative_actions": [
    {"type": "...", "target": "...", "reasoning": "..."}
  ],
  "goal_progress": "How this action moves toward the goal"
}

SAFETY:
- Never suggest actions that could harm the system
- Warn about potentially destructive actions (delete, close without saving)
- Prefer reversible actions when possible`;

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
      console.error('[vision-agent] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !LOVABLE_API_KEY) {
      console.error('[vision-agent] Missing required configuration');
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
      console.error('[vision-agent] Invalid JWT:', authError?.message);
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

    const validationResult = VisionRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('[vision-agent] Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request parameters" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { screenshot, goal, previousActions, language } = validationResult.data;

    // Build context from previous actions
    const actionHistory = previousActions.length > 0 
      ? `\n\nPREVIOUS ACTIONS:\n${previousActions.map((a, i) => 
          `${i + 1}. ${a.type || 'action'}: ${a.target || 'unknown'} - ${a.result || 'completed'}`).join('\n')}`
      : "";

    const userMessage = language === "hi" 
      ? `लक्ष्य: ${goal}\n\nइस स्क्रीनशॉट का विश्लेषण करें और अगली सर्वोत्तम क्रिया सुझाएं।${actionHistory}`
      : `Goal: ${goal}\n\nAnalyze this screenshot and suggest the next best action to achieve the goal.${actionHistory}`;

    console.log("Sending screenshot for vision analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: VISION_AGENT_PROMPT },
          { 
            role: "user", 
            content: [
              { type: "text", text: userMessage },
              { 
                type: "image_url", 
                image_url: { url: screenshot }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("[vision-agent] API error:", response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unable to analyze the image. Please try again." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("Vision analysis complete:", content.substring(0, 200));

    // Try to parse JSON response
    let analysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = {
          ui_state: { application: "Unknown", current_screen: "Analysis complete" },
          analysis: content,
          suggested_action: {
            type: "read",
            target: "Screen content",
            confidence: 0.7,
            reasoning: "Could not determine specific action"
          }
        };
      }
    } catch {
      console.log("JSON parse failed, using text response");
      analysisResult = {
        analysis: content,
        suggested_action: { type: "read", confidence: 0.5 }
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        rawResponse: content,
        language
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[vision-agent] Error:", error);
    
    // Generic error message - never expose internal details
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Unable to process the request. Please try again."
      }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('Origin')), "Content-Type": "application/json" } }
    );
  }
});
