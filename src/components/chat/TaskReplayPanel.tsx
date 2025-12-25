import { useState, useEffect } from "react";
import { History, Play, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskWorkflow {
  id: string;
  task_name: string;
  task_description: string | null;
  workflow_steps: unknown;
  status: string;
  replay_count: number;
  created_at: string;
  execution_time_ms: number | null;
}

type WorkflowStep = { step: number; description: string; action: string };

interface TaskReplayPanelProps {
  sessionId: string;
  onReplayTask: (task: TaskWorkflow) => void;
  language: "en" | "hi";
}

export const TaskReplayPanel = ({
  sessionId,
  onReplayTask,
  language,
}: TaskReplayPanelProps) => {
  const [tasks, setTasks] = useState<TaskWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWorkflow | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [sessionId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("task_workflows")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setTasks(data as TaskWorkflow[]);
    }
    setIsLoading(false);
  };

  const handleReplay = async (task: TaskWorkflow) => {
    setSelectedTask(task);
    setShowConfirm(true);
  };

  const confirmReplay = async () => {
    if (!selectedTask) return;

    // Update replay count
    await supabase
      .from("task_workflows")
      .update({
        replay_count: selectedTask.replay_count + 1,
        last_replayed_at: new Date().toISOString(),
      })
      .eq("id", selectedTask.id);

    onReplayTask(selectedTask);
    setShowConfirm(false);
    setSelectedTask(null);
    fetchTasks();
  };

  const texts = {
    en: {
      title: "Task Memory",
      subtitle: "Previously completed tasks",
      replay: "Replay",
      steps: "steps",
      replayed: "replayed",
      confirmTitle: "Replay Task?",
      confirmDesc: "This will re-execute the following task:",
      cancel: "Cancel",
      confirm: "Yes, Replay",
      noTasks: "No saved tasks yet",
    },
    hi: {
      title: "कार्य स्मृति",
      subtitle: "पहले पूर्ण किए गए कार्य",
      replay: "दोहराएं",
      steps: "चरण",
      replayed: "बार दोहराया",
      confirmTitle: "कार्य दोहराएं?",
      confirmDesc: "यह निम्नलिखित कार्य को फिर से निष्पादित करेगा:",
      cancel: "रद्द करें",
      confirm: "हाँ, दोहराएं",
      noTasks: "अभी तक कोई सहेजा गया कार्य नहीं",
    },
  };

  const t = texts[language];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="w-4 h-4" />
          <span className="text-sm">{t.noTasks}</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <History className="w-4 h-4 text-primary" />
          <span>{t.title}</span>
        </div>

        {tasks.map((task) => (
          <Card
            key={task.id}
            className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleReplay(task)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="font-medium text-sm">{task.task_name}</span>
                </div>
                {task.task_description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {task.task_description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {Array.isArray(task.workflow_steps) ? task.workflow_steps.length : 0} {t.steps}
                  </Badge>
                  {task.replay_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {task.replay_count}x {t.replayed}
                    </Badge>
                  )}
                  {task.execution_time_ms && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(task.execution_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="ml-2">
                <Play className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmTitle}</DialogTitle>
            <DialogDescription>{t.confirmDesc}</DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="py-4">
              <p className="font-medium">{selectedTask.task_name}</p>
              {selectedTask.task_description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTask.task_description}
                </p>
              )}
              <div className="mt-3 space-y-1">
                {Array.isArray(selectedTask.workflow_steps) &&
                  (selectedTask.workflow_steps as WorkflowStep[]).map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{idx + 1}.</span>
                      <span>{step.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {t.cancel}
            </Button>
            <Button onClick={confirmReplay}>
              <Play className="w-4 h-4 mr-2" />
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
