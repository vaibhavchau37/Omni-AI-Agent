import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { AgentActivityLog, AgentActivity } from "./AgentActivityLog";
import { GoalTracker } from "./GoalTracker";
import { WelcomeScreen } from "./WelcomeScreen";
import type { Artifact } from "@/lib/artifacts";
import type { UploadedFile } from "@/services/artifactService";
import type { AgentRoleId } from "@/lib/roles";

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
  attachments?: UploadedFile[];
  artifact?: Artifact;
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
  onOpenAnalytics?: () => void;
  onEditMessage?: (id: string, newContent: string) => void;
  agentRole?: AgentRoleId;
  displayName?: string;
}

export const ChatContainer = ({ 
  messages, 
  isTyping, 
  agentActivities,
  onSpeak, 
  speakingMessageId,
  currentGoal,
  onSelectDemo,
  onOpenAnalytics,
  onEditMessage,
  agentRole = "default",
  displayName = "",
}: ChatContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, agentActivities]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pt-4 pb-36">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Welcome + Demos (only when empty) */}
        {messages.length === 0 && (
          <WelcomeScreen 
            onFeatureClick={onSelectDemo} 
            onOpenAnalytics={onOpenAnalytics}
            role={agentRole}
            displayName={displayName}
          />
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
            attachments={message.attachments}
            artifact={message.artifact}
            onEdit={message.role === "user" && onEditMessage ? (next) => onEditMessage(message.id, next) : undefined}
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