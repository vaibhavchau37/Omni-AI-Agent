import { Sparkles, ArrowRight } from "lucide-react";
import { ROLE_META, type AgentRoleId } from "@/lib/roles";

interface WelcomeScreenProps {
  onFeatureClick?: (action: string) => void;
  onOpenAnalytics?: () => void;
  role?: AgentRoleId;
}

export const WelcomeScreen = ({ onFeatureClick, role = "default" }: WelcomeScreenProps) => {
  const meta = ROLE_META[role] ?? ROLE_META.default;
  const RoleIcon = meta.icon;

  return (
    <div className="text-center py-12 fade-in">
      {/* Hero */}
      <div className="relative inline-block mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center glow-primary">
          <RoleIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-accent" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-1">
        {role === "default" ? (
          <>Welcome to <span className="gradient-text">{meta.title}</span></>
        ) : (
          <><span className="gradient-text">{meta.title}</span> mode</>
        )}
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">{meta.tagline}</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto px-4">
        {meta.quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onFeatureClick?.(action.message)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/50 hover:border-primary/40 hover:bg-card/90 transition-all duration-200 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <RoleIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors flex-1">{action.label}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
