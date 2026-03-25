import { readUint32BE, readBytes } from "./binary.js";
import {
    MAGIC_BNR1,
    MAGIC_BNR2,
    IMAGE_OFFSET,
    TEXT_OFFSET,
    TEXT_BLOCK_SIZE,
    BNR1_SIZE,
    BNR2_SIZE,
    BNR2_LANGUAGE_COUNT,
    TEXT_FIELDS,
} from "./constants.js";
import { decodeImage } from "./image.js";
import { decodeShiftJIS } from "./text.js";
import type { Bnr, Bnr1, Bnr2, BnrTextBlock } from "./types.js";

function decodeTextBlock(view: DataView, offset: number): BnrTextBlock {
    const result = {} as BnrTextBlock;
    let pos = offset;
    for (const { key, size } of TEXT_FIELDS) {
        result[key] = decodeShiftJIS(readBytes(view, pos, size));
        pos += size;
    }
    return result;
}

/**
 * Decode a BNR1 or BNR2 binary file.
 * Auto-detects format from the magic bytes.
 */
export function decode(data: ArrayBuffer | Uint8Array): Bnr {
    const buffer =
        data instanceof Uint8Array
            ? data.buffer.slice(
                  data.byteOffset,
                  data.byteOffset + data.byteLength,
              )
            : data;
    const view = new DataView(buffer);

    const magic = readUint32BE(view, 0);

    if (magic === MAGIC_BNR1) {
        if (buffer.byteLength < BNR1_SIZE) {
            throw new Error(
                `BNR1 file too small: expected at least ${BNR1_SIZE} bytes, got ${buffer.byteLength}`,
            );
        }

        return {
            type: "BNR1",
            image: {
                pixels: decodeImage(view, IMAGE_OFFSET),
                width: 96,
                height: 32,
            },
            text: decodeTextBlock(view, TEXT_OFFSET),
        } satisfies Bnr1;
    }

    if (magic === MAGIC_BNR2) {
        if (buffer.byteLength < BNR2_SIZE) {
            throw new Error(
                `BNR2 file too small: expected at least ${BNR2_SIZE} bytes, got ${buffer.byteLength}`,
            );
        }

        const texts = Array.from({ length: BNR2_LANGUAGE_COUNT }, (_, i) =>
            decodeTextBlock(view, TEXT_OFFSET + i * TEXT_BLOCK_SIZE),
        ) as [
            BnrTextBlock,
            BnrTextBlock,
            BnrTextBlock,
            BnrTextBlock,
            BnrTextBlock,
            BnrTextBlock,
        ];

        return {
            type: "BNR2",
            image: {
                pixels: decodeImage(view, IMAGE_OFFSET),
                width: 96,
                height: 32,
            },
            texts,
        } satisfies Bnr2;
    }

    const magicHex = magic.toString(16).padStart(8, "0");
    throw new Error(
        `Invalid BNR magic: 0x${magicHex} (expected "BNR1" or "BNR2")`,
    );
}
