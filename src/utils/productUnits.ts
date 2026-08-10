/**
 * The units products are actually listed in.
 *
 * Taken from live data on 08 Aug 2026 (`GET /api/products`, 22 products):
 * `kg` ×13, `bags` ×6, `100kg_bag` ×2, `packet` ×1. The Add-to-store form used
 * to offer only `kg` and `tonne` — three of the four real values could not be
 * picked at all, and `tonne` is used by no product in the database.
 *
 * **The create endpoint disagrees with its own data.** Verified 08 Aug 2026:
 *
 * ```
 * POST /api/products  { unit: "bags" }
 *   -> 400 {"error":"Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"}
 * ```
 *
 * So `bags` and `packet` — 7 of the 22 products in the database, 32% — cannot be
 * created through the API that serves them, while `50kg_bag` and `tonne` are
 * accepted and used by no product at all.
 *
 * Until the backend accepts the vocabulary it stores (backend issue 11), the
 * picker must only offer units that can actually be saved: offering "Bag" and
 * watching every submission 400 is worse than not offering it. `acceptedByCreateApi`
 * records the distinction rather than deleting the knowledge — flip `bags` and
 * `packet` to `true` once the backend is fixed and they return to the dropdown.
 */
export interface ProductUnitOption {
  /** Value stored on the product — must match what the backend already holds. */
  value: string;
  label: string;
  /**
   * Kilograms in one unit, where it is fixed by definition. `null` means the
   * agent has to state it, because a "bag" is not a fixed weight.
   */
  fixedWeightKg: number | null;
  /**
   * Whether `POST /api/products` will accept this value. `false` means the unit
   * exists in live data but the create validator rejects it.
   */
  acceptedByCreateApi: boolean;
}

export const PRODUCT_UNITS: ProductUnitOption[] = [
  { value: "kg", label: "Kilogram (kg)", fixedWeightKg: 1, acceptedByCreateApi: true },
  { value: "bags", label: "Bag", fixedWeightKg: null, acceptedByCreateApi: false },
  { value: "50kg_bag", label: "50kg bag", fixedWeightKg: 50, acceptedByCreateApi: true },
  { value: "100kg_bag", label: "100kg bag", fixedWeightKg: 100, acceptedByCreateApi: true },
  { value: "packet", label: "Packet", fixedWeightKg: null, acceptedByCreateApi: false },
  { value: "tonne", label: "Tonne", fixedWeightKg: 1000, acceptedByCreateApi: true },
];

/**
 * The units the Add-to-store picker may offer — every one of these can actually
 * be saved. `PRODUCT_UNITS` remains the full vocabulary, so a legacy `bags` or
 * `packet` product still resolves its label and unit weight via
 * `getProductUnit`.
 */
export const CREATABLE_PRODUCT_UNITS: ProductUnitOption[] = PRODUCT_UNITS.filter(
  (u) => u.acceptedByCreateApi,
);

export const getProductUnit = (value: string): ProductUnitOption | undefined =>
  PRODUCT_UNITS.find((u) => u.value === value);

/**
 * Transport pricing multiplies `unitWeightKg × quantity`, and falls back to
 * treating the quantity itself as kilograms when the weight is missing — so a
 * product listed as "50 bags" with no unit weight is shipped as if it were
 * 50 kg. Anything whose weight is not fixed by its name must state it.
 */
export const requiresUnitWeight = (value: string): boolean => {
  const unit = getProductUnit(value);
  return !!unit && unit.fixedWeightKg === null;
};
