import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = join(process.cwd(), 'src');
const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [path] : [];
  });

describe('hydration source safeguards', () => {
  it('does not include the extension-like attribute or a blanket hydration suppression', () => {
    const extensionAttribute = ['fdprocessed', 'id'].join('');
    const suppression = ['suppress', 'HydrationWarning'].join('');

    for (const file of sourceFiles(sourceRoot)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain(extensionAttribute);
      expect(source).not.toContain(suppression);
    }
  });
});
