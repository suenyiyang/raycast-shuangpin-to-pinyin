import { describe, expect, it } from "vitest";
import { ConversionError, convertShuangpin, encodeSyllable, getUnsupportedSyllables } from "../src/converter";
import { SCHEME_IDS, type SchemeId } from "../src/schemes";

describe("convertShuangpin", () => {
  it("converts the motivating Xiaohe example", () => {
    const result = convertShuangpin("syyiyh", "xiaohe");

    expect(result.pairs).toEqual(["sy", "yi", "yh"]);
    expect(result.candidates).toEqual([
      {
        output: "sunyiyang",
        syllables: ["sun", "yi", "yang"],
      },
    ]);
  });

  it.each<[SchemeId, string]>([
    ["xiaohe", "syyiyh"],
    ["apple-default", "snyiyh"],
    ["sogou", "spyiyh"],
    ["pinyin-jiajia", "szyiyg"],
    ["microsoft", "spyiyh"],
    ["common", "spyiyh"],
  ])("converts the same name with the %s layout", (scheme, code) => {
    expect(convertShuangpin(code, scheme).candidates[0]?.output).toBe("sunyiyang");
  });

  it("matches Apple's documented default-layout example", () => {
    expect(convertShuangpin("dwnk", "apple-default").candidates[0]?.output).toBe("diannao");
  });

  it("preserves whitespace, punctuation, and Chinese text", () => {
    expect(convertShuangpin("中文 sy yi-yh！", "xiaohe").candidates[0]?.output).toBe("中文 sun yi-yang！");
    expect(convertShuangpin("你好，syyiyh。", "xiaohe").candidates[0]?.output).toBe("你好，sunyiyang。");
  });

  it("supports semicolon keys in Microsoft and Sogou layouts", () => {
    expect(convertShuangpin("p;", "microsoft").candidates[0]?.output).toBe("ping");
    expect(convertShuangpin("p;", "sogou").candidates[0]?.output).toBe("ping");
  });

  it("returns every valid expansion when a layout code is ambiguous", () => {
    expect(convertShuangpin("nv", "apple-default").candidates.map((candidate) => candidate.output)).toEqual([
      "nv",
      "nve",
    ]);
  });

  it("uses the selected layout rather than assuming Xiaohe", () => {
    expect(convertShuangpin("sy", "pinyin-jiajia").candidates[0]?.output).toBe("song");
    expect(() => convertShuangpin("sy", "microsoft")).toThrow(ConversionError);
  });

  it("converts a trailing half-pair as an initial", () => {
    expect(convertShuangpin("v", "xiaohe").candidates[0]).toEqual({ output: "zh", syllables: ["zh"] });
    expect(convertShuangpin("syv", "xiaohe").candidates[0]?.output).toBe("sunzh");
    expect(convertShuangpin("v", "apple-default").candidates[0]?.output).toBe("sh");
  });

  it("preserves text containing no Shuangpin code", () => {
    expect(convertShuangpin("双拼！", "xiaohe").candidates).toEqual([{ output: "双拼！", syllables: [] }]);
  });

  it("reports the invalid pair and its position", () => {
    try {
      convertShuangpin("syqz", "xiaohe");
      expect.fail("expected conversion to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ConversionError);
      expect(error).toMatchObject({ code: "unknown-code", pair: "qz", pairIndex: 1 });
    }
  });
});

describe("layout definitions", () => {
  it.each(SCHEME_IDS)("encodes every supported Mandarin syllable for %s", (scheme) => {
    expect(getUnsupportedSyllables(scheme)).toEqual([]);
  });

  it("encodes umlaut syllables to the scheme-specific keys", () => {
    expect(encodeSyllable("ju", "xiaohe")).toBe("jv");
    expect(encodeSyllable("jue", "xiaohe")).toBe("jt");
    expect(encodeSyllable("nv", "apple-default")).toBe("nv");
    expect(encodeSyllable("nve", "apple-default")).toBe("nv");
  });
});
