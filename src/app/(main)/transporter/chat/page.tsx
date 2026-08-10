import React from "react";
import SupportChatView from "@/components/support/SupportChatView";

export const metadata = { title: "Chat" };

// Linked from the transporter sidebar (desktop and mobile); the route did not
// exist before, so both links 404'd (bug 14c).
export default function TransporterChatPage() {
  return <SupportChatView />;
}
