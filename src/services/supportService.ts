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

export const supportService = {
  getContacts: async (): Promise<SupportContacts> => {
    const response = await api.get("/api/support/contacts");
    return response.data?.data ?? response.data ?? {};
  },
};
