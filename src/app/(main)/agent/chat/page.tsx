import React from "react";
import SupportChatView from "@/components/support/SupportChatView";

export const metadata = { title: "Chat" };

// The agent sidebar has linked here since launch; until now the route did not
// exist and every click 404'd (bug 14c).
export default function AgentChatPage() {
  return <SupportChatView />;
}
