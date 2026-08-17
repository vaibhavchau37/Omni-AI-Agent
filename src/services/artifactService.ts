import { supabase } from "@/integrations/supabase/client";
import type { Artifact, ArtifactKind } from "@/lib/artifacts";

export interface UploadedFile {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

export const generateArtifact = async (
  kind: ArtifactKind,
  prompt: string,
  language: "en" | "hi" = "en"
): Promise<{ artifact?: Artifact; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("omniagent-artifact", {
      body: { kind, prompt, language },
    });
    if (error) return { error: "I couldn't build that file. Please try again." };
    if (data?.error) return { error: data.error };
    return { artifact: data.artifact as Artifact };
  } catch {
    return { error: "Something went wrong while building your file." };
  }
};

export const analyzeFiles = async (
  files: UploadedFile[],
  question: string
): Promise<{ summary?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("omniagent-analyze-file", {
      body: {
        files: files.map((f) => ({ name: f.name, mimeType: f.mimeType, dataUrl: f.dataUrl })),
        question,
      },
    });
    if (error) return { error: "I couldn't read that file. Please try another one." };
    if (data?.error) return { error: data.error };
    return { summary: data.summary as string };
  } catch {
    return { error: "Something went wrong while reading your file." };
  }
};

export const fileToUpload = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result),
      });
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
