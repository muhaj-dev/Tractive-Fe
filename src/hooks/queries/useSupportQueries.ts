import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  supportService,
  toSupportChannels,
  toSupportHotlines,
  SupportContacts,
  SupportTicket,
  CreateTicketPayload,
  Conversation,
} from "@/services/supportService";

export const supportKeys = {
  all: ["support"] as const,
  contacts: () => [...supportKeys.all, "contacts"] as const,
  tickets: () => [...supportKeys.all, "tickets"] as const,
  conversations: () => [...supportKeys.all, "conversations"] as const,
  conversation: (id: string) =>
    [...supportKeys.all, "conversation", id] as const,
};

const messageFrom = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** Support contacts barely change — cache them for the session so opening the
 * modal repeatedly doesn't re-hit the API. */
export const useSupportContacts = () =>
  useQuery<SupportContacts>({
    queryKey: supportKeys.contacts(),
    queryFn: supportService.getContacts,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

/** Contacts already flattened into displayable rows. */
export const useSupportChannels = () => {
  const query = useSupportContacts();
  return { ...query, channels: toSupportChannels(query.data) };
};

/** Contacts reduced to callable numbers. */
export const useSupportHotlines = () => {
  const query = useSupportContacts();
  return { ...query, hotlines: toSupportHotlines(query.data) };
};

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

export const useSupportTickets = () =>
  useQuery<SupportTicket[]>({
    queryKey: supportKeys.tickets(),
    queryFn: supportService.listTickets,
    staleTime: 30 * 1000,
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) =>
      supportService.createTicket(payload),
    onSuccess: () => {
      // Without this the new ticket does not appear until a hard reload --
      // the same omission that produced bugs 10a and 11b.
      qc.invalidateQueries({ queryKey: supportKeys.tickets() });
      toast.success("Support request sent");
    },
    onError: (error) =>
      toast.error(messageFrom(error, "Could not send your support request")),
  });
};

export const useCloseTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportService.closeTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.tickets() });
      toast.success("Ticket closed");
    },
    onError: (error) => toast.error(messageFrom(error, "Could not close ticket")),
  });
};

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export const useConversations = () =>
  useQuery<Conversation[]>({
    queryKey: supportKeys.conversations(),
    queryFn: supportService.listConversations,
    staleTime: 30 * 1000,
  });

/** Enabled only when an id is supplied. The underlying route is currently
 * broken for every id (see supportService.getConversation), so callers must
 * render its error state rather than assume an empty thread. */
export const useConversation = (id: string | null) =>
  useQuery<Conversation>({
    queryKey: supportKeys.conversation(id ?? ""),
    queryFn: () => supportService.getConversation(id as string),
    enabled: Boolean(id),
    retry: false,
  });

export const useStartConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (initialMessage: string) =>
      supportService.startConversation(initialMessage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.conversations() });
      toast.success("Conversation started");
    },
    onError: (error) =>
      toast.error(messageFrom(error, "Could not start the conversation")),
  });
};

export const useSendMessage = (conversationId: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      supportService.sendMessage(conversationId as string, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.conversations() });
      if (conversationId) {
        qc.invalidateQueries({
          queryKey: supportKeys.conversation(conversationId),
        });
      }
    },
    onError: (error) => toast.error(messageFrom(error, "Could not send message")),
  });
};
