import { describe, expect, it } from "vitest";

import { greenhouseHtmlToText, shortenPreview } from "./description";

describe("Greenhouse description normalization", () => {
  it("converts HTML, entities, and excessive whitespace into readable text", () => {
    expect(greenhouseHtmlToText("<p>Hello &amp; welcome</p><p>Second&nbsp;paragraph<br>line two</p>")).toBe("Hello & welcome\n\nSecond paragraph\nline two");
  });

  it("handles missing content and limits a UI preview", () => {
    expect(greenhouseHtmlToText(null)).toBeNull();
    expect(shortenPreview("123456", 4)).toBe("1234…");
  });
});
