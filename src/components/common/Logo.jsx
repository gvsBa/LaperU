import { Link } from 'react-router-dom'

function Logo() {
  return (
    <Link to="/" className="brand" aria-label="LaperU - Beranda">
      <svg className="brand__mark" viewBox="0 0 52 52" aria-hidden="true">
        <path d="M8 25h36c-1.2 12-8.1 18-18 18S9.2 37 8 25Z" />
        <path d="M14 25c1.4-6.4 5.4-10 12-10 6.3 0 10.5 3.6 12 10M19 15c1-3.4 3.2-5.4 6.4-6.2M31 15l6.5-7M10 44h32" />
        <circle cx="15" cy="21" r="2" />
        <circle cx="38" cy="20" r="2" />
      </svg>
      <span>Laper<span>U</span></span>
    </Link>
  )
}

export default Logo
