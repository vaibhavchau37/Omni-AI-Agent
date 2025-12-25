import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "@/hooks/use-toast";
import { sendChatMessage } from "@/services/chatService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

// Intent Classification
type IntentType = 
  | "General Question"
  | "Information Request"
  | "Task Execution"
  | "Appointment / Scheduling"
  | "Support / Help"
  | "Unknown Intent";

const classifyIntent = (message: string): IntentType => {
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes("schedule") ||
    lowerMessage.includes("appointment") ||
    lowerMessage.includes("book") ||
    lowerMessage.includes("meeting") ||
    lowerMessage.includes("calendar") ||
    lowerMessage.includes("remind")
  ) {
    return "Appointment / Scheduling";
  }
  
  if (
    lowerMessage.includes("create") ||
    lowerMessage.includes("execute") ||
    lowerMessage.includes("run") ||
    lowerMessage.includes("do ") ||
    lowerMessage.includes("make") ||
    lowerMessage.includes("generate") ||
    lowerMessage.includes("send") ||
    lowerMessage.includes("update") ||
    lowerMessage.includes("build") ||
    lowerMessage.includes("set up")
  ) {
    return "Task Execution";
  }
  
  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("support") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("problem") ||
    lowerMessage.includes("trouble") ||
    lowerMessage.includes("fix") ||
    lowerMessage.includes("error")
  ) {
    return "Support / Help";
  }
  
  if (
    lowerMessage.includes("find") ||
    lowerMessage.includes("search") ||
    lowerMessage.includes("look up") ||
    lowerMessage.includes("get me") ||
    lowerMessage.includes("show me") ||
    lowerMessage.includes("list") ||
    lowerMessage.includes("tell me about")
  ) {
    return "Information Request";
  }
  
  if (
    lowerMessage.includes("what") ||
    lowerMessage.includes("how") ||
    lowerMessage.includes("why") ||
    lowerMessage.includes("when") ||
    lowerMessage.includes("where") ||
    lowerMessage.includes("who") ||
    lowerMessage.includes("can you") ||
    lowerMessage.includes("?")
  ) {
    return "General Question";
  }
  
  return "Unknown Intent";
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const conversationHistory = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  
  const { isListening, transcript, toggleListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Handle voice transcript
  useEffect(() => {
    if (!isListening && transcript) {
      setIsVoiceMode(true);
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  // Sync speaking state
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  const addMessage = useCallback((role: "user" | "assistant", content: string, intent?: string): string => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, role, content, intent }]);
    conversationHistory.current.push({ role, content });
    return id;
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

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage("user", content);
    setIsTyping(true);

    // Classify intent
    const intent = classifyIntent(content);

    try {
      // Call AI backend
      const response = await sendChatMessage(
        [...conversationHistory.current],
        isVoiceMode,
        intent
      );

      if (response.error) {
        // Handle error gracefully
        const errorMessage = response.error;
        const messageId = addMessage("assistant", errorMessage, "Support / Help");
        
        if (response.errorType === "rate_limit") {
          toast({
            title: "Please wait",
            description: "Too many requests. Try again in a moment.",
            variant: "destructive",
          });
        }
        
        if (isVoiceMode) {
          setSpeakingMessageId(messageId);
          speak(errorMessage);
        }
      } else if (response.content) {
        // Success - add response
        const messageId = addMessage("assistant", response.content, response.intent || intent);
        
        // Auto-speak in voice mode
        if (isVoiceMode) {
          setSpeakingMessageId(messageId);
          speak(response.content);
        }
      }
    } catch (err) {
      // Unexpected error - apologize politely
      console.error("Unexpected error:", err);
      const errorMessage = "I apologize, but something unexpected happened. Please try again, or let me know how else I can help.";
      const messageId = addMessage("assistant", errorMessage, "Support / Help");
      
      if (isVoiceMode) {
        setSpeakingMessageId(messageId);
        speak(errorMessage);
      }
    }

    setIsTyping(false);
    setIsVoiceMode(false);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      toast({
        title: "Processing your voice",
        description: "I'll respond in a moment...",
      });
    } else {
      stop();
      setSpeakingMessageId(null);
      toggleListening();
      toast({
        title: "Listening...",
        description: "Speak naturally. I'll respond conversationally.",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />
      <ChatContainer 
        messages={messages} 
        isTyping={isTyping}
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
