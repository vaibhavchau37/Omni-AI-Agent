import { useState } from "react";
import { 
  Brain, 
  Wrench, 
  HeadphonesIcon, 
  CheckCircle, 
  Shield, 
  Network,
  Loader2,
  Lock,
  Unlock,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Agent type definitions with clear responsibilities and permissions
export interface AgentDefinition {
  id: "coordinator" | "planner" | "executor" | "support" | "evaluator" | "safety";
  name: string;
  nameHi: string;
  role: string;
  roleHi: string;
  permissions: string[];
  restrictions: string[];
  icon: typeof Brain;
  color: string;
  bgColor: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: "coordinator",
    name: "Coordinator",
    nameHi: "समन्वयक",
    role: "Orchestrates agent collaboration and task delegation",
    roleHi: "एजेंट सहयोग और कार्य प्रतिनिधिमंडल का संचालन",
    permissions: ["delegate_tasks", "view_all_agents", "set_priorities", "resolve_conflicts"],
    restrictions: ["cannot_execute_actions", "cannot_modify_data"],
    icon: Network,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "planner",
    name: "Planner",
    nameHi: "योजनाकार",
    role: "Breaks down goals into actionable steps",
    roleHi: "लक्ष्यों को कार्य योग्य चरणों में विभाजित करता है",
    permissions: ["create_plans", "estimate_effort", "prioritize_steps"],
    restrictions: ["cannot_execute", "cannot_access_external_apis"],
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "executor",
    name: "Executor",
    nameHi: "निष्पादक",
    role: "Performs actions and interacts with tools",
    roleHi: "कार्य करता है और उपकरणों के साथ बातचीत करता है",
    permissions: ["run_tools", "api_calls", "file_operations", "data_processing"],
    restrictions: ["requires_approval_for_destructive", "rate_limited"],
    icon: Wrench,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "support",
    name: "Support",
    nameHi: "सहायक",
    role: "Manages user communication and tone",
    roleHi: "उपयोगकर्ता संचार और स्वर का प्रबंधन",
    permissions: ["format_responses", "add_empathy", "translate_content"],
    restrictions: ["cannot_access_tools", "cannot_make_decisions"],
    icon: HeadphonesIcon,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "evaluator",
    name: "Evaluator",
    nameHi: "मूल्यांकनकर्ता",
    role: "Reviews output quality and confidence",
    roleHi: "आउटपुट गुणवत्ता और विश्वास की समीक्षा",
    permissions: ["rate_confidence", "flag_escalation", "improve_responses"],
    restrictions: ["cannot_execute", "advisory_only"],
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    id: "safety",
    name: "Safety Guard",
    nameHi: "सुरक्षा गार्ड",
    role: "Ensures all actions are safe and compliant",
    roleHi: "सभी कार्य सुरक्षित और अनुपालन में हैं",
    permissions: ["block_unsafe_actions", "require_confirmation", "audit_logs"],
    restrictions: ["cannot_execute_tasks", "monitoring_only"],
    icon: Shield,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
];

// Communication message between agents
export interface AgentMessage {
  id: string;
  from: AgentDefinition["id"];
  to: AgentDefinition["id"];
  type: "request" | "response" | "notify" | "approve" | "reject";
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface MultiAgentPanelProps {
  activeAgents: AgentDefinition["id"][];
  messages: AgentMessage[];
  isProcessing: boolean;
  language: "en" | "hi";
}

export const MultiAgentPanel = ({
  activeAgents,
  messages,
  isProcessing,
  language,
}: MultiAgentPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getAgent = (id: AgentDefinition["id"]) => 
    AGENT_DEFINITIONS.find(a => a.id === id);

  const getMessageTypeIcon = (type: AgentMessage["type"]) => {
    switch (type) {
      case "request": return "⚡";
      case "response": return "📥";
      case "notify": return "📢";
      case "approve": return "✅";
      case "reject": return "❌";
    }
  };

  if (activeAgents.length === 0 && messages.length === 0) return null;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="mb-3 p-3 rounded-lg bg-secondary/30 border border-border/50 fade-in">
        {/* Compact Header with Toggle */}
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full h-auto p-0 hover:bg-transparent flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {language === "hi" ? "मल्टी-एजेंट" : "Multi-Agent"}
              </span>
              {isProcessing && (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              )}
              {/* Compact active agents preview */}
              <div className="flex -space-x-1">
                {AGENT_DEFINITIONS.filter(a => activeAgents.includes(a.id)).slice(0, 3).map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <div
                      key={agent.id}
                      className={cn("w-5 h-5 rounded-full flex items-center justify-center border border-background", agent.bgColor)}
                    >
                      <Icon className={cn("w-2.5 h-2.5", agent.color)} />
                    </div>
                  );
                })}
                {activeAgents.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] border border-background">
                    +{activeAgents.length - 3}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {activeAgents.length} {language === "hi" ? "सक्रिय" : "active"}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        {/* Expandable Content */}
        <CollapsibleContent className="mt-3 space-y-3">
          {/* Active Agents */}
          <div className="flex flex-wrap gap-1.5">
            {AGENT_DEFINITIONS.map((agent) => {
              const isActive = activeAgents.includes(agent.id);
              const Icon = agent.icon;
              
              return (
                <div
                  key={agent.id}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all text-[10px]",
                    isActive
                      ? `${agent.bgColor} border-current ${agent.color}`
                      : "bg-muted/30 border-border/50 opacity-40"
                  )}
                >
                  <Icon className={cn("w-3 h-3", agent.color)} />
                  <span className="font-medium">
                    {language === "hi" ? agent.nameHi : agent.name}
                  </span>
                  {isActive ? (
                    <Unlock className="w-2.5 h-2.5 text-green-400" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Communication Log - Compact */}
          {messages.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                {language === "hi" ? "संचार:" : "Communication:"}
              </span>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {messages.slice(-3).map((msg) => {
                  const fromAgent = getAgent(msg.from);
                  const toAgent = getAgent(msg.to);
                  
                  if (!fromAgent || !toAgent) return null;
                  
                  return (
                    <div
                      key={msg.id}
                      className="flex items-center gap-1.5 text-[10px] p-1 rounded bg-background/50"
                    >
                      <span className={cn("font-medium", fromAgent.color)}>
                        {language === "hi" ? fromAgent.nameHi : fromAgent.name}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className={cn("font-medium", toAgent.color)}>
                        {language === "hi" ? toAgent.nameHi : toAgent.name}
                      </span>
                      <span>{getMessageTypeIcon(msg.type)}</span>
                      <span className="text-muted-foreground truncate flex-1">
                        {msg.content.slice(0, 40)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Permissions - Compact */}
          <details className="pt-2 border-t border-border/50">
            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
              {language === "hi" ? "अनुमतियाँ" : "Permissions"}
            </summary>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {AGENT_DEFINITIONS.filter(a => activeAgents.includes(a.id)).map((agent) => {
                const Icon = agent.icon;
                
                return (
                  <div key={agent.id} className={cn("p-1.5 rounded-md", agent.bgColor)}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Icon className={cn("w-3 h-3", agent.color)} />
                      <span className={cn("text-[10px] font-medium", agent.color)}>
                        {language === "hi" ? agent.nameHi : agent.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {agent.permissions.slice(0, 2).map((perm) => (
                        <span
                          key={perm}
                          className="text-[8px] px-1 py-0.5 rounded bg-green-500/20 text-green-400"
                        >
                          ✓ {perm.slice(0, 10)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
