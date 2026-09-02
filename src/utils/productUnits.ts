/**
 * The units products are actually listed in.
 *
 * The API used to reject two of the values it stored: `POST /api/products`
 * answered `400 "Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"` for
 * `bags` and `packet`, which between them covered 7 of the 22 live products, so
 * those products could not be listed or edited through the API that served
 * them. Re-verified 18 Aug 2026 — both are now accepted (`201`), an unknown
 * value is still rejected, and the stored data has been migrated to
 * `kg` / `50kg_bag` / `100kg_bag`. Every unit below can be saved, so
 * `acceptedByCreateApi` is `true` throughout; the flag stays because the create
 * validator, not this file, decides the vocabulary, and it has changed before.
 *
 * Note the 400 message still names the old four values. It is stale text, not a
 * live constraint.
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
  { value: "bags", label: "Bag", fixedWeightKg: null, acceptedByCreateApi: true },
  { value: "50kg_bag", label: "50kg bag", fixedWeightKg: 50, acceptedByCreateApi: true },
  { value: "100kg_bag", label: "100kg bag", fixedWeightKg: 100, acceptedByCreateApi: true },
  { value: "packet", label: "Packet", fixedWeightKg: null, acceptedByCreateApi: true },
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
 * The unit as it should read directly after a quantity — "50 100kg bags", not
 * the raw "50 100kg_bag" the API stores. Order lines keep the unit they were
 * placed with, so legacy values still turn up here and must still resolve.
 * An unrecognised value is returned as-is, with its underscores softened,
 * rather than dropped: a wrong-looking unit is better than a missing one.
 */
const UNIT_AFTER_QUANTITY: Record<string, string> = {
  kg: "kg",
  bags: "bags",
  "50kg_bag": "50kg bags",
  "100kg_bag": "100kg bags",
  packet: "packets",
  tonne: "tonnes",
};

export const formatUnitAfterQuantity = (value?: string | null): string => {
  if (!value) return "";
  return UNIT_AFTER_QUANTITY[value] ?? value.replace(/_/g, " ");
};

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
