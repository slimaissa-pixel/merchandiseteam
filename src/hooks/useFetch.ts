import { useCallback, useEffect, useState } from 'react';

export function useFetch<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const executeFetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, deps);

    useEffect(() => {
        let mounted = true;

        executeFetch().then(() => {
            if (!mounted) return;
        });

        return () => { mounted = false; };
    }, [executeFetch]);

    return { data, loading, error, refetch: executeFetch };
}
