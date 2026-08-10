"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ShortlistItem = {
  id: string;
  slug: string;
  name: string;
  province: string;
  type: string;
};

const STORAGE_KEY = "cz-shortlist";
const EVENT = "cz-shortlist-change";

function readItems(): ShortlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShortlistItem[]) : [];
  } catch {
    return [];
  }
}

function writeItems(items: ShortlistItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Cache the parsed snapshot so useSyncExternalStore doesn't see a new array
// reference (and re-render) on every call when the underlying data hasn't changed.
let cachedRaw: string | null = null;
let cachedItems: ShortlistItem[] = [];

function getSnapshot(): ShortlistItem[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedItems = raw ? (JSON.parse(raw) as ShortlistItem[]) : [];
    } catch {
      cachedItems = [];
    }
  }
  return cachedItems;
}

function getServerSnapshot(): ShortlistItem[] {
  return [];
}

export function useShortlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((item: ShortlistItem) => {
    const current = readItems();
    if (current.some((v) => v.id === item.id)) return;
    writeItems([...current, item]);
  }, []);

  const remove = useCallback((id: string) => {
    writeItems(readItems().filter((v) => v.id !== id));
  }, []);

  const toggle = useCallback((item: ShortlistItem) => {
    const current = readItems();
    const exists = current.some((v) => v.id === item.id);
    writeItems(exists ? current.filter((v) => v.id !== item.id) : [...current, item]);
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  const has = useCallback((id: string) => items.some((v) => v.id === id), [items]);

  return { items, add, remove, toggle, clear, has };
}
