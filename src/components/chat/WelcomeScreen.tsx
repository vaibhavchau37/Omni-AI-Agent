import { Zap, Sparkles, Brain, Target, Wrench, Calendar, Users, BarChart3, LucideIcon } from "lucide-react";

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
}

const features: Feature[] = [
  { 
    id: "multi-agent",
    icon: Brain, 
    title: "Multi-Agent AI", 
    description: "Collaborative thinking",
    action: "Show me how multi-agent collaboration works with an example task"
  },
  { 
    id: "goal",
    icon: Target, 
    title: "Goal-Oriented", 
    description: "Step-by-step goals",
    action: "Help me create a step-by-step goal plan for learning a new skill"
  },
  { 
    id: "tool",
    icon: Wrench, 
    title: "Tool Selection", 
    description: "Smart automation",
    action: "What tools and automations can you help me with?"
  },
  { 
    id: "schedule",
    icon: Calendar, 
    title: "Scheduling", 
    description: "Appointments",
    action: "Help me schedule an appointment for tomorrow at 3 PM"
  },
  { 
    id: "role",
    icon: Users, 
    title: "Role-Based", 
    description: "Adaptive behavior",
    action: "Explain how you adapt to different roles like developer, support, or analyst"
  },
  { 
    id: "analytics",
    icon: BarChart3, 
    title: "Analytics", 
    description: "Track performance",
    action: "open-analytics"
  },
];

interface WelcomeScreenProps {
  onFeatureClick?: (action: string) => void;
  onOpenAnalytics?: () => void;
}

export const WelcomeScreen = ({ onFeatureClick, onOpenAnalytics }: WelcomeScreenProps) => {
  const handleFeatureClick = (feature: Feature) => {
    if (feature.action === "open-analytics") {
      onOpenAnalytics?.();
    } else {
      onFeatureClick?.(feature.action);
    }
  };

  return (
    <div className="text-center py-16 fade-in">
      {/* Hero Icon */}
      <div className="relative inline-block mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/25 via-accent/15 to-primary/10 border border-primary/25 flex items-center justify-center glow-primary">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-accent" />
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome to <span className="gradient-text">OmniAgent</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your intelligent multi-agent AI assistant with goal tracking and real-time analytics
        </p>
      </div>

      {/* Feature Cards */}
      <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-4">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 hover:scale-105 active:scale-95 transition-all duration-300 min-w-[120px] cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};