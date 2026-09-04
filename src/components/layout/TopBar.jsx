import Icon from '../common/Icon'

function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar__inner">
        <div className="topbar__contacts">
          <span><Icon name="store" size={15} /> Temukan kuliner terbaik di sekitar kampus</span>
          <span><Icon name="mapPin" size={15} /> Telkom University, Bandung</span>
        </div>
        <div className="topbar__socials" aria-label="Media sosial LaperU">
          <a href="#" aria-label="Twitter"><Icon name="twitter" size={13} /></a>
          <a href="#" aria-label="Instagram"><Icon name="instagram" size={13} /></a>
        </div>
      </div>
    </div>
  )
}

export default TopBar
