import { Zap, Sparkles } from "lucide-react";

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
      <div className="space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome to <span className="gradient-text">OmniAgent</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your intelligent multi-agent AI assistant with goal tracking and real-time analytics
        </p>
      </div>
    </div>
  );
};