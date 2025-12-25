import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for OmniAgent with memory awareness
const createSystemPrompt = (memories: string[], voiceMode: boolean) => {
  const memorySection = memories.length > 0 
    ? `\n\nREMEMBERED INFORMATION ABOUT THIS USER:\n${memories.join('\n')}\n\nUse this information naturally in your responses when relevant.`
    : '';

  if (voiceMode) {
    return `You are OmniAgent, an intelligent AI assistant.

Keep responses SHORT and CONVERSATIONAL - you're speaking out loud.

Guidelines:
- Maximum 2-3 sentences per response
- Use natural pauses (periods, not lists)
- Be warm and friendly
- Ask one follow-up question at most
- Never use bullet points or formatting
- Sound like a real assistant, not a document
- If you know the user's name, use it naturally
- Remember their preferences and refer to them

Always ask if they need anything else at the end.${memorySection}`;
  }

  return `You are OmniAgent, an intelligent AI assistant platform.

Your purpose is to communicate with users via chat and voice, understand their needs, and perform actions.

CONVERSATION FLOW:
1. Greet the user politely (use their name if you know it)
2. Understand the user's intent
3. Ask follow-up questions if required
4. Process the request step-by-step
5. Provide a clear and final response
6. Ask if the user needs anything else

RESPONSE GUIDELINES:
- Clear, concise, and professional
- Easy to understand
- Free from technical jargon unless required
- If you know the user's name, use it naturally
- Remember and reference their preferences
- Never guess or invent answers

MEMORY EXTRACTION:
When the user shares personal information, acknowledge it warmly.
Look for and remember:
- Their name (e.g., "I'm John", "My name is Sarah")
- Preferences (e.g., "I prefer email", "I like brief responses")
- Context about their work or needs

Always end with asking if the user needs anything else.${memorySection}`;
};

// Extract memorable information from conversation
const extractMemories = (userMessage: string, assistantResponse: string): Array<{type: string, key: string, value: string}> => {
  const memories: Array<{type: string, key: string, value: string}> = [];
  const lowerMessage = userMessage.toLowerCase();

  // Extract name patterns
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i,
    /this is (\w+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      // Avoid common words that aren't names
      if (!['here', 'fine', 'good', 'okay', 'interested', 'looking', 'trying', 'having'].includes(name.toLowerCase())) {
        memories.push({ type: 'user_name', key: 'name', value: name });
      }
    }
  }

  // Extract preferences
  const preferencePatterns = [
    { pattern: /i prefer (\w+(?:\s+\w+)?)/i, key: 'general_preference' },
    { pattern: /i like (\w+(?:\s+\w+)?)/i, key: 'likes' },
    { pattern: /i don't like (\w+(?:\s+\w+)?)/i, key: 'dislikes' },
    { pattern: /i need (\w+(?:\s+\w+)?)/i, key: 'needs' },
    { pattern: /i work (?:at|for|in) (\w+(?:\s+\w+)?)/i, key: 'workplace' },
  ];

  for (const { pattern, key } of preferencePatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      memories.push({ type: 'preference', key, value: match[1] });
    }
  }

  // Extract previous request context
  if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('appointment')) {
    memories.push({ type: 'request', key: 'scheduling_interest', value: 'User interested in scheduling' });
  }

  return memories;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, voiceMode, intent, sessionId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Create Supabase client for memory operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch existing memories for this session
    let existingMemories: string[] = [];
    if (sessionId) {
      const { data: memoryData } = await supabase
        .from('conversation_memory')
        .select('memory_type, memory_key, memory_value')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (memoryData && memoryData.length > 0) {
        existingMemories = memoryData.map(m => {
          if (m.memory_type === 'user_name') return `User's name: ${m.memory_value}`;
          if (m.memory_type === 'preference') return `User preference (${m.memory_key}): ${m.memory_value}`;
          if (m.memory_type === 'request') return `Previous interest: ${m.memory_value}`;
          return `${m.memory_key}: ${m.memory_value}`;
        });
      }
    }

    console.log("Processing chat request:", { 
      messageCount: messages?.length, 
      voiceMode, 
      intent,
      sessionId,
      memoriesFound: existingMemories.length
    });

    const systemPrompt = createSystemPrompt(existingMemories, voiceMode);

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

    // Extract and store new memories
    if (sessionId && messages?.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      const newMemories = extractMemories(lastUserMessage, content);
      
      for (const memory of newMemories) {
        // Upsert memory (update if exists, insert if not)
        const { error: upsertError } = await supabase
          .from('conversation_memory')
          .upsert({
            session_id: sessionId,
            memory_type: memory.type,
            memory_key: memory.key,
            memory_value: memory.value,
          }, {
            onConflict: 'session_id,memory_key',
            ignoreDuplicates: false
          });
        
        if (upsertError) {
          console.log("Memory storage note:", upsertError.message);
          // Try simple insert if upsert fails
          await supabase
            .from('conversation_memory')
            .insert({
              session_id: sessionId,
              memory_type: memory.type,
              memory_key: memory.key,
              memory_value: memory.value,
            });
        }
      }
      
      if (newMemories.length > 0) {
        console.log("Stored memories:", newMemories.map(m => `${m.key}: ${m.value}`));
      }
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
