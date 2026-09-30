/**
 * The units products are actually listed in.
 *
 * The API used to reject two of the values it stored: `POST /api/products`
 * answered `400 "Unit must be one of kg, tonne, 50kg_bag, or 100kg_bag"` for
 * `bags` and `packet`, which between them covered 7 of the 22 live products, so
 * those products could not be listed or edited through the API that served
 * them. Re-verified 18 Aug 2026 — both are now accepted (`201`), an unknown
 * value is still rejected, and the stored data has been migrated to
 * `kg` / `50kg_bag` / `100kg_bag`.
 *
 * Re-tested 03 Sep 2026, and "accepted" turns out not to mean "stored". The
 * server keeps exactly four units — its 400 for `crate` names them: `kg`,
 * `tonne`, `50kg_bag`, `100kg_bag` — and anything else is silently aliased onto
 * one of them, on both POST and PUT:
 *
 *     bags -> 50kg_bag      packet -> kg
 *     bag  -> 50kg_bag      ton    -> tonne
 *
 * So the 400 message is not stale text after all; it is the real vocabulary.
 *
 * As of 07 Sep 2026 `bags` and `packet` are no longer offered when creating a
 * product. Offering them meant an agent picked "Bag", the product was stored as
 * `50kg_bag`, and transport then billed 50 kg per bag against a label the agent
 * never chose — a silent 50× error on a "1 kg packet", and a 2× one wherever a
 * bag was meant to be 25 kg. That is item 22 in docs/API-FIXES-REQUIRED.md and
 * is still the backend's to fix; until it is, the picker simply does not offer a
 * value the server will rewrite. Both stay in `PRODUCT_UNITS` because products
 * created before this change still carry them and must still resolve a label.
 */

/** Every unit that can appear on a product, including the two legacy values. */
export type ProductUnitValue =
  | "kg"
  | "bags"
  | "50kg_bag"
  | "100kg_bag"
  | "packet"
  | "tonne";

/**
 * The units the API actually stores, and so the only ones a new product may be
 * created or updated with. Anything outside this set is either rewritten
 * silently (`bags`, `packet`, `bag`, `ton`) or rejected outright (`crate`).
 */
export type CreatableProductUnit = "kg" | "50kg_bag" | "100kg_bag" | "tonne";

export interface ProductUnitOption {
  /** Value stored on the product — must match what the backend already holds. */
  value: ProductUnitValue;
  label: string;
  /**
   * Kilograms in one unit, where it is fixed by definition. `null` means the
   * agent has to state it, because a "bag" is not a fixed weight.
   */
  fixedWeightKg: number | null;
  /**
   * Whether the value survives `POST`/`PUT /api/products` unchanged. `false`
   * means the call succeeds but the server stores a different unit, so the
   * picker must not offer it.
   */
  storedByApi: boolean;
}

export const PRODUCT_UNITS: ProductUnitOption[] = [
  { value: "kg", label: "Kilogram (kg)", fixedWeightKg: 1, storedByApi: true },
  { value: "bags", label: "Bag", fixedWeightKg: null, storedByApi: false },
  { value: "50kg_bag", label: "50kg bag", fixedWeightKg: 50, storedByApi: true },
  { value: "100kg_bag", label: "100kg bag", fixedWeightKg: 100, storedByApi: true },
  { value: "packet", label: "Packet", fixedWeightKg: null, storedByApi: false },
  { value: "tonne", label: "Tonne", fixedWeightKg: 1000, storedByApi: true },
];

/**
 * The units the Add-to-store picker may offer — every one of these round-trips
 * unchanged. `PRODUCT_UNITS` remains the full vocabulary, so a legacy `bags` or
 * `packet` product still resolves its label and unit weight via
 * `getProductUnit`.
 */
export const CREATABLE_PRODUCT_UNITS: ProductUnitOption[] = PRODUCT_UNITS.filter(
  (u) => u.storedByApi,
);

export const getProductUnit = (value: string): ProductUnitOption | undefined =>
  PRODUCT_UNITS.find((u) => u.value === value);

/**
 * Narrows a picker value before it is sent. The `<select>` hands back a bare
 * string, so this is the one place the four-value contract is enforced at
 * runtime rather than only in the type system.
 */
export const isCreatableProductUnit = (
  value: string,
): value is CreatableProductUnit =>
  CREATABLE_PRODUCT_UNITS.some((u) => u.value === value);

/**
 * The unit as it should read directly after a quantity — "50 100kg bags", not
 * the raw "50 100kg_bag" the API stores. Order lines keep the unit they were
 * placed with, so legacy values still turn up here and must still resolve.
 * An unrecognised value is returned as-is, with its underscores softened,
 * rather than dropped: a wrong-looking unit is better than a missing one.
 *
 * Pass the quantity when there is one, so a single unit reads "1 100kg bag"
 * rather than "1 100kg bags". Without it the plural is used, which is what a
 * label such as "Quantity (100kg bags)" wants.
 */
const UNIT_AFTER_QUANTITY: Record<string, { one: string; many: string }> = {
  kg: { one: "kg", many: "kg" },
  bags: { one: "bag", many: "bags" },
  "50kg_bag": { one: "50kg bag", many: "50kg bags" },
  "100kg_bag": { one: "100kg bag", many: "100kg bags" },
  packet: { one: "packet", many: "packets" },
  tonne: { one: "tonne", many: "tonnes" },
};

export const formatUnitAfterQuantity = (
  value?: string | null,
  quantity?: number | string | null,
): string => {
  if (!value) return "";
  const forms = UNIT_AFTER_QUANTITY[value];
  if (!forms) return value.replace(/_/g, " ");
  return Number(quantity) === 1 ? forms.one : forms.many;
};

/** "12 100kg bags", "1 tonne" — the quantity followed by its readable unit. */
export const formatQuantityWithUnit = (
  quantity: number | string | null | undefined,
  unit?: string | null,
): string => {
  if (quantity === undefined || quantity === null || quantity === "") return "—";
  const readable = formatUnitAfterQuantity(unit, quantity);
  return readable ? `${quantity} ${readable}` : `${quantity}`;
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
