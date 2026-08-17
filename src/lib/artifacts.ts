import PptxGenJS from "pptxgenjs";
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
} from "docx";
import { saveAs } from "file-saver";

export type ArtifactKind = "ppt" | "doc" | "landing" | "sheet";

export interface PptArtifact {
  type: "ppt";
  title: string;
  subtitle?: string;
  slides: Array<{ title: string; bullets: string[]; notes?: string }>;
}

export interface DocArtifact {
  type: "doc";
  title: string;
  subtitle?: string;
  sections: Array<{ heading: string; paragraphs?: string[]; bullets?: string[] }>;
}

export interface SheetArtifact {
  type: "sheet";
  title: string;
  columns: string[];
  rows: string[][];
}

export interface LandingArtifact {
  type: "landing";
  title: string;
  brand?: string;
  tagline?: string;
  hero: { headline: string; subheadline: string; cta: string };
  features: Array<{ title: string; description: string; emoji?: string }>;
  about?: string;
  contactEmail?: string;
  accent?: string;
}

export type Artifact = PptArtifact | DocArtifact | SheetArtifact | LandingArtifact;

const slug = (s: string) =>
  (s || "omniagent").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "omniagent";

/** Detect a "make me a file" request from free text. Returns null for normal chat. */
export const detectArtifactRequest = (text: string): ArtifactKind | null => {
  const t = text.toLowerCase();
  const wantsMake = /\b(make|create|generate|build|prepare|banao|bana do|draft|design|write)\b/.test(t);
  if (!wantsMake) return null;
  if (/\b(ppt|powerpoint|presentation|slide deck|slides|pitch deck)\b/.test(t)) return "ppt";
  if (/\b(word file|word document|\.docx|docx|word doc|report document|resume|cv|letter|essay|assignment)\b/.test(t)) return "doc";
  if (/\b(landing page|website|web page|webpage|portfolio page|one[- ]pager|site)\b/.test(t)) return "landing";
  if (/\b(excel|spreadsheet|csv|sheet|table of data)\b/.test(t)) return "sheet";
  return null;
};

export const artifactLabel: Record<ArtifactKind, string> = {
  ppt: "PowerPoint (.pptx)",
  doc: "Word document (.docx)",
  landing: "Landing page (.html)",
  sheet: "Spreadsheet (.csv)",
};

/* ---------------- Builders ---------------- */

export const downloadPpt = async (a: PptArtifact) => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  const cover = pptx.addSlide();
  cover.background = { color: "0B1220" };
  cover.addText(a.title || "Presentation", {
    x: 0.6, y: 2.0, w: 8.8, h: 1.2, fontSize: 40, bold: true, color: "FFFFFF",
  });
  if (a.subtitle) {
    cover.addText(a.subtitle, { x: 0.6, y: 3.2, w: 8.8, h: 0.8, fontSize: 18, color: "9BB4FF" });
  }

  (a.slides || []).forEach((s) => {
    const slide = pptx.addSlide();
    slide.addText(s.title || "", { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 26, bold: true, color: "0B1220" });
    const bullets = (s.bullets || []).filter(Boolean);
    if (bullets.length) {
      slide.addText(bullets.map((b) => ({ text: b, options: { bullet: true } })), {
        x: 0.7, y: 1.4, w: 8.6, h: 3.6, fontSize: 16, color: "26324A", lineSpacing: 28,
      });
    }
    if (s.notes) slide.addNotes(s.notes);
  });

  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  saveAs(blob, `${slug(a.title)}.pptx`);
};

export const downloadDoc = async (a: DocArtifact) => {
  const children: Paragraph[] = [
    new Paragraph({ text: a.title || "Document", heading: HeadingLevel.TITLE }),
  ];
  if (a.subtitle) {
    children.push(new Paragraph({ children: [new TextRun({ text: a.subtitle, italics: true })] }));
  }
  (a.sections || []).forEach((sec) => {
    children.push(new Paragraph({ text: sec.heading || "", heading: HeadingLevel.HEADING_1 }));
    (sec.paragraphs || []).forEach((p) => children.push(new Paragraph({ text: p })));
    (sec.bullets || []).forEach((b) => children.push(new Paragraph({ text: b, bullet: { level: 0 } })));
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug(a.title)}.docx`);
};

export const downloadSheet = (a: SheetArtifact) => {
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [a.columns || [], ...(a.rows || [])].map((r) => r.map(esc).join(",")).join("\n");
  saveAs(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${slug(a.title)}.csv`);
};

export const buildLandingHtml = (a: LandingArtifact): string => {
  const accent = /^#[0-9a-f]{6}$/i.test(a.accent || "") ? a.accent : "#4f7cff";
  const esc = (s = "") => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const features = (a.features || [])
    .map(
      (f) => `      <article class="card">
        <div class="emoji">${esc(f.emoji || "✦")}</div>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.description)}</p>
      </article>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(a.title || a.brand || "Landing page")}</title>
<meta name="description" content="${esc(a.tagline || a.hero?.subheadline || "")}" />
<style>
  :root { --accent: ${accent}; --bg: #0b1220; --fg: #f4f7ff; --muted: #a8b4d0; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--fg); line-height:1.6; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
  header { display:flex; justify-content:space-between; align-items:center; padding:24px 0; }
  .brand { font-weight:800; letter-spacing:-0.02em; font-size:20px; }
  .btn { display:inline-block; background: var(--accent); color:#fff; padding:14px 26px; border-radius:12px; text-decoration:none; font-weight:600; }
  .hero { padding: 72px 0 64px; text-align:center; }
  .hero h1 { font-size: clamp(32px, 6vw, 56px); line-height:1.1; margin:0 0 16px; letter-spacing:-0.03em; }
  .hero p { color: var(--muted); font-size:18px; max-width:640px; margin:0 auto 32px; }
  .grid { display:grid; gap:20px; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); padding-bottom:64px; }
  .card { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:24px; }
  .card h3 { margin:12px 0 8px; font-size:18px; }
  .card p { color: var(--muted); margin:0; font-size:15px; }
  .emoji { font-size:26px; }
  section.about { padding: 48px 0; border-top:1px solid rgba(255,255,255,0.08); color: var(--muted); }
  footer { padding:32px 0 56px; color: var(--muted); font-size:14px; border-top:1px solid rgba(255,255,255,0.08); }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">${esc(a.brand || a.title || "Brand")}</div>
      <a class="btn" href="#cta">${esc(a.hero?.cta || "Get started")}</a>
    </header>

    <main class="hero">
      <h1>${esc(a.hero?.headline || a.title || "")}</h1>
      <p>${esc(a.hero?.subheadline || a.tagline || "")}</p>
      <a id="cta" class="btn" href="mailto:${esc(a.contactEmail || "hello@example.com")}">${esc(a.hero?.cta || "Get started")}</a>
    </main>

    <div class="grid">
${features}
    </div>

    ${a.about ? `<section class="about"><h2>About</h2><p>${esc(a.about)}</p></section>` : ""}

    <footer>© ${new Date().getFullYear()} ${esc(a.brand || a.title || "")} · ${esc(a.contactEmail || "")}</footer>
  </div>
</body>
</html>`;
};

export const downloadLanding = (a: LandingArtifact) => {
  saveAs(new Blob([buildLandingHtml(a)], { type: "text/html;charset=utf-8" }), `${slug(a.brand || a.title)}-landing.html`);
};

export const downloadArtifact = async (a: Artifact) => {
  switch (a.type) {
    case "ppt": return downloadPpt(a);
    case "doc": return downloadDoc(a);
    case "sheet": return downloadSheet(a);
    case "landing": return downloadLanding(a);
  }
};

export const artifactSummary = (a: Artifact): string => {
  switch (a.type) {
    case "ppt": return `${a.slides?.length || 0} slides`;
    case "doc": return `${a.sections?.length || 0} sections`;
    case "sheet": return `${a.rows?.length || 0} rows × ${a.columns?.length || 0} columns`;
    case "landing": return `${a.features?.length || 0} feature blocks`;
  }
};
