/**
 * Display formatters for dashboard numbers.
 *
 * Confirmed from the live admin dashboard responses: amounts come back as whole
 * Naira (e.g. totalSpent 13500 = ₦13,500, not kobo), so the symbol is ₦. This is
 * the single place to change it if the backend ever switches units.
 */
export const CURRENCY_SYMBOL = "₦";

/**
 * ₦ with thousands separators: 1250000 → "₦1,250,000". Pass `decimals` where a
 * screen shows a fixed number of places, e.g. 999999 → "₦999,999.00" with
 * `{ decimals: 2 }`. Presentation only — the value itself is never rounded
 * before it is sent anywhere.
 */
export const formatCurrency = (
  value: number | null | undefined,
  options?: { decimals?: number },
): string => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const decimals = options?.decimals;
  return `${CURRENCY_SYMBOL}${n.toLocaleString(
    "en-US",
    decimals === undefined
      ? undefined
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
  )}`;
};

/** Compact money for tight spots like chart axes: ₦210M, ₦4.5K, ₦0. */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const compact = (v: number, unit: string) =>
    `${(v % 1 === 0 ? v.toFixed(0) : v.toFixed(1))}${unit}`;
  let body: string;
  if (abs >= 1e9) body = compact(abs / 1e9, "B");
  else if (abs >= 1e6) body = compact(abs / 1e6, "M");
  else if (abs >= 1e3) body = compact(abs / 1e3, "K");
  else body = String(abs);
  return `${sign}${CURRENCY_SYMBOL}${body}`;
};

export const formatNumber = (value: number | null | undefined): string => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return n.toLocaleString();
};

/** "+25%" / "-4%" with sign, from a raw percent number (25 → "+25%"). */
export const formatDelta = (value: number | null | undefined): string => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}%`;
};
