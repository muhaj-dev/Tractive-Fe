"use client";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "@/icons/Icon1";
import { StarIcon, YellowStarIcon } from "@/icons/Icons";
import { useCreateReview } from "@/hooks/queries/useReviewQueries";
import type { RevieweeType } from "@/services/reviewService";

const MAX_COMMENT_LENGTH = 500;

interface Props {
  /** User being reviewed. The caller must not render this without a real id. */
  agentId: string;
  agentName?: string;
  /**
   * What `agentId` refers to — drives the dialog copy only. A user has a single
   * rating shared across their agent/seller/transporter profiles, so the request
   * body is the same whichever surface this is rendered on.
   */
  revieweeType?: RevieweeType;
  /** Label on the opener — the seller/transporter pages want their own wording. */
  buttonLabel?: string;
  /** Opener styling. `inline` suits a profile header, `block` a card footer. */
  variant?: "block" | "inline";
}

/**
 * Lets a buyer rate an agent, seller or transporter. Rendered on delivered
 * orders (next to "Confirm receipt"), on the seller store header and on the
 * transporter profile header.
 */
export const LeaveReviewButton: React.FC<Props> = ({
  agentId,
  agentName,
  revieweeType = "agent",
  buttonLabel = "Leave a review",
  variant = "block",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  // Set when the backend answers 409 `hasReviewed` — the buyer already rated
  // this agent, so the button collapses to a reviewed state instead of
  // re-offering a form that can only fail.
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const createReview = useCreateReview();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const titleId = `leave-review-title-${agentId}`;

  const close = () => {
    if (createReview.isPending) return;
    setIsOpen(false);
  };

  const open = () => {
    setRating(0);
    setComment("");
    setIsOpen(true);
  };

  // Escape closes, Tab cycles inside the dialog (focus trap).
  useEffect(() => {
    if (!isOpen) return;
    const node = dialogRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea, [href], input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, createReview.isPending]);

  // Move focus into the dialog on open, and back to the opener on close.
  useEffect(() => {
    if (isOpen) {
      dialogRef.current
        ?.querySelector<HTMLElement>('[data-autofocus="true"]')
        ?.focus();
    } else {
      openerRef.current?.focus();
    }
  }, [isOpen]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const canSubmit =
    rating > 0 && comment.trim().length > 0 && !createReview.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createReview.mutate(
      { agentId, rating, comment: comment.trim() },
      {
        onSuccess: () => {
          setIsOpen(false);
          setSubmitted(true);
          setRating(0);
          setComment("");
        },
        onError: (error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (status !== 409) return;
          setIsOpen(false);
          setAlreadyReviewed(true);
          setRating(0);
          setComment("");
        },
      },
    );
  };

  // Left/Right arrows move between stars, matching the radiogroup pattern.
  const handleStarKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setRating(Math.min(5, value + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setRating(Math.max(1, value - 1));
    }
  };

  if (submitted || alreadyReviewed) {
    return (
      <div className="bg-[#eaf3ea] rounded-[10px] p-3 text-center font-montserrat text-[12px] font-medium text-[#538e53]">
        {submitted
          ? "Thanks for your review!"
          : `You have already reviewed ${agentName || `this ${revieweeType}`}.`}
      </div>
    );
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={open}
        className={
          variant === "inline"
            ? "border border-[#538e53] text-[#538e53] rounded-md px-3 py-1.5 font-montserrat text-[12px] font-medium hover:bg-[#eaf3ea] transition-colors cursor-pointer"
            : "w-full border border-[#538e53] text-[#538e53] rounded-[10px] py-2.5 font-montserrat text-[13px] font-medium hover:bg-[#eaf3ea] transition-colors cursor-pointer"
        }
      >
        {buttonLabel}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="leave-review-modal"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close review form"
              onClick={close}
              className="absolute inset-0 bg-black/50 cursor-pointer"
            />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full sm:w-[90%] sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-[#fefefe] rounded-t-2xl sm:rounded-[10px] p-4 flex flex-col gap-3 shadow-[0px_4px_20px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between">
                <h2
                  id={titleId}
                  className="font-montserrat font-medium text-[14px] text-[#2b2b2b]"
                >
                  Rate {agentName || `the ${revieweeType}`}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#f1f1f1]"
                >
                  <XIcon />
                </button>
              </div>

              <div
                role="radiogroup"
                aria-label="Rating out of 5 stars"
                className="flex items-center gap-2"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                    data-autofocus={value === 1 ? "true" : undefined}
                    tabIndex={rating === value || (rating === 0 && value === 1) ? 0 : -1}
                    onClick={() => setRating(value)}
                    onKeyDown={(e) => handleStarKeyDown(e, value)}
                    className="cursor-pointer rounded-[3px] p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#538e53]"
                  >
                    {value <= rating ? <YellowStarIcon /> : <StarIcon />}
                  </button>
                ))}
                <span className="font-montserrat font-normal text-[11px] text-[#808080] ml-1">
                  {rating > 0 ? `${rating}/5` : "Select a rating"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="review-comment"
                  className="font-montserrat font-normal text-[11px] text-[#808080]"
                >
                  Your review
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder="Tell other buyers how this order went…"
                  rows={4}
                  className="w-full rounded-[4px] border border-[#e2e2e2] px-3 py-2 font-montserrat text-[12px] text-[#2b2b2b] outline-none focus:border-[#538e53] resize-none"
                />
                <span className="self-end font-montserrat font-normal text-[10px] text-[#808080]">
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 rounded-[10px] bg-[#538e53] px-3 py-2 font-montserrat text-[12px] font-medium text-[#fefefe] cursor-pointer hover:bg-[#467a46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createReview.isPending ? "Submitting…" : "Submit review"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={createReview.isPending}
                  className="rounded-[10px] border border-[#e2e2e2] px-3 py-2 font-montserrat text-[12px] font-medium text-[#2b2b2b] cursor-pointer hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
