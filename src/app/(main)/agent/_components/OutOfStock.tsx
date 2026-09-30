"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAgentOutOfStock,
  useRestockProduct,
} from "@/hooks/queries/useAgentDashboardQueries";
import { OutOfStockProduct } from "@/services/agentDashboardService";
import { useModalA11y } from "@/hooks/useModalA11y";

// Inline modal for the Restock action — collects the quantity + restock date the
// `POST /api/agents/products/{id}/restock` body needs.
const RestockModal = ({
  product,
  onClose,
}: {
  product: OutOfStockProduct;
  onClose: () => void;
}) => {
  const [quantity, setQuantity] = useState("");
  const [restockDate, setRestockDate] = useState("");
  const { mutate, isPending } = useRestockProduct();
  // Only mounted while open.
  const dialogRef = useRef<HTMLFormElement>(null);
  useModalA11y(true, dialogRef, { onEscape: onClose });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    mutate(
      {
        productId: product.id,
        payload: {
          quantity: qty,
          ...(restockDate ? { restockDate } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(`${product.name || "Product"} restocked.`);
          onClose();
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Restock failed."),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restock-modal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-[320px] bg-[#fefefe] rounded-[8px] p-5 flex flex-col gap-4"
      >
        <h3
          id="restock-modal-title"
          className="font-montserrat text-[#2b2b2b] text-[14px] font-medium"
        >
          Restock {product.name}
        </h3>
        <div className="flex flex-col gap-1.5">
          <label className="font-montserrat text-[#2b2b2b] text-[11px]">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border border-[#e2e2e2] rounded-[4px] px-3 py-2 text-[12px] font-montserrat outline-none focus:border-[#538e53]"
            placeholder="e.g. 50"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-montserrat text-[#2b2b2b] text-[11px]">
            Restock date
          </label>
          <input
            type="date"
            value={restockDate}
            onChange={(e) => setRestockDate(e.target.value)}
            className="border border-[#e2e2e2] rounded-[4px] px-3 py-2 text-[12px] font-montserrat outline-none focus:border-[#538e53]"
          />
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer font-montserrat text-[#808080] text-[12px] px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer font-montserrat text-[#fefefe] bg-[#538e53] text-[12px] px-4 py-1.5 rounded-[4px] disabled:opacity-60"
          >
            {isPending ? "Restocking…" : "Restock"}
          </button>
        </div>
      </form>
    </div>
  );
};

export const OutOfStock: React.FC = () => {
  const router = useRouter();
  const { data: products, isLoading, isError } = useAgentOutOfStock(7);
  const [active, setActive] = useState<OutOfStockProduct | null>(null);

  return (
    <div className="w-full lg:w-[39%] bg-[#fefefe] shadow-md rounded-[4px]">
      <h2 className="font-montserrat text-[#2b2b2b] text-[12px] p-2 rounded-tl-[6px] rounded-br-[6px] font-medium mb-4 bg-[#cce5cc] flex items-center justify-center w-[40%]">
        Out of Stock
      </h2>

      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-full flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-[5px]">
                <span className="h-[33px] w-[44px] rounded-md bg-[#ececec] animate-pulse" />
                <div className="flex flex-col gap-2">
                  <span className="block h-2.5 w-20 rounded bg-[#ececec] animate-pulse" />
                  <span className="block h-2.5 w-16 rounded bg-[#ececec] animate-pulse" />
                </div>
              </div>
              <span className="h-3 w-12 rounded bg-[#ececec] animate-pulse" />
            </div>
          ))
        ) : isError || !products?.length ? (
          <p className="px-4 py-6 text-center text-[11px] font-montserrat text-[#808080]">
            {isError ? "Couldn't load products." : "Nothing out of stock."}
          </p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="w-full flex items-center justify-between px-4"
            >
              <div className="flex items-center gap-[5px]">
                <Image
                  src={product.image || "/images/yellowPepper.png"}
                  alt={product.name}
                  width={44}
                  height={33}
                  className="rounded-md object-cover h-[33px] w-[44px]"
                />
                <div className="flex flex-col gap-2">
                  <span className="font-montserrat text-[#2b2b2b] text-[10px] font-normal">
                    {product.name}
                  </span>
                  <span className="font-montserrat text-[#2b2b2b] text-[10px] font-normal truncate">
                    {product.description}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActive(product)}
                className="cursor-pointer font-montserrat text-[#538e53] text-[12px] font-medium"
              >
                Restock
              </button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => router.push("/agent/produce-list")}
        className="cursor-pointer flex items-center justify-end ml-auto mr-4 text-[12px] font-montserrat mt-[1rem] text-[#538e53]"
      >
        See all
      </button>

      {active && (
        <RestockModal product={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
};
