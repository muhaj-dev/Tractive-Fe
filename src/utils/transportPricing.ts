import { TruckItem } from "./TruckData";

/**
 * What a fleet booking actually costs, and how to describe it.
 *
 * A **whole-truck** fleet (`wholeTruckOnly`, i.e. `pricingModel:
 * "flat_rate_whole_truck"`) is billed its flat price however much of it you fill. The
 * booking page used to quote `pricePerKg × weight` for these too, which understated the
 * price badly: verified 09 Aug 2026 on a ₦150 whole-truck fleet, a 50 kg load was quoted
 * **₦0.5** and the backend charged **₦150** — the buyer saw a figure 300× below what they
 * were billed. Scaled to a real ₦250,000 truck, a small load quotes as pocket change.
 *
 * Per-kg fleets are unchanged: weight × rate.
 */
export interface TransportCost {
  /** Naira amount the buyer will actually be charged. */
  amount: number;
  /** Whether this is a flat whole-truck charge rather than a per-kg one. */
  isWholeTruck: boolean;
  /** Short suffix for display, e.g. "(₦12/kg)" or "(whole truck)". */
  basisLabel: string;
}

export const isWholeTruckFleet = (item: Pick<TruckItem, "wholeTruckOnly" | "pricingModel">): boolean =>
  item.wholeTruckOnly === true || item.pricingModel === "flat_rate_whole_truck";

export const computeTransportCost = (
  item: Pick<TruckItem, "wholeTruckOnly" | "pricingModel" | "pricePerKg" | "totalPrice">,
  totalWeightKg: number,
): TransportCost => {
  if (isWholeTruckFleet(item)) {
    return {
      amount: item.totalPrice || 0,
      isWholeTruck: true,
      basisLabel: "(whole truck)",
    };
  }
  const pricePerKg = item.pricePerKg || 0;
  return {
    amount: totalWeightKg * pricePerKg,
    isWholeTruck: false,
    basisLabel: `(₦${pricePerKg}/kg)`,
  };
};
