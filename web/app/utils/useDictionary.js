import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

const dictionaryCache = {};
const loadingPromises = {};

export function useDictionary(code) {
  const [dictionary, setDictionary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDictionary = useCallback(async () => {
    if (dictionaryCache[code]) {
      setDictionary(dictionaryCache[code]);
      setLoading(false);
      return;
    }

    if (loadingPromises[code]) {
      try {
        const data = await loadingPromises[code];
        setDictionary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const promise = api.get(`/dictionaries/${code}`)
      .then((data) => {
        dictionaryCache[code] = data;
        return data;
      })
      .finally(() => {
        delete loadingPromises[code];
      });

    loadingPromises[code] = promise;

    try {
      const data = await promise;
      setDictionary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      loadDictionary();
    }
  }, [code, loadDictionary]);

  const options = dictionary?.items?.map(item => ({
    label: item.label,
    value: item.value,
    color: item.color,
    description: item.description,
  })) || [];

  const getLabel = useCallback((value) => {
    const item = dictionary?.items?.find(i => i.value === value);
    return item?.label || value;
  }, [dictionary]);

  const getColor = useCallback((value) => {
    const item = dictionary?.items?.find(i => i.value === value);
    return item?.color || null;
  }, [dictionary]);

  return {
    dictionary,
    items: dictionary?.items || [],
    options,
    loading,
    error,
    getLabel,
    getColor,
    reload: loadDictionary,
  };
}

export function clearDictionaryCache(code) {
  if (code) {
    delete dictionaryCache[code];
  } else {
    Object.keys(dictionaryCache).forEach(key => delete dictionaryCache[key]);
  }
}

export default useDictionary;
