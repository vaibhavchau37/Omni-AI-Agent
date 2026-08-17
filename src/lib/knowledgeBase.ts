// OmniAgent Knowledge Base
// Add your knowledge entries here

export interface KnowledgeEntry {
  keywords: string[];
  topic: string;
  content: string;
  followUpQuestions?: string[];
}

export const knowledgeBase: KnowledgeEntry[] = [
  {
    keywords: ["hours", "open", "business hours", "working hours", "available"],
    topic: "Business Hours",
    content: "Our business hours are Monday to Friday, 9:00 AM to 6:00 PM (EST). We are closed on weekends and public holidays.",
    followUpQuestions: ["Would you like to schedule a meeting during these hours?"],
  },
  {
    keywords: ["contact", "email", "phone", "reach", "call"],
    topic: "Contact Information",
    content: "You can reach us through:\n• Email: support@company.com\n• Phone: 1-800-123-4567\n• Live Chat: Available on our website during business hours",
    followUpQuestions: ["Which contact method would you prefer to use?"],
  },
  {
    keywords: ["pricing", "cost", "price", "plans", "subscription", "pay"],
    topic: "Pricing",
    content: "We offer three pricing tiers:\n• Starter: $29/month - Basic features\n• Professional: $79/month - Advanced features + priority support\n• Enterprise: Custom pricing - Full features + dedicated support",
    followUpQuestions: ["Would you like more details about a specific plan?"],
  },
  {
    keywords: ["refund", "money back", "cancel", "cancellation"],
    topic: "Refund Policy",
    content: "We offer a 30-day money-back guarantee on all plans. To request a refund, please contact our support team with your order details.",
    followUpQuestions: ["Would you like me to guide you through the refund process?"],
  },
  {
    keywords: ["features", "capabilities", "what can", "functions"],
    topic: "Product Features",
    content: "OmniAgent offers:\n• Intelligent conversation handling\n• Multi-channel support (chat, voice)\n• Intent classification\n• Knowledge base integration\n• Workflow automation\n• Appointment scheduling",
    followUpQuestions: ["Which feature would you like to learn more about?"],
  },
  {
    keywords: ["account", "sign up", "register", "create account"],
    topic: "Account Creation",
    content: "To create an account:\n1. Visit our website\n2. Click 'Sign Up'\n3. Enter your email and create a password\n4. Verify your email\n5. Complete your profile",
    followUpQuestions: ["Would you like help with any of these steps?"],
  },
  {
    keywords: ["password", "reset", "forgot", "login issue"],
    topic: "Password Reset",
    content: "To reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your inbox for reset instructions\n5. Create a new password",
    followUpQuestions: ["Are you having trouble with any of these steps?"],
  },
  {
    keywords: ["integration", "api", "connect", "third party"],
    topic: "Integrations",
    content: "We integrate with popular platforms including:\n• Slack\n• Microsoft Teams\n• Salesforce\n• HubSpot\n• Zapier\n• Custom APIs available for Enterprise plans",
    followUpQuestions: ["Which integration are you interested in?"],
  },
  {
    keywords: ["chatgpt", "openai", "gpt", "gpt-5", "gpt5"],
    topic: "ChatGPT / OpenAI GPT",
    content: "ChatGPT runs on OpenAI's GPT-5 family (tiers like 5.4, 5.5 and 5.6 — sol, terra, luna).\n• Strengths: general reasoning, coding, agentic tool use, deep research, voice\n• Multimodal: text + image input\n• Tiers trade cost/latency for reasoning depth (nano/mini → flagship)",
    followUpQuestions: ["Want a comparison with Claude or Gemini for your use case?"],
  },
  {
    keywords: ["claude", "anthropic", "opus", "sonnet", "haiku"],
    topic: "Claude (Anthropic)",
    content: "Claude comes in Opus (most capable), Sonnet (balanced) and Haiku (fast/cheap) tiers.\n• Strengths: long-context reasoning, high-quality writing, strong coding\n• Agentic: computer use, tool calling, and the MCP (Model Context Protocol) ecosystem\n• Often chosen for careful, well-structured long-form output",
    followUpQuestions: ["Should I compare Claude with GPT-5 or Gemini?"],
  },
  {
    keywords: ["gemini", "google ai", "bard", "flash"],
    topic: "Gemini (Google)",
    content: "Gemini ships as Pro, Flash and Flash-Lite tiers.\n• Natively multimodal: text, image, audio and video input\n• Very large context windows\n• Flash/Flash-Lite are extremely fast and cheap for high-volume tasks\n• Deep integration with Google Workspace and Android",
    followUpQuestions: ["Do you need speed and cost, or maximum reasoning quality?"],
  },
  {
    keywords: ["deepseek", "r1", "open weights", "open source model"],
    topic: "DeepSeek",
    content: "DeepSeek is an open-weight lab known for the V-series (general) and R-series (reasoning) models.\n• Strong math and coding at very low cost\n• Open weights → self-hosting, fine-tuning and privacy control\n• Popular as a cheap alternative to closed frontier models",
    followUpQuestions: ["Are you optimizing for cost, or for self-hosting and privacy?"],
  },
  {
    keywords: ["kimi", "moonshot", "k2"],
    topic: "Kimi (Moonshot AI)",
    content: "Kimi (Moonshot AI) K-series models — e.g. K2 — are open-weight and agent-focused.\n• Long context and strong tool/function calling\n• Good coding performance at low cost\n• Frequently used for high-throughput autonomous agents",
    followUpQuestions: ["Are you building an agent that needs heavy tool calling?"],
  },
  {
    keywords: ["grok", "llama", "mistral", "qwen", "perplexity", "cohere"],
    topic: "Other AI Models",
    content: "Beyond the big three:\n• Grok (xAI) — real-time/social data flavour\n• Llama (Meta) — widely used open weights\n• Mistral — European, efficient open-weight models\n• Qwen (Alibaba) — strong multilingual open weights\n• Perplexity — answer engine with citations\n• Cohere — enterprise RAG and search",
    followUpQuestions: ["Which one should I dig into for you?"],
  },
  {
    keywords: ["compare models", "which ai", "best ai", "model comparison", "vs"],
    topic: "Choosing an AI Model",
    content: "Quick guidance:\n• Hard reasoning / complex coding → frontier tier (GPT-5.x flagship, Claude Opus, Gemini Pro)\n• High volume, low latency, low cost → mini/nano/flash/haiku tiers\n• Self-hosting, privacy or tight budgets → open weights (DeepSeek, Kimi, Llama, Qwen, Mistral)\n• Long documents / video / audio → Gemini or Claude long-context tiers\nModel versions change fast, so always verify current names and pricing with the vendor.",
    followUpQuestions: ["Tell me your task and constraints and I'll recommend one."],
  },
  {
    keywords: ["mcp", "agent", "rag", "tool calling", "function calling", "vector"],
    topic: "Modern AI Agent Stack",
    content: "Today's agent building blocks:\n• Tool / function calling for real actions\n• MCP servers to expose apps to assistants\n• RAG over vector stores for grounded answers\n• Structured outputs + streaming for reliable UX\n• Multi-agent orchestration (planner → executor → evaluator)\n• Evaluation loops to catch low-confidence answers",
    followUpQuestions: ["Want me to map this onto your own workflow?"],
  },
];

export const searchKnowledgeBase = (query: string): KnowledgeEntry | null => {
  const lowerQuery = query.toLowerCase();
  
  for (const entry of knowledgeBase) {
    for (const keyword of entry.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return entry;
      }
    }
  }
  
  return null;
};
