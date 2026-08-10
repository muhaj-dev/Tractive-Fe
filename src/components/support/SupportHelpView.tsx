"use client";

import React, { useState } from "react";
import {
  useCloseTicket,
  useCreateTicket,
  useSupportChannels,
  useSupportTickets,
} from "@/hooks/queries/useSupportQueries";
import { TicketPriority } from "@/services/supportService";

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const priorityStyle: Record<string, string> = {
  low: "bg-[#eef5ee] text-[#538e53]",
  medium: "bg-[#fdf3e7] text-[#D77F40]",
  high: "bg-[#fdecea] text-[#c0392b]",
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

/** Help / support centre, shared by the agent and transporter sidebars.
 * Backed by `/api/help` (list, create, close) and `/api/support/contacts`. */
export const SupportHelpView: React.FC<{ heading?: string }> = ({
  heading = "Help & support",
}) => {
  const { channels, isLoading: contactsLoading } = useSupportChannels();
  const { data: tickets = [], isLoading, isError, error, refetch } =
    useSupportTickets();
  const createTicket = useCreateTicket();
  const closeTicket = useCloseTicket();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [touched, setTouched] = useState(false);

  const subjectError = touched && !subject.trim() ? "Add a subject" : "";
  const messageError = touched && !message.trim() ? "Describe the problem" : "";
  const canSubmit = subject.trim() && message.trim() && !createTicket.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!subject.trim() || !message.trim()) return;
    await createTicket.mutateAsync({
      subject: subject.trim(),
      message: message.trim(),
      priority,
    });
    setSubject("");
    setMessage("");
    setPriority("medium");
    setTouched(false);
  };

  return (
    <div className="w-[95%] mx-auto mb-8 flex flex-col gap-5">
      <h1 className="pt-6 text-lg font-medium font-montserrat text-[#2b2b2b]">
        {heading}
      </h1>

      {/* Contact channels ------------------------------------------------- */}
      <section className="rounded-[10px] bg-[#fefefe] shadow-md p-5">
        <h2 className="text-base font-medium font-montserrat text-[#2b2b2b] mb-3">
          Talk to us
        </h2>
        {contactsLoading ? (
          <p className="text-sm font-montserrat text-gray-400">
            Loading contact details…
          </p>
        ) : channels.length ? (
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-6">
            {channels.map((channel) => (
              <li key={channel.id} className="flex flex-col">
                <span className="text-xs font-montserrat uppercase tracking-wide text-gray-500">
                  {channel.label}
                </span>
                <a
                  href={channel.href}
                  className="text-sm font-montserrat text-[#538e53] hover:underline cursor-pointer break-all"
                >
                  {channel.value}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-montserrat text-gray-500">
            No support contacts are published right now. Raise a request below
            and the team will reply.
          </p>
        )}
      </section>

      {/* New request ------------------------------------------------------- */}
      <section className="rounded-[10px] bg-[#fefefe] shadow-md p-5">
        <h2 className="text-base font-medium font-montserrat text-[#2b2b2b] mb-3">
          Raise a support request
        </h2>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="ticket-subject"
              className="text-xs font-montserrat text-gray-600"
            >
              Subject
            </label>
            <input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Payment not reflecting on my order"
              aria-invalid={Boolean(subjectError)}
              aria-describedby={subjectError ? "ticket-subject-error" : undefined}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm font-montserrat focus:outline-none focus:border-[#538e53]"
            />
            {subjectError && (
              <span
                id="ticket-subject-error"
                className="text-xs font-montserrat text-[#c0392b]"
              >
                {subjectError}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="ticket-message"
              className="text-xs font-montserrat text-gray-600"
            >
              What went wrong?
            </label>
            <textarea
              id="ticket-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include the order or transaction reference if you have one."
              aria-invalid={Boolean(messageError)}
              aria-describedby={messageError ? "ticket-message-error" : undefined}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm font-montserrat focus:outline-none focus:border-[#538e53] resize-y"
            />
            {messageError && (
              <span
                id="ticket-message-error"
                className="text-xs font-montserrat text-[#c0392b]"
              >
                {messageError}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 sm:max-w-[200px]">
            <label
              htmlFor="ticket-priority"
              className="text-xs font-montserrat text-gray-600"
            >
              Priority
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm font-montserrat bg-white focus:outline-none focus:border-[#538e53] cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 rounded-md bg-[#538e53] text-[#fefefe] text-sm font-montserrat hover:bg-[#477847] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {createTicket.isPending ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      </section>

      {/* Existing requests -------------------------------------------------- */}
      <section className="rounded-[10px] bg-[#fefefe] shadow-md p-5">
        <h2 className="text-base font-medium font-montserrat text-[#2b2b2b] mb-3">
          Your requests
        </h2>

        {isLoading ? (
          <p className="text-sm font-montserrat text-gray-400">Loading…</p>
        ) : isError ? (
          // A failed load must read as a failure, not as "you have none" -- the
          // mistake behind bug 13d.
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm font-montserrat text-[#c0392b]">
              Your requests could not be loaded.
              {error instanceof Error && error.message
                ? ` ${error.message}`
                : ""}
            </p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-xs font-montserrat hover:bg-gray-50 cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm font-montserrat text-gray-500">
            You have not raised any support requests yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <li
                key={ticket._id}
                className="py-3 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium font-montserrat text-[#2b2b2b]">
                      {ticket.subject || "Untitled request"}
                    </span>
                    {ticket.priority && (
                      <span
                        className={`text-[11px] font-montserrat px-2 py-0.5 rounded-full ${
                          priorityStyle[ticket.priority] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    )}
                    {ticket.status && (
                      <span className="text-[11px] font-montserrat px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {ticket.status}
                      </span>
                    )}
                  </div>
                  {ticket.message && (
                    <p className="text-sm font-montserrat text-gray-600 mt-1 break-words">
                      {ticket.message}
                    </p>
                  )}
                  {formatDate(ticket.createdAt) && (
                    <span className="text-xs font-montserrat text-gray-400">
                      Raised {formatDate(ticket.createdAt)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => closeTicket.mutate(ticket._id)}
                  disabled={closeTicket.isPending}
                  className="self-start px-3 py-1.5 rounded-md border border-gray-300 text-xs font-montserrat hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  Close ticket
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SupportHelpView;
