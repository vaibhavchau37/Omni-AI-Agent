import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { AgentActivityLog, AgentActivity } from "./AgentActivityLog";
import { GoalTracker } from "./GoalTracker";
import { WelcomeScreen } from "./WelcomeScreen";
import { DemoScenarios } from "./DemoScenarios";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  emotion?: "positive" | "neutral" | "negative" | "frustrated";
  showEscalation?: boolean;
  selectedTool?: string;
  toolReason?: string;
  reasoning?: string;
  retryCount?: number;
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  agentActivities: AgentActivity[];
  onSpeak?: (content: string) => void;
  speakingMessageId?: string | null;
  currentGoal?: { 
    goal: string; 
    steps: string[]; 
    currentStep: number;
    executedActions?: Array<{step: number, action: string, status: string, result: string}>;
    isAutonomous?: boolean;
  } | null;
  onSelectDemo?: (message: string) => void;
}

export const ChatContainer = ({ 
  messages, 
  isTyping, 
  agentActivities,
  onSpeak, 
  speakingMessageId,
  currentGoal,
  onSelectDemo
}: ChatContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, agentActivities]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Welcome + Demos (only when empty) */}
        {messages.length === 0 && (
          <>
            <WelcomeScreen />
            {onSelectDemo && (
              <DemoScenarios onSelectDemo={onSelectDemo} disabled={isTyping} />
            )}
          </>
        )}

        {/* Goal Tracker */}
        {currentGoal && (
          <GoalTracker 
            goal={currentGoal.goal} 
            steps={currentGoal.steps} 
            currentStep={currentGoal.currentStep}
            isVisible={true}
            executedActions={currentGoal.executedActions}
            isAutonomous={currentGoal.isAutonomous}
          />
        )}

        {/* Messages */}
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            role={message.role} 
            content={message.content}
            intent={message.intent}
            confidence={message.confidence}
            emotion={message.emotion}
            showEscalation={message.showEscalation}
            selectedTool={message.selectedTool}
            toolReason={message.toolReason}
            reasoning={message.reasoning}
            retryCount={message.retryCount}
            timestamp={message.timestamp}
            isStreaming={message.isStreaming}
            onSpeak={message.role === "assistant" && onSpeak && !message.isStreaming ? () => onSpeak(message.content) : undefined}
            isSpeaking={speakingMessageId === message.id}
          />
        ))}

        {/* Activity Log */}
        <AgentActivityLog activities={agentActivities} isVisible={isTyping} />

        {/* Typing */}
        {isTyping && <TypingIndicator />}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
};