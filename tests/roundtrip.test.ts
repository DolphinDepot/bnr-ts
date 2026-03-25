import { describe, it, expect } from "vitest";
import { encode, decode } from "../src/index.js";
import { BNR1_SIZE, BNR2_SIZE } from "../src/constants.js";
import type {
    BnrTextBlock,
    Bnr1EncodeInput,
    Bnr2EncodeInput,
} from "../src/types.js";

function makeText(prefix: string): BnrTextBlock {
    return {
        gameNameShort: `${prefix} Game`,
        developerNameShort: `${prefix} Dev`,
        gameTitle: `${prefix} Full Game Title`,
        developerName: `${prefix} Full Developer Name`,
        description: `${prefix} This is a test game description.`,
    };
}

function makeImage(): Uint8Array {
    const rgba = new Uint8Array(96 * 32 * 4);
    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 96; x++) {
            const idx = (y * 96 + x) * 4;
            rgba[idx] = (x * 2 + y * 3) & 0xff;
            rgba[idx + 1] = (x + y * 7) & 0xff;
            rgba[idx + 2] = (x * 5 + y) & 0xff;
            rgba[idx + 3] = 255; // fully opaque
        }
    }
    return rgba;
}

describe("BNR1 round-trip", () => {
    it("encode then decode preserves metadata", () => {
        const input: Bnr1EncodeInput = {
            type: "BNR1",
            image: makeImage(),
            text: makeText("Test"),
        };

        const binary = encode(input);
        expect(binary.length).toBe(BNR1_SIZE);

        const result = decode(binary);
        expect(result.type).toBe("BNR1");
        if (result.type !== "BNR1") throw new Error("unexpected type");

        expect(result.text.gameNameShort).toBe(input.text.gameNameShort);
        expect(result.text.developerNameShort).toBe(
            input.text.developerNameShort,
        );
        expect(result.text.gameTitle).toBe(input.text.gameTitle);
        expect(result.text.developerName).toBe(input.text.developerName);
        expect(result.text.description).toBe(input.text.description);
    });

    it("encode then decode preserves image (within quantization tolerance)", () => {
        const image = makeImage();
        const input: Bnr1EncodeInput = {
            type: "BNR1",
            image,
            text: makeText("Img"),
        };

        const binary = encode(input);
        const result = decode(binary);
        if (result.type !== "BNR1") throw new Error("unexpected type");

        // Check a sampling of pixels
        for (let i = 0; i < image.length; i += 4) {
            expect(Math.abs(result.image.pixels[i] - image[i])).toBeLessThan(9);
            expect(
                Math.abs(result.image.pixels[i + 1] - image[i + 1]),
            ).toBeLessThan(9);
            expect(
                Math.abs(result.image.pixels[i + 2] - image[i + 2]),
            ).toBeLessThan(9);
            expect(result.image.pixels[i + 3]).toBe(255);
        }
    });

    it("produces correct magic bytes", () => {
        const binary = encode({
            type: "BNR1",
            image: makeImage(),
            text: makeText(""),
        });
        // "BNR1" = 0x42 0x4E 0x52 0x31
        expect(binary[0]).toBe(0x42);
        expect(binary[1]).toBe(0x4e);
        expect(binary[2]).toBe(0x52);
        expect(binary[3]).toBe(0x31);
    });
});

describe("BNR2 round-trip", () => {
    it("encode then decode preserves all 6 language blocks", () => {
        const langs = ["EN", "DE", "FR", "ES", "IT", "NL"] as const;
        const texts = langs.map((l) => makeText(l)) as Bnr2EncodeInput["texts"];

        const input: Bnr2EncodeInput = {
            type: "BNR2",
            image: makeImage(),
            texts,
        };

        const binary = encode(input);
        expect(binary.length).toBe(BNR2_SIZE);

        const result = decode(binary);
        expect(result.type).toBe("BNR2");
        if (result.type !== "BNR2") throw new Error("unexpected type");

        for (let i = 0; i < 6; i++) {
            expect(result.texts[i].gameNameShort).toBe(texts[i].gameNameShort);
            expect(result.texts[i].developerNameShort).toBe(
                texts[i].developerNameShort,
            );
            expect(result.texts[i].gameTitle).toBe(texts[i].gameTitle);
            expect(result.texts[i].developerName).toBe(texts[i].developerName);
            expect(result.texts[i].description).toBe(texts[i].description);
        }
    });

    it("produces correct magic bytes", () => {
        const texts = Array.from({ length: 6 }, () =>
            makeText(""),
        ) as Bnr2EncodeInput["texts"];
        const binary = encode({
            type: "BNR2",
            image: makeImage(),
            texts,
        });
        // "BNR2" = 0x42 0x4E 0x52 0x32
        expect(binary[0]).toBe(0x42);
        expect(binary[1]).toBe(0x4e);
        expect(binary[2]).toBe(0x52);
        expect(binary[3]).toBe(0x32);
    });
});

describe("decode error handling", () => {
    it("rejects invalid magic bytes", () => {
        const bad = new Uint8Array(BNR1_SIZE);
        bad[0] = 0xff;
        expect(() => decode(bad)).toThrow("Invalid BNR magic");
    });

    it("rejects truncated BNR1 file", () => {
        const small = new Uint8Array(100);
        small[0] = 0x42;
        small[1] = 0x4e;
        small[2] = 0x52;
        small[3] = 0x31; // "BNR1"
        expect(() => decode(small)).toThrow("BNR1 file too small");
    });

    it("rejects truncated BNR2 file", () => {
        const small = new Uint8Array(BNR1_SIZE); // BNR1 size, but marked BNR2
        small[0] = 0x42;
        small[1] = 0x4e;
        small[2] = 0x52;
        small[3] = 0x32; // "BNR2"
        expect(() => decode(small)).toThrow("BNR2 file too small");
    });
});
