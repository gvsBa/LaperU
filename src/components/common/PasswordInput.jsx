import { useId, useState } from 'react'
export default function PasswordInput({ label, ...props }) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  return <div className="password-control"><label htmlFor={id}>{label}</label><span className="password-control__field">
    <input {...props} id={id} type={visible ? 'text' : 'password'} />
    <button type="button" aria-label={`${visible ? 'Sembunyikan' : 'Tampilkan'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Sembunyikan' : 'Lihat'}</button>
  </span></div>
}
