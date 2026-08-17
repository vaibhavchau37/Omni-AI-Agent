import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  files: z.array(z.object({
    name: z.string().max(300),
    mimeType: z.string().max(200),
    dataUrl: z.string().min(20).max(12_000_000),
  })).min(1).max(4),
  question: z.string().max(2000).optional().default(""),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid file payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { files, question } = parsed.data;

    const content: unknown[] = [{
      type: "text",
      text: `Read the attached file(s) carefully and extract what is actually in them.
${question ? `The user asked: "${question}"` : ""}
Reply with: (1) a one-line description of each file, (2) the key facts, numbers or text it contains, (3) anything that is unclear or unreadable. Never guess content that is not visible.`,
    }];

    for (const f of files) {
      if (f.mimeType.startsWith("image/")) {
        content.push({ type: "image_url", image_url: { url: f.dataUrl } });
      } else {
        content.push({ type: "file", file: { filename: f.name, file_data: f.dataUrl } });
      }
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content }],
      }),
    });

    if (res.status === 429 || res.status === 402) {
      return new Response(JSON.stringify({
        error: res.status === 429 ? "Too many requests. Please retry shortly." : "AI credits exhausted. Please add credits.",
      }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!res.ok) {
      console.error("[omniagent-analyze-file] gateway error", res.status, await res.text());
      return new Response(JSON.stringify({ error: "Could not read that file." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[omniagent-analyze-file] error", e);
    return new Response(JSON.stringify({ error: "Unable to read the file right now." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
