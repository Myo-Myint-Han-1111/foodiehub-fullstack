"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Simple in-memory cache for API responses.
 * Data survives across page navigations (SPA) but clears on hard refresh.
 */
const cache = new Map<string, { data: unknown; fetchedAt: number }>();

interface UseCachedFetchOptions {
  /** Polling interval in ms. 0 = no polling. */
  pollInterval?: number;
  /** Max age in ms before cached data is considered stale. Default 30s. */
  maxAge?: number;
  /** Called when fresh data arrives (for notification logic etc.) */
  onData?: (newData: unknown, prevData: unknown | null) => void;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  /** True when showing cached data while fetching fresh data */
  isValidating: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useCachedFetch<T>(
  url: string | null,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const { pollInterval = 0, maxAge = 30000, onData } = options;

  // Initialize from cache immediately
  const cached = url ? cache.get(url) : null;
  const [data, setData] = useState<T | null>(
    cached ? (cached.data as T) : null
  );
  const [isLoading, setIsLoading] = useState(!cached);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const prevDataRef = useRef<unknown>(cached?.data ?? null);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const mountedRef = useRef(true);
  // Track if we've ever loaded data — once true, never show full loading spinner again
  const hasLoadedRef = useRef(!!cached);

  const fetchData = useCallback(async () => {
    if (!url) return;

    if (cache.has(url) || hasLoadedRef.current) {
      setIsValidating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!mountedRef.current) return;

      if (json.success !== false) {
        const newData = json.data !== undefined ? json.data : json;
        cache.set(url, { data: newData, fetchedAt: Date.now() });
        hasLoadedRef.current = true;

        // Call onData before setData so components can compare old vs new
        if (onDataRef.current) {
          onDataRef.current(newData, prevDataRef.current);
        }
        prevDataRef.current = newData;
        setData(newData as T);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e : new Error("Fetch failed"));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [url]);

  // Initial fetch — skip if cache is fresh
  useEffect(() => {
    mountedRef.current = true;
    if (!url) return;

    const entry = cache.get(url);
    if (entry && Date.now() - entry.fetchedAt < maxAge) {
      // Cache is fresh — use it, but still revalidate in background
      setData(entry.data as T);
      setIsLoading(false);
      prevDataRef.current = entry.data;
    }

    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [url, fetchData, maxAge]);

  // Polling
  useEffect(() => {
    if (!pollInterval || !url) return;
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, url, fetchData]);

  return { data, isLoading, isValidating, error, refresh: fetchData };
}

/** Manually invalidate a cache entry (e.g. after a mutation) */
export function invalidateCache(url: string) {
  cache.delete(url);
}

/** Invalidate all cache entries matching a prefix */
export function invalidateCachePrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
