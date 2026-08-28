import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface PasswordFieldProps {
  autoComplete: string
  error?: string
  id: string
  label: string
  name: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export function PasswordField({
  autoComplete,
  error,
  id,
  label,
  name,
  onChange,
  placeholder = 'Masukkan kata sandi',
  value,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className={`password-input${error ? ' input-shell--error' : ''}`}>
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          id={id}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
