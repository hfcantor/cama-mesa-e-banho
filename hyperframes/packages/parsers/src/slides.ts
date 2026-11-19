/**
 * Markdown slide decks. Slides are separated by a line containing only `---`.
 * Per-slide directives go in HTML comments:  <!-- duration: 5, transition: wipe-left, background: #102030 -->
 * Supported content: # title, ## subtitle, bullet lists, one image ![alt](src),
 * paragraphs, and speaker notes after a line "Notes:" (used as narration text).
 */

export interface Slide {
  title: string | null;
  subtitle: string | null;
  bullets: string[];
  paragraphs: string[];
  image: { src: string; alt: string } | null;
  notes: string | null;
  duration: number | null;
  transition: string | null;
  background: string | null;
  layout: string | null;
}

const DIRECTIVE = /<!--([\s\S]*?)-->/g;

export function parseSlidesMarkdown(md: string): Slide[] {
  const src = md.replace(/\r/g, '').replace(/^---\n[\s\S]*?\n---\n/, (front) => (front.includes(':') ? '' : front));
  const chunks = src.split(/\n-{3,}\s*\n/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const slide: Slide = { title: null, subtitle: null, bullets: [], paragraphs: [], image: null, notes: null, duration: null, transition: null, background: null, layout: null };
    let body = chunk.replace(DIRECTIVE, (_, inner: string) => {
      for (const pair of inner.split(/[,\n]/)) {
        const [k, ...rest] = pair.split(':');
        const key = k?.trim().toLowerCase();
        const value = rest.join(':').trim();
        if (!key || !value) continue;
        if (key === 'duration') slide.duration = Number(value.replace(/s$/, '')) || null;
        else if (key === 'transition') slide.transition = value;
        else if (key === 'background') slide.background = value;
        else if (key === 'layout') slide.layout = value;
      }
      return '';
    });
    const notesIdx = body.search(/^notes:\s*$/im);
    if (notesIdx >= 0) {
      slide.notes = body.slice(notesIdx).replace(/^notes:\s*$/im, '').trim() || null;
      body = body.slice(0, notesIdx);
    }
    const para: string[] = [];
    const flushPara = () => { if (para.length) { slide.paragraphs.push(para.join(' ')); para.length = 0; } };
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (!line) { flushPara(); continue; }
      let m: RegExpExecArray | null;
      if ((m = /^#\s+(.+)$/.exec(line)) && !slide.title) { flushPara(); slide.title = m[1]!; }
      else if ((m = /^#{2,3}\s+(.+)$/.exec(line)) && !slide.subtitle) { flushPara(); slide.subtitle = m[1]!; }
      else if ((m = /^[-*+]\s+(.+)$/.exec(line)) || (m = /^\d+[.)]\s+(.+)$/.exec(line))) { flushPara(); slide.bullets.push(m[1]!); }
      else if ((m = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/.exec(line))) { flushPara(); slide.image = { alt: m[1]!, src: m[2]! }; }
      else para.push(line);
    }
    flushPara();
    return slide;
  });
}

/** Minimal inline markdown → HTML (bold, italic, code). Input is escaped first. */
export function inlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
