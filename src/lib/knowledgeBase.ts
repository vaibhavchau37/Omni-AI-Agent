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
