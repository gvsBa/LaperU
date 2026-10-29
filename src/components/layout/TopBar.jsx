import Icon from '../common/Icon'

function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar__inner">
        <div className="topbar__contacts">
          <span><Icon name="store" size={15} /> Temukan kuliner terbaik di sekitar kampus</span>
          <span><Icon name="mapPin" size={15} /> Telkom University, Bandung</span>
        </div>
        <span className="topbar__socials">Referensi lokal · tanpa layanan pesan antar</span>
      </div>
    </div>
  )
}

export default TopBar
