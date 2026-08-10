"use client";

import React, { useState } from "react";
import {
  useConversation,
  useConversations,
  useStartConversation,
} from "@/hooks/queries/useSupportQueries";
import { counterpartOf, Conversation } from "@/services/supportService";

const formatWhen = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString();
};

const initialOf = (name?: string) =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

/** Chat, shared by the agent and transporter sidebars. Backed by `/api/chat`.
 *
 * The conversation *list* is real and works. Opening a thread does not: the
 * backend's `GET /api/chat/{conversationId}` answers 400 for every id it is
 * given, including the ids this very list returns, and no other route exposes
 * a conversation's messages. Rather than paint an empty thread -- which would
 * repeat bug 13d, where a failed load looked like "no data" -- the detail pane
 * states plainly that the thread cannot be loaded. */
export const SupportChatView: React.FC<{ heading?: string }> = ({
  heading = "Chat",
}) => {
  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const selected = conversations.find((c) => c._id === selectedId) || null;
  const thread = useConversation(selectedId);
  const startConversation = useStartConversation();

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await startConversation.mutateAsync(draft.trim());
    setDraft("");
  };

  const renderRow = (conversation: Conversation) => {
    const other = counterpartOf(conversation);
    const isSelected = conversation._id === selectedId;
    return (
      <li key={conversation._id}>
        <button
          onClick={() => setSelectedId(conversation._id)}
          aria-current={isSelected}
          className={`w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
            isSelected ? "bg-[#EFF7EF]" : "hover:bg-gray-50"
          }`}
        >
          <span
            aria-hidden="true"
            className="shrink-0 w-9 h-9 rounded-full bg-[#538e53] text-[#fefefe] flex items-center justify-center text-sm font-montserrat"
          >
            {initialOf(other?.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium font-montserrat text-[#2b2b2b] truncate">
                {other?.name || "Unknown participant"}
              </span>
              <span className="text-[11px] font-montserrat text-gray-400 shrink-0">
                {formatWhen(conversation.lastMessageAt)}
              </span>
            </span>
            <span className="block text-xs font-montserrat text-gray-500 truncate">
              {conversation.lastMessage?.text || "No messages yet"}
            </span>
            {conversation.isClosed && (
              <span className="inline-block mt-1 text-[11px] font-montserrat px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                Closed
              </span>
            )}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="w-[95%] mx-auto mb-8 flex flex-col gap-5">
      <h1 className="pt-6 text-lg font-medium font-montserrat text-[#2b2b2b]">
        {heading}
      </h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Conversation list --------------------------------------------- */}
        <section className="rounded-[10px] bg-[#fefefe] shadow-md overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-base font-medium font-montserrat text-[#2b2b2b]">
            Conversations
          </h2>

          {isLoading ? (
            <p className="px-4 pb-4 text-sm font-montserrat text-gray-400">
              Loading…
            </p>
          ) : isError ? (
            <div className="px-4 pb-4 flex flex-col items-start gap-2">
              <p className="text-sm font-montserrat text-[#c0392b]">
                Conversations could not be loaded.
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
          ) : conversations.length === 0 ? (
            <p className="px-4 pb-4 text-sm font-montserrat text-gray-500">
              You have no conversations yet. Start one below.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-[460px] overflow-y-auto">
              {conversations.map(renderRow)}
            </ul>
          )}

          <form
            onSubmit={start}
            className="border-t border-gray-200 p-4 flex flex-col gap-2"
          >
            <label
              htmlFor="chat-new"
              className="text-xs font-montserrat text-gray-600"
            >
              Start a new conversation
            </label>
            <textarea
              id="chat-new"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your first message…"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm font-montserrat focus:outline-none focus:border-[#538e53] resize-y"
            />
            <button
              type="submit"
              disabled={!draft.trim() || startConversation.isPending}
              className="self-start px-4 py-2 rounded-md bg-[#538e53] text-[#fefefe] text-sm font-montserrat hover:bg-[#477847] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {startConversation.isPending ? "Starting…" : "Start chat"}
            </button>
          </form>
        </section>

        {/* Thread ---------------------------------------------------------- */}
        <section className="rounded-[10px] bg-[#fefefe] shadow-md p-5 min-h-[280px]">
          {!selected ? (
            <p className="text-sm font-montserrat text-gray-500">
              Select a conversation to read it.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-medium font-montserrat text-[#2b2b2b]">
                  {counterpartOf(selected)?.name || "Conversation"}
                </h2>
                {counterpartOf(selected)?.email && (
                  <span className="text-xs font-montserrat text-gray-500">
                    {counterpartOf(selected)?.email}
                  </span>
                )}
              </div>

              {thread.isLoading ? (
                <p className="text-sm font-montserrat text-gray-400">
                  Opening conversation…
                </p>
              ) : thread.isError ? (
                <div className="rounded-md border border-[#f3c9c4] bg-[#fdecea] p-4 flex flex-col gap-2">
                  <p className="text-sm font-montserrat text-[#c0392b]">
                    This conversation cannot be opened yet.
                  </p>
                  <p className="text-xs font-montserrat text-[#8c3b31]">
                    The server rejected the request for this thread. The most
                    recent message is shown below in the meantime.
                  </p>
                  <button
                    onClick={() => thread.refetch()}
                    className="self-start px-3 py-1.5 rounded-md border border-[#e3b0a9] text-xs font-montserrat hover:bg-[#fbe0dc] cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-3 max-h-[420px] overflow-y-auto">
                  {(thread.data?.messages ?? []).map((m, i) => (
                    <li
                      key={m._id || i}
                      className="rounded-md bg-gray-50 px-3 py-2"
                    >
                      <span className="block text-xs font-montserrat text-gray-500">
                        {m.sender?.name || "Unknown"} · {formatWhen(m.sentAt)}
                      </span>
                      <span className="block text-sm font-montserrat text-[#2b2b2b] break-words">
                        {m.text}
                      </span>
                    </li>
                  ))}
                  {!(thread.data?.messages ?? []).length && (
                    <li className="text-sm font-montserrat text-gray-500">
                      No messages in this conversation.
                    </li>
                  )}
                </ul>
              )}

              {/* Last known message, so the pane is never simply blank. */}
              {selected.lastMessage?.text && (
                <div className="rounded-md bg-gray-50 px-3 py-2">
                  <span className="block text-xs font-montserrat text-gray-500">
                    {selected.lastMessage.sender?.name || "Unknown"} ·{" "}
                    {formatWhen(selected.lastMessage.sentAt)} · most recent
                  </span>
                  <span className="block text-sm font-montserrat text-[#2b2b2b] break-words">
                    {selected.lastMessage.text}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SupportChatView;
