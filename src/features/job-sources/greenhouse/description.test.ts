import { describe, expect, it } from 'vitest';

import { greenhouseHtmlToText, shortenPreview } from './description';

describe('Greenhouse description normalization', () => {
  it('converts HTML, entities, and excessive whitespace into readable text', () => {
    expect(
      greenhouseHtmlToText('<p>Hello &amp; welcome</p><p>Second&nbsp;paragraph<br>line two</p>'),
    ).toBe('Hello & welcome\n\nSecond paragraph\nline two');
  });

  it('normalizes nested tags, lists, malformed markup, and plain text without rendering tags', () => {
    expect(
      greenhouseHtmlToText(
        '<div><h2>Title</h2><p>First <strong>paragraph</strong></p><ul><li>One</li><li>Two &amp; three</li></ul></div>',
      ),
    ).toBe('Title\n\nFirst paragraph\n\nOne\n\nTwo & three');
    expect(greenhouseHtmlToText('<div>Incomplete <p>content')).toBe('Incomplete\ncontent');
    expect(greenhouseHtmlToText('Plain&nbsp;text &amp; details')).toBe('Plain text & details');
  });

  it('handles missing content and limits a UI preview', () => {
    expect(greenhouseHtmlToText(null)).toBeNull();
    expect(shortenPreview('123456', 4)).toBe('1234…');
  });
});
