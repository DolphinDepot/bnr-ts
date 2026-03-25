// TextDecoder with "shift_jis" is supported in browsers and Cloudflare Workers.
// In Node.js it requires ICU data, included by default since v18.
const shiftJISDecoder = new TextDecoder("shift_jis");

/**
 * Decode a Shift-JIS encoded byte sequence to a string.
 * Strips trailing null bytes before decoding.
 */
export function decodeShiftJIS(bytes: Uint8Array): string {
    let end = bytes.length;
    for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0) {
            end = i;
            break;
        }
    }
    return shiftJISDecoder.decode(bytes.subarray(0, end));
}

/**
 * Encode a string to Shift-JIS, padded or truncated to exactly `maxBytes`.
 * Truncation happens at character boundaries to avoid partial multi-byte sequences.
 */
export function encodeShiftJIS(str: string, maxBytes: number): Uint8Array {
    const result = new Uint8Array(maxBytes);
    let offset = 0;

    for (const char of str) {
        const cp = char.codePointAt(0)!;
        let b0: number;
        let b1 = -1;

        if (cp >= 0x20 && cp <= 0x7e) {
            b0 = cp;
        } else if (cp >= 0xff61 && cp <= 0xff9f) {
            // Half-width katakana (U+FF61-U+FF9F) maps to 0xA1-0xDF
            b0 = cp - 0xff61 + 0xa1;
        } else {
            const sjisCode = unicodeToShiftJIS(cp);
            if (sjisCode !== undefined) {
                if (sjisCode <= 0xff) {
                    b0 = sjisCode;
                } else {
                    b0 = sjisCode >> 8;
                    b1 = sjisCode & 0xff;
                }
            } else {
                b0 = 0x3f; // '?' for unmappable characters
            }
        }

        const needed = b1 === -1 ? 1 : 2;
        if (offset + needed > maxBytes) break;
        result[offset++] = b0;
        if (b1 !== -1) result[offset++] = b1;
    }

    return result;
}

/**
 * Look up the Shift-JIS code for a Unicode codepoint.
 * Uses a lazily-built reverse map from the forward decoding table.
 */
let reverseMap: Map<number, number> | undefined;

function unicodeToShiftJIS(codePoint: number): number | undefined {
    if (!reverseMap) {
        reverseMap = buildReverseMap();
    }
    return reverseMap.get(codePoint);
}

/**
 * Build a Unicode→Shift-JIS reverse lookup map by decoding every possible
 * Shift-JIS double-byte sequence using TextDecoder.
 *
 * Avoids bundling a large static table — generates the mapping at runtime
 * on first use (~30-50ms on modern hardware).
 */
function buildReverseMap(): Map<number, number> {
    const map = new Map<number, number>();
    const decoder = new TextDecoder("shift_jis", { fatal: true });
    const buf = new Uint8Array(2);

    // Shift-JIS lead bytes: 0x81-0x9F, 0xE0-0xEF
    const leadRanges = [
        [0x81, 0x9f],
        [0xe0, 0xef],
    ] as const;

    for (const [leadStart, leadEnd] of leadRanges) {
        for (let lead = leadStart; lead <= leadEnd; lead++) {
            buf[0] = lead;
            for (let trail = 0x40; trail <= 0xfc; trail++) {
                if (trail === 0x7f) continue;
                buf[1] = trail;

                try {
                    const str = decoder.decode(buf);
                    if (str.length === 1 && str !== "\uFFFD") {
                        const cp = str.codePointAt(0)!;
                        if (!map.has(cp)) {
                            map.set(cp, (lead << 8) | trail);
                        }
                    }
                } catch {
                    // Fatal decoder throws on invalid sequences
                }
            }
        }
    }

    return map;
}
