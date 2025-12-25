import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  totalInteractions: number;
  successRate: number;
  avgResponseTime: number;
  intentBreakdown: Record<string, number>;
  emotionBreakdown: Record<string, number>;
  confidenceBreakdown: Record<string, number>;
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboard = ({ isOpen, onClose }: AnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const successCount = data.filter(d => d.task_success).length;
        const avgTime = data.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / data.length;
        
        const intentBreakdown: Record<string, number> = {};
        const emotionBreakdown: Record<string, number> = {};
        const confidenceBreakdown: Record<string, number> = {};

        data.forEach(d => {
          if (d.intent) intentBreakdown[d.intent] = (intentBreakdown[d.intent] || 0) + 1;
          if (d.emotion) emotionBreakdown[d.emotion] = (emotionBreakdown[d.emotion] || 0) + 1;
          if (d.confidence) confidenceBreakdown[d.confidence] = (confidenceBreakdown[d.confidence] || 0) + 1;
        });

        setAnalytics({
          totalInteractions: data.length,
          successRate: (successCount / data.length) * 100,
          avgResponseTime: avgTime,
          intentBreakdown,
          emotionBreakdown,
          confidenceBreakdown,
        });
      } else {
        setAnalytics({
          totalInteractions: 0,
          successRate: 0,
          avgResponseTime: 0,
          intentBreakdown: {},
          emotionBreakdown: {},
          confidenceBreakdown: {},
        });
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 p-6 rounded-2xl bg-card border border-border shadow-2xl fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI Analytics Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Total Interactions</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{analytics.totalInteractions}</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{analytics.successRate.toFixed(1)}%</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{(analytics.avgResponseTime / 1000).toFixed(1)}s</p>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Intent Breakdown */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-3">Intent Frequency</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.intentBreakdown).slice(0, 5).map(([intent, count]) => (
                    <div key={intent} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{intent}</span>
                      <span className="text-foreground font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(analytics.intentBreakdown).length === 0 && (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                </div>
              </div>

              {/* Confidence Breakdown */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-3">Confidence Levels</h3>
                <div className="space-y-2">
                  {['high', 'medium', 'low'].map(level => {
                    const count = analytics.confidenceBreakdown[level] || 0;
                    const total = analytics.totalInteractions || 1;
                    const percentage = (count / total) * 100;
                    
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn(
                            "capitalize",
                            level === 'high' && "text-green-400",
                            level === 'medium' && "text-yellow-400",
                            level === 'low' && "text-red-400"
                          )}>{level}</span>
                          <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              level === 'high' && "bg-green-400",
                              level === 'medium' && "bg-yellow-400",
                              level === 'low' && "bg-red-400"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Emotion Analysis */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <h3 className="text-sm font-medium text-foreground mb-3">User Emotions Detected</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.emotionBreakdown).map(([emotion, count]) => (
                  <span 
                    key={emotion}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      emotion === 'positive' && "bg-green-500/20 text-green-400",
                      emotion === 'neutral' && "bg-gray-500/20 text-gray-400",
                      emotion === 'negative' && "bg-orange-500/20 text-orange-400",
                      emotion === 'frustrated' && "bg-red-500/20 text-red-400"
                    )}
                  >
                    {emotion}: {count}
                  </span>
                ))}
                {Object.keys(analytics.emotionBreakdown).length === 0 && (
                  <p className="text-xs text-muted-foreground">No emotion data yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No analytics data available</div>
        )}
      </div>
    </div>
  );
};