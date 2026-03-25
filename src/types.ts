/** Language slots in BNR2, in order. */
export enum BnrLanguage {
    English = 0,
    German = 1,
    French = 2,
    Spanish = 3,
    Italian = 4,
    Dutch = 5,
}

/** A single language's text metadata block. */
export interface BnrTextBlock {
    /** Short game name (max 32 bytes Shift-JIS). */
    gameNameShort: string;
    /** Short developer/company name (max 32 bytes Shift-JIS). */
    developerNameShort: string;
    /** Full game title (max 64 bytes Shift-JIS). */
    gameTitle: string;
    /** Full developer/company name (max 64 bytes Shift-JIS). */
    developerName: string;
    /** Game description (max 128 bytes Shift-JIS). */
    description: string;
}

/** Banner image: 96x32 RGBA pixels. */
export interface BnrImage {
    /** Raw RGBA pixel data, 4 bytes per pixel, row-major. Length = 12288. */
    readonly pixels: Uint8Array;
    readonly width: 96;
    readonly height: 32;
}

/** Decoded BNR1 file (US/JP). */
export interface Bnr1 {
    readonly type: "BNR1";
    readonly image: BnrImage;
    readonly text: BnrTextBlock;
}

/** Decoded BNR2 file (PAL/Europe, 6 languages). */
export interface Bnr2 {
    readonly type: "BNR2";
    readonly image: BnrImage;
    readonly texts: readonly [
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
    ];
}

/** A decoded BNR file (either BNR1 or BNR2). */
export type Bnr = Bnr1 | Bnr2;

/** Input for encoding a BNR1 file. */
export interface Bnr1EncodeInput {
    type: "BNR1";
    /** RGBA pixel data, must be exactly 12288 bytes (96 * 32 * 4). */
    image: Uint8Array;
    text: BnrTextBlock;
}

/** Input for encoding a BNR2 file. */
export interface Bnr2EncodeInput {
    type: "BNR2";
    /** RGBA pixel data, must be exactly 12288 bytes (96 * 32 * 4). */
    image: Uint8Array;
    texts: [
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
        BnrTextBlock,
    ];
}

/** Input for encoding a BNR file. */
export type BnrEncodeInput = Bnr1EncodeInput | Bnr2EncodeInput;
