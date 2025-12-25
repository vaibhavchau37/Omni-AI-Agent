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
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  metadata?: Record<string, any>;
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
  const getAgent = (id: AgentDefinition["id"]) => 
    AGENT_DEFINITIONS.find(a => a.id === id);

  const getMessageTypeIcon = (type: AgentMessage["type"]) => {
    switch (type) {
      case "request": return "📤";
      case "response": return "📥";
      case "notify": return "📢";
      case "approve": return "✅";
      case "reject": return "❌";
    }
  };

  if (activeAgents.length === 0 && messages.length === 0) return null;

  return (
    <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border/50 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {language === "hi" ? "मल्टी-एजेंट सिस्टम" : "Multi-Agent System"}
          </span>
          {isProcessing && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {activeAgents.length} {language === "hi" ? "सक्रिय" : "active"}
        </Badge>
      </div>

      {/* Active Agents */}
      <div className="flex flex-wrap gap-2 mb-4">
        {AGENT_DEFINITIONS.map((agent) => {
          const isActive = activeAgents.includes(agent.id);
          const Icon = agent.icon;
          
          return (
            <div
              key={agent.id}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all",
                isActive
                  ? `${agent.bgColor} border-current ${agent.color}`
                  : "bg-muted/30 border-border/50 opacity-40"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", agent.color)} />
              <span className="text-xs font-medium">
                {language === "hi" ? agent.nameHi : agent.name}
              </span>
              {isActive ? (
                <Unlock className="w-3 h-3 text-green-400" />
              ) : (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Communication Log */}
      {messages.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {language === "hi" ? "संचार लॉग:" : "Communication Log:"}
          </span>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {messages.slice(-5).map((msg) => {
              const fromAgent = getAgent(msg.from);
              const toAgent = getAgent(msg.to);
              
              if (!fromAgent || !toAgent) return null;
              
              return (
                <div
                  key={msg.id}
                  className="flex items-center gap-2 text-xs p-1.5 rounded bg-background/50"
                >
                  <span className={cn("font-medium", fromAgent.color)}>
                    {language === "hi" ? fromAgent.nameHi : fromAgent.name}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className={cn("font-medium", toAgent.color)}>
                    {language === "hi" ? toAgent.nameHi : toAgent.name}
                  </span>
                  <span className="text-muted-foreground">
                    {getMessageTypeIcon(msg.type)}
                  </span>
                  <span className="text-muted-foreground truncate flex-1">
                    {msg.content}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Permissions Legend */}
      <details className="mt-3 pt-3 border-t border-border/50">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          {language === "hi" ? "एजेंट अनुमतियाँ देखें" : "View Agent Permissions"}
        </summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {AGENT_DEFINITIONS.filter(a => activeAgents.includes(a.id)).map((agent) => {
            const Icon = agent.icon;
            
            return (
              <div key={agent.id} className={cn("p-2 rounded-lg", agent.bgColor)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-4 h-4", agent.color)} />
                  <span className={cn("text-xs font-medium", agent.color)}>
                    {language === "hi" ? agent.nameHi : agent.name}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  {language === "hi" ? agent.roleHi : agent.role}
                </p>
                <div className="flex flex-wrap gap-1">
                  {agent.permissions.slice(0, 3).map((perm) => (
                    <span
                      key={perm}
                      className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                  {agent.restrictions.slice(0, 2).map((rest) => (
                    <span
                      key={rest}
                      className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400"
                    >
                      ✗ {rest}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
};
