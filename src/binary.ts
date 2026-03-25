export function readUint32BE(view: DataView, offset: number): number {
    return view.getUint32(offset, false);
}

export function writeUint32BE(
    view: DataView,
    offset: number,
    value: number,
): void {
    view.setUint32(offset, value, false);
}

export function readUint16BE(view: DataView, offset: number): number {
    return view.getUint16(offset, false);
}

export function writeUint16BE(
    view: DataView,
    offset: number,
    value: number,
): void {
    view.setUint16(offset, value, false);
}

/** Slice bytes from a DataView's underlying buffer, accounting for byteOffset. */
export function readBytes(
    view: DataView,
    offset: number,
    length: number,
): Uint8Array {
    return new Uint8Array(view.buffer, view.byteOffset + offset, length);
}

/** Write bytes into a DataView's underlying buffer, accounting for byteOffset. */
export function writeBytes(
    view: DataView,
    offset: number,
    data: Uint8Array,
): void {
    new Uint8Array(view.buffer, view.byteOffset + offset, data.length).set(
        data,
    );
}
