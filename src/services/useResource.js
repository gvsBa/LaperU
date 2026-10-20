import { useCallback, useEffect, useState } from 'react'

export function useResource(loader) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((value) => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    // Preserve the current form until a refreshed snapshot arrives.
    Promise.resolve().then(() => loader(controller.signal))
      .then((data) => { if (!controller.signal.aborted) setState({ data, error: '', loading: false }) })
      .catch((error) => { if (!controller.signal.aborted) setState((old) => ({ ...old, error: error.message, loading: false })) })
    return () => controller.abort()
  }, [loader, version])
  return { ...state, reload, version }
}
