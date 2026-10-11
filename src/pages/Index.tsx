import { useState, useEffect, useCallback, useRef } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ControlBar, AgentRole } from "@/components/chat/ControlBar";
import { AnalyticsDashboard } from "@/components/chat/AnalyticsDashboard";
import { VisionAgent } from "@/components/chat/VisionAgent";
import { MultiAgentPanel, AgentMessage, AgentDefinition } from "@/components/chat/MultiAgentPanel";
import { AgentActivity } from "@/components/chat/AgentActivityLog";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useContinuousListening } from "@/hooks/useContinuousListening";
import { toast } from "@/hooks/use-toast";
import { sendChatMessageStreaming, clearSession } from "@/services/chatService";
import { generateArtifact, analyzeFiles, UploadedFile } from "@/services/artifactService";
import { detectArtifactRequest, artifactLabel, Artifact } from "@/lib/artifacts";
import { Button } from "@/components/ui/button";
import { ROLE_META } from "@/lib/roles";
import { SettingsDialog, SettingsTab } from "@/components/chat/SettingsDialog";
import { AccountMenu } from "@/components/chat/AccountMenu";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { AppSettings, loadSettings, saveSettings, applyTextSize } from "@/lib/settings";
import {
  ChatSession,
  saveSession,
  listSessions,
  newSessionId,
} from "@/lib/chatHistory";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: "high" | "medium" | "low";
  confidenceScore?: number;
  needsUserConfirmation?: boolean;
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

type IntentType = 
  | "General Question"
  | "Information Request"
  | "Task Execution"
  | "Appointment / Scheduling"
  | "Support / Help"
  | "Unknown Intent";

const classifyIntent = (message: string): IntentType => {
  const lower = message.toLowerCase();
  if (/schedule|appointment|book|meeting|calendar|remind/.test(lower)) return "Appointment / Scheduling";
  if (/create|execute|run|do |make|generate|send|update|build|set up/.test(lower)) return "Task Execution";
  if (/help|support|issue|problem|trouble|fix|error/.test(lower)) return "Support / Help";
  if (/find|search|look up|get me|show me|list|tell me about/.test(lower)) return "Information Request";
  if (/what|how|why|when|where|who|can you|\?/.test(lower)) return "General Question";
  return "Unknown Intent";
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [agentRole, setAgentRole] = useState<AgentRole>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("omniagent_role") : null;
    return saved && saved in ROLE_META ? (saved as AgentRole) : "default";
  });
  const [isSimulation, setIsSimulation] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState<string>(() => newSessionId());
  const [historyCount, setHistoryCount] = useState<number>(() => listSessions().length);
  const [historyRevision, setHistoryRevision] = useState(0);

  
  const [currentGoal, setCurrentGoal] = useState<{ goal: string; steps: string[]; currentStep: number; executedActions?: Array<{step: number, action: string, status: string, result: string}>; isAutonomous?: boolean } | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const explainMode = settings.showReasoning;
  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);
  const openSettings = useCallback((tab: SettingsTab) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, []);
  const [activeAgents, setActiveAgents] = useState<AgentDefinition["id"][]>([]);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  
  const conversationHistory = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  
  const { isListening, transcript, toggleListening, resetTranscript, setLanguage, currentLanguage } = useSpeechRecognition();
  const { speak, stop, isSpeaking, setPreferredLanguage } = useTextToSpeech();
  const continuousListening = useContinuousListening();

  useEffect(() => {
    if (continuousListening.isWakeWordDetected && continuousListening.transcript) {
      const trimmedTranscript = continuousListening.transcript.trim();
      if (trimmedTranscript.length > 3 && !isTyping) {
        continuousListening.pauseListening();
        setIsVoiceMode(true);
        handleSendMessage(trimmedTranscript);
        continuousListening.resetTranscript();
      }
    }
  }, [continuousListening.isWakeWordDetected, continuousListening.transcript, isTyping]);

  useEffect(() => {
    if (!isTyping && !isSpeaking && continuousListening.isEnabled) {
      continuousListening.resumeListening();
    }
  }, [isTyping, isSpeaking, continuousListening.isEnabled]);

  useEffect(() => {
    if (!isListening && transcript) {
      setIsVoiceMode(true);
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  useEffect(() => { applyTextSize(settings.textSize); }, [settings.textSize]);

  useEffect(() => {
    setLanguage(settings.language);
    setPreferredLanguage(settings.language === "hi-IN" ? "hi" : settings.language === "en-US" ? "en" : "auto");
  }, [settings.language]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        openSettings("general");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSettings]);

  useEffect(() => {
    if (!isSpeaking) setSpeakingMessageId(null);
  }, [isSpeaking]);

  const addMessage = useCallback((
    role: "user" | "assistant", 
    content: string, 
    extras?: Partial<Omit<Message, 'id' | 'role' | 'content' | 'timestamp'>>
  ): string => {
    const id = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const timestamp = Date.now();
    setMessages(prev => [...prev, { id, role, content, timestamp, ...extras }]);
    conversationHistory.current.push({ role, content });
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const simulateAgentActivity = useCallback((activities: Array<{agent: string, action: string}>) => {
    setAgentActivities([]);
    activities.forEach((activity, index) => {
      setTimeout(() => {
        const activityId = `${Date.now()}_${index}`;
        setAgentActivities(prev => [
          ...prev.map(a => ({ ...a, status: "complete" as const })),
          { id: activityId, agent: activity.agent as AgentActivity["agent"], action: activity.action, status: "running" as const, timestamp: Date.now() }
        ]);
      }, index * 800);
    });
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

  // Auto-save the current conversation to local history
  useEffect(() => {
    if (isTyping) return;
    const persistable = messages.filter((m) => m.content.trim() && !m.isStreaming);
    if (persistable.length === 0) return;
    saveSession(sessionKey, persistable, agentRole);
    setHistoryCount(listSessions().length);
    setHistoryRevision((revision) => revision + 1);
  }, [messages, isTyping, sessionKey, agentRole]);

  const handleClearSession = useCallback(() => {
    setMessages([]);
    conversationHistory.current = [];
    setAgentActivities([]);
    setCurrentGoal(null);
    setActiveAgents([]);
    setAgentMessages([]);
    setSessionKey(newSessionId());
    clearSession();
    const def = settingsRef.current.defaultRole;
    if (def in ROLE_META) {
      setAgentRole(def);
      localStorage.setItem("omniagent_role", def);
    }
    stop();
    setSpeakingMessageId(null);
    setHistoryCount(listSessions().length);
    toast({ title: "New chat started", description: "Your previous chat is saved in History." });
  }, [stop]);

  const handleSelectSession = useCallback((session: ChatSession) => {
    stop();
    setSpeakingMessageId(null);
    setAgentActivities([]);
    setCurrentGoal(null);
    setActiveAgents([]);
    setAgentMessages([]);
    setSessionKey(session.id);
    setMessages(session.messages as Message[]);
    conversationHistory.current = session.messages.map((m) => ({ role: m.role, content: m.content }));
    if (session.role && session.role in ROLE_META) {
      setAgentRole(session.role as AgentRole);
      localStorage.setItem("omniagent_role", session.role);
    }
    toast({ title: "Chat restored", description: session.title });
  }, [stop]);


  const handleRoleChange = useCallback((role: AgentRole) => {
    setAgentRole(role);
    localStorage.setItem("omniagent_role", role);
    const meta = ROLE_META[role];
    toast({ title: `${meta.title} mode`, description: meta.tagline });
  }, []);

  const handleSendMessage = async (content: string, attachments?: UploadedFile[]) => {
    const intent = classifyIntent(content);
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setMessages(prev => [...prev, { id, role: "user", content, timestamp: Date.now(), attachments }]);
    conversationHistory.current.push({ role: "user", content });
    setIsTyping(true);
    setAgentActivities([]);
    setActiveAgents([]);
    setAgentMessages([]);

    // Create assistant message placeholder for streaming
    const assistantId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const assistantTimestamp = Date.now();
    setMessages(prev => [...prev, { 
      id: assistantId, 
      role: "assistant" as const, 
      content: "", 
      timestamp: assistantTimestamp,
      isStreaming: true 
    }]);

    let streamedContent = "";

    // 1) File generation requests (PPT / Word / landing page / spreadsheet)
    const artifactKind = detectArtifactRequest(content);
    if (artifactKind) {
      updateMessage(assistantId, { content: `Building your ${artifactLabel[artifactKind]}…` });
      const { artifact, error } = await generateArtifact(
        artifactKind,
        content,
        currentLanguage === "hi-IN" ? "hi" : "en"
      );
      if (artifact) {
        const reply = `Here is your ${artifactLabel[artifactKind]}. Download it below${artifactKind === "landing" ? ", or preview it in a new tab" : ""}. Tell me what to change and I'll rebuild it.`;
        updateMessage(assistantId, {
          content: reply,
          isStreaming: false,
          intent: "Task Execution",
          confidence: "high",
          selectedTool: artifactLabel[artifactKind],
          artifact,
        });
        conversationHistory.current.push({ role: "assistant", content: reply });
      } else {
        updateMessage(assistantId, {
          content: error || "I couldn't build that file. Please try again.",
          isStreaming: false,
          confidence: "low",
        });
        conversationHistory.current.push({ role: "assistant", content: error || "File generation failed." });
      }
      setIsTyping(false);
      setIsVoiceMode(false);
      return;
    }

    // 2) Attached images / documents → read them first, then answer with that context
    let historyForModel = [...conversationHistory.current];
    if (attachments?.length) {
      updateMessage(assistantId, { content: "Reading your file(s)…" });
      const { summary, error } = await analyzeFiles(attachments, content);
      if (error) {
        updateMessage(assistantId, { content: error, isStreaming: false, confidence: "low" });
        conversationHistory.current.push({ role: "assistant", content: error });
        setIsTyping(false);
        setIsVoiceMode(false);
        return;
      }
      const fileContext = `[Contents extracted from the user's attached file(s): ${attachments.map(f => f.name).join(", ")}]\n${summary}`;
      historyForModel = [
        ...historyForModel.slice(0, -1),
        { role: "user", content: `${fileContext}\n\nUser question: ${content}` },
      ];
      updateMessage(assistantId, { content: "" });
    }

    await sendChatMessageStreaming(
      historyForModel,
      {
        onToken: (token) => {
          streamedContent += token;
          updateMessage(assistantId, { content: streamedContent });
        },
        onComplete: (response) => {
          // Update conversation history
          conversationHistory.current.push({ role: "assistant", content: streamedContent });
          
          // Update message with final metadata
          updateMessage(assistantId, {
            content: streamedContent || response.content || "",
            isStreaming: false,
            intent: response.intent || intent,
            confidence: response.confidence,
            emotion: response.emotion,
            showEscalation: response.shouldEscalate,
            selectedTool: response.selectedTool,
            toolReason: response.toolReason,
            reasoning: response.reasoning,
            retryCount: response.retryCount,
          });

          // Handle agent activities
          if (response.agentActivities) {
            simulateAgentActivity(response.agentActivities);
            const agents = response.agentActivities.map(a => a.agent as AgentDefinition["id"]);
            setActiveAgents([...new Set(agents)] as AgentDefinition["id"][]);
            
            const msgs: AgentMessage[] = [];
            response.agentActivities.forEach((activity, index) => {
              if (index > 0 && response.agentActivities) {
                const prevAgent = response.agentActivities[index - 1].agent;
                msgs.push({
                  id: `${Date.now()}_${index}`,
                  from: prevAgent as AgentDefinition["id"],
                  to: activity.agent as AgentDefinition["id"],
                  type: "request",
                  content: activity.action,
                  timestamp: Date.now(),
                });
              }
            });
            setAgentMessages(msgs);
          }

          // Handle goals
          if (response.isGoal && response.goalSteps?.length) {
            setCurrentGoal({
              goal: content,
              steps: response.goalSteps,
              currentStep: 0,
              executedActions: response.executedActions,
              isAutonomous: response.isAutonomous,
            });
          }

          // Voice mode
          if ((isVoiceMode || settingsRef.current.autoSpeak) && streamedContent) {
            setSpeakingMessageId(assistantId);
            speak(streamedContent);
          }

          setIsTyping(false);
          setIsVoiceMode(false);
        },
        onError: (error) => {
          updateMessage(assistantId, {
            content: error,
            isStreaming: false,
            intent: "Support / Help",
            confidence: "low",
            showEscalation: true,
          });
          conversationHistory.current.push({ role: "assistant", content: error });
          
          if (isVoiceMode) {
            setSpeakingMessageId(assistantId);
            speak(error);
          }
          
          setIsTyping(false);
          setIsVoiceMode(false);
        },
      },
      isVoiceMode,
      intent,
      { agentRole, isSimulation, explainDecision: explainMode }
    );
  };

  const handleEditMessage = useCallback((id: string, newContent: string) => {
    setMessages(prev => {
      const index = prev.findIndex(m => m.id === id);
      if (index === -1) return prev;
      const kept = prev.slice(0, index);
      conversationHistory.current = kept
        .filter(m => m.content)
        .map(m => ({ role: m.role, content: m.content }));
      return kept;
    });
    setTimeout(() => handleSendMessage(newContent), 0);
  }, []);

  const handleVoiceToggle = () => {
    if (isListening) {
      toggleListening();
      toast({ title: "Processing..." });
    } else {
      stop();
      setSpeakingMessageId(null);
      toggleListening();
      toast({ title: "🎤 Listening" });
    }
  };

  const handleLanguageChange = (lang: "en-US" | "hi-IN" | "auto") => {
    updateSettings({ ...settingsRef.current, language: lang });
  };

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
      <ChatSidebar
        desktopOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeSessionId={sessionKey}
        historyVersion={historyRevision}
        onSelect={handleSelectSession}
        onNewChat={handleClearSession}
        onOpenSettings={() => openSettings("general")}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Header */}
      <ChatHeader 
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => {
          if (window.matchMedia("(min-width: 1024px)").matches) {
            setSidebarOpen((open) => !open);
          } else {
            setMobileSidebarOpen(true);
          }
        }}
        onClearSession={handleClearSession} 
        onOpenAnalytics={() => setShowAnalytics(true)}
        explainMode={explainMode}
        onExplainModeToggle={() => updateSettings({ ...settings, showReasoning: !explainMode })}
        accountSlot={
          <AccountMenu
            name={settings.displayName}
            language={settings.language}
            onLanguage={handleLanguageChange}
            onOpenSettings={openSettings}
            onGetHelp={() => handleSendMessage("How do I use OmniAgent? Give me a short guide to its main features, modes and buttons.")}
          />
        }
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={updateSettings}
        onHistoryCleared={() => setHistoryCount(listSessions().length)}
        initialTab={settingsTab}
      />

      {/* Control Bar */}
      <ControlBar
        agentRole={agentRole}
        onRoleChange={handleRoleChange}
        isSimulation={isSimulation}
        onSimulationToggle={() => setIsSimulation(!isSimulation)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        isListening={isListening}
        continuousListening={continuousListening}
      />
      
      {/* Multi-Agent Panel */}
      {activeAgents.length > 0 && (
        <div className="px-4 max-w-3xl mx-auto w-full">
          <MultiAgentPanel
            activeAgents={activeAgents}
            messages={agentMessages}
            isProcessing={isTyping}
            language={currentLanguage === "hi-IN" ? "hi" : "en"}
          />
        </div>
      )}
      
      {/* Main Content */}
      <ChatContainer
        messages={messages} 
        isTyping={isTyping}
        agentActivities={agentActivities}
        onSpeak={handleSpeak}
        speakingMessageId={speakingMessageId}
        currentGoal={currentGoal}
        onSelectDemo={handleSendMessage}
        onOpenAnalytics={() => setShowAnalytics(true)}
        onEditMessage={handleEditMessage}
        agentRole={agentRole}
        displayName={settings.displayName}
      />
      
      {/* Input Area */}
      <div className="shrink-0 border-t border-border/30 bg-background/95 px-2.5 py-2 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            isListening={isListening}
            onVoiceToggle={handleVoiceToggle}
            disabled={isTyping}
          />
        </div>
      </div>
      
      <AnalyticsDashboard isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
      </div>
    </div>
  );
};

export default Index;