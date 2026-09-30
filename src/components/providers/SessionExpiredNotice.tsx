"use client";

import { useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT } from "@/lib/axios";

/**
 * Covers the app the moment the API reports the session is gone for good.
 *
 * When a token expires every request on the page fails with 401 together, and
 * each screen then renders as if it simply had no records — a fleet list of 5
 * reading as 0 (bug 13d). The axios interceptor already signs out and sends the
 * user to /login; this makes the reason visible for the moment in between, so
 * an expired session is never mistaken for an empty account.
 */
export default function SessionExpiredNotice() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const onExpired = () => setExpired(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  if (!expired) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#fefefe]"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#a0dfa0] border-t-[#538e53] rounded-full"></div>
        <p className="font-montserrat font-medium text-[#2b2b2b]">
          Your session has expired
        </p>
        <p className="font-montserrat text-sm text-[#808080]">
          Taking you to the login page so you can sign in again…
        </p>
      </div>
    </div>
  );
}
