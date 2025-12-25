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
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  suggestion?: string;
  details?: string;
}

// Generate or retrieve session ID for memory persistence
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
      console.error("Supabase function error:", error);
      return {
        error: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
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
      intent: data.intent
    };
  } catch (err) {
    console.error("Chat service error:", err);
    return {
      error: "I apologize, but something went wrong. Would you like to try again?",
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
      console.error("Action execution error:", error);
      return {
        success: false,
        error: "I couldn't complete that action right now. Would you like to try something else?",
        suggestion: "Please try again or describe what you need differently."
      };
    }

    return data;
  } catch (err) {
    console.error("Action service error:", err);
    return {
      success: false,
      error: "I apologize, but I encountered an issue. Let me know how else I can help.",
      suggestion: "Try describing your request in a different way."
    };
  }
};

// Clear session to start fresh conversation
export const clearSession = (): void => {
  localStorage.removeItem("omniagent_session_id");
};

// Get current session ID (for debugging/display)
export const getCurrentSessionId = (): string | null => {
  return localStorage.getItem("omniagent_session_id");
};
