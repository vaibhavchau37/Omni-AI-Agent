import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { AgentActivity } from "@/components/chat/AgentActivityLog";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "@/hooks/use-toast";
import { sendChatMessage } from "@/services/chatService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
}

type IntentType = 
  | "General Question"
  | "Information Request"
  | "Task Execution"
  | "Appointment / Scheduling"
  | "Support / Help"
  | "Unknown Intent";

const classifyIntent = (message: string): IntentType => {
  const lower = message.toLowerCase();
  
  if (/schedule|appointment|book|meeting|calendar|remind/.test(lower)) {
    return "Appointment / Scheduling";
  }
  if (/create|execute|run|do |make|generate|send|update|build|set up/.test(lower)) {
    return "Task Execution";
  }
  if (/help|support|issue|problem|trouble|fix|error/.test(lower)) {
    return "Support / Help";
  }
  if (/find|search|look up|get me|show me|list|tell me about/.test(lower)) {
    return "Information Request";
  }
  if (/what|how|why|when|where|who|can you|\?/.test(lower)) {
    return "General Question";
  }
  return "Unknown Intent";
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const conversationHistory = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  
  const { isListening, transcript, toggleListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    if (!isListening && transcript) {
      setIsVoiceMode(true);
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  useEffect(() => {
    if (!isSpeaking) setSpeakingMessageId(null);
  }, [isSpeaking]);

  const addMessage = useCallback((
    role: "user" | "assistant", 
    content: string, 
    extras?: {
      intent?: string;
      confidence?: "high" | "medium" | "low";
      emotion?: "positive" | "neutral" | "negative" | "frustrated";
      showEscalation?: boolean;
    }
  ): string => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, role, content, ...extras }]);
    conversationHistory.current.push({ role, content });
    return id;
  }, []);

  const simulateAgentActivity = useCallback((activities: Array<{agent: string, action: string}>) => {
    setAgentActivities([]);
    
    activities.forEach((activity, index) => {
      setTimeout(() => {
        const activityId = `${Date.now()}_${index}`;
        setAgentActivities(prev => [
          ...prev.map(a => ({ ...a, status: "complete" as const })),
          { 
            id: activityId, 
            agent: activity.agent as AgentActivity["agent"], 
            action: activity.action, 
            status: "running" as const,
            timestamp: Date.now()
          }
        ]);
      }, index * 800);
    });

    // Mark all complete after last one
    setTimeout(() => {
      setAgentActivities(prev => prev.map(a => ({ ...a, status: "complete" as const })));
    }, activities.length * 800 + 500);
  }, []);

  const handleSpeak = useCallback((content: string) => {
    const message = messages.find(m => m.content === content);
    if (message) {
      if (speakingMessageId === message.id) {
        stop();
        setSpeakingMessageId(null);
      } else {
        stop();
        setSpeakingMessageId(message.id);
        speak(content);
      }
    }
  }, [messages, speakingMessageId, speak, stop]);

  const handleClearSession = useCallback(() => {
    setMessages([]);
    conversationHistory.current = [];
    setAgentActivities([]);
    stop();
    setSpeakingMessageId(null);
  }, [stop]);

  const handleSendMessage = async (content: string) => {
    const intent = classifyIntent(content);
    addMessage("user", content);
    setIsTyping(true);
    setAgentActivities([]);

    try {
      const response = await sendChatMessage(
        [...conversationHistory.current],
        isVoiceMode,
        intent
      );

      // Simulate agent activities if returned
      if (response.agentActivities) {
        simulateAgentActivity(response.agentActivities);
      }

      if (response.error) {
        const messageId = addMessage("assistant", response.error, { 
          intent: "Support / Help",
          confidence: "low"
        });
        
        if (response.errorType === "rate_limit") {
          toast({
            title: "Please wait",
            description: "Too many requests. Try again shortly.",
            variant: "destructive",
          });
        }
        
        if (isVoiceMode) {
          setSpeakingMessageId(messageId);
          speak(response.error);
        }
      } else if (response.content) {
        const messageId = addMessage("assistant", response.content, {
          intent: response.intent || intent,
          confidence: response.confidence,
          emotion: response.emotion,
          showEscalation: response.shouldEscalate
        });
        
        if (isVoiceMode) {
          setSpeakingMessageId(messageId);
          speak(response.content);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      const errorMsg = "I apologize, but something unexpected happened. Please try again.";
      const messageId = addMessage("assistant", errorMsg, { 
        intent: "Support / Help",
        confidence: "low",
        showEscalation: true
      });
      
      if (isVoiceMode) {
        setSpeakingMessageId(messageId);
        speak(errorMsg);
      }
    }

    setIsTyping(false);
    setIsVoiceMode(false);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      toast({ title: "Processing your voice", description: "Responding shortly..." });
    } else {
      stop();
      setSpeakingMessageId(null);
      toggleListening();
      toast({ title: "Listening...", description: "Speak naturally." });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onClearSession={handleClearSession} />
      <ChatContainer 
        messages={messages} 
        isTyping={isTyping}
        agentActivities={agentActivities}
        onSpeak={handleSpeak}
        speakingMessageId={speakingMessageId}
      />
      <div className="border-t border-border/50 p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            isListening={isListening}
            onVoiceToggle={handleVoiceToggle}
            disabled={isTyping}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
