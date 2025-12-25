import { useState, useEffect } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "@/hooks/use-toast";

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

// Generate responses based on intent
const generateResponse = (userMessage: string, intent: IntentType): string => {
  const message = userMessage.toLowerCase();
  
  switch (intent) {
    case "Appointment / Scheduling":
      return "I understand you'd like to schedule something. I can help you manage appointments, set reminders, and organize your calendar. Could you please provide more details about what you'd like to schedule?";
    
    case "Task Execution":
      return "I'm ready to execute that task for you. Let me understand the specifics:\n\n• What exactly would you like me to do?\n• Are there any specific parameters or requirements?\n• When should this be completed?\n\nOnce I have these details, I can proceed with the execution.";
    
    case "Support / Help":
      return "I'm here to help! Please describe the issue you're experiencing in detail, and I'll do my best to provide a solution or guide you through the troubleshooting process.";
    
    case "Information Request":
      return "I'll help you find that information. To provide the most relevant and accurate data, could you be more specific about what you're looking for? I can search through various sources to get you the information you need.";
    
    case "General Question":
      if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
        return "Hello! I'm OmniAgent, your intelligent AI assistant. I can help you with questions, tasks, scheduling, and much more. What would you like to do today?";
      }
      if (message.includes("who are you") || message.includes("what are you")) {
        return "I'm OmniAgent, an intelligent AI assistant platform. I'm designed to:\n\n• Answer questions and provide guidance\n• Execute tasks and workflows\n• Manage appointments and scheduling\n• Provide support and help\n\nI classify your messages to understand your intent and provide the most relevant assistance.";
      }
      if (message.includes("what can you do") || message.includes("capabilities")) {
        return "I can assist you with a variety of tasks:\n\n1. **General Questions** - Answer inquiries on various topics\n2. **Information Requests** - Find and retrieve data\n3. **Task Execution** - Perform actions and run workflows\n4. **Scheduling** - Manage appointments and reminders\n5. **Support** - Help troubleshoot issues\n\nJust tell me what you need!";
      }
      return "I understand your question. Let me provide you with a helpful response. Could you give me a bit more context so I can give you the most accurate answer?";
    
    default:
      return "I've received your message. Could you please rephrase or provide more details so I can better understand how to assist you?";
  }
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { isListening, transcript, toggleListening, resetTranscript } = useSpeechRecognition();

  // Handle voice transcript
  useEffect(() => {
    if (!isListening && transcript) {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

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
    
    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    const response = generateResponse(content, intent);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      intent,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
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
