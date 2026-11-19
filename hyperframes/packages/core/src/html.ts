/** Small helpers around parse5's default tree (Node side). */
import { parse, type DefaultTreeAdapterTypes as T, type ParserError } from 'parse5';
import type { ParseIssue, SourceLocation } from './types.ts';

export type Element = T.Element;
export type Node = T.Node;

export interface ParsedDocument {
  document: T.Document;
  errors: ParseIssue[];
}

export function parseHtml(html: string): ParsedDocument {
  const errors: ParseIssue[] = [];
  const document = parse(html, {
    sourceCodeLocationInfo: true,
    onParseError: (e: ParserError) => {
      errors.push({ code: e.code, message: describeParseError(e.code), line: e.startLine, col: e.startCol });
    },
  });
  return { document, errors };
}

function describeParseError(code: string): string {
  return code.replace(/-/g, ' ');
}

export function isElement(n: Node): n is Element {
  return 'tagName' in n;
}

export function childNodes(n: Node): Node[] {
  if (isElement(n) && n.tagName === 'template') {
    return (n as T.Template).content.childNodes as Node[];
  }
  return 'childNodes' in n ? (n.childNodes as Node[]) : [];
}

/** Depth-first, document order. */
export function walk(root: Node, visit: (el: Element) => void): void {
  const stack: Node[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (isElement(n)) visit(n);
    const kids = childNodes(n);
    for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]!);
  }
}

export function attr(el: Element, name: string): string | null {
  const a = el.attrs.find((x) => x.name === name);
  return a ? a.value : null;
}

export function hasAttr(el: Element, name: string): boolean {
  return el.attrs.some((x) => x.name === name);
}

export function textContent(el: Node): string {
  if ('value' in el && (el as T.TextNode).nodeName === '#text') return (el as T.TextNode).value;
  return childNodes(el).map(textContent).join('');
}

export function location(el: Element): SourceLocation | null {
  const l = el.sourceCodeLocation;
  if (!l) return null;
  return { line: l.startLine, col: l.startCol, startOffset: l.startOffset, endOffset: l.endOffset };
}

/** Location of an element's text content (for <style>/<script> bodies). */
export function contentLocation(el: Element): SourceLocation | null {
  const l = el.sourceCodeLocation;
  if (!l || !l.startTag) return null;
  return {
    line: l.startTag.endLine,
    col: l.startTag.endCol,
    startOffset: l.startTag.endOffset,
    endOffset: l.endTag ? l.endTag.startOffset : l.endOffset,
  };
}

export function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function escapeHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Converts a string offset to 1-based line/column. */
export function offsetToLineCol(text: string, offset: number): { line: number; col: number } {
  let line = 1, last = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) { line++; last = i + 1; }
  }
  return { line, col: offset - last + 1 };
}
