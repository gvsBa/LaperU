import { useRef, useState } from 'react'

export default function ActionForm({ children, submitLabel = 'Simpan', onSubmit, onSaved, reset = false, confirmMessage }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const locked = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (locked.current || (confirmMessage && !window.confirm(confirmMessage))) return
    const form = event.currentTarget
    const data = new FormData(form)
    locked.current = true
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      await onSubmit(data)
      if (reset) form.reset()
      setMessage('Berhasil disimpan.')
      onSaved?.()
    } catch (error) {
      setFailed(true)
      const details = Object.values(error.details?.fieldErrors || {}).flat().join(' ')
      setMessage([error.message, details].filter(Boolean).join(' '))
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return <form className="management-form" onSubmit={submit}>
    <fieldset disabled={busy}>{children}<button type="submit" className="button button--dark">{busy ? 'Memproses…' : submitLabel}</button></fieldset>
    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
  </form>
}
