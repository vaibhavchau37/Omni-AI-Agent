import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for OmniAgent
const SYSTEM_PROMPT = `You are OmniAgent, an intelligent AI assistant platform.

Your purpose is to communicate with users via chat and voice, understand their needs, and perform actions.

CONVERSATION FLOW:
1. Greet the user politely
2. Understand the user's intent
3. Ask follow-up questions if required
4. Process the request step-by-step
5. Provide a clear and final response
6. Ask if the user needs anything else

INTENT CLASSIFICATION:
Classify each user message into one of these intents:
- General Question
- Information Request  
- Task Execution
- Appointment / Scheduling
- Support / Help
- Unknown Intent

FOR TASK EXECUTION:
- Break the task into smaller steps
- Confirm required details from the user
- Execute the task logically
- Confirm completion to the user

RESPONSE GUIDELINES:
- Keep responses short and natural (especially for voice mode)
- Use friendly conversational tone
- Avoid long paragraphs
- Sound human-like and professional
- Never guess or invent answers
- If you don't know something, say so politely

Always end with asking if the user needs anything else.`;

// Voice mode system prompt (shorter responses)
const VOICE_SYSTEM_PROMPT = `You are OmniAgent, an intelligent AI assistant.

Keep responses SHORT and CONVERSATIONAL - you're speaking out loud.

Guidelines:
- Maximum 2-3 sentences per response
- Use natural pauses (periods, not lists)
- Be warm and friendly
- Ask one follow-up question at most
- Never use bullet points or formatting
- Sound like a real assistant, not a document

Always ask if they need anything else at the end.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, voiceMode, intent } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Processing chat request:", { 
      messageCount: messages?.length, 
      voiceMode, 
      intent,
      lastMessage: messages?.[messages.length - 1]?.content?.substring(0, 50)
    });

    const systemPrompt = voiceMode ? VOICE_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: voiceMode ? 150 : 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "I'm receiving too many requests right now. Please wait a moment and try again.",
            errorType: "rate_limit"
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "The AI service needs attention. Please try again later.",
            errorType: "payment_required"
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", data);
      throw new Error("Invalid response from AI service");
    }

    console.log("AI response generated successfully, length:", content.length);

    return new Response(
      JSON.stringify({ 
        content,
        intent: intent || "General Question"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in omniagent-chat:", error);
    
    // Never expose system errors to user
    const errorMessage = error instanceof Error ? error.message : "";
    const userMessage = errorMessage.includes("configured") || errorMessage.includes("unavailable")
      ? errorMessage
      : "I apologize, but I encountered an issue processing your request. Please try again, or let me know if I can help with something else.";
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        errorType: "general"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
