import React from "react";
import SupportHelpView from "@/components/support/SupportHelpView";

export const metadata = { title: "Help" };

// Linked from the agent sidebar (desktop and mobile); the route did not exist
// before, so both links 404'd (bug 14c).
export default function AgentHelpPage() {
  return <SupportHelpView />;
}
