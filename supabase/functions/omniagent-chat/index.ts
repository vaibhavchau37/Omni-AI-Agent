import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multi-Agent System Prompts
const PLANNER_PROMPT = `You are the Planner Agent. Your job is to:
1. Analyze the user's request
2. Break down complex tasks into steps
3. Identify what information is needed
4. Create an execution plan

Respond with a brief plan in 2-3 bullet points. Be concise.`;

const EXECUTOR_PROMPT = `You are the Executor Agent. Your job is to:
1. Follow the plan provided
2. Execute each step logically
3. Gather and process information
4. Prepare the response content

Execute the task and provide the result.`;

const SUPPORT_PROMPT = `You are the Support Agent. Your job is to:
1. Make responses friendly and clear
2. Ensure the user feels heard
3. Add helpful context when needed
4. Detect user emotion and adjust tone

If user seems frustrated, be extra empathetic.
If user seems happy, match their energy.`;

const EVALUATOR_PROMPT = `You are the Evaluator Agent. Your job is to:
1. Review the response for accuracy
2. Simplify explanations
3. Remove unnecessary content
4. Rate confidence (HIGH, MEDIUM, LOW)
5. Flag if human escalation is needed

Respond with:
CONFIDENCE: [HIGH/MEDIUM/LOW]
ESCALATE: [YES/NO]
IMPROVED_RESPONSE: [your improved version]`;

// Emotion detection patterns
const detectEmotion = (message: string): "positive" | "neutral" | "negative" | "frustrated" => {
  const lower = message.toLowerCase();
  
  // Frustrated indicators
  if (
    lower.includes("frustrated") ||
    lower.includes("angry") ||
    lower.includes("annoyed") ||
    lower.includes("!!!") ||
    lower.includes("not working") ||
    lower.includes("doesn't work") ||
    lower.includes("hate") ||
    lower.includes("terrible") ||
    lower.includes("worst")
  ) {
    return "frustrated";
  }
  
  // Negative indicators
  if (
    lower.includes("confused") ||
    lower.includes("don't understand") ||
    lower.includes("problem") ||
    lower.includes("issue") ||
    lower.includes("wrong") ||
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("sad") ||
    lower.includes("disappointed")
  ) {
    return "negative";
  }
  
  // Positive indicators
  if (
    lower.includes("thank") ||
    lower.includes("great") ||
    lower.includes("awesome") ||
    lower.includes("love") ||
    lower.includes("excellent") ||
    lower.includes("perfect") ||
    lower.includes("amazing") ||
    lower.includes("wonderful") ||
    lower.includes("happy") ||
    lower.includes("!")
  ) {
    return "positive";
  }
  
  return "neutral";
};

// Main system prompt with memory
const createMainPrompt = (memories: string[], emotion: string, voiceMode: boolean) => {
  const emotionGuidance = {
    positive: "The user seems happy. Match their positive energy!",
    neutral: "The user is in a neutral state. Be helpful and professional.",
    negative: "The user seems concerned. Be extra helpful and reassuring.",
    frustrated: "The user seems frustrated. Be calm, empathetic, and solution-focused. Acknowledge their frustration.",
  };

  const memorySection = memories.length > 0 
    ? `\n\nREMEMBERED ABOUT THIS USER:\n${memories.join('\n')}`
    : '';

  const voiceGuidance = voiceMode 
    ? "\n\nVOICE MODE: Keep response under 3 sentences. Be conversational, no formatting."
    : "";

  return `You are OmniAgent, an intelligent multi-agent AI assistant.

EMOTIONAL CONTEXT: ${emotionGuidance[emotion as keyof typeof emotionGuidance]}

GUIDELINES:
- Clear, concise, professional responses
- Easy to understand, avoid jargon
- Use the user's name if known
- Always ask if they need anything else
- If unsure, admit it honestly${memorySection}${voiceGuidance}`;
};

// Extract memories from message
const extractMemories = (message: string): Array<{type: string, key: string, value: string}> => {
  const memories: Array<{type: string, key: string, value: string}> = [];
  
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      if (!['here', 'fine', 'good', 'okay', 'interested', 'looking', 'trying', 'having', 'just'].includes(name.toLowerCase())) {
        memories.push({ type: 'user_name', key: 'name', value: name });
      }
    }
  }

  const prefPatterns = [
    { pattern: /i prefer (\w+(?:\s+\w+)?)/i, key: 'preference' },
    { pattern: /i like (\w+(?:\s+\w+)?)/i, key: 'likes' },
    { pattern: /i work (?:at|for|in) (\w+(?:\s+\w+)?)/i, key: 'workplace' },
  ];

  for (const { pattern, key } of prefPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      memories.push({ type: 'preference', key, value: match[1] });
    }
  }

  return memories;
};

// Call AI with specific prompt
const callAI = async (apiKey: string, systemPrompt: string, messages: Array<{role: string, content: string}>, maxTokens = 300) => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
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
      throw new Error("AI service is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const lastMessage = messages?.[messages.length - 1]?.content || '';
    
    // Detect emotion
    const emotion = detectEmotion(lastMessage);
    console.log("Detected emotion:", emotion);

    // Fetch memories
    let existingMemories: string[] = [];
    if (sessionId) {
      const { data: memoryData } = await supabase
        .from('conversation_memory')
        .select('memory_type, memory_key, memory_value')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (memoryData?.length) {
        existingMemories = memoryData.map(m => {
          if (m.memory_type === 'user_name') return `User's name: ${m.memory_value}`;
          if (m.memory_type === 'preference') return `Preference (${m.memory_key}): ${m.memory_value}`;
          return `${m.memory_key}: ${m.memory_value}`;
        });
      }
    }

    // Multi-agent collaboration for complex tasks
    const isComplexTask = intent === "Task Execution" || lastMessage.length > 100;
    let agentActivities: Array<{agent: string, action: string}> = [];
    
    let finalResponse = "";
    let confidence: "high" | "medium" | "low" = "high";
    let shouldEscalate = false;

    if (isComplexTask && !voiceMode) {
      // Step 1: Planner Agent
      agentActivities.push({ agent: "planner", action: "Analyzing request and creating plan" });
      const plan = await callAI(LOVABLE_API_KEY, PLANNER_PROMPT, messages, 150);
      console.log("Planner output:", plan);

      // Step 2: Executor Agent
      agentActivities.push({ agent: "executor", action: "Executing the plan" });
      const executorMessages = [...messages, { role: "assistant", content: `Plan: ${plan}` }];
      const execution = await callAI(LOVABLE_API_KEY, EXECUTOR_PROMPT, executorMessages, 300);
      console.log("Executor output:", execution);

      // Step 3: Support Agent (emotion-aware)
      agentActivities.push({ agent: "support", action: "Adding empathy and clarity" });
      const supportPrompt = SUPPORT_PROMPT + `\n\nUser emotion: ${emotion}. Adjust tone accordingly.`;
      const supportMessages = [...messages, { role: "assistant", content: execution }];
      const supported = await callAI(LOVABLE_API_KEY, supportPrompt, supportMessages, 300);

      // Step 4: Evaluator Agent
      agentActivities.push({ agent: "evaluator", action: "Reviewing and improving response" });
      const evalMessages = [{ role: "user", content: `Review this response:\n${supported}` }];
      const evaluation = await callAI(LOVABLE_API_KEY, EVALUATOR_PROMPT, evalMessages, 400);
      
      // Parse evaluation
      const confMatch = evaluation.match(/CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
      const escMatch = evaluation.match(/ESCALATE:\s*(YES|NO)/i);
      const respMatch = evaluation.match(/IMPROVED_RESPONSE:\s*([\s\S]*)/i);
      
      confidence = (confMatch?.[1]?.toLowerCase() || "medium") as "high" | "medium" | "low";
      shouldEscalate = escMatch?.[1]?.toUpperCase() === "YES";
      finalResponse = respMatch?.[1]?.trim() || supported;

    } else {
      // Simple request - single agent with emotion awareness
      const mainPrompt = createMainPrompt(existingMemories, emotion, voiceMode);
      finalResponse = await callAI(LOVABLE_API_KEY, mainPrompt, messages, voiceMode ? 100 : 400);
      
      // Quick confidence check for simple responses
      if (emotion === "frustrated" || lastMessage.includes("?")) {
        confidence = "medium";
      }
      if (finalResponse.includes("I'm not sure") || finalResponse.includes("I don't know")) {
        confidence = "low";
        shouldEscalate = true;
      }
    }

    // Store new memories
    if (sessionId) {
      const newMemories = extractMemories(lastMessage);
      for (const memory of newMemories) {
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

    console.log("Response generated:", { confidence, shouldEscalate, emotion, agentCount: agentActivities.length });

    return new Response(
      JSON.stringify({ 
        content: finalResponse,
        intent: intent || "General Question",
        confidence,
        emotion,
        shouldEscalate,
        agentActivities: agentActivities.length > 0 ? agentActivities : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in omniagent-chat:", error);
    
    const errorMessage = error instanceof Error ? error.message : "";
    const userMessage = errorMessage.includes("configured") || errorMessage.includes("unavailable")
      ? errorMessage
      : "I apologize, but I encountered an issue. Please try again, or let me know if I can help with something else.";
    
    return new Response(
      JSON.stringify({ error: userMessage, errorType: "general" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
