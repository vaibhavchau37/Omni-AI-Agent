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
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  sessionId: z.string().min(1).max(100).optional(),
  voiceMode: z.boolean().optional().default(false),
  intent: z.string().max(200).optional(),
  agentRole: z.enum(['default', 'student_assistant', 'hr_assistant', 'customer_support', 'admin_agent']).optional().default('default'),
  isSimulation: z.boolean().optional().default(false),
  explainDecision: z.boolean().optional().default(false),
});

// Available tools for agent - Desktop Actions
const AVAILABLE_TOOLS = [
  { name: "search", description: "Search for information online", triggers: ["find", "search", "look up", "google"], action: "SEARCH" },
  { name: "calendar", description: "Schedule appointments and reminders", triggers: ["schedule", "book", "appointment", "meeting", "remind"], action: "CALENDAR" },
  { name: "email", description: "Send and read emails", triggers: ["email", "send message", "mail", "compose"], action: "EMAIL" },
  { name: "task", description: "Create and manage tasks/todos", triggers: ["task", "todo", "create task", "add task"], action: "TASK" },
  { name: "file", description: "Open, create, or manage files", triggers: ["open file", "create file", "document", "folder"], action: "FILE" },
  { name: "browser", description: "Open websites and web apps", triggers: ["open", "website", "browse", "navigate"], action: "BROWSER" },
  { name: "calculate", description: "Perform calculations", triggers: ["calculate", "compute", "math"], action: "CALCULATE" },
  { name: "analyze", description: "Analyze data or content", triggers: ["analyze", "review", "evaluate", "study"], action: "ANALYZE" },
  { name: "notes", description: "Take and organize notes", triggers: ["note", "write down", "jot", "remember this"], action: "NOTES" },
];

// Language detection - Hindi/English
const detectLanguage = (message: string): "hi" | "en" => {
  const hindiPattern = /[\u0900-\u097F]/;
  const hindiWords = ["मुझे", "मैं", "कृपया", "मदद", "चाहिए", "करो", "करें", "बताओ", "दो", "है", "हैं", "का", "की", "के"];
  
  if (hindiPattern.test(message)) return "hi";
  
  const lowerMessage = message.toLowerCase();
  for (const word of hindiWords) {
    if (lowerMessage.includes(word)) return "hi";
  }
  
  return "en";
};

// Bilingual response templates
const RESPONSES = {
  goalStarted: {
    en: "🎯 Goal received! I'll handle this autonomously. Here's my execution plan:",
    hi: "🎯 लक्ष्य प्राप्त! मैं इसे स्वतंत्र रूप से संभालूंगा। यह रहा मेरा कार्य योजना:"
  },
  stepExecuting: {
    en: "⚡ Executing step",
    hi: "⚡ चरण निष्पादित कर रहा हूं"
  },
  stepComplete: {
    en: "✅ Step completed",
    hi: "✅ चरण पूर्ण"
  },
  goalComplete: {
    en: "🎉 Goal completed successfully! All tasks have been executed.",
    hi: "🎉 लक्ष्य सफलतापूर्वक पूर्ण! सभी कार्य निष्पादित हो गए हैं।"
  },
  verifying: {
    en: "🔍 Verifying results...",
    hi: "🔍 परिणाम सत्यापित कर रहा हूं..."
  },
  safetyNote: {
    en: "⚠️ Note: This action requires your confirmation before execution.",
    hi: "⚠️ नोट: इस कार्रवाई के लिए निष्पादन से पहले आपकी पुष्टि आवश्यक है।"
  }
};

// Simulate desktop action execution
const executeDesktopAction = async (
  action: string, 
  params: Record<string, string>
): Promise<{ success: boolean; result: string; requiresConfirmation?: boolean }> => {
  const safeActions = ["SEARCH", "ANALYZE", "CALCULATE", "NOTES"];
  const confirmActions = ["EMAIL", "CALENDAR", "FILE", "TASK"];
  
  await new Promise(r => setTimeout(r, 300));
  
  if (confirmActions.includes(action)) {
    return {
      success: true,
      result: `Action ${action} prepared`,
      requiresConfirmation: true
    };
  }
  
  return {
    success: true,
    result: `Action ${action} executed successfully with params: ${JSON.stringify(params)}`
  };
};

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

// Agent definitions with clear responsibilities
const AGENT_REGISTRY = {
  coordinator: {
    id: "coordinator",
    name: "Coordinator Agent",
    permissions: ["delegate_tasks", "view_all_agents", "set_priorities", "resolve_conflicts"],
    restrictions: ["cannot_execute_actions", "cannot_modify_data"],
    canDelegateTo: ["planner", "executor", "support", "evaluator", "safety"],
  },
  planner: {
    id: "planner",
    name: "Planner Agent",
    permissions: ["create_plans", "estimate_effort", "prioritize_steps"],
    restrictions: ["cannot_execute", "cannot_access_external_apis"],
    canDelegateTo: ["executor"],
  },
  executor: {
    id: "executor", 
    name: "Executor Agent",
    permissions: ["run_tools", "api_calls", "file_operations", "data_processing"],
    restrictions: ["requires_approval_for_destructive", "rate_limited"],
    canDelegateTo: ["support"],
  },
  support: {
    id: "support",
    name: "Support Agent",
    permissions: ["format_responses", "add_empathy", "translate_content"],
    restrictions: ["cannot_access_tools", "cannot_make_decisions"],
    canDelegateTo: [],
  },
  evaluator: {
    id: "evaluator",
    name: "Evaluator Agent", 
    permissions: ["rate_confidence", "flag_escalation", "improve_responses"],
    restrictions: ["cannot_execute", "advisory_only"],
    canDelegateTo: ["support"],
  },
  safety: {
    id: "safety",
    name: "Safety Guard Agent",
    permissions: ["block_unsafe_actions", "require_confirmation", "audit_logs"],
    restrictions: ["cannot_execute_tasks", "monitoring_only"],
    canDelegateTo: [],
  },
};

// Safety topics that require careful handling
const SAFETY_TOPICS = [
  "suicide", "self-harm", "harm others", "kill", "weapon", "illegal", 
  "hack", "exploit", "password", "credit card", "social security",
  "medical diagnosis", "legal advice", "financial advice"
];

// Check if message contains safety concerns
const checkSafety = (message: string): { isSafe: boolean; concern: string | null } => {
  const lower = message.toLowerCase();
  for (const topic of SAFETY_TOPICS) {
    if (lower.includes(topic)) {
      return { isSafe: false, concern: topic };
    }
  }
  return { isSafe: true, concern: null };
};

// Agent-specific prompts
const AUTONOMOUS_PLANNER_PROMPT = `You are the Planner Agent in a multi-agent AI system.

YOUR RESPONSIBILITIES:
1. Analyze goals and break them into actionable steps
2. Do NOT ask questions - make intelligent assumptions
3. Create execution plans with 3-6 concrete steps
4. Assign appropriate desktop actions to each step

YOUR PERMISSIONS: ${JSON.stringify(AGENT_REGISTRY.planner.permissions)}
YOUR RESTRICTIONS: ${JSON.stringify(AGENT_REGISTRY.planner.restrictions)}

AVAILABLE DESKTOP ACTIONS:
- SEARCH: Find information online
- CALENDAR: Schedule events/reminders
- EMAIL: Compose and send emails
- TASK: Create tasks/todos
- FILE: Manage files/documents
- BROWSER: Open websites
- CALCULATE: Perform calculations
- ANALYZE: Analyze content
- NOTES: Take notes

OUTPUT FORMAT (STRICT):
STEP 1: [action description] | ACTION: [DESKTOP_ACTION] | PARAMS: [key=value,key=value]
STEP 2: [action description] | ACTION: [DESKTOP_ACTION] | PARAMS: [key=value,key=value]
...

RULES:
- Do NOT ask unnecessary questions - just execute
- Make reasonable assumptions based on context
- Prioritize safety - flag dangerous actions
- Be autonomous but safe`;

const PLANNER_PROMPT = AUTONOMOUS_PLANNER_PROMPT;

const EXECUTOR_PROMPT = `You are the Executor Agent in a multi-agent AI system.

YOUR RESPONSIBILITIES:
1. Execute the plan provided by the Planner Agent
2. Process information and gather data
3. Use tools within your permissions
4. Report results back to the Coordinator

YOUR PERMISSIONS: ${JSON.stringify(AGENT_REGISTRY.executor.permissions)}
YOUR RESTRICTIONS: ${JSON.stringify(AGENT_REGISTRY.executor.restrictions)}

SAFETY GUARDRAILS (MANDATORY):
- Never provide medical diagnoses - suggest consulting professionals
- Never provide legal advice - recommend legal counsel
- Never provide specific financial advice - suggest financial advisors
- If an action requires approval, flag it with [NEEDS_APPROVAL]

FAILURE RECOVERY:
- If a step fails, note it and suggest an alternative
- Always provide a helpful fallback response

Execute the task and provide the result.`;

const SUPPORT_PROMPT = `You are the Support Agent in a multi-agent AI system.

YOUR RESPONSIBILITIES:
1. Format responses for user communication
2. Add empathy and emotional intelligence
3. Ensure responses are clear and helpful
4. Translate between technical and user-friendly language

YOUR PERMISSIONS: ${JSON.stringify(AGENT_REGISTRY.support.permissions)}
YOUR RESTRICTIONS: ${JSON.stringify(AGENT_REGISTRY.support.restrictions)}

TONE CONSISTENCY:
- Professional yet approachable
- Never condescending or dismissive
- Match user's urgency appropriately
- Use "I" statements, not "we"

EMOTION-BASED ADJUSTMENTS:
- Frustrated user: Be calm, empathetic, solution-focused
- Positive user: Match their energy warmly
- Confused user: Be patient, use simpler language
- Neutral user: Be helpful and professional`;

const EVALUATOR_PROMPT = `You are the Evaluator Agent in a multi-agent AI system.

YOUR RESPONSIBILITIES:
1. Review response accuracy and quality
2. Rate confidence level (HIGH, MEDIUM, LOW)
3. Flag if human escalation is needed
4. Suggest improvements to responses

YOUR PERMISSIONS: ${JSON.stringify(AGENT_REGISTRY.evaluator.permissions)}
YOUR RESTRICTIONS: ${JSON.stringify(AGENT_REGISTRY.evaluator.restrictions)}

CONFIDENCE RATING RULES:
- HIGH: Clear factual information, well-established topics
- MEDIUM: Complex topics, some uncertainty
- LOW: Speculation, unknown areas, requires expert

ESCALATION TRIGGERS (set ESCALATE: YES):
- User explicitly requests human help
- Topic requires professional expertise
- User seems very frustrated or upset
- AI cannot provide adequate help
- Safety concerns detected

OUTPUT FORMAT:
CONFIDENCE: [HIGH/MEDIUM/LOW]
ESCALATE: [YES/NO]
REASONING: [brief explanation]
IMPROVED_RESPONSE: [your improved version]`;

// Emotion detection
const detectEmotion = (message: string): "positive" | "neutral" | "negative" | "frustrated" => {
  const lower = message.toLowerCase();
  
  if (
    lower.includes("frustrated") || lower.includes("angry") || lower.includes("annoyed") ||
    lower.includes("!!!") || lower.includes("not working") || lower.includes("doesn't work") ||
    lower.includes("hate") || lower.includes("terrible") || lower.includes("worst")
  ) {
    return "frustrated";
  }
  
  if (
    lower.includes("confused") || lower.includes("don't understand") || lower.includes("problem") ||
    lower.includes("issue") || lower.includes("wrong") || lower.includes("error") ||
    lower.includes("failed") || lower.includes("sad") || lower.includes("disappointed")
  ) {
    return "negative";
  }
  
  if (
    lower.includes("thank") || lower.includes("great") || lower.includes("awesome") ||
    lower.includes("love") || lower.includes("excellent") || lower.includes("perfect") ||
    lower.includes("amazing") || lower.includes("wonderful") || lower.includes("happy") ||
    lower.includes("!")
  ) {
    return "positive";
  }
  
  return "neutral";
};

// Detect if message is a goal
const detectGoal = (message: string): { isGoal: boolean; goalDescription: string | null; isAutonomous: boolean } => {
  const lower = message.toLowerCase();
  
  const hindiGoalPatterns = [
    /मुझे (.*) में मदद करो/i,
    /मुझे (.*) करना है/i,
    /मैं (.*) चाहता हूं/i,
    /मैं (.*) चाहती हूं/i,
    /(.*) की तैयारी करो/i,
    /(.*) कर दो/i,
    /(.*) करें/i,
  ];
  
  const englishGoalPatterns = [
    /help me (?:to )?(.*)/i,
    /i want to (.*)/i,
    /i need to (.*)/i,
    /prepare (?:me )?for (.*)/i,
    /teach me (.*)/i,
    /guide me (?:to|through) (.*)/i,
    /show me how to (.*)/i,
    /can you (.*) for me/i,
    /please (.*)/i,
    /make me (.*)/i,
    /create (.*)/i,
    /set up (.*)/i,
    /organize (.*)/i,
    /plan (.*)/i,
  ];

  for (const pattern of hindiGoalPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return { isGoal: true, goalDescription: match[1].trim(), isAutonomous: true };
    }
  }

  for (const pattern of englishGoalPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return { isGoal: true, goalDescription: match[1].trim(), isAutonomous: true };
    }
  }

  const imperativeIndicators = ["schedule", "book", "send", "create", "find", "search", "set", "organize", "prepare", "remind"];
  for (const indicator of imperativeIndicators) {
    if (lower.startsWith(indicator) || lower.includes(`please ${indicator}`)) {
      return { isGoal: true, goalDescription: message, isAutonomous: true };
    }
  }

  return { isGoal: false, goalDescription: null, isAutonomous: false };
};

// Select appropriate tool
const selectTool = (message: string): { tool: string | null; reason: string } => {
  const lower = message.toLowerCase();
  
  for (const tool of AVAILABLE_TOOLS) {
    for (const trigger of tool.triggers) {
      if (lower.includes(trigger)) {
        return { tool: tool.name, reason: `Selected ${tool.name} tool` };
      }
    }
  }
  
  return { tool: null, reason: "Using general reasoning" };
};

// Main system prompt
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

// Call AI with retry logic
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
      throw new Error("AI_SERVICE_ERROR");
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

// ===========================================
// HELPER: Verify session ownership
// ===========================================
const verifySessionOwnership = async (
  supabase: any,
  sessionId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();
  
  return !!data;
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // ===========================================
    // JWT AUTHENTICATION
    // ===========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[omniagent-chat] Missing authorization header');
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[omniagent-chat] Missing required configuration');
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create anon client with user's JWT for RLS-protected operations
    const supabaseWithAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser();
    if (authError || !user) {
      console.error('[omniagent-chat] Invalid JWT:', authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication" }),
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
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = ChatRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('[omniagent-chat] Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      messages, 
      voiceMode, 
      intent, 
      sessionId, 
      agentRole,
      isSimulation,
      explainDecision
    } = validationResult.data;

    // Verify session ownership if sessionId provided
    if (sessionId) {
      const ownsSession = await verifySessionOwnership(supabaseWithAuth, sessionId, user.id);
      if (!ownsSession) {
        console.error('[omniagent-chat] User does not own session:', sessionId);
        return new Response(
          JSON.stringify({ error: "Access denied to this session" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // Detect emotion
    const emotion = detectEmotion(lastMessage);
    console.log("Detected emotion:", emotion);

    // Detect language for bilingual responses
    const userLanguage = detectLanguage(lastMessage);
    console.log("Detected language:", userLanguage);

    // Detect goal with autonomous mode
    const { isGoal, goalDescription, isAutonomous } = detectGoal(lastMessage);
    console.log("Is goal:", isGoal, goalDescription, "Autonomous:", isAutonomous);

    // Select tool
    const { tool: selectedTool, reason: toolReason } = selectTool(lastMessage);
    console.log("Selected tool:", selectedTool, toolReason);

    // Fetch memories (skip in simulation mode)
    let existingMemories: string[] = [];
    let goalContext: { goal: string; steps: string[]; currentStep: number } | undefined;
    
    if (sessionId && !isSimulation) {
      // Fetch memories using authenticated client (respects RLS)
      const { data: memoryData } = await supabaseWithAuth
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

      // Fetch active goal using authenticated client
      const { data: goalData } = await supabaseWithAuth
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
          steps: [],
          currentStep: goalData.completed_steps || 0,
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
    let executedActions: Array<{step: number, action: string, status: string, result: string}> = [];

    // ===========================================
    // AUTONOMOUS GOAL EXECUTION MODE
    // ===========================================
    if (isGoal && isAutonomous && !voiceMode) {
      console.log("=== AUTONOMOUS EXECUTION MODE ===");
      
      agentActivities.push({ 
        agent: "planner", 
        action: userLanguage === "hi" 
          ? "लक्ष्य का विश्लेषण और स्वायत्त योजना बना रहा हूं" 
          : "Analyzing goal and creating autonomous execution plan" 
      });
      
      const planResult = await callAI(LOVABLE_API_KEY, AUTONOMOUS_PLANNER_PROMPT, messages, 500);
      totalRetries += planResult.retries;
      console.log("Autonomous plan:", planResult.content);

      const stepPattern = /STEP (\d+):\s*([^|]+)\|\s*ACTION:\s*(\w+)\s*\|\s*PARAMS:\s*([^\n]+)/gi;
      let match;
      const parsedSteps: Array<{step: number, description: string, action: string, params: Record<string, string>}> = [];
      
      while ((match = stepPattern.exec(planResult.content)) !== null) {
        const params: Record<string, string> = {};
        match[4].split(',').forEach(p => {
          const [key, value] = p.split('=').map(s => s.trim());
          if (key && value) params[key] = value;
        });
        
        parsedSteps.push({
          step: parseInt(match[1]),
          description: match[2].trim(),
          action: match[3].trim(),
          params
        });
        goalSteps.push(match[2].trim());
      }

      if (parsedSteps.length === 0) {
        const simpleSteps = planResult.content.match(/STEP \d+:\s*([^\n|]+)/gi);
        if (simpleSteps) {
          simpleSteps.forEach((s, i) => {
            const desc = s.replace(/STEP \d+:\s*/i, '').trim();
            goalSteps.push(desc);
            parsedSteps.push({
              step: i + 1,
              description: desc,
              action: "ANALYZE",
              params: {}
            });
          });
        }
      }

      console.log("Parsed steps:", parsedSteps);

      // Save goal using authenticated client (respects RLS)
      if (sessionId && !isSimulation && goalSteps.length > 0) {
        await supabaseWithAuth.from('agent_goals').insert({
          session_id: sessionId,
          goal_description: goalDescription || lastMessage,
          total_steps: goalSteps.length,
          completed_steps: 0,
          status: 'active',
        });
      }

      let stepResults: string[] = [];
      let requiresConfirmation = false;
      
      for (const step of parsedSteps) {
        agentActivities.push({ 
          agent: "executor", 
          action: `${RESPONSES.stepExecuting[userLanguage]} ${step.step}: ${step.description}` 
        });

        const actionResult = await executeDesktopAction(step.action, step.params);
        
        executedActions.push({
          step: step.step,
          action: step.action,
          status: actionResult.success ? "completed" : "failed",
          result: actionResult.result
        });

        if (actionResult.requiresConfirmation) {
          requiresConfirmation = true;
          stepResults.push(`${step.step}. ${step.description} - ⏳ ${userLanguage === "hi" ? "पुष्टि की प्रतीक्षा" : "Awaiting confirmation"}`);
        } else {
          stepResults.push(`${step.step}. ${step.description} - ✅ ${userLanguage === "hi" ? "पूर्ण" : "Done"}`);
        }
      }

      agentActivities.push({ 
        agent: "evaluator", 
        action: RESPONSES.verifying[userLanguage]
      });

      const completionPrompt = userLanguage === "hi" 
        ? `आपने निम्नलिखित लक्ष्य पूरा किया: "${goalDescription}"
           
निष्पादित चरण:
${stepResults.join('\n')}

एक संक्षिप्त, पेशेवर पूर्णता रिपोर्ट हिंदी में लिखें। उपयोगकर्ता को बताएं कि क्या पूरा हुआ और आगे क्या करना चाहिए।`
        : `You completed the following goal: "${goalDescription}"
           
Executed steps:
${stepResults.join('\n')}

Write a brief, professional completion report. Tell the user what was accomplished and what to do next.`;

      const reportMessages = [{ role: "user" as const, content: completionPrompt }];
      const reportResult = await callAI(LOVABLE_API_KEY, SUPPORT_PROMPT, reportMessages, 400);
      
      finalResponse = `${RESPONSES.goalStarted[userLanguage]}\n\n`;
      finalResponse += `**${userLanguage === "hi" ? "निष्पादित कार्य" : "Executed Tasks"}:**\n`;
      finalResponse += stepResults.join('\n') + '\n\n';
      
      if (requiresConfirmation) {
        finalResponse += `\n${RESPONSES.safetyNote[userLanguage]}\n\n`;
      }
      
      finalResponse += `---\n\n${reportResult.content}`;
      
      if (userLanguage === "hi") {
        finalResponse += `\n\n🎉 ${RESPONSES.goalComplete.hi}`;
      } else {
        finalResponse += `\n\n🎉 ${RESPONSES.goalComplete.en}`;
      }

      confidence = "high";
      reasoning = `Autonomous execution of ${parsedSteps.length} steps completed. Actions: ${parsedSteps.map(s => s.action).join(', ')}`;

    } else if (isComplexTask && !voiceMode) {
      agentActivities.push({ agent: "planner", action: isGoal ? "Breaking down goal into steps" : "Analyzing request and creating plan" });
      const planResult = await callAI(LOVABLE_API_KEY, PLANNER_PROMPT, messages, 200);
      totalRetries += planResult.retries;
      console.log("Planner output:", planResult.content);

      if (isGoal && goalDescription) {
        const stepMatches = planResult.content.match(/STEP \d+:\s*([^\n|]+)/gi);
        if (stepMatches) {
          goalSteps = stepMatches.map(s => s.replace(/STEP \d+:\s*/i, '').split('|')[0].trim());
        }
        
        if (sessionId && !isSimulation && goalSteps.length > 0) {
          await supabaseWithAuth.from('agent_goals').insert({
            session_id: sessionId,
            goal_description: goalDescription,
            total_steps: goalSteps.length,
            completed_steps: 0,
            status: 'active',
          });
        }
      }

      if (selectedTool) {
        agentActivities.push({ agent: "executor", action: `Selected ${selectedTool} tool: ${toolReason}` });
      }

      agentActivities.push({ agent: "executor", action: "Executing the plan" });
      const executorMessages = [
        ...(contextSummary ? [{ role: "system" as const, content: `Previous conversation summary: ${contextSummary}` }] : []),
        ...messages, 
        { role: "assistant" as const, content: `Plan: ${planResult.content}` }
      ];
      const execResult = await callAI(LOVABLE_API_KEY, EXECUTOR_PROMPT, executorMessages, 400);
      totalRetries += execResult.retries;
      console.log("Executor output:", execResult.content);

      agentActivities.push({ agent: "support", action: "Adding empathy and clarity" });
      const supportPrompt = SUPPORT_PROMPT + `\n\nUser emotion: ${emotion}. Adjust tone accordingly.`;
      const supportMessages = [...messages, { role: "assistant" as const, content: execResult.content }];
      const supportResult = await callAI(LOVABLE_API_KEY, supportPrompt, supportMessages, 400);
      totalRetries += supportResult.retries;

      agentActivities.push({ agent: "evaluator", action: "Reviewing and improving response" });
      const evalMessages = [{ role: "user" as const, content: `Review this response:\n${supportResult.content}` }];
      const evalResult = await callAI(LOVABLE_API_KEY, EVALUATOR_PROMPT, evalMessages, 500);
      
      const confMatch = evalResult.content.match(/CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
      const escMatch = evalResult.content.match(/ESCALATE:\s*(YES|NO)/i);
      const reasonMatch = evalResult.content.match(/REASONING:\s*([^\n]+)/i);
      const respMatch = evalResult.content.match(/IMPROVED_RESPONSE:\s*([\s\S]*)/i);
      
      confidence = (confMatch?.[1]?.toLowerCase() || "medium") as "high" | "medium" | "low";
      shouldEscalate = escMatch?.[1]?.toUpperCase() === "YES";
      reasoning = reasonMatch?.[1]?.trim() || "";
      finalResponse = respMatch?.[1]?.trim() || supportResult.content;

    } else {
      const mainPrompt = createMainPrompt(
        existingMemories, 
        emotion, 
        voiceMode, 
        agentRole,
        goalContext,
        isSimulation
      );
      
      const contextMessages = contextSummary 
        ? [{ role: "system" as const, content: `Previous conversation summary: ${contextSummary}` }, ...messages]
        : messages;
      
      const result = await callAI(LOVABLE_API_KEY, mainPrompt, contextMessages, voiceMode ? 100 : 400);
      finalResponse = result.content;
      totalRetries = result.retries;
      
      if (emotion === "frustrated" || lastMessage.includes("?")) {
        confidence = "medium";
      }
      if (finalResponse.includes("I'm not sure") || finalResponse.includes("I don't know")) {
        confidence = "low";
        shouldEscalate = true;
      }
    }

    if (explainDecision && reasoning) {
      finalResponse += `\n\n---\n**Why I answered this way:**\n${reasoning}`;
    }

    // Store new memories using authenticated client (respects RLS)
    if (sessionId && !isSimulation) {
      const newMemories = extractMemories(lastMessage);
      for (const memory of newMemories) {
        await supabaseWithAuth
          .from('conversation_memory')
          .insert({
            session_id: sessionId,
            memory_type: memory.type,
            memory_key: memory.key,
            memory_value: memory.value,
          });
      }

      // Log analytics - use service role for system metrics only
      const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
      const responseTime = Date.now() - startTime;
      await supabaseService.from('agent_analytics').insert({
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
        executedActions: executedActions.length > 0 ? executedActions : undefined,
        isAutonomous: isGoal && isAutonomous,
        userLanguage,
        retryCount: totalRetries,
        isSimulation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[omniagent-chat] Error:", error);
    
    // Generic error message - never expose internal details
    return new Response(
      JSON.stringify({ 
        error: "I apologize, but I encountered an issue. Please try again." 
      }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('Origin')), "Content-Type": "application/json" } }
    );
  }
});
