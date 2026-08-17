import { Download, FileText, Presentation, Globe, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Artifact, artifactLabel, artifactSummary, downloadArtifact, buildLandingHtml } from "@/lib/artifacts";

const icons = {
  ppt: Presentation,
  doc: FileText,
  landing: Globe,
  sheet: Table2,
} as const;

export const ArtifactCard = ({ artifact }: { artifact: Artifact }) => {
  const Icon = icons[artifact.type];

  const preview = () => {
    if (artifact.type !== "landing") return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(buildLandingHtml(artifact));
      win.document.close();
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{artifact.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {artifactLabel[artifact.type]} · {artifactSummary(artifact)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => downloadArtifact(artifact)}>
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
        {artifact.type === "landing" && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={preview}>
            Preview
          </Button>
        )}
      </div>
    </div>
  );
};
