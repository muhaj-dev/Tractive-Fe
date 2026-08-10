import { useQuery } from "@tanstack/react-query";
import {
  supportService,
  toSupportChannels,
  toSupportHotlines,
  SupportContacts,
} from "@/services/supportService";

export const supportKeys = {
  all: ["support"] as const,
  contacts: () => [...supportKeys.all, "contacts"] as const,
};

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
