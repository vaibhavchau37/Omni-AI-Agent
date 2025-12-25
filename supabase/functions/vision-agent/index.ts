import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { screenshot, goal, previousActions = [], language = "en" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Vision service not configured");
    }

    if (!screenshot) {
      throw new Error("No screenshot provided");
    }

    // Build context from previous actions
    const actionHistory = previousActions.length > 0 
      ? `\n\nPREVIOUS ACTIONS:\n${previousActions.map((a: any, i: number) => 
          `${i + 1}. ${a.type}: ${a.target} - ${a.result}`).join('\n')}`
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
      const errorText = await response.text();
      console.error("Vision API error:", response.status, errorText);
      throw new Error(`Vision analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("Vision analysis complete:", content.substring(0, 200));

    // Try to parse JSON response
    let analysisResult;
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
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
    } catch (parseError) {
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
    console.error("Vision agent error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
