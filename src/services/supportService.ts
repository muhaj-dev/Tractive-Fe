import api from "@/lib/axios";

/** `GET /api/support/contacts` returns a single contact set, not a list:
 * `{ hotline, whatsapp, email }`. Any of the three may be absent. */
export interface SupportContacts {
  hotline?: string;
  whatsapp?: string;
  email?: string;
}

export type SupportChannelKind = "phone" | "whatsapp" | "email";

export interface SupportChannel {
  id: SupportChannelKind;
  label: string;
  value: string;
  /** Ready-made `tel:` / `https://wa.me` / `mailto:` target. */
  href: string;
}

const digitsOnly = (value: string) => value.replace(/[^\d+]/g, "");

/** Flatten the contact set into the rows the UI renders, dropping empties so a
 * missing channel disappears rather than showing a blank line. */
export const toSupportChannels = (
  contacts?: SupportContacts | null
): SupportChannel[] => {
  if (!contacts) return [];

  const channels: SupportChannel[] = [];

  if (contacts.hotline?.trim()) {
    const number = contacts.hotline.trim();
    channels.push({
      id: "phone",
      label: "Hotline",
      value: number,
      href: `tel:${digitsOnly(number)}`,
    });
  }

  if (contacts.whatsapp?.trim()) {
    const number = contacts.whatsapp.trim();
    channels.push({
      id: "whatsapp",
      label: "WhatsApp",
      value: number,
      href: `https://wa.me/${digitsOnly(number).replace(/^\+/, "")}`,
    });
  }

  if (contacts.email?.trim()) {
    const email = contacts.email.trim();
    channels.push({
      id: "email",
      label: "Email",
      value: email,
      href: `mailto:${email}`,
    });
  }

  return channels;
};

/** Just the callable numbers — used by the live-chat modal's hotline strip. */
export const toSupportHotlines = (contacts?: SupportContacts | null): string[] =>
  toSupportChannels(contacts)
    .filter((channel) => channel.id !== "email")
    .map((channel) => channel.value);

// ---------------------------------------------------------------------------
// Support tickets — `/api/help`
// ---------------------------------------------------------------------------

export type TicketPriority = "low" | "medium" | "high";

/** Shape confirmed against the live API on 10 Aug 2026. Everything past `_id`
 * is optional because the list came back empty for every account we hold, so
 * only the documented request body is certain. */
export interface SupportTicket {
  _id: string;
  subject?: string;
  message?: string;
  priority?: TicketPriority;
  status?: string;
  linkedOrderId?: string;
  linkedTransactionId?: string;
  createdAt?: string;
  updatedAt?: string;
  replies?: { message?: string; sentAt?: string; author?: { name?: string } }[];
}

export interface CreateTicketPayload {
  subject: string;
  message: string;
  priority?: TicketPriority;
  linkedOrderId?: string;
  linkedTransactionId?: string;
}

// ---------------------------------------------------------------------------
// Conversations — `/api/chat`
// ---------------------------------------------------------------------------

export interface ChatParticipant {
  _id: string;
  name?: string;
  email?: string;
  roles?: string[];
}

export interface ChatMessage {
  _id?: string;
  text?: string;
  sender?: ChatParticipant;
  sentAt?: string;
}

export interface Conversation {
  _id: string;
  participants?: ChatParticipant[];
  isClosed?: boolean;
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  createdAt?: string;
  /** Only present on the detail route, which is currently unusable — see
   * `getConversation`. */
  messages?: ChatMessage[];
}

/** The other side of a conversation, for display. Falls back to the first
 * participant when both sides are the same account (which real data contains). */
export const counterpartOf = (
  conversation: Conversation,
  selfId?: string,
): ChatParticipant | undefined => {
  const people = conversation.participants ?? [];
  if (!people.length) return undefined;
  return people.find((p) => p._id !== selfId) ?? people[0];
};

/** Unwrap `{ data: ... }` if the backend used an envelope, else take the body. */
const unwrap = <T,>(body: unknown, fallback: T): T => {
  const envelope = body as { data?: T } | null;
  return (envelope?.data ?? (body as T) ?? fallback) as T;
};

export const supportService = {
  getContacts: async (): Promise<SupportContacts> => {
    const response = await api.get("/api/support/contacts");
    return response.data?.data ?? response.data ?? {};
  },

  // --- tickets -------------------------------------------------------------

  listTickets: async (): Promise<SupportTicket[]> => {
    const response = await api.get("/api/help");
    const data = unwrap<SupportTicket[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  },

  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const response = await api.post("/api/help", payload);
    return unwrap<SupportTicket>(response.data, {} as SupportTicket);
  },

  closeTicket: async (id: string): Promise<void> => {
    await api.delete(`/api/help/${id}`);
  },

  // --- conversations -------------------------------------------------------

  listConversations: async (): Promise<Conversation[]> => {
    const response = await api.get("/api/chat");
    const data = unwrap<Conversation[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  },

  /** BROKEN BACKEND ROUTE, kept wired so it starts working the moment it is
   * fixed. `GET /api/chat/{conversationId}` answers 400 "Invalid conversation
   * ID format" for *every* input — including the well-formed 24-character
   * ObjectIds that `GET /api/chat` itself returns, and including a valid id
   * that simply does not exist (which should be a 404). Verified 10 Aug 2026.
   * There is no other route that returns a conversation's messages:
   * `/api/chat/{id}/messages` does not exist on the backend at all. */
  getConversation: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/api/chat/${id}`);
    return unwrap<Conversation>(response.data, {} as Conversation);
  },

  startConversation: async (initialMessage: string): Promise<Conversation> => {
    const response = await api.post("/api/chat", { initialMessage });
    return unwrap<Conversation>(response.data, {} as Conversation);
  },

  sendMessage: async (id: string, text: string): Promise<ChatMessage> => {
    const response = await api.post(`/api/chat/${id}`, { text });
    return unwrap<ChatMessage>(response.data, {} as ChatMessage);
  },
};
