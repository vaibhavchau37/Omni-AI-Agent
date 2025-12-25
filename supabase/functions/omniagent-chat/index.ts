import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Available tools for agent
const AVAILABLE_TOOLS = [
  { name: "search", description: "Search for information", triggers: ["find", "search", "look up"] },
  { name: "calendar", description: "Schedule appointments", triggers: ["schedule", "book", "appointment"] },
  { name: "email", description: "Send emails", triggers: ["email", "send message", "mail"] },
  { name: "task", description: "Create and manage tasks", triggers: ["task", "todo", "remind"] },
  { name: "calculate", description: "Perform calculations", triggers: ["calculate", "compute", "math"] },
  { name: "analyze", description: "Analyze data or content", triggers: ["analyze", "review", "evaluate"] },
];

// Role-based behavior configurations
const ROLE_CONFIGS = {
  default: {
    name: "OmniAgent",
    tone: "professional and friendly",
    permissions: ["general", "tasks", "information"],
    greeting: "Hello! I'm OmniAgent, your intelligent AI assistant.",
  },
  student_assistant: {
    name: "Study Buddy",
    tone: "encouraging and educational",
    permissions: ["learning", "study", "explanations"],
    greeting: "Hey there! Ready to learn something awesome today?",
  },
  hr_assistant: {
    name: "HR Assistant",
    tone: "professional and empathetic",
    permissions: ["hr", "policies", "onboarding"],
    greeting: "Welcome! I'm here to help with any HR-related questions.",
  },
  customer_support: {
    name: "Support Agent",
    tone: "patient and solution-focused",
    permissions: ["support", "troubleshooting", "refunds"],
    greeting: "Hi! I'm here to help resolve any issues you're experiencing.",
  },
  admin_agent: {
    name: "Admin Assistant",
    tone: "efficient and direct",
    permissions: ["admin", "reports", "system"],
    greeting: "Admin mode active. How can I assist with system operations?",
  },
};

// Multi-Agent System Prompts
const PLANNER_PROMPT = `You are the Planner Agent. Your job is to:
1. Analyze the user's request
2. Break down complex tasks into steps
3. Identify what information is needed
4. Create an execution plan

For GOAL-ORIENTED requests (user gives a goal like "help me prepare for X"):
- Break the goal into 3-5 actionable steps
- Format as: STEP 1: [action], STEP 2: [action], etc.
- Include progress markers

Respond with a brief plan in 2-3 bullet points. Be concise.`;

const EXECUTOR_PROMPT = `You are the Executor Agent. Your job is to:
1. Follow the plan provided
2. Execute each step logically
3. Gather and process information
4. Prepare the response content

If a step fails, note it and suggest an alternative approach.

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
REASONING: [brief explanation of why you gave this confidence]
IMPROVED_RESPONSE: [your improved version]`;

// Emotion detection patterns
const detectEmotion = (message: string): "positive" | "neutral" | "negative" | "frustrated" => {
  const lower = message.toLowerCase();
  
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

// Detect if message is a goal vs a question
const detectGoal = (message: string): { isGoal: boolean; goalDescription: string | null } => {
  const lower = message.toLowerCase();
  const goalPatterns = [
    /help me (?:to )?(.*)/i,
    /i want to (.*)/i,
    /i need to (.*)/i,
    /prepare (?:me )?for (.*)/i,
    /teach me (.*)/i,
    /guide me (?:to|through) (.*)/i,
    /show me how to (.*)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return { isGoal: true, goalDescription: match[1].trim() };
    }
  }

  return { isGoal: false, goalDescription: null };
};

// Select appropriate tool based on message
const selectTool = (message: string): { tool: string | null; reason: string } => {
  const lower = message.toLowerCase();
  
  for (const tool of AVAILABLE_TOOLS) {
    for (const trigger of tool.triggers) {
      if (lower.includes(trigger)) {
        return { 
          tool: tool.name, 
          reason: `Selected ${tool.name} tool because message contains "${trigger}"` 
        };
      }
    }
  }
  
  return { tool: null, reason: "Using general reasoning - no specific tool needed" };
};

// Main system prompt with memory, role, and goal awareness
const createMainPrompt = (
  memories: string[], 
  emotion: string, 
  voiceMode: boolean, 
  role: string,
  goalContext?: { goal: string; steps: string[]; currentStep: number },
  isSimulation?: boolean
) => {
  const roleConfig = ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS] || ROLE_CONFIGS.default;
  
  const emotionGuidance = {
    positive: "The user seems happy. Match their positive energy!",
    neutral: "The user is in a neutral state. Be helpful and professional.",
    negative: "The user seems concerned. Be extra helpful and reassuring.",
    frustrated: "The user seems frustrated. Be calm, empathetic, and solution-focused.",
  };

  const memorySection = memories.length > 0 
    ? `\n\nREMEMBERED ABOUT THIS USER:\n${memories.join('\n')}`
    : '';

  const voiceGuidance = voiceMode 
    ? "\n\nVOICE MODE: Keep response under 3 sentences. Be conversational, no formatting."
    : "";

  const goalSection = goalContext 
    ? `\n\nACTIVE GOAL: ${goalContext.goal}\nSTEPS: ${goalContext.steps.join(' → ')}\nCURRENT STEP: ${goalContext.currentStep + 1} of ${goalContext.steps.length}`
    : "";

  const simulationWarning = isSimulation
    ? "\n\n[SIMULATION MODE] This is a test interaction. Do not save any data."
    : "";

  return `You are ${roleConfig.name}, an intelligent multi-agent AI assistant.

ROLE: ${roleConfig.name}
TONE: ${roleConfig.tone}
PERMISSIONS: ${roleConfig.permissions.join(", ")}

EMOTIONAL CONTEXT: ${emotionGuidance[emotion as keyof typeof emotionGuidance]}

GUIDELINES:
- Clear, concise, professional responses
- Easy to understand, avoid jargon
- Use the user's name if known
- Always ask if they need anything else
- If unsure, admit it honestly
- When explaining decisions, be transparent${memorySection}${voiceGuidance}${goalSection}${simulationWarning}`;
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

// Compress long conversation context
const compressContext = async (
  apiKey: string, 
  messages: Array<{role: string, content: string}>
): Promise<string> => {
  if (messages.length < 6) return "";
  
  const messagesText = messages.slice(0, -3).map(m => `${m.role}: ${m.content}`).join('\n');
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: "Summarize this conversation in 2-3 sentences. Keep only important facts, decisions, and context. Be extremely concise." 
        },
        { role: "user", content: messagesText },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) return "";
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// Call AI with specific prompt and retry logic
const callAI = async (
  apiKey: string, 
  systemPrompt: string, 
  messages: Array<{role: string, content: string}>, 
  maxTokens = 300,
  retryCount = 0
): Promise<{ content: string; retries: number }> => {
  try {
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
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      if (retryCount < 2) {
        console.log(`AI call failed, retrying (attempt ${retryCount + 2})...`);
        await new Promise(r => setTimeout(r, 1000));
        return callAI(apiKey, systemPrompt, messages, maxTokens, retryCount + 1);
      }
      throw new Error(`AI call failed after ${retryCount + 1} attempts: ${response.status}`);
    }

    const data = await response.json();
    return { 
      content: data.choices?.[0]?.message?.content || "", 
      retries: retryCount 
    };
  } catch (error) {
    if (retryCount < 2) {
      console.log(`AI call error, retrying (attempt ${retryCount + 2})...`);
      await new Promise(r => setTimeout(r, 1000));
      return callAI(apiKey, systemPrompt, messages, maxTokens, retryCount + 1);
    }
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { 
      messages, 
      voiceMode, 
      intent, 
      sessionId, 
      agentRole = "default",
      isSimulation = false,
      explainDecision = false
    } = await req.json();
    
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

    // Detect goal
    const { isGoal, goalDescription } = detectGoal(lastMessage);
    console.log("Is goal:", isGoal, goalDescription);

    // Select tool
    const { tool: selectedTool, reason: toolReason } = selectTool(lastMessage);
    console.log("Selected tool:", selectedTool, toolReason);

    // Fetch memories (skip in simulation mode)
    let existingMemories: string[] = [];
    let goalContext: { goal: string; steps: string[]; currentStep: number } | undefined;
    
    if (sessionId && !isSimulation) {
      // Fetch memories
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

      // Fetch active goal
      const { data: goalData } = await supabase
        .from('agent_goals')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (goalData) {
        goalContext = {
          goal: goalData.goal_description,
          steps: [], // Would parse from saved data
          currentStep: goalData.completed_steps,
        };
      }
    }

    // Context compression for long conversations
    let contextSummary = "";
    if (messages.length > 6) {
      contextSummary = await compressContext(LOVABLE_API_KEY, messages);
      console.log("Context compressed:", contextSummary.substring(0, 100));
    }

    // Multi-agent collaboration
    const isComplexTask = intent === "Task Execution" || lastMessage.length > 100 || isGoal;
    let agentActivities: Array<{agent: string, action: string}> = [];
    
    let finalResponse = "";
    let confidence: "high" | "medium" | "low" = "high";
    let shouldEscalate = false;
    let reasoning = "";
    let totalRetries = 0;
    let goalSteps: string[] = [];

    if (isComplexTask && !voiceMode) {
      // Step 1: Planner Agent
      agentActivities.push({ agent: "planner", action: isGoal ? "Breaking down goal into steps" : "Analyzing request and creating plan" });
      const planResult = await callAI(LOVABLE_API_KEY, PLANNER_PROMPT, messages, 200);
      totalRetries += planResult.retries;
      console.log("Planner output:", planResult.content);

      // Extract goal steps if applicable
      if (isGoal && goalDescription) {
        const stepMatches = planResult.content.match(/STEP \d+:\s*([^\n]+)/gi);
        if (stepMatches) {
          goalSteps = stepMatches.map(s => s.replace(/STEP \d+:\s*/i, '').trim());
        }
        
        // Save goal to database (skip in simulation)
        if (sessionId && !isSimulation && goalSteps.length > 0) {
          await supabase.from('agent_goals').insert({
            session_id: sessionId,
            goal_description: goalDescription,
            total_steps: goalSteps.length,
            completed_steps: 0,
            status: 'active',
          });
        }
      }

      // Step 2: Tool Selection
      if (selectedTool) {
        agentActivities.push({ agent: "executor", action: `Selected ${selectedTool} tool: ${toolReason}` });
      }

      // Step 3: Executor Agent
      agentActivities.push({ agent: "executor", action: "Executing the plan" });
      const executorMessages = [
        ...(contextSummary ? [{ role: "system" as const, content: `Previous conversation summary: ${contextSummary}` }] : []),
        ...messages, 
        { role: "assistant" as const, content: `Plan: ${planResult.content}` }
      ];
      const execResult = await callAI(LOVABLE_API_KEY, EXECUTOR_PROMPT, executorMessages, 400);
      totalRetries += execResult.retries;
      console.log("Executor output:", execResult.content);

      // Step 4: Support Agent (emotion-aware)
      agentActivities.push({ agent: "support", action: "Adding empathy and clarity" });
      const supportPrompt = SUPPORT_PROMPT + `\n\nUser emotion: ${emotion}. Adjust tone accordingly.`;
      const supportMessages = [...messages, { role: "assistant" as const, content: execResult.content }];
      const supportResult = await callAI(LOVABLE_API_KEY, supportPrompt, supportMessages, 400);
      totalRetries += supportResult.retries;

      // Step 5: Evaluator Agent
      agentActivities.push({ agent: "evaluator", action: "Reviewing and improving response" });
      const evalMessages = [{ role: "user" as const, content: `Review this response:\n${supportResult.content}` }];
      const evalResult = await callAI(LOVABLE_API_KEY, EVALUATOR_PROMPT, evalMessages, 500);
      
      // Parse evaluation
      const confMatch = evalResult.content.match(/CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
      const escMatch = evalResult.content.match(/ESCALATE:\s*(YES|NO)/i);
      const reasonMatch = evalResult.content.match(/REASONING:\s*([^\n]+)/i);
      const respMatch = evalResult.content.match(/IMPROVED_RESPONSE:\s*([\s\S]*)/i);
      
      confidence = (confMatch?.[1]?.toLowerCase() || "medium") as "high" | "medium" | "low";
      shouldEscalate = escMatch?.[1]?.toUpperCase() === "YES";
      reasoning = reasonMatch?.[1]?.trim() || "";
      finalResponse = respMatch?.[1]?.trim() || supportResult.content;

    } else {
      // Simple request - single agent with emotion awareness
      const mainPrompt = createMainPrompt(
        existingMemories, 
        emotion, 
        voiceMode, 
        agentRole,
        goalContext,
        isSimulation
      );
      
      // Add context summary if available
      const contextMessages = contextSummary 
        ? [{ role: "system" as const, content: `Previous conversation summary: ${contextSummary}` }, ...messages]
        : messages;
      
      const result = await callAI(LOVABLE_API_KEY, mainPrompt, contextMessages, voiceMode ? 100 : 400);
      finalResponse = result.content;
      totalRetries = result.retries;
      
      // Quick confidence check
      if (emotion === "frustrated" || lastMessage.includes("?")) {
        confidence = "medium";
      }
      if (finalResponse.includes("I'm not sure") || finalResponse.includes("I don't know")) {
        confidence = "low";
        shouldEscalate = true;
      }
    }

    // Add explain-my-decision if requested
    if (explainDecision && reasoning) {
      finalResponse += `\n\n---\n**Why I answered this way:**\n${reasoning}`;
    }

    // Store new memories (skip in simulation mode)
    if (sessionId && !isSimulation) {
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

      // Log analytics
      const responseTime = Date.now() - startTime;
      await supabase.from('agent_analytics').insert({
        session_id: sessionId,
        intent: intent || "General Question",
        task_success: !shouldEscalate,
        confidence,
        emotion,
        retry_count: totalRetries,
        response_time_ms: responseTime,
        agent_role: agentRole,
        is_simulation: isSimulation,
      });
    }

    console.log("Response generated:", { 
      confidence, 
      shouldEscalate, 
      emotion, 
      agentCount: agentActivities.length,
      retries: totalRetries,
      responseTime: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({ 
        content: finalResponse,
        intent: intent || "General Question",
        confidence,
        emotion,
        shouldEscalate,
        agentActivities: agentActivities.length > 0 ? agentActivities : undefined,
        reasoning: explainDecision ? reasoning : undefined,
        selectedTool,
        toolReason: selectedTool ? toolReason : undefined,
        isGoal,
        goalSteps: isGoal ? goalSteps : undefined,
        retryCount: totalRetries,
        isSimulation,
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