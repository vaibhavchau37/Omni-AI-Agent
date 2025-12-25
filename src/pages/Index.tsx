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
}

// Simulated AI responses for demo
const generateResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    return "Hello! I'm your AI assistant. I'm here to help you with any questions or tasks. What would you like to know?";
  }
  
  if (message.includes("help")) {
    return "I'd be happy to help! I can assist you with:\n\n• Answering questions\n• Providing information\n• Helping with tasks\n• General conversation\n\nJust let me know what you need!";
  }
  
  if (message.includes("who are you") || message.includes("what are you")) {
    return "I'm an advanced AI assistant designed to help you with various tasks. I can understand your questions, provide clear answers, and assist with your needs. I'm always here to help!";
  }
  
  if (message.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  if (message.includes("weather")) {
    return "I don't have access to real-time weather data, but I'd recommend checking a weather service like Weather.com or your local forecast. Is there anything else I can help you with?";
  }
  
  if (message.includes("time") || message.includes("date")) {
    const now = new Date();
    return `The current date and time is ${now.toLocaleString()}. Is there anything else you'd like to know?`;
  }

  return "I understand your message. Let me help you with that. Could you provide a bit more context so I can give you the most accurate and helpful response?";
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

    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = generateResponse(content);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
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
