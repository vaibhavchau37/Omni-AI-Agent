import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // Simulated execution with safe defaults
  const safeActions = ["SEARCH", "ANALYZE", "CALCULATE", "NOTES"];
  const confirmActions = ["EMAIL", "CALENDAR", "FILE", "TASK"];
  
  await new Promise(r => setTimeout(r, 300)); // Simulate processing
  
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

// ==========================================
// PRODUCTION-GRADE PROMPTS WITH GUARDRAILS
// ==========================================

// Safety topics that require careful handling
const SAFETY_TOPICS = [
  "suicide", "self-harm", "harm others", "kill", "weapon", "illegal", 
  "hack", "exploit", "password", "credit card", "social security",
  "medical diagnosis", "legal advice", "financial advice"
];

// Topics where AI should admit uncertainty
const UNCERTAINTY_TOPICS = [
  "future predictions", "personal opinion", "medical symptoms",
  "legal matters", "investment advice", "specific prices", "exact dates"
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

// Multi-Agent System Prompts with strict consistency rules
const AUTONOMOUS_PLANNER_PROMPT = `You are the Autonomous Planner Agent. Your job is to:
1. Analyze the user's goal and create an IMMEDIATE execution plan
2. Do NOT ask questions - make intelligent assumptions
3. Break the goal into 3-6 concrete, executable steps
4. Assign appropriate desktop actions to each step

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
- Be autonomous but safe
- Keep steps concrete and executable

Example:
Goal: "Help me prepare for a job interview"
STEP 1: Research common interview questions | ACTION: SEARCH | PARAMS: query=common interview questions
STEP 2: Create study notes with key answers | ACTION: NOTES | PARAMS: title=Interview Prep Notes
STEP 3: Schedule practice session reminder | ACTION: CALENDAR | PARAMS: event=Interview Practice,time=tomorrow 5pm
STEP 4: Search for company background | ACTION: SEARCH | PARAMS: query=company background research`;

const PLANNER_PROMPT = AUTONOMOUS_PLANNER_PROMPT;

const EXECUTOR_PROMPT = `You are the Executor Agent. Your job is to:
1. Follow the plan provided
2. Execute each step logically
3. Gather and process information
4. Prepare the response content

SAFETY GUARDRAILS (MANDATORY):
- Never provide medical diagnoses - suggest consulting professionals
- Never provide legal advice - recommend legal counsel
- Never provide specific financial advice - suggest financial advisors
- Never share harmful or dangerous information
- If you cannot complete a step safely, explain why

FAILURE RECOVERY:
- If a step fails, note it and suggest an alternative approach
- Always provide a helpful fallback response

Execute the task and provide the result.`;

const SUPPORT_PROMPT = `You are the Support Agent. Your job is to:
1. Make responses friendly and clear
2. Ensure the user feels heard
3. Add helpful context when needed
4. Detect user emotion and adjust tone

TONE CONSISTENCY (ALWAYS FOLLOW):
- Professional yet approachable
- Never condescending or dismissive
- Match user's urgency appropriately
- Use "I" statements, not "we"

EMOTION-BASED ADJUSTMENTS:
- Frustrated user: Be calm, empathetic, solution-focused. Acknowledge their frustration.
- Positive user: Match their energy warmly
- Confused user: Be patient, use simpler language
- Neutral user: Be helpful and professional`;

const EVALUATOR_PROMPT = `You are the Evaluator Agent. Your job is to:
1. Review the response for accuracy
2. Simplify explanations
3. Remove unnecessary content
4. Rate confidence (HIGH, MEDIUM, LOW)
5. Flag if human escalation is needed

CONFIDENCE RATING RULES:
- HIGH: Clear factual information, well-established topics, simple tasks
- MEDIUM: Complex topics, some uncertainty, needs verification
- LOW: Speculation, unknown areas, sensitive topics, requires expert

ESCALATION TRIGGERS (set ESCALATE: YES):
- User explicitly requests human help
- Topic requires professional expertise (medical, legal, financial)
- User seems very frustrated or upset
- AI cannot provide adequate help
- Safety concerns detected

Respond with:
CONFIDENCE: [HIGH/MEDIUM/LOW]
ESCALATE: [YES/NO]
REASONING: [brief explanation of why you gave this confidence]
IMPROVED_RESPONSE: [your improved version]`;

// "I don't know" response templates
const UNCERTAINTY_RESPONSES = [
  "I don't have enough information to answer that accurately. Would you like me to help you find a reliable source?",
  "I'm not certain about that specific detail. To give you accurate information, I'd recommend checking with an expert or official source.",
  "That's outside my area of confidence. I want to be honest rather than give you potentially incorrect information.",
  "I don't know the answer to that with certainty. Shall I help you find someone who does?",
];

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

// Detect if message is a goal vs a question - Enhanced for autonomous mode
const detectGoal = (message: string): { isGoal: boolean; goalDescription: string | null; isAutonomous: boolean } => {
  const lower = message.toLowerCase();
  
  // Hindi goal patterns
  const hindiGoalPatterns = [
    /मुझे (.*) में मदद करो/i,
    /मुझे (.*) करना है/i,
    /मैं (.*) चाहता हूं/i,
    /मैं (.*) चाहती हूं/i,
    /(.*) की तैयारी करो/i,
    /(.*) कर दो/i,
    /(.*) करें/i,
  ];
  
  // English goal patterns
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

  // Check Hindi patterns first
  for (const pattern of hindiGoalPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return { isGoal: true, goalDescription: match[1].trim(), isAutonomous: true };
    }
  }

  // Check English patterns
  for (const pattern of englishGoalPatterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return { isGoal: true, goalDescription: match[1].trim(), isAutonomous: true };
    }
  }

  // Check for imperative sentences (commands)
  const imperativeIndicators = ["schedule", "book", "send", "create", "find", "search", "set", "organize", "prepare", "remind"];
  for (const indicator of imperativeIndicators) {
    if (lower.startsWith(indicator) || lower.includes(`please ${indicator}`)) {
      return { isGoal: true, goalDescription: message, isAutonomous: true };
    }
  }

  return { isGoal: false, goalDescription: null, isAutonomous: false };
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
          steps: [],
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
    let executedActions: Array<{step: number, action: string, status: string, result: string}> = [];

    // ==========================================
    // AUTONOMOUS GOAL EXECUTION MODE
    // ==========================================
    if (isGoal && isAutonomous && !voiceMode) {
      console.log("=== AUTONOMOUS EXECUTION MODE ===");
      
      // Step 1: Autonomous Planning - NO QUESTIONS ASKED
      agentActivities.push({ 
        agent: "planner", 
        action: userLanguage === "hi" 
          ? "लक्ष्य का विश्लेषण और स्वायत्त योजना बना रहा हूं" 
          : "Analyzing goal and creating autonomous execution plan" 
      });
      
      const planResult = await callAI(LOVABLE_API_KEY, AUTONOMOUS_PLANNER_PROMPT, messages, 500);
      totalRetries += planResult.retries;
      console.log("Autonomous plan:", planResult.content);

      // Parse execution steps with actions
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

      // Fallback: extract simple steps if pattern didn't match
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

      // Save goal to database
      if (sessionId && !isSimulation && goalSteps.length > 0) {
        await supabase.from('agent_goals').insert({
          session_id: sessionId,
          goal_description: goalDescription || lastMessage,
          total_steps: goalSteps.length,
          completed_steps: 0,
          status: 'active',
        });
      }

      // Step 2: Execute each step autonomously
      let stepResults: string[] = [];
      let requiresConfirmation = false;
      
      for (const step of parsedSteps) {
        agentActivities.push({ 
          agent: "executor", 
          action: `${RESPONSES.stepExecuting[userLanguage]} ${step.step}: ${step.description}` 
        });

        // Execute the desktop action
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

      // Step 3: Verify and generate completion report
      agentActivities.push({ 
        agent: "evaluator", 
        action: RESPONSES.verifying[userLanguage]
      });

      // Generate final response in user's language
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
      
      // Build final response
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
      // Step 1: Planner Agent (non-autonomous complex task)
      agentActivities.push({ agent: "planner", action: isGoal ? "Breaking down goal into steps" : "Analyzing request and creating plan" });
      const planResult = await callAI(LOVABLE_API_KEY, PLANNER_PROMPT, messages, 200);
      totalRetries += planResult.retries;
      console.log("Planner output:", planResult.content);

      // Extract goal steps if applicable
      if (isGoal && goalDescription) {
        const stepMatches = planResult.content.match(/STEP \d+:\s*([^\n|]+)/gi);
        if (stepMatches) {
          goalSteps = stepMatches.map(s => s.replace(/STEP \d+:\s*/i, '').split('|')[0].trim());
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
        executedActions: executedActions.length > 0 ? executedActions : undefined,
        isAutonomous: isGoal && isAutonomous,
        userLanguage,
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