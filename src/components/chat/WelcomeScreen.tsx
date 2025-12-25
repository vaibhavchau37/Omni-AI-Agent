import { Zap, Brain, Target, Wrench, Calendar, Users, BarChart3, Sparkles } from "lucide-react";

const capabilities = [
  { icon: Brain, label: "Multi-Agent", desc: "Collaborative AI" },
  { icon: Target, label: "Goal-Oriented", desc: "Step-by-step" },
  { icon: Wrench, label: "Smart Tools", desc: "Automation" },
  { icon: Calendar, label: "Scheduling", desc: "Appointments" },
  { icon: Users, label: "Role-Based", desc: "Adaptive" },
  { icon: BarChart3, label: "Analytics", desc: "Insights" },
];

export const WelcomeScreen = () => {
  return (
    <div className="text-center py-12 fade-in">
      {/* Hero Icon */}
      <div className="relative inline-block mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/20 flex items-center justify-center glow-primary">
          <Zap className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-accent" />
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-3 mb-10">
        <h2 className="text-3xl font-bold text-foreground">
          Welcome to <span className="gradient-text">OmniAgent</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Your intelligent multi-agent AI assistant with goal tracking, 
          role-based personas, and real-time analytics.
        </p>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
        {capabilities.map((cap, index) => (
          <div
            key={cap.label}
            className="group p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:border-primary/30 hover:bg-secondary/80 transition-all duration-300 cursor-pointer hover-lift card-shine"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <cap.icon className="w-6 h-6 text-primary/80 mx-auto mb-2 group-hover:scale-110 group-hover:text-primary transition-all" />
            <p className="text-xs font-semibold text-foreground mb-0.5">{cap.label}</p>
            <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Tip */}
      <p className="text-xs text-muted-foreground/60 mt-10">
        💡 Try: "Help me prepare for a job interview" or enable Sandbox mode for testing
      </p>
    </div>
  );
};