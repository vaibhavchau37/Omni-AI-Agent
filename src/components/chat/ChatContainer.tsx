import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { Zap, MessageSquare, Calendar, HelpCircle, Wrench, Search } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
}

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  onSpeak?: (content: string) => void;
  speakingMessageId?: string | null;
}

const capabilities = [
  { icon: MessageSquare, label: "Answer Questions", desc: "General inquiries" },
  { icon: Search, label: "Find Information", desc: "Data retrieval" },
  { icon: Wrench, label: "Execute Tasks", desc: "Workflow automation" },
  { icon: Calendar, label: "Scheduling", desc: "Appointments" },
  { icon: HelpCircle, label: "Support", desc: "Help & guidance" },
];

export const ChatContainer = ({ messages, isTyping, onSpeak, speakingMessageId }: ChatContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center glow-primary">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to <span className="gradient-text">OmniAgent</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Your intelligent AI assistant. I can understand your intent and help with various tasks.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
              {capabilities.map((cap, index) => (
                <div
                  key={cap.label}
                  className="p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <cap.icon className="w-5 h-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-medium text-foreground">{cap.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            role={message.role} 
            content={message.content}
            intent={message.intent}
            onSpeak={message.role === "assistant" && onSpeak ? () => onSpeak(message.content) : undefined}
            isSpeaking={speakingMessageId === message.id}
          />
        ))}

        {isTyping && <TypingIndicator />}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
