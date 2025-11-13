import { useEffect, useState, useCallback, useRef } from "react";

const useAppwrite = (fn) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const fnRef = useRef(fn);

  // Update fn ref without triggering refetch
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fnRef.current();
      if (isMountedRef.current) {
        setData(response || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err?.message || "An unknown error occurred";
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

export default useAppwrite;
