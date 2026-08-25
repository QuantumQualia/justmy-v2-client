/**
 * Address helpers: parse free-text (single or multiline) into street / city / state / ZIP,
 * format for storage, and compare for duplicates.
 */

export interface AddressInputFields {
  title?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface AddressDisplayFields {
  title?: string;
  address: string;
  latitude?: string;
  longitude?: string;
}

export type ParsedPostalAddress = {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  formatted: string;
};

const US_STATE_BY_TOKEN: Record<string, string> = {
  al: "AL",
  alabama: "AL",
  ak: "AK",
  alaska: "AK",
  az: "AZ",
  arizona: "AZ",
  ar: "AR",
  arkansas: "AR",
  ca: "CA",
  california: "CA",
  co: "CO",
  colorado: "CO",
  ct: "CT",
  connecticut: "CT",
  de: "DE",
  delaware: "DE",
  dc: "DC",
  fl: "FL",
  florida: "FL",
  ga: "GA",
  georgia: "GA",
  hi: "HI",
  hawaii: "HI",
  id: "ID",
  idaho: "ID",
  il: "IL",
  illinois: "IL",
  in: "IN",
  indiana: "IN",
  ia: "IA",
  iowa: "IA",
  ks: "KS",
  kansas: "KS",
  ky: "KY",
  kentucky: "KY",
  la: "LA",
  louisiana: "LA",
  me: "ME",
  maine: "ME",
  md: "MD",
  maryland: "MD",
  ma: "MA",
  massachusetts: "MA",
  mi: "MI",
  michigan: "MI",
  mn: "MN",
  minnesota: "MN",
  ms: "MS",
  mississippi: "MS",
  mo: "MO",
  missouri: "MO",
  mt: "MT",
  montana: "MT",
  ne: "NE",
  nebraska: "NE",
  nv: "NV",
  nevada: "NV",
  nh: "NH",
  "new hampshire": "NH",
  nj: "NJ",
  "new jersey": "NJ",
  nm: "NM",
  "new mexico": "NM",
  ny: "NY",
  "new york": "NY",
  nc: "NC",
  "north carolina": "NC",
  nd: "ND",
  "north dakota": "ND",
  oh: "OH",
  ohio: "OH",
  ok: "OK",
  oklahoma: "OK",
  or: "OR",
  oregon: "OR",
  pa: "PA",
  pennsylvania: "PA",
  ri: "RI",
  "rhode island": "RI",
  sc: "SC",
  "south carolina": "SC",
  sd: "SD",
  "south dakota": "SD",
  tn: "TN",
  tennessee: "TN",
  tx: "TX",
  texas: "TX",
  ut: "UT",
  utah: "UT",
  vt: "VT",
  vermont: "VT",
  va: "VA",
  virginia: "VA",
  wa: "WA",
  washington: "WA",
  wv: "WV",
  "west virginia": "WV",
  wi: "WI",
  wisconsin: "WI",
  wy: "WY",
  wyoming: "WY",
};

const ZIP_RE = /\b(\d{5}(?:-\d{4})?)\b/;
const STREET_HINT = /\d{1,6}\s+.+/i;
const STREET_START = /\b\d{1,6}\s+[A-Za-z0-9]/;
const STREET_SUFFIX =
  /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pkwy|hwy|suite|ste|unit)\.?\b/i;
const UNIT_HINT = /^(apt|apartment|suite|ste|unit|#|bldg|building|floor|fl)\b/i;
const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const US_PHONE_IN_TEXT = /(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/;
const HOURS_IN_TEXT =
  /\b(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s*[-–—to]+\s*(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?))?\b|\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i;

function stateFromToken(token: string): string | undefined {
  const trimmed = token.trim().replace(/\./g, "");
  if (!trimmed) return undefined;
  return US_STATE_BY_TOKEN[trimmed.toLowerCase()];
}

export function formatPostalAddress(parts: {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const cityStateZip = [parts.city, [parts.state, parts.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [parts.line1, parts.line2, cityStateZip].filter(Boolean).join(", ");
}

function tokensFromRaw(raw: string): string[] {
  return raw
    .replace(/\r/g, "")
    .split(/\n+/)
    .flatMap((line) => line.split(","))
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Best-effort US/Canada-style parse of a pasted address. */
export function parsePostalAddress(raw: string): ParsedPostalAddress | null {
  const text = (raw || "").replace(/\r/g, "").trim();
  if (!text || text.length < 8) return null;

  const tokens = tokensFromRaw(text);
  if (!tokens.length) return null;

  let zip: string | undefined;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const current = tokens[i];
    if (!current) continue;
    const match = current.match(ZIP_RE);
    if (!match) continue;
    zip = match[1];
    const stripped = current.replace(ZIP_RE, "").replace(/\s+/g, " ").trim();
    if (!stripped) tokens.splice(i, 1);
    else tokens[i] = stripped;
    break;
  }

  let state: string | undefined;
  let stateIndex = -1;
  let cityInStateToken = false;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (!token) continue;
    const direct = stateFromToken(token);
    if (direct) {
      state = direct;
      stateIndex = i;
      tokens.splice(i, 1);
      break;
    }
    const words = token.split(/\s+/);
    if (words.length >= 2) {
      const last = stateFromToken(words[words.length - 1] || "");
      if (last) {
        state = last;
        tokens[i] = words.slice(0, -1).join(" ");
        stateIndex = i;
        cityInStateToken = true;
        break;
      }
    }
  }

  let city: string | undefined;
  if (cityInStateToken && stateIndex >= 0) {
    city = tokens[stateIndex];
    tokens.splice(stateIndex, 1);
  } else if (stateIndex > 0) {
    city = tokens[stateIndex - 1];
    tokens.splice(stateIndex - 1, 1);
  } else if (tokens.length >= 2 && zip) {
    city = tokens[tokens.length - 1];
    tokens.pop();
  }

  const streetTokens = tokens.filter(Boolean);
  if (!streetTokens.length) return null;
  const streetIndex = streetTokens.findIndex(
    (token) => STREET_START.test(token) && (STREET_SUFFIX.test(token) || streetTokens.length === 1),
  );
  const usableStreet = streetIndex >= 0 ? streetTokens.slice(streetIndex) : streetTokens;
  const line1 = usableStreet[0] || "";
  const rest = usableStreet.slice(1).filter((token) => isUnitLine(token));
  const line2 = rest.join(", ") || undefined;
  if (line1.length < 5) return null;
  if (!STREET_HINT.test(line1) && !zip && !state) return null;

  return {
    line1,
    line2,
    city,
    state,
    zip,
    formatted: formatPostalAddress({ line1, line2, city, state, zip }),
  };
}

export function isAddressNoiseLine(value: string): boolean {
  const text = (value || "").replace(/\s+/g, " ").trim();
  if (!text) return true;
  if (
    /^(hours?|open(?:ing)?|closed|follow us|copyright|privacy|terms|email|phone|tel|fax)\b/i.test(text) &&
    !STREET_SUFFIX.test(text)
  ) {
    return true;
  }
  if (EMAIL_IN_TEXT.test(text) && !STREET_SUFFIX.test(text)) return true;
  const withoutPhone = text
    .replace(/(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/g, "")
    .replace(/[\s().+-]/g, "");
  if (!withoutPhone) return true;
  if (HOURS_IN_TEXT.test(text) && !STREET_HINT.test(text) && !ZIP_RE.test(text)) return true;
  return false;
}

export function sanitizeAddressCandidate(raw: string): string {
  const kept = (raw || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !isAddressNoiseLine(line));
  let text = kept
    .join(", ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ")
    .replace(/(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/g, " ")
    .replace(
      /\b(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)(?:\s*[-–—to]+\s*(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?))?\b/gi,
      " ",
    )
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi, " ")
    .replace(/[|•·]+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,(?:\s*,)+/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^,+|,+$/g, "")
    .trim();
  const streetIdx = text.search(STREET_START);
  if (streetIdx > 0) text = text.slice(streetIdx);
  const zipMatches = [...text.matchAll(/\b\d{5}(?:-\d{4})?\b/g)];
  const lastZip = zipMatches[zipMatches.length - 1];
  if (lastZip?.index != null) {
    text = text.slice(0, lastZip.index + lastZip[0].length);
  }
  return text.replace(/[,\s]+$/g, "").trim();
}

function isUsableParsedAddress(parsed: ParsedPostalAddress | null): parsed is ParsedPostalAddress {
  if (!parsed) return false;
  if (!STREET_START.test(parsed.line1)) return false;
  if (!STREET_SUFFIX.test(parsed.line1)) return false;
  if (EMAIL_IN_TEXT.test(parsed.formatted)) return false;
  if (US_PHONE_IN_TEXT.test(parsed.formatted)) return false;
  if (HOURS_IN_TEXT.test(parsed.formatted)) return false;
  return Boolean(parsed.city || parsed.zip);
}

/** Strip contact-block noise and return a clean US postal address, or null. */
export function normalizePostalAddress(raw: string): string | null {
  const cleaned = sanitizeAddressCandidate(raw);
  if (!cleaned || cleaned.length < 8) return null;
  const parsed = parsePostalAddress(cleaned);
  if (!isUsableParsedAddress(parsed)) return null;
  return parsed.formatted;
}

export function looksLikeAddress(raw: string): boolean {
  const text = (raw || "").trim();
  if (text.length < 8 || text.length > 280) return false;
  if (normalizePostalAddress(text)) return true;
  if (isAddressNoiseLine(text)) return false;
  if (STREET_HINT.test(text) && STREET_SUFFIX.test(text)) return true;
  const parsed = parsePostalAddress(text);
  return Boolean(parsed?.line1 && STREET_SUFFIX.test(parsed.line1));
}

export function addressIdentityKey(raw: string): string {
  const parsed =
    parsePostalAddress(sanitizeAddressCandidate(raw) || raw) || parsePostalAddress(raw);
  const source = parsed ? `${parsed.line1} ${parsed.zip || ""}` : raw;
  return source.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function addressesMatch(a?: string | null, b?: string | null): boolean {
  const left = (a || "").replace(/\s+/g, " ").trim().toLowerCase();
  const right = (b || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  const keyA = addressIdentityKey(a || "");
  const keyB = addressIdentityKey(b || "");
  return Boolean(keyA && keyB && keyA === keyB);
}

/** Combine editor fields into one stored address string. */
export function combineAddressFields(fields: AddressInputFields): string {
  return formatPostalAddress({
    line1: fields.address.trim(),
    city: fields.city?.trim() || undefined,
    state: fields.state?.trim() || undefined,
    zip: fields.zipCode?.trim() || undefined,
  });
}

/** Split a stored address string back into editor fields. */
export function extractAddressFields(addressString: string): AddressInputFields {
  if (!addressString?.trim()) return { address: "" };
  const parsed = parsePostalAddress(addressString);
  if (!parsed) return { address: addressString.trim() };
  return {
    address: [parsed.line1, parsed.line2].filter(Boolean).join(", "),
    city: parsed.city,
    state: parsed.state,
    zipCode: parsed.zip,
  };
}

export function formatAddressForDisplay(address: AddressDisplayFields): string {
  const parts: string[] = [];
  if (address.title) parts.push(address.title);
  if (address.address) parts.push(address.address);
  return parts.join(" - ");
}

export function isUnitLine(value: string): boolean {
  return UNIT_HINT.test(value.trim());
}
