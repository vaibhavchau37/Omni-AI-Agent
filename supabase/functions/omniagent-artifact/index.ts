import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  kind: z.enum(['ppt', 'doc', 'landing', 'sheet']),
  prompt: z.string().min(2).max(5000),
  language: z.enum(['en', 'hi']).optional().default('en'),
});

const SCHEMAS: Record<string, string> = {
  ppt: `{"type":"ppt","title":string,"subtitle":string,"slides":[{"title":string,"bullets":string[],"notes":string}]}  // 6-10 slides, 3-5 crisp bullets each`,
  doc: `{"type":"doc","title":string,"subtitle":string,"sections":[{"heading":string,"paragraphs":string[],"bullets":string[]}]}  // 4-8 sections`,
  sheet: `{"type":"sheet","title":string,"columns":string[],"rows":string[][]}  // up to 8 columns, up to 40 rows`,
  landing: `{"type":"landing","title":string,"brand":string,"tagline":string,"hero":{"headline":string,"subheadline":string,"cta":string},"features":[{"title":string,"description":string,"emoji":string}],"about":string,"contactEmail":string,"accent":string /* hex color */}  // exactly one landing PAGE, not a full multi-page site`,
};

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
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { kind, prompt, language } = parsed.data;

    const system = `You are OmniAgent's document builder for Indian users.
Produce ONLY valid minified JSON matching this schema, with no markdown fences and no commentary:
${SCHEMAS[kind]}

Rules:
- Write in ${language === 'hi' ? 'Hindi (Devanagari), simple and natural' : 'clear, simple English'}.
- Be concrete and practical. Use India-relevant examples, currency (₹) and context when relevant.
- Never invent statistics, prices, dates or citations. If a number is unknown, describe it qualitatively.
- Keep every string short enough to fit on a slide or a page.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests right now. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      console.error("[omniagent-artifact] gateway error", res.status, await res.text());
      return new Response(JSON.stringify({ error: "Could not build that file. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    let artifact;
    try {
      artifact = JSON.parse(raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
    } catch {
      console.error("[omniagent-artifact] parse failure", raw.slice(0, 400));
      return new Response(JSON.stringify({ error: "The generated file was malformed. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    artifact.type = kind;
    return new Response(JSON.stringify({ artifact }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[omniagent-artifact] error", e);
    return new Response(JSON.stringify({ error: "Unable to generate the file right now." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
