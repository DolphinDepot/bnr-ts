import { readUint16BE, writeUint16BE } from "./binary.js";
import {
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    IMAGE_SIZE,
    TILE_WIDTH,
    TILE_HEIGHT,
    RGBA_SIZE,
} from "./constants.js";

const TILES_X = IMAGE_WIDTH / TILE_WIDTH;
const TILES_Y = IMAGE_HEIGHT / TILE_HEIGHT;

/**
 * Pixels with alpha >= 224 use the higher-quality RGB555 opaque mode.
 * Lower threshold (vs strict 255) avoids anti-aliased edges falling
 * into the lower-quality RGB4A3 mode unnecessarily.
 */
const ALPHA_OPAQUE_THRESHOLD = 224;

/**
 * Decode GX-tiled RGB5A3 image data to RGBA pixels.
 *
 * @param view DataView containing the full BNR file data
 * @param offset Byte offset where image data starts (typically 0x20)
 * @returns RGBA pixel array (96x32x4 = 12288 bytes)
 */
export function decodeImage(view: DataView, offset: number): Uint8Array {
    const rgba = new Uint8Array(RGBA_SIZE);
    let srcOffset = offset;

    for (let ty = 0; ty < TILES_Y; ty++) {
        for (let tx = 0; tx < TILES_X; tx++) {
            for (let py = 0; py < TILE_HEIGHT; py++) {
                for (let px = 0; px < TILE_WIDTH; px++) {
                    const pixel = readUint16BE(view, srcOffset);
                    srcOffset += 2;

                    const imgX = tx * TILE_WIDTH + px;
                    const imgY = ty * TILE_HEIGHT + py;
                    const dstIdx = (imgY * IMAGE_WIDTH + imgX) * 4;

                    if (pixel & 0x8000) {
                        // Opaque mode: 1 RRRRR GGGGG BBBBB (RGB555)
                        const r5 = (pixel >> 10) & 0x1f;
                        const g5 = (pixel >> 5) & 0x1f;
                        const b5 = pixel & 0x1f;
                        rgba[dstIdx] = (r5 << 3) | (r5 >> 2);
                        rgba[dstIdx + 1] = (g5 << 3) | (g5 >> 2);
                        rgba[dstIdx + 2] = (b5 << 3) | (b5 >> 2);
                        rgba[dstIdx + 3] = 255;
                    } else {
                        // Transparent mode: 0 AAA RRRR GGGG BBBB (RGB4A3)
                        const a3 = (pixel >> 12) & 0x07;
                        const r4 = (pixel >> 8) & 0x0f;
                        const g4 = (pixel >> 4) & 0x0f;
                        const b4 = pixel & 0x0f;
                        rgba[dstIdx] = (r4 << 4) | r4;
                        rgba[dstIdx + 1] = (g4 << 4) | g4;
                        rgba[dstIdx + 2] = (b4 << 4) | b4;
                        rgba[dstIdx + 3] = (a3 << 5) | (a3 << 2) | (a3 >> 1);
                    }
                }
            }
        }
    }

    return rgba;
}

/**
 * Encode RGBA pixels to GX-tiled RGB5A3 image data.
 *
 * @param rgba RGBA pixel array (must be exactly 12288 bytes)
 * @returns Encoded image data (6144 bytes)
 */
export function encodeImage(rgba: Uint8Array): Uint8Array {
    if (rgba.length !== RGBA_SIZE) {
        throw new Error(
            `Image pixel data must be exactly ${RGBA_SIZE} bytes, got ${rgba.length}`,
        );
    }

    const buf = new ArrayBuffer(IMAGE_SIZE);
    const view = new DataView(buf);
    let dstOffset = 0;

    for (let ty = 0; ty < TILES_Y; ty++) {
        for (let tx = 0; tx < TILES_X; tx++) {
            for (let py = 0; py < TILE_HEIGHT; py++) {
                for (let px = 0; px < TILE_WIDTH; px++) {
                    const imgX = tx * TILE_WIDTH + px;
                    const imgY = ty * TILE_HEIGHT + py;
                    const srcIdx = (imgY * IMAGE_WIDTH + imgX) * 4;

                    const r = rgba[srcIdx];
                    const g = rgba[srcIdx + 1];
                    const b = rgba[srcIdx + 2];
                    const a = rgba[srcIdx + 3];

                    let pixel: number;

                    if (a >= ALPHA_OPAQUE_THRESHOLD) {
                        // Opaque mode: 1 RRRRR GGGGG BBBBB
                        const r5 = r >> 3;
                        const g5 = g >> 3;
                        const b5 = b >> 3;
                        pixel = 0x8000 | (r5 << 10) | (g5 << 5) | b5;
                    } else {
                        // Transparent mode: 0 AAA RRRR GGGG BBBB
                        const a3 = a >> 5;
                        const r4 = r >> 4;
                        const g4 = g >> 4;
                        const b4 = b >> 4;
                        pixel = (a3 << 12) | (r4 << 8) | (g4 << 4) | b4;
                    }

                    writeUint16BE(view, dstOffset, pixel);
                    dstOffset += 2;
                }
            }
        }
    }

    return new Uint8Array(buf);
}
