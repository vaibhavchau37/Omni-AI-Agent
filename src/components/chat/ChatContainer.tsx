import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { AgentActivityLog, AgentActivity } from "./AgentActivityLog";
import { Zap, MessageSquare, Calendar, HelpCircle, Wrench, Search, Brain, Users } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
}

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  agentActivities: AgentActivity[];
  onSpeak?: (content: string) => void;
  speakingMessageId?: string | null;
}

const capabilities = [
  { icon: Brain, label: "Multi-Agent AI", desc: "Collaborative thinking" },
  { icon: MessageSquare, label: "Smart Replies", desc: "Context-aware" },
  { icon: Wrench, label: "Task Execution", desc: "Step-by-step" },
  { icon: Calendar, label: "Scheduling", desc: "Appointments" },
  { icon: Users, label: "Escalation", desc: "Human support" },
];

export const ChatContainer = ({ 
  messages, 
  isTyping, 
  agentActivities,
  onSpeak, 
  speakingMessageId 
}: ChatContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, agentActivities]);

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
            <p className="text-muted-foreground max-w-md mx-auto mb-2">
              Your intelligent multi-agent AI assistant with memory, emotion detection, and self-evaluation.
            </p>
            <p className="text-xs text-muted-foreground/70 mb-8">
              Try: "Hi, my name is Vaibhav" or ask a complex question!
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
            confidence={message.confidence}
            emotion={message.emotion}
            showEscalation={message.showEscalation}
            onSpeak={message.role === "assistant" && onSpeak ? () => onSpeak(message.content) : undefined}
            isSpeaking={speakingMessageId === message.id}
          />
        ))}

        {/* Agent Activity Log during processing */}
        <AgentActivityLog activities={agentActivities} isVisible={isTyping} />

        {isTyping && <TypingIndicator />}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
