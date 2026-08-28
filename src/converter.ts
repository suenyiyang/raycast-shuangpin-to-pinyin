import { SCHEMES, type SchemeDefinition, type SchemeId } from "./schemes";
import { PINYIN_SYLLABLES } from "./syllables";

const MAX_CANDIDATES = 64;
const CODE_RUN = /[a-zA-Z;]+/g;

export type ConversionErrorCode = "empty" | "invalid-characters" | "unknown-code" | "too-ambiguous";

export class ConversionError extends Error {
  constructor(
    readonly code: ConversionErrorCode,
    message: string,
    readonly pair?: string,
    readonly pairIndex?: number,
  ) {
    super(message);
    this.name = "ConversionError";
  }
}

export interface ConversionCandidate {
  output: string;
  syllables: string[];
}

export interface ConversionResult {
  source: string;
  normalizedCode: string;
  pairs: string[];
  candidates: ConversionCandidate[];
}

function splitInitial(syllable: string): { initial: string; final: string } | undefined {
  for (const initial of ["zh", "ch", "sh"]) {
    if (syllable.startsWith(initial)) {
      return { initial, final: syllable.slice(initial.length) };
    }
  }

  const initial = syllable[0];
  if (initial && "bpmfdtnlgkhjqxrzcsyw".includes(initial)) {
    return { initial, final: syllable.slice(1) };
  }

  return undefined;
}

function normalizeFinal(initial: string, final: string): string {
  if ((initial === "n" || initial === "l") && final === "v") {
    return "ü";
  }
  if ((initial === "n" || initial === "l") && final === "ve") {
    return "üe";
  }
  if (["j", "q", "x", "y"].includes(initial) && final === "u") {
    return "ü";
  }
  return final;
}

function encodeZeroInitial(syllable: string, scheme: SchemeDefinition): string | undefined {
  if (scheme.zeroInitialMode === "xiaohe-style") {
    if (syllable.length === 2) {
      return syllable;
    }
    const finalKey = scheme.finals[syllable];
    return finalKey ? `${syllable[0]}${finalKey}` : undefined;
  }

  const finalKey = scheme.finals[syllable];
  if (!finalKey) {
    return undefined;
  }

  if (scheme.zeroInitialMode === "o-prefix") {
    return `o${finalKey}`;
  }

  return `${syllable[0]}${finalKey}`;
}

export function encodeSyllable(syllable: string, schemeId: SchemeId): string | undefined {
  const normalized = syllable.toLowerCase().replaceAll("ü", "v");
  const scheme = SCHEMES[schemeId];
  const split = splitInitial(normalized);

  if (!split) {
    return encodeZeroInitial(normalized, scheme);
  }

  const initialKey = scheme.initials[split.initial];
  const finalKey = scheme.finals[normalizeFinal(split.initial, split.final)];
  if (!initialKey || !finalKey) {
    return undefined;
  }

  return `${initialKey}${finalKey}`;
}

const reverseMapCache = new Map<SchemeId, ReadonlyMap<string, readonly string[]>>();

export function getReverseMap(schemeId: SchemeId): ReadonlyMap<string, readonly string[]> {
  const cached = reverseMapCache.get(schemeId);
  if (cached) {
    return cached;
  }

  const mutable = new Map<string, string[]>();
  for (const syllable of PINYIN_SYLLABLES) {
    const code = encodeSyllable(syllable, schemeId);
    if (!code) {
      continue;
    }
    const existing = mutable.get(code) ?? [];
    if (!existing.includes(syllable)) {
      existing.push(syllable);
    }
    mutable.set(code, existing);
  }

  const result = new Map<string, readonly string[]>(mutable);
  reverseMapCache.set(schemeId, result);
  return result;
}

export function getUnsupportedSyllables(schemeId: SchemeId): string[] {
  return PINYIN_SYLLABLES.filter((syllable) => !encodeSyllable(syllable, schemeId));
}

interface ConversionPartOption {
  output: string;
  syllables: string[];
}

function getPartialOptions(key: string, scheme: SchemeDefinition): ConversionPartOption[] {
  const initials = Object.entries(scheme.initials)
    .filter(([, initialKey]) => initialKey === key)
    .map(([initial]) => initial);

  if (initials.length === 0) {
    return [{ output: key, syllables: [] }];
  }

  return initials.map((initial) => ({ output: initial, syllables: [initial] }));
}

function combineCandidates(
  optionsByPart: readonly (readonly ConversionPartOption[])[],
): ConversionCandidate[] {
  let combinations: ConversionCandidate[] = [{ output: "", syllables: [] }];

  for (const options of optionsByPart) {
    const next: ConversionCandidate[] = [];
    for (const combination of combinations) {
      for (const option of options) {
        next.push({
          output: `${combination.output}${option.output}`,
          syllables: [...combination.syllables, ...option.syllables],
        });
        if (next.length > MAX_CANDIDATES) {
          throw new ConversionError("too-ambiguous", `转换结果超过 ${MAX_CANDIDATES} 个，请缩短选中的编码`);
        }
      }
    }
    combinations = next;
  }

  return combinations;
}

export function convertShuangpin(source: string, schemeId: SchemeId): ConversionResult {
  if (!source.trim()) {
    throw new ConversionError("empty", "没有可转换的文本");
  }

  const scheme = SCHEMES[schemeId];
  const reverseMap = getReverseMap(schemeId);
  const pairs: string[] = [];
  const normalizedRuns: string[] = [];
  const optionsByPart: ConversionPartOption[][] = [];
  let sourceIndex = 0;

  for (const match of source.matchAll(CODE_RUN)) {
    const matchIndex = match.index;
    if (matchIndex > sourceIndex) {
      optionsByPart.push([{ output: source.slice(sourceIndex, matchIndex), syllables: [] }]);
    }

    const code = match[0].toLowerCase();
    normalizedRuns.push(code);

    for (let codeIndex = 0; codeIndex < code.length; codeIndex += 2) {
      const pair = code.slice(codeIndex, codeIndex + 2);
      const pairIndex = pairs.length;
      pairs.push(pair);

      if (pair.length === 1) {
        optionsByPart.push(getPartialOptions(pair, scheme));
        continue;
      }

      const options = reverseMap.get(pair);
      if (!options || options.length === 0) {
        throw new ConversionError(
          "unknown-code",
          `“${pair}”不是${scheme.title}中的有效完整音节`,
          pair,
          pairIndex,
        );
      }
      optionsByPart.push(options.map((syllable) => ({ output: syllable, syllables: [syllable] })));
    }

    sourceIndex = matchIndex + match[0].length;
  }

  if (sourceIndex < source.length) {
    optionsByPart.push([{ output: source.slice(sourceIndex), syllables: [] }]);
  }

  return {
    source,
    normalizedCode: normalizedRuns.join(""),
    pairs,
    candidates: combineCandidates(optionsByPart),
  };
}
