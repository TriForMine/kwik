// CREDIT TO: https://stackoverflow.com/a/47475081
export function uuid4() {
  function hex(s: string, b: number) {
    return s +
      (b >>> 4).toString(16) +
      (b & 0b1111).toString(16);
  }

  let r = crypto.getRandomValues(new Uint8Array(16));

  r[6] = r[6] >>> 4 | 0b01000000;
  r[8] = r[8] >>> 3 | 0b10000000;

  return r.slice(0, 4).reduce(hex, "") +
    r.slice(4, 6).reduce(hex, "-") +
    r.slice(6, 8).reduce(hex, "-") +
    r.slice(8, 10).reduce(hex, "-") +
    r.slice(10, 16).reduce(hex, "-");
}
