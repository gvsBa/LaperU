import { useEffect, useState } from 'react'
import { AuthLayout } from './components/AuthLayout'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import type { AuthMode } from './types/auth'

function modeFromPath(): AuthMode {
  return window.location.pathname.toLowerCase().includes('signup') ? 'signup' : 'login'
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>(modeFromPath)

  useEffect(() => {
    function syncMode() {
      setMode(modeFromPath())
    }
    window.addEventListener('popstate', syncMode)
    return () => window.removeEventListener('popstate', syncMode)
  }, [])

  function handleModeChange(nextMode: AuthMode) {
    const path = nextMode === 'signup' ? '/signup' : '/login'
    window.history.pushState({}, '', path)
    setMode(nextMode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthLayout>
      {mode === 'login' ? (
        <LoginPage onModeChange={handleModeChange} />
      ) : (
        <SignUpPage onModeChange={handleModeChange} />
      )}
    </AuthLayout>
  )
}
