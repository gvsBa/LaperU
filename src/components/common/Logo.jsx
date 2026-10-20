import { Link } from 'react-router-dom'
import laperuLogo from '../../assets/images/laperu-logo.svg'

function Logo() {
  return (
    <Link to="/" className="brand brand--image" aria-label="LaperU - Beranda">
      <img className="brand__image" src={laperuLogo} alt="LaperU" />
    </Link>
  )
}

export default Logo