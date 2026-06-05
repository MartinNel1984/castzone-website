"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  created_at: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("id, type, title, body, url, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications((data as Notification[]) ?? []));

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, handleOutsideClick]);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative text-pale-water hover:text-bone-white transition-colors p-1"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center leading-none px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-80 bg-deep-water-light border border-surface-teal rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-teal/40 flex items-center justify-between">
            <span className="text-bone-white font-heading font-bold uppercase text-sm tracking-wider">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-storm text-xs font-body">{notifications.length} recent</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-teal/20">
            {notifications.length === 0 ? (
              <p className="text-storm font-body text-sm text-center py-10">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.url ?? "/catches"}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3 hover:bg-deep-water transition-colors ${!n.read ? "bg-cast-orange/5" : ""}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">🏆</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-bone-white font-body text-sm font-medium leading-snug">{n.title}</p>
                    {n.body && (
                      <p className="text-storm text-xs mt-0.5 leading-snug">{n.body}</p>
                    )}
                    <p className="text-storm/50 text-xs mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                  )}
                </Link>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-surface-teal/40 text-center">
            <Link
              href="/catches"
              onClick={() => setOpen(false)}
              className="text-cast-orange hover:underline text-xs font-body"
            >
              View Trophy Room →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
