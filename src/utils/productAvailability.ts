/**
 * What a buyer should be told about whether a product can be bought.
 *
 * The product's own `status` (`available` | `out_of_stock` | `discontinued` in
 * the OpenAPI Product schema; some legacy rows still say `active`) is the
 * authority, so an explicit out-of-stock or discontinued status always wins.
 * A product still marked available with a quantity of 0 has nothing left to
 * sell, so it reads as out of stock too rather than "Available".
 */
export type ProductAvailability = "Available" | "Out of stock" | "Discontinued";

export const getProductAvailability = (product: {
  status?: string | null;
  quantity?: number | string | null;
}): ProductAvailability => {
  const status = (product.status || "").toLowerCase();
  if (status === "discontinued") return "Discontinued";
  if (status === "out_of_stock") return "Out of stock";

  const quantity = Number(product.quantity);
  if (
    product.quantity !== undefined &&
    product.quantity !== null &&
    product.quantity !== "" &&
    Number.isFinite(quantity) &&
    quantity <= 0
  ) {
    return "Out of stock";
  }
  return "Available";
};
