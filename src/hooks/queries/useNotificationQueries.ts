"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  notificationService,
  type GetNotificationsParams,
} from "@/services/notificationService";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: GetNotificationsParams) =>
    [...notificationKeys.all, "list", params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

/** Poll cadence when the live stream is not carrying updates. */
const POLL_MS = 60 * 1000;
/** Slow safety poll while the stream is connected, in case a push is dropped. */
const STREAM_BACKUP_POLL_MS = 5 * 60 * 1000;
/** Give up reconnecting after this many failures and let polling take over. */
const MAX_STREAM_RETRIES = 5;

export interface NotificationQueryOptions {
  /** Milliseconds between background refetches, or false to disable polling. */
  pollInterval?: number | false;
}

export const useNotifications = (
  enabled: boolean = true,
  params?: GetNotificationsParams,
  options?: NotificationQueryOptions,
) => {
  const pollInterval = options?.pollInterval ?? POLL_MS;
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationService.getNotifications(params),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: enabled && pollInterval !== false ? pollInterval : false,
    refetchOnWindowFocus: true,
  });
};

/**
 * Authoritative unread badge count (not limited by the paged list).
 */
export const useUnreadNotificationCount = (
  enabled: boolean = true,
  options?: NotificationQueryOptions,
) => {
  const pollInterval = options?.pollInterval ?? POLL_MS;
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: enabled && pollInterval !== false ? pollInterval : false,
    refetchOnWindowFocus: true,
  });
};

/** Named SSE events the backend may push, alongside the default `message`. */
const STREAM_EVENT_NAMES = ["notification", "notifications", "unread-count"];

/**
 * Live notification feed over SSE (GET /api/notifications/stream).
 *
 * EventSource cannot set an Authorization header, so the token rides in the
 * query string. Every push invalidates the notification queries, which is what
 * actually refreshes the bell and the dropdown — the payload is only used to
 * decide whether to toast.
 *
 * If the stream never opens (endpoint down, token rejected, proxy buffering),
 * `connected` stays false and the caller keeps polling, so the UI degrades to
 * exactly the behaviour it had before the stream existed.
 */
export const useNotificationStream = (enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      typeof EventSource === "undefined"
    ) {
      setConnected(false);
      return;
    }

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let cancelled = false;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    const handlePush = (event: MessageEvent) => {
      // Heartbeats arrive as SSE comments (no data) — nothing to do.
      if (!event.data) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any = null;
      try {
        payload = JSON.parse(event.data);
      } catch {
        payload = null;
      }

      const kind = payload?.type ?? payload?.event;
      if (kind === "ping" || kind === "heartbeat" || kind === "connected") {
        return;
      }

      refresh();

      const notification = payload?.notification ?? payload?.data ?? payload;
      const message: string | undefined = notification?.message;
      const title: string | undefined = notification?.title;
      if (message || title) {
        toast(title || "New notification", {
          description: title ? message : undefined,
          duration: 5000,
        });
      }
    };

    const scheduleReconnect = () => {
      if (cancelled || attempts >= MAX_STREAM_RETRIES) return;
      // Exponential backoff, capped at 30s.
      const delay = Math.min(30_000, 2_000 * 2 ** attempts);
      attempts += 1;
      retryTimer = setTimeout(() => {
        void connect();
      }, delay);
    };

    const connect = async () => {
      const url = await notificationService.getStreamUrl();
      if (cancelled) return;
      if (!url) {
        // No token yet — polling covers us until the session lands.
        setConnected(false);
        return;
      }

      source = new EventSource(url);

      source.onopen = () => {
        attempts = 0;
        setConnected(true);
        // Catch up on anything missed while disconnected.
        refresh();
      };

      source.onmessage = handlePush;
      STREAM_EVENT_NAMES.forEach((name) =>
        source?.addEventListener(name, handlePush as EventListener),
      );

      source.onerror = () => {
        setConnected(false);
        // EventSource retries on its own, but it would loop forever on an
        // expired token. Close it and drive the retry ourselves so we can
        // re-resolve the token each attempt and give up in a bounded way.
        source?.close();
        source = null;
        scheduleReconnect();
      };
    };

    void connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
      source = null;
      setConnected(false);
    };
  }, [enabled, queryClient]);

  return { connected };
};

/**
 * The bell's data source: live stream when it is up, polling when it is not.
 */
export const useNotificationCenter = (
  enabled: boolean = true,
  params?: GetNotificationsParams,
) => {
  const { connected } = useNotificationStream(enabled);
  const query = useNotifications(enabled, params, {
    pollInterval: connected ? STREAM_BACKUP_POLL_MS : POLL_MS,
  });
  return { ...query, streamConnected: connected };
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    // Without this a failure is completely silent: clicking a notification does
    // nothing, says nothing, and leaves the dot in place.
    onError: () => {
      toast.error("Couldn't mark that notification as read. Please try again.");
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: () => {
      toast.error("Couldn't mark your notifications as read. Please try again.");
    },
  });
};
