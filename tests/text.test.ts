import { describe, it, expect } from "vitest";
import { encodeShiftJIS, decodeShiftJIS } from "../src/text.js";

describe("Shift-JIS text encode/decode", () => {
    it("round-trips ASCII strings", () => {
        const text = "Hello World";
        const encoded = encodeShiftJIS(text, 32);
        expect(encoded.length).toBe(32);
        expect(decodeShiftJIS(encoded)).toBe(text);
    });

    it("null-pads short strings", () => {
        const encoded = encodeShiftJIS("Hi", 8);
        expect(encoded.length).toBe(8);
        expect(encoded[0]).toBe(0x48); // 'H'
        expect(encoded[1]).toBe(0x69); // 'i'
        for (let i = 2; i < 8; i++) {
            expect(encoded[i]).toBe(0); // null padding
        }
    });

    it("truncates strings that exceed max bytes", () => {
        const long = "A".repeat(100);
        const encoded = encodeShiftJIS(long, 32);
        expect(encoded.length).toBe(32);
        expect(decodeShiftJIS(encoded)).toBe("A".repeat(32));
    });

    it("handles empty string", () => {
        const encoded = encodeShiftJIS("", 16);
        expect(encoded.length).toBe(16);
        expect(encoded.every((b) => b === 0)).toBe(true);
        expect(decodeShiftJIS(encoded)).toBe("");
    });

    it("decodes bytes with trailing nulls", () => {
        const bytes = new Uint8Array([0x41, 0x42, 0x43, 0x00, 0x00]);
        expect(decodeShiftJIS(bytes)).toBe("ABC");
    });

    it("round-trips Japanese characters", () => {
        // "ゲーム" (Game in katakana)
        const text = "\u30B2\u30FC\u30E0";
        const encoded = encodeShiftJIS(text, 32);
        const decoded = decodeShiftJIS(encoded);
        expect(decoded).toBe(text);
    });

    it("truncates at character boundary for multi-byte chars", () => {
        // Each katakana character is 2 bytes in Shift-JIS
        // With maxBytes=5, we can fit 2 characters (4 bytes) but not 3 (6 bytes)
        const text = "\u30A2\u30A4\u30A6"; // アイウ
        const encoded = encodeShiftJIS(text, 5);
        expect(encoded.length).toBe(5);
        // Should have exactly 2 characters (4 bytes) + 1 null byte
        const decoded = decodeShiftJIS(encoded);
        expect(decoded).toBe("\u30A2\u30A4");
    });
});
