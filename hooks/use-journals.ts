"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getJournals, Journal } from "@/app/actions/journal";

const PAGE_SIZE = 20;

export type { Journal };

export function useJournals() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the last loaded ID for pagination
  const lastIdRef = useRef<string | undefined>(undefined);
  // Prevent duplicate initial fetches
  const initialFetchDone = useRef(false);

  const fetchJournals = useCallback(async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const currentLastId = isInitial ? undefined : lastIdRef.current;
      const newJournals = await getJournals(PAGE_SIZE, currentLastId);

      if (isInitial) {
        setJournals(newJournals);
      } else {
        setJournals((prev) => {
          // Prevent duplicates if any
          const existingIds = new Set(prev.map(j => j.id));
          const uniqueNewJournals = newJournals.filter(j => !existingIds.has(j.id));
          return [...prev, ...uniqueNewJournals];
        });
      }

      if (newJournals.length > 0) {
        lastIdRef.current = newJournals[newJournals.length - 1].id;
      }

      if (newJournals.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Error fetching journals:", err);
      setError("Could not load journals.");
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

    useEffect(() => {

      if (!initialFetchDone.current) {

        initialFetchDone.current = true;

        fetchJournals(true);

      }

    }, [fetchJournals]);

  

    const loadMore = useCallback(() => {

      if (!loading && !loadingMore && hasMore) {

        fetchJournals(false);

      }

    }, [loading, loadingMore, hasMore, fetchJournals]);

  

    const refresh = useCallback(() => {

      lastIdRef.current = undefined;

      setHasMore(true);

      setJournals([]);

      fetchJournals(true);

    }, [fetchJournals]);

  

    return { journals, loading, loadingMore, hasMore, error, loadMore, refresh };

  }

  