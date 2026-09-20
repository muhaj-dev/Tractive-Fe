import { redirect } from "next/navigation";

/**
 * Kept only so the URL does not 404.
 *
 * This route used to render its own verification form, but it was never wired
 * up: the address shown was a hardcoded literal, the OTP input asked for five
 * digits where the backend mails six, and the form had no submit handler, so a
 * correct code did nothing. Nothing in the app ever linked here — signup goes
 * to /email-confirmation, which is the real, working page — and while this
 * route sat behind AuthGuard the dead form was at least unreachable. It is
 * public now, so it forwards instead of presenting a broken lookalike.
 */
export default function AccountVerification() {
  redirect("/email-confirmation");
}
