import { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "@/hooks/use-toast";
import { searchKnowledgeBase, KnowledgeEntry } from "@/lib/knowledgeBase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

// Conversation States
type ConversationState = 
  | "idle"
  | "greeting"
  | "understanding"
  | "follow_up"
  | "processing"
  | "responding"
  | "closing";

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
  
  // Scheduling patterns
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
  
  // Task execution patterns
  if (
    lowerMessage.includes("create") ||
    lowerMessage.includes("execute") ||
    lowerMessage.includes("run") ||
    lowerMessage.includes("do ") ||
    lowerMessage.includes("make") ||
    lowerMessage.includes("generate") ||
    lowerMessage.includes("send") ||
    lowerMessage.includes("update")
  ) {
    return "Task Execution";
  }
  
  // Support patterns
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
  
  // Information request patterns
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
  
  // General question patterns
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
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null);
  const { isListening, transcript, toggleListening, resetTranscript } = useSpeechRecognition();

  // Handle voice transcript
  useEffect(() => {
    if (!isListening && transcript) {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  const addAssistantMessage = useCallback((content: string, intent?: IntentType) => {
    const message: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      intent,
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const processConversationFlow = async (userMessage: string, intent: IntentType) => {
    // Step 1: Greeting (if first interaction)
    if (!hasGreeted) {
      setConversationState("greeting");
      await new Promise((r) => setTimeout(r, 500));
      addAssistantMessage(
        "Hello! 👋 Welcome to OmniAgent. I'm here to assist you today.\n\nI'll do my best to understand your needs and provide helpful responses."
      );
      setHasGreeted(true);
      await new Promise((r) => setTimeout(r, 800));
    }

    // Step 2: Understanding Intent
    setConversationState("understanding");
    await new Promise((r) => setTimeout(r, 600));

    // Step 3: Search Knowledge Base
    const knowledgeResult = searchKnowledgeBase(userMessage);

    // Step 4: Process and Respond
    setConversationState("processing");
    await new Promise((r) => setTimeout(r, 500));

    if (knowledgeResult) {
      // Found in knowledge base
      setConversationState("responding");
      
      let response = `📚 **${knowledgeResult.topic}**\n\n${knowledgeResult.content}`;
      
      // Step 5: Add follow-up question if available
      if (knowledgeResult.followUpQuestions && knowledgeResult.followUpQuestions.length > 0) {
        response += `\n\n${knowledgeResult.followUpQuestions[0]}`;
        setPendingFollowUp(knowledgeResult.topic);
      }
      
      // Step 6: Ask if user needs anything else
      response += "\n\n---\nIs there anything else I can help you with?";
      
      addAssistantMessage(response, intent);
    } else {
      // Not found in knowledge base - generate contextual response without guessing
      setConversationState("responding");
      
      let response = "";
      
      switch (intent) {
        case "Appointment / Scheduling":
          response = "I understand you'd like to schedule something.\n\nTo assist you properly, I need a few more details:\n• What type of appointment are you looking to schedule?\n• Do you have a preferred date and time?\n• Any specific requirements I should know about?\n\n---\nIs there anything else I can help you with?";
          break;
        
        case "Task Execution":
          response = "I'd be happy to help execute that task.\n\nTo proceed, please provide:\n• A clear description of what needs to be done\n• Any specific parameters or constraints\n• The expected outcome\n\n---\nIs there anything else I can help you with?";
          break;
        
        case "Support / Help":
          response = "I'm here to help resolve your issue.\n\nPlease describe:\n• What problem are you experiencing?\n• When did this issue start?\n• Have you tried any solutions already?\n\nI'll search our knowledge base for relevant solutions.\n\n---\nIs there anything else I can help you with?";
          break;
        
        case "Information Request":
          response = "I apologize, but I don't have specific information about that topic in my knowledge base.\n\nI can only provide accurate information from verified sources. Could you:\n• Rephrase your question?\n• Ask about a different topic?\n• Provide more context?\n\n---\nIs there anything else I can help you with?";
          break;
        
        case "General Question":
          if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
            response = "Hello! It's great to hear from you. How can I assist you today?\n\nI can help with:\n• Answering questions about our services\n• Scheduling appointments\n• Providing support\n• Finding information\n\n---\nWhat would you like to do?";
          } else if (userMessage.toLowerCase().includes("thank")) {
            response = "You're very welcome! I'm glad I could help.\n\n---\nIs there anything else I can assist you with today?";
          } else if (userMessage.toLowerCase().includes("bye") || userMessage.toLowerCase().includes("goodbye")) {
            response = "Thank you for chatting with OmniAgent! 👋\n\nIt was my pleasure assisting you. Have a wonderful day, and don't hesitate to reach out if you need help in the future!";
          } else {
            response = "I appreciate your question. Unfortunately, I don't have verified information about that specific topic in my knowledge base.\n\n**I never guess or provide unverified information.**\n\nCould you try:\n• Rephrasing your question?\n• Asking about our products, pricing, or services?\n\n---\nIs there anything else I can help you with?";
          }
          break;
        
        default:
          response = "I received your message, but I'm not entirely sure I understand. Could you please:\n\n• Rephrase your request?\n• Provide more specific details?\n• Let me know what you're trying to accomplish?\n\nI'm here to help!\n\n---\nIs there anything else I can assist you with?";
      }
      
      addAssistantMessage(response, intent);
    }

    setConversationState("closing");
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Classify intent
    const intent = classifyIntent(content);
    
    // Process through conversation flow
    await processConversationFlow(content, intent);

    setIsTyping(false);
    setConversationState("idle");
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      toast({
        title: "Voice recording stopped",
        description: "Processing your message...",
      });
    } else {
      toggleListening();
      toast({
        title: "Listening...",
        description: "Speak now. Click again to stop.",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />
      <ChatContainer messages={messages} isTyping={isTyping} />
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
