import { writeUint32BE, writeBytes } from "./binary.js";
import {
    MAGIC_BNR1,
    MAGIC_BNR2,
    IMAGE_OFFSET,
    TEXT_OFFSET,
    TEXT_BLOCK_SIZE,
    BNR1_SIZE,
    BNR2_SIZE,
    BNR2_LANGUAGE_COUNT,
    RGBA_SIZE,
    TEXT_FIELDS,
} from "./constants.js";
import { encodeImage } from "./image.js";
import { encodeShiftJIS } from "./text.js";
import type { BnrEncodeInput, BnrTextBlock } from "./types.js";

function writeTextBlock(
    view: DataView,
    offset: number,
    text: BnrTextBlock,
): void {
    let pos = offset;
    for (const { key, size } of TEXT_FIELDS) {
        writeBytes(view, pos, encodeShiftJIS(text[key], size));
        pos += size;
    }
}

/**
 * Encode a BNR1 or BNR2 file from structured input.
 */
export function encode(input: BnrEncodeInput): Uint8Array {
    if (input.image.length !== RGBA_SIZE) {
        throw new Error(
            `Image pixel data must be exactly ${RGBA_SIZE} bytes (96x32 RGBA), got ${input.image.length}`,
        );
    }

    const totalSize = input.type === "BNR1" ? BNR1_SIZE : BNR2_SIZE;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    const magic = input.type === "BNR1" ? MAGIC_BNR1 : MAGIC_BNR2;
    writeUint32BE(view, 0, magic);

    writeBytes(view, IMAGE_OFFSET, encodeImage(input.image));

    if (input.type === "BNR1") {
        writeTextBlock(view, TEXT_OFFSET, input.text);
    } else {
        for (let i = 0; i < BNR2_LANGUAGE_COUNT; i++) {
            writeTextBlock(
                view,
                TEXT_OFFSET + i * TEXT_BLOCK_SIZE,
                input.texts[i],
            );
        }
    }

    return new Uint8Array(buffer);
}
