import { useCallback, useEffect, useRef, useState } from 'react'
import { privateApi } from './managementService'

// Keep request errors visible and never replace failed requests with demo data.
export function useRemote(loader, initialData = null) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [version, setVersion] = useState(0)
  const lock = useRef(false)
  const reload = useCallback(() => setVersion(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return
      setLoading(true)
      return loader(controller.signal)
    }).then(result => {
      if (!controller.signal.aborted) { setData(result); setError(''); setLoading(false) }
    }).catch(failure => {
      if (!controller.signal.aborted) { setError(failure.message); setLoading(false) }
    })
    return () => controller.abort()
  }, [loader, version])
  async function run(action, success = 'Perubahan tersimpan di server.') {
    if (lock.current) return false
    lock.current = true; setBusy(true); setError(''); setMessage('')
    try {
      await action()
      setMessage(success)
      reload()
      return true
    } catch (failure) {
      const details = Object.values(failure.details?.fieldErrors || {}).flat().join(' ')
      setError([failure.message, details].filter(Boolean).join(' '))
      return false
    } finally { lock.current = false; setBusy(false) }
  }
  return { data, setData, error, loading, busy, message, reload, run }
}

export function usePagedApi(path, map) {
  const [page, setPage] = useState(1)
  const loader = useCallback(async signal => {
    const result = await privateApi(`${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=20`, { signal })
    return { ...result, items: result.items.map(map) }
  }, [path, page, map])
  const remote = useRemote(loader)
  const current = remote.data?.pagination.page === page
  return { ...remote, items: current ? remote.data.items : [], page, setPage, pagination: current ? remote.data.pagination : null }
}
