import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { getAuthSession, subscribeAuthSession } from '../services/apiClient.js'
import * as authService from '../services/authService.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, getAuthSession)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const operationId = useRef(0)

  useEffect(() => {
    let mounted = true
    const initialOperation = operationId.current
    const restore = getAuthSession().accessToken ? Promise.resolve() : authService.restoreSession()
    restore.catch((failure) => {
      if (mounted && operationId.current === initialOperation && failure.status !== 401 && failure.status !== 403) setError(failure.message)
    }).finally(() => {
      if (mounted && operationId.current === initialOperation) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const runAction = useCallback(async (action, ...args) => {
    const id = ++operationId.current
    setError(null)
    setLoading(true)
    try {
      return await action(...args)
    } catch (failure) {
      if (operationId.current === id) setError(failure.message)
      throw failure
    } finally {
      if (operationId.current === id) setLoading(false)
    }
  }, [])

  const value = useMemo(() => ({
    user: session.user,
    loading,
    error,
    login: (email, password) => runAction(authService.login, email, password),
    registerCustomer: (input) => runAction(authService.registerCustomer, input),
    registerUmkm: (input) => runAction(authService.registerUmkm, input),
    logout: () => runAction(authService.logout),
  }), [session.user, loading, error, runAction])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
