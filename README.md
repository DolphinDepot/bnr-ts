# @dolphindepot/bnr

Encode and decode Nintendo GameCube BNR1/BNR2 (`opening.bnr`) files.

- Zero dependencies
- Works in browsers, Node.js, and Cloudflare Workers
- Full support for BNR1 (US/JP) and BNR2 (PAL/Europe, 6 languages)
- RGB5A3 pixel format with GX 4x4 tile encoding
- Shift-JIS text encoding/decoding

## Install

```bash
npm install @dolphindepot/bnr
```

## Usage

### Decode

```typescript
import { decode } from "@dolphindepot/bnr";

const bnr = decode(arrayBuffer);

if (bnr.type === "BNR1") {
    console.log(bnr.text.gameTitle);
} else {
    // BNR2 — 6 language blocks
    console.log(bnr.texts[0].gameTitle); // English
}

// bnr.image.pixels is RGBA data (96x32, 12288 bytes)
// Ready to draw on a <canvas> via ImageData
```

### Encode

```typescript
import { encode } from "@dolphindepot/bnr";

const binary = encode({
    type: "BNR1",
    image: rgbaPixels, // Uint8Array, 96x32x4 = 12288 bytes
    text: {
        gameNameShort: "My Game",
        developerNameShort: "Dev",
        gameTitle: "My Game - Full Title",
        developerName: "Developer Name",
        description: "A homebrew GameCube game.",
    },
});

// binary is a Uint8Array — save as opening.bnr
```

### BNR2 (multi-language)

```typescript
import { encode, BnrLanguage } from "@dolphindepot/bnr";

const texts = [
    { gameNameShort: "My Game", ... },    // English
    { gameNameShort: "Mein Spiel", ... }, // German
    { gameNameShort: "Mon Jeu", ... },    // French
    { gameNameShort: "Mi Juego", ... },   // Spanish
    { gameNameShort: "Il Mio Gioco", ... }, // Italian
    { gameNameShort: "Mijn Spel", ... },  // Dutch
];

const binary = encode({ type: "BNR2", image: rgbaPixels, texts });
```

## Image format

The library works with raw RGBA pixel data (`Uint8Array` of 12288 bytes for a 96x32 image). To convert from PNG/JPEG:

**Browser (Canvas API):**

```typescript
const img = new Image();
img.src = URL.createObjectURL(file);
await img.decode();

const canvas = new OffscreenCanvas(96, 32);
const ctx = canvas.getContext("2d")!;
ctx.drawImage(img, 0, 0, 96, 32);
const rgba = new Uint8Array(ctx.getImageData(0, 0, 96, 32).data);
```

## BNR format reference

| | BNR1 (US/JP) | BNR2 (PAL/Europe) |
|---|---|---|
| File size | 6496 bytes | 8096 bytes |
| Image | 96x32 px, RGB5A3 | 96x32 px, RGB5A3 |
| Languages | 1 | 6 (EN, DE, FR, ES, IT, NL) |
| Text encoding | Shift-JIS | Shift-JIS |

## License

MIT
