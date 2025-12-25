import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  content?: string;
  intent?: string;
  error?: string;
  errorType?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  shouldEscalate?: boolean;
  agentActivities?: Array<{agent: string, action: string}>;
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  suggestion?: string;
  details?: string;
}

const getSessionId = (): string => {
  const storageKey = "omniagent_session_id";
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

export const sendChatMessage = async (
  messages: ChatMessage[],
  voiceMode: boolean = false,
  intent?: string
): Promise<ChatResponse> => {
  try {
    const sessionId = getSessionId();
    
    const { data, error } = await supabase.functions.invoke("omniagent-chat", {
      body: { 
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        voiceMode,
        intent,
        sessionId
      },
    });

    if (error) {
      console.error("Function error:", error);
      return {
        error: "I apologize, but I'm having trouble connecting. Please try again.",
        errorType: "connection"
      };
    }

    if (data.error) {
      return {
        error: data.error,
        errorType: data.errorType || "general"
      };
    }

    return {
      content: data.content,
      intent: data.intent,
      confidence: data.confidence,
      emotion: data.emotion,
      shouldEscalate: data.shouldEscalate,
      agentActivities: data.agentActivities
    };
  } catch (err) {
    console.error("Chat service error:", err);
    return {
      error: "Something went wrong. Would you like to try again?",
      errorType: "general"
    };
  }
};

export const executeAction = async (
  action: string,
  params: Record<string, unknown> = {}
): Promise<ActionResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("omniagent-action", {
      body: { action, params },
    });

    if (error) {
      return {
        success: false,
        error: "Couldn't complete that action. Try something else?",
        suggestion: "Describe your request differently."
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      error: "I encountered an issue. How else can I help?",
      suggestion: "Try a different approach."
    };
  }
};

export const clearSession = (): void => {
  localStorage.removeItem("omniagent_session_id");
};

export const getCurrentSessionId = (): string | null => {
  return localStorage.getItem("omniagent_session_id");
};
