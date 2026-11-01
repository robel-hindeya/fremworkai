export function money(n: number, decimals?: number): string {
  const d = decimals ?? (Math.abs(n) % 1 ? 2 : 0);
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (n < 0 ? "−$" : "$") + s;
}

export function signedMoney(n: number): string {
  return (n > 0 ? "+" : "") + money(n);
}

export function kfmt(n: number): string {
  const a = Math.abs(n);
  const s = a >= 1e6 ? (a / 1e6).toFixed(2) + "M" : a >= 1e3 ? Math.round(a / 1e3) + "k" : String(Math.round(a));
  return (n < 0 ? "−$" : "$") + s;
}

export function pct(a: number, b: number): number {
  return ((a - b) / Math.abs(b)) * 100;
}

export function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fileSize(bytes: number): string {
  return bytes > 1e6 ? (bytes / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1e3)) + " KB";
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Demo "today" so the sample data always lines up. */
export const TODAY = "2026-10-31";

export const MAX_FILE_BYTES = 25e6;
export const MAX_FILES = 10;
export const ACCEPTED = /\.(pdf|xlsx|xls|csv|png|jpe?g|webp)$/i;

export function checkFiles(list: File[], already: number) {
  const ok: { name: string; ext: string; size: string }[] = [];
  const errors: string[] = [];
  for (const f of list) {
    if (!ACCEPTED.test(f.name)) errors.push(`${f.name} isn’t a supported file. Upload a PDF, spreadsheet (XLSX, CSV) or image.`);
    else if (f.size > MAX_FILE_BYTES) errors.push(`${f.name} is ${fileSize(f.size)}. Files can be up to 25 MB.`);
    else if (f.size === 0) errors.push(`${f.name} is empty. Check the file and try again.`);
    else ok.push({ name: f.name, ext: (f.name.split(".").pop() || "").toUpperCase(), size: fileSize(f.size) });
  }
  const room = MAX_FILES - already;
  if (ok.length > room) {
    errors.push(`You can attach up to ${MAX_FILES} files to one message. ${ok.length - Math.max(0, room)} weren’t added.`);
    ok.length = Math.max(0, room);
  }
  return { ok, errors };
}
