const VERSION = 1;
const TOTAL = 4096n;
const TOP = 1n << 32n;
const MID = 1n << 31n;
const QTR = 1n << 30n;
const MASK = TOP - 1n;

function buildCumulative(counts: number[]): bigint[] {
  const cum: bigint[] = [0n];
  let acc = 0;
  for (const c of counts) {
    acc += Math.max(1, c);
    cum.push(BigInt(acc));
  }
  const last = Number(cum[cum.length - 1]);
  if (last !== Number(TOTAL)) {
    const scale = Number(TOTAL) / last;
    for (let i = 0; i <= counts.length; i++) {
      cum[i] = BigInt(Math.round(Number(cum[i]) * scale));
    }
    cum[counts.length] = TOTAL;
  }
  for (let i = 1; i <= counts.length; i++) {
    if (cum[i] <= cum[i - 1]) cum[i] = cum[i - 1] + 1n;
  }
  cum[counts.length] = TOTAL;
  return cum;
}

function rangeEncode(symbols: number[], counts: number[]): Uint8Array {
  const cum = buildCumulative(counts);
  let low = 0n;
  let high = MASK;
  let pending = 0;
  const bits: number[] = [];
  const emit = (b: number) => {
    bits.push(b);
    while (pending > 0) {
      bits.push(1 - b);
      pending--;
    }
  };
  for (const s of symbols) {
    const range = high - low + 1n;
    high = low + (range * cum[s + 1]) / TOTAL - 1n;
    low = low + (range * cum[s]) / TOTAL;
    while (true) {
      if (high < MID) {
        emit(0);
      } else if (low >= MID) {
        emit(1);
        low -= MID;
        high -= MID;
      } else if (low >= QTR && high < 3n * QTR) {
        pending++;
        low -= QTR;
        high -= QTR;
      } else {
        break;
      }
      low = (low << 1n) & MASK;
      high = ((high << 1n) | 1n) & MASK;
    }
  }
  pending++;
  emit(low < QTR ? 0 : 1);
  const out = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) out[i >> 3] |= 1 << (7 - (i & 7));
  }
  return out;
}

function rangeDecode(
  buf: Uint8Array,
  counts: number[],
  n: number,
): number[] {
  const cum = buildCumulative(counts);
  let bitIdx = 0;
  const readBit = (): bigint => {
    const byteIdx = bitIdx >> 3;
    const bit = bitIdx & 7;
    bitIdx++;
    if (byteIdx >= buf.length) return 0n;
    return BigInt((buf[byteIdx] >> (7 - bit)) & 1);
  };
  let low = 0n;
  let high = MASK;
  let code = 0n;
  for (let i = 0; i < 32; i++) code = (code << 1n) | readBit();
  const syms: number[] = [];
  for (let k = 0; k < n; k++) {
    const range = high - low + 1n;
    const scaled = ((code - low + 1n) * TOTAL - 1n) / range;
    let s = 0;
    while (s < counts.length && cum[s + 1] <= scaled) s++;
    syms.push(s);
    high = low + (range * cum[s + 1]) / TOTAL - 1n;
    low = low + (range * cum[s]) / TOTAL;
    while (true) {
      if (high < MID) {
        // bit 0
      } else if (low >= MID) {
        low -= MID;
        high -= MID;
        code -= MID;
      } else if (low >= QTR && high < 3n * QTR) {
        low -= QTR;
        high -= QTR;
        code -= QTR;
      } else {
        break;
      }
      low = (low << 1n) & MASK;
      high = ((high << 1n) | 1n) & MASK;
      code = ((code << 1n) | readBit()) & MASK;
    }
  }
  return syms;
}

function toBase64Url(buf: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(buf).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 === 0 ? "" : "=".repeat(4 - (norm.length % 4));
  if (typeof atob !== "undefined") {
    const bin = atob(norm + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(norm + pad, "base64"));
}

export type ShareData = { name: string; quantities: number[] };

export function encodeShareCode(name: string, quantities: number[]): string {
  const nameBytes = new TextEncoder().encode(name);
  if (nameBytes.length === 0) throw new Error("Nome vazio");
  if (nameBytes.length > 255) throw new Error("Nome muito longo (máx. 255 bytes)");
  if (quantities.length === 0 || quantities.length > 0xffff) {
    throw new Error("Quantidade de figurinhas inválida");
  }
  const safeQty = quantities.map((q) => Math.max(0, Math.min(255, Math.floor(q))));
  const maxQ = Math.max(0, ...safeQty);
  const counts = new Array(maxQ + 1).fill(0);
  for (const q of safeQty) counts[q]++;
  const payload = rangeEncode(safeQty, counts);
  const headerLen = 1 + 2 + 1 + (maxQ + 1) * 2 + 1 + nameBytes.length;
  const buf = new Uint8Array(headerLen + payload.length);
  let off = 0;
  buf[off++] = VERSION;
  buf[off++] = (safeQty.length >> 8) & 0xff;
  buf[off++] = safeQty.length & 0xff;
  buf[off++] = maxQ;
  for (const c of counts) {
    buf[off++] = (c >> 8) & 0xff;
    buf[off++] = c & 0xff;
  }
  buf[off++] = nameBytes.length;
  buf.set(nameBytes, off);
  off += nameBytes.length;
  buf.set(payload, off);
  return toBase64Url(buf);
}

export function decodeShareCode(code: string): ShareData {
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Código vazio");
  const buf = fromBase64Url(trimmed);
  if (buf.length < 6) throw new Error("Código muito curto");
  let off = 0;
  const version = buf[off++];
  if (version !== VERSION) {
    throw new Error(`Versão ${version} não suportada (esperado ${VERSION})`);
  }
  const n = (buf[off++] << 8) | buf[off++];
  const maxQ = buf[off++];
  if (buf.length < off + (maxQ + 1) * 2 + 1) throw new Error("Cabeçalho incompleto");
  const counts: number[] = [];
  for (let i = 0; i <= maxQ; i++) {
    counts.push((buf[off++] << 8) | buf[off++]);
  }
  const total = counts.reduce((s, c) => s + c, 0);
  if (total !== n) throw new Error("Distribuição inconsistente");
  const nameLen = buf[off++];
  if (buf.length < off + nameLen) throw new Error("Nome incompleto");
  const name = new TextDecoder().decode(buf.subarray(off, off + nameLen));
  off += nameLen;
  const payload = buf.subarray(off);
  const quantities = rangeDecode(payload, counts, n);
  return { name, quantities };
}
