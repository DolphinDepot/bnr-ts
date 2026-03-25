/** "BNR1" as a 32-bit big-endian value. */
export const MAGIC_BNR1 = 0x424e5231;

/** "BNR2" as a 32-bit big-endian value. */
export const MAGIC_BNR2 = 0x424e5232;

/** Byte offset where image data begins (immediately after the 32-byte header). */
export const IMAGE_OFFSET = 0x20;

/** Size of the encoded image data in bytes. */
export const IMAGE_SIZE = 0x1800;

/** Banner image width in pixels. */
export const IMAGE_WIDTH = 96;

/** Banner image height in pixels. */
export const IMAGE_HEIGHT = 32;

/** GX tile width in pixels. */
export const TILE_WIDTH = 4;

/** GX tile height in pixels. */
export const TILE_HEIGHT = 4;

/** Byte offset where the first text block begins. */
export const TEXT_OFFSET = 0x1820;

/** Size of one text metadata block in bytes. */
export const TEXT_BLOCK_SIZE = 0x140;

/** Number of language slots in BNR2. */
export const BNR2_LANGUAGE_COUNT = 6;

/** Total file size of a BNR1 file. */
export const BNR1_SIZE = 0x1960;

/** Total file size of a BNR2 file. */
export const BNR2_SIZE = 0x1fa0;

/** RGBA pixel data size for the banner image (96 * 32 * 4). */
export const RGBA_SIZE = IMAGE_WIDTH * IMAGE_HEIGHT * 4;

/** Field sizes within a text block. */
export const FIELD_GAME_NAME_SHORT = 0x20;
export const FIELD_DEV_NAME_SHORT = 0x20;
export const FIELD_GAME_TITLE = 0x40;
export const FIELD_DEV_NAME = 0x40;
export const FIELD_DESCRIPTION = 0x80;

/** Ordered field layout for a text block — single source of truth for encode/decode. */
export const TEXT_FIELDS: ReadonlyArray<{
    key:
        | "gameNameShort"
        | "developerNameShort"
        | "gameTitle"
        | "developerName"
        | "description";
    size: number;
}> = [
    { key: "gameNameShort", size: FIELD_GAME_NAME_SHORT },
    { key: "developerNameShort", size: FIELD_DEV_NAME_SHORT },
    { key: "gameTitle", size: FIELD_GAME_TITLE },
    { key: "developerName", size: FIELD_DEV_NAME },
    { key: "description", size: FIELD_DESCRIPTION },
];
