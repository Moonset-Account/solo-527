"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiOptions<T> {
  autoFetch?: boolean;
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T | ((prev: T | null) => T)) => void;
}

export function useApi<T>(
  url: string | null,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { autoFetch = true, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(autoFetch && !!url);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError]);

  useEffect(() => {
    if (autoFetch && url) {
      fetchData();
    }
  }, [autoFetch, url, fetchData]);

  const mutate = useCallback(
    (newData: T | ((prev: T | null) => T)) => {
      setData((prev) =>
        typeof newData === "function" ? (newData as (prev: T | null) => T)(prev) : newData
      );
    },
    []
  );

  return { data, loading, error, refetch: fetchData, mutate };
}

interface MutationOptions<T, R> {
  onSuccess?: (data: R, variables: T) => void;
  onError?: (error: Error, variables: T) => void;
}

interface MutationResult<T, R> {
  loading: boolean;
  error: Error | null;
  data: R | null;
  mutate: (variables: T) => Promise<R | null>;
}

export function useMutation<T, R>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  options: MutationOptions<T, R> = {}
): MutationResult<T, R> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<R | null>(null);

  const mutate = useCallback(
    async (variables: T): Promise<R | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(variables),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        options.onSuccess?.(result, variables);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options.onError?.(error, variables);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, method, options]
  );

  return { loading, error, data, mutate };
}
