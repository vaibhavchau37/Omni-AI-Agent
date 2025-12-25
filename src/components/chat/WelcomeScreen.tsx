import { Zap, Sparkles, Brain, Target, Wrench, Calendar, Users, BarChart3 } from "lucide-react";

const features = [
  { icon: Brain, title: "Multi-Agent AI", description: "Collaborative thinking" },
  { icon: Target, title: "Goal-Oriented", description: "Step-by-step goals" },
  { icon: Wrench, title: "Tool Selection", description: "Smart automation" },
  { icon: Calendar, title: "Scheduling", description: "Appointments" },
  { icon: Users, title: "Role-Based", description: "Adaptive behavior" },
  { icon: BarChart3, title: "Analytics", description: "Track performance" },
];

export const WelcomeScreen = () => {
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
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 min-w-[120px]"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};