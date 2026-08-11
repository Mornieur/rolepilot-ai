import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('scheduled collection workflow timeout contract', () => {
  it('gives the 180-second route bounded client and job headroom and treats 409 as a skip', () => {
    const workflow = readFileSync(
      resolve(process.cwd(), '.github/workflows/scheduled-job-collection.yml'),
      'utf8',
    );
    expect(workflow).toMatch(/collect:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5/);
    expect(workflow).toContain('--connect-timeout 10 --max-time 210');
    expect(workflow).toContain(
      '409) echo "Collection already in progress; skipping this scheduled invocation."',
    );
  });
});
