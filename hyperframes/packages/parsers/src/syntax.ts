/** Syntax checks for CSS (css-tree) and JavaScript (acorn) with positions. */
import * as acorn from 'acorn';
import * as csstree from 'css-tree';

export interface SyntaxIssue { message: string; line: number; col: number }

export function checkJavaScript(code: string, o: { module?: boolean } = {}): SyntaxIssue[] {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: o.module ? 'module' : 'script', allowHashBang: true, locations: true });
    return [];
  } catch (e) {
    const err = e as SyntaxError & { loc?: { line: number; column: number } };
    return [{ message: err.message.replace(/\s*\(\d+:\d+\)$/, ''), line: err.loc?.line ?? 1, col: (err.loc?.column ?? 0) + 1 }];
  }
}

/** Returns the identifiers used as callees/members, for heuristics in the linter. */
export function scanJavaScript(code: string, o: { module?: boolean } = {}): { calls: Array<{ name: string; line: number; col: number }> } {
  const calls: Array<{ name: string; line: number; col: number }> = [];
  let ast: acorn.Node;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: o.module ? 'module' : 'script', locations: true });
  } catch {
    return { calls };
  }
  const nameOf = (n: unknown): string | null => {
    const node = n as { type: string; name?: string; object?: unknown; property?: { name?: string; value?: unknown }; computed?: boolean };
    if (node.type === 'Identifier') return node.name ?? null;
    if (node.type === 'MemberExpression') {
      const obj = nameOf(node.object);
      const prop = node.computed ? null : node.property?.name;
      return obj && prop ? `${obj}.${prop}` : prop ?? null;
    }
    if (node.type === 'ThisExpression') return 'this';
    return null;
  };
  const visit = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(visit); return; }
    const node = n as { type?: string; callee?: unknown; loc?: { start: { line: number; column: number } } };
    if ((node.type === 'CallExpression' || node.type === 'NewExpression') && node.callee) {
      const name = nameOf(node.callee);
      if (name) calls.push({ name, line: node.loc?.start.line ?? 0, col: (node.loc?.start.column ?? 0) + 1 });
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end') continue;
      visit((node as Record<string, unknown>)[key]);
    }
  };
  visit(ast);
  return { calls };
}

export function checkCss(css: string, o: { declarationList?: boolean } = {}): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  csstree.parse(css, {
    context: o.declarationList ? 'declarationList' : 'stylesheet',
    positions: true,
    onParseError: (err: { message: string; line?: number; column?: number }) => {
      issues.push({ message: err.message, line: err.line ?? 1, col: err.column ?? 1 });
    },
  });
  // property/value validation against the CSS spec grammar (unknown properties etc.)
  try {
    const ast = csstree.parse(css, { context: o.declarationList ? 'declarationList' : 'stylesheet', positions: true });
    csstree.walk(ast, {
      visit: 'Declaration',
      enter(node: csstree.Declaration) {
        if (node.property.startsWith('--')) return;
        const match = csstree.lexer.matchProperty(node.property, node.value);
        const loc = node.loc?.start;
        if (match.error && /Unknown property/.test(match.error.message)) {
          issues.push({ message: `unknown property "${node.property}"`, line: loc?.line ?? 1, col: loc?.column ?? 1 });
        }
      },
    });
  } catch {
    /* parse errors were already reported */
  }
  return issues;
}
