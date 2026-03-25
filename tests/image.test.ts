import { describe, it, expect } from "vitest";
import { encodeImage, decodeImage } from "../src/image.js";
import { IMAGE_SIZE } from "../src/constants.js";

describe("image encode/decode", () => {
    it("round-trips a fully opaque image", () => {
        const rgba = new Uint8Array(96 * 32 * 4);

        // Fill with a known pattern: red gradient
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 96; x++) {
                const idx = (y * 96 + x) * 4;
                rgba[idx] = x * 2; // R: 0-190
                rgba[idx + 1] = y * 8; // G: 0-248
                rgba[idx + 2] = 128; // B: constant
                rgba[idx + 3] = 255; // A: fully opaque
            }
        }

        const encoded = encodeImage(rgba);
        expect(encoded.length).toBe(IMAGE_SIZE);

        const view = new DataView(encoded.buffer);
        const decoded = decodeImage(view, 0);
        expect(decoded.length).toBe(96 * 32 * 4);

        // Check that values are close (5-bit quantization loses up to 7 per channel)
        for (let i = 0; i < rgba.length; i += 4) {
            expect(Math.abs(decoded[i] - rgba[i])).toBeLessThan(9);
            expect(Math.abs(decoded[i + 1] - rgba[i + 1])).toBeLessThan(9);
            expect(Math.abs(decoded[i + 2] - rgba[i + 2])).toBeLessThan(9);
            expect(decoded[i + 3]).toBe(255); // A preserved exactly
        }
    });

    it("round-trips semi-transparent pixels", () => {
        const rgba = new Uint8Array(96 * 32 * 4);

        // Set a few pixels with varying alpha
        const testPixels = [
            { x: 0, y: 0, r: 255, g: 0, b: 0, a: 128 },
            { x: 1, y: 0, r: 0, g: 255, b: 0, a: 64 },
            { x: 2, y: 0, r: 0, g: 0, b: 255, a: 0 },
        ];

        for (const p of testPixels) {
            const idx = (p.y * 96 + p.x) * 4;
            rgba[idx] = p.r;
            rgba[idx + 1] = p.g;
            rgba[idx + 2] = p.b;
            rgba[idx + 3] = p.a;
        }

        const encoded = encodeImage(rgba);
        const view = new DataView(encoded.buffer);
        const decoded = decodeImage(view, 0);

        for (const p of testPixels) {
            const idx = (p.y * 96 + p.x) * 4;
            // RGB4A3 has 4-bit RGB and 3-bit alpha, so precision is lower
            expect(Math.abs(decoded[idx] - p.r)).toBeLessThan(20);
            expect(Math.abs(decoded[idx + 1] - p.g)).toBeLessThan(20);
            expect(Math.abs(decoded[idx + 2] - p.b)).toBeLessThan(20);
            expect(Math.abs(decoded[idx + 3] - p.a)).toBeLessThan(40);
        }
    });

    it("encodes with correct tile ordering", () => {
        const rgba = new Uint8Array(96 * 32 * 4);
        // All black, full alpha
        for (let i = 3; i < rgba.length; i += 4) {
            rgba[i] = 255;
        }

        // Set pixel (0,0) to bright red
        rgba[0] = 248; // R (will quantize to 31 << 3 = 248)
        rgba[1] = 0;
        rgba[2] = 0;
        rgba[3] = 255;

        // Set pixel (4,0) to bright green — this is in the second tile
        const idx2 = 4 * 4; // x=4
        rgba[idx2] = 0;
        rgba[idx2 + 1] = 248;
        rgba[idx2 + 2] = 0;
        rgba[idx2 + 3] = 255;

        const encoded = encodeImage(rgba);
        const view = new DataView(encoded.buffer);

        // First pixel of first tile should be red: 0x8000 | (31 << 10) = 0xFC00
        expect(view.getUint16(0, false)).toBe(0xfc00);

        // First pixel of second tile starts at byte offset 32 (one 4x4 tile = 32 bytes)
        // Green: 0x8000 | (31 << 5) = 0x83E0
        expect(view.getUint16(32, false)).toBe(0x83e0);
    });

    it("rejects wrong-sized input", () => {
        expect(() => encodeImage(new Uint8Array(100))).toThrow(
            "Image pixel data must be exactly 12288 bytes",
        );
    });
});
