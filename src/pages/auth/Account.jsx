import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../components/common/Logo";
import Icon from "../../components/common/Icon";
import SiteFooter from "../../components/layout/SiteFooter";
import profileAvatar from "../../assets/images/profile-avatar.webp";

const accountTabs = [
  { id: "profile", label: "Profil" },
  { id: "security", label: "Keamanan" },
  { id: "activity", label: "Aktivitas Saya" },
];

const loginSessions = [
  {
    device: "Chrome Windows",
    location: "Bandung",
    active: "2 jam lalu",
    current: true,
  },
  { device: "Safari iPhone", location: "Ngawi", active: "1 hari lalu" },
  { device: "Chrome Android", location: "Bali", active: "1 detik lalu" },
];

const loginHistory = [
  {
    time: "13 Okt 2026 12.00",
    device: "Chrome Windows",
    location: "Bandung",
    status: "Perangkat ini",
    current: true,
  },
  {
    time: "10 Okt 2026 09.12",
    device: "Safari iPhone",
    location: "Ngawi",
    status: "Gagal",
  },
  {
    time: "7 Okt 2026 13.00",
    device: "Chrome Android",
    location: "Bali",
    status: "Gagal",
  },
];

const activities = [
  {
    id: 1,
    type: "review",
    initials: "Iqs",
    text: (
      <>
        Memberi ulasan di <strong>Nasi goreng pak Mamat</strong>
      </>
    ),
    time: "13 Okt 2025, 19.00",
    actions: ["Edit", "Hapus"],
  },
  {
    id: 2,
    type: "report",
    initials: "Laq",
    text: (
      <>
        Melaporkan <strong>Soto pak odang</strong> karena terlalu enak
      </>
    ),
    time: "10 Okt 2025, 08.00",
    actions: ["Lihat"],
  },
  {
    id: 3,
    type: "favorite",
    initials: "Lxn",
    text: (
      <>
        Menambahkan <strong>Sate asin gurih</strong> ke favorit
      </>
    ),
    time: "",
    actions: ["Hapus"],
  },
  {
    id: 4,
    type: "review",
    initials: "Afg",
    text: (
      <>
        Mengedit ulasan di <strong>Tianlala</strong>{" "}
        <span className="account-stars">★★★★★ → ★★★★★</span>
      </>
    ),
    time: "",
    actions: ["Lihat"],
  },
];

function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [profile, setProfile] = useState({
    fullName: "Nama Mahasiswa",
    email: "mahasiswa@student.telkomuniversity.ac.id",
    phone: "",
    address: "",
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const currentTab = accountTabs.some(
    (tab) => tab.id === searchParams.get("tab"),
  )
    ? searchParams.get("tab")
    : "profile";

  function changeTab(tab) {
    const nextParams = new URLSearchParams(searchParams);

    if (tab === "profile") nextParams.delete("tab");
    else nextParams.set("tab", tab);

    setSearchParams(nextParams);
  }

  function handleSearch(event) {
    event.preventDefault();

    const query = search.trim();
    navigate(
      query
        ? `/explore?mode=account&q=${encodeURIComponent(query)}`
        : "/explore?mode=account",
    );
  }

  function updateProfile(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <div className="account-header__inner">
          <Link to="/explore?mode=account" aria-label="Kembali ke Explore">
            <Logo />
          </Link>

          <form
            className="account-search"
            onSubmit={handleSearch}
            role="search"
          >
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter delivery address"
              aria-label="Cari makanan atau warung"
            />
            <button type="submit" aria-label="Cari">
              <Icon name="search" size={19} />
            </button>
          </form>
        </div>
      </header>

      <main className="account-main">
        <aside className="account-sidebar">
          <nav className="account-sidebar__nav" aria-label="Navigasi akun">
            {accountTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={currentTab === tab.id ? "is-active" : ""}
                onClick={() => changeTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="account-sidebar__logout"
            onClick={() => setIsLogoutModalOpen(true)}
          >
            Keluar
          </button>
        </aside>

        <section className="account-content">
          {currentTab === "profile" && (
            <ProfilePanel profile={profile} onChange={updateProfile} />
          )}

          {currentTab === "security" && <SecurityPanel />}

          {currentTab === "activity" && (
            <ActivityPanel
              activityFilter={activityFilter}
              onFilterChange={setActivityFilter}
            />
          )}
        </section>
      </main>
      {isLogoutModalOpen && (
        <div
          className="logout-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div className="logout-modal__card">
            <h2 id="logout-modal-title">Keluar</h2>
            <p>Anda yakin ingin keluar?</p>

            <div className="logout-modal__actions">
              <button
                type="button"
                className="logout-modal__cancel"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Batal
              </button>

              <button
                type="button"
                className="logout-modal__confirm"
                onClick={() => navigate("/explore")}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

function ProfilePanel({ profile, onChange }) {
  function resetProfile() {
    document.getElementById("profile-form")?.reset();
  }

  return (
    <div className="account-panel">
      <section className="account-profile-summary">
        <img src={profileAvatar} alt="Foto profil mahasiswa" />
        <div>
          <h1>{profile.fullName || "Nama Mahasiswa"}</h1>
          <p>{profile.email || "mahasiswa@student.telkomuniversity.ac.id"}</p>
        </div>
      </section>

      <section className="account-stat-grid" aria-label="Ringkasan akun">
        <article className="account-stat">
          <strong>10</strong>
        </article>
        <article className="account-stat">
          <span>Warung favorit</span>
          <strong>6</strong>
        </article>
        <article className="account-stat">
          <span>laporan dikirim</span>
          <strong>20</strong>
        </article>
      </section>

      <form
        id="profile-form"
        className="account-card account-profile-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <h2>Data profil</h2>

        <div className="account-form-grid">
          <label>
            Nama lengkap
            <input
              name="fullName"
              value={profile.fullName}
              onChange={onChange}
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={onChange}
            />
          </label>

          <label>
            No. telepon
            <input
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={onChange}
            />
          </label>

          <label>
            Alamat
            <input name="address" value={profile.address} onChange={onChange} />
          </label>
        </div>

        <div className="account-actions">
          <button
            type="button"
            className="account-button account-button--outline"
            onClick={resetProfile}
          >
            Batal
          </button>
          <button type="submit" className="account-button">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="account-panel account-security">
      <form
        className="account-card"
        onSubmit={(event) => event.preventDefault()}
      >
        <h2>Ubah kata sandi</h2>

        <div className="account-form-grid account-form-grid--three">
          <label>
            Kata sandi lama
            <input type="password" />
          </label>

          <label>
            Kata sandi baru
            <input type="password" />
          </label>

          <label>
            Konfirmasi kata sandi
            <input type="password" />
          </label>
        </div>

        <p className="account-help">
          Minimal 8 karakter dengan kombinasi angka.
        </p>

        <div className="account-actions">
          <button
            type="button"
            className="account-button account-button--outline"
          >
            Batal
          </button>
          <button type="submit" className="account-button">
            Perbarui Sandi
          </button>
        </div>
      </form>

      <form
        className="account-card account-two-factor"
        onSubmit={(event) => event.preventDefault()}
      >
        <h2>Verifikasi dua langkah</h2>

        <label className="account-two-factor__email">
          Email pemulihan
          <input type="email" />
        </label>

        <label className="account-check">
          <input type="checkbox" />
          <span>minta kode</span>
        </label>

        <div className="account-actions">
          <button
            type="button"
            className="account-button account-button--outline"
          >
            Batal
          </button>
          <button type="submit" className="account-button">
            Simpan
          </button>
        </div>
      </form>

      <section className="account-card account-table-card">
        <h2>Sesi login</h2>

        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th>Perangkat</th>
                <th>Lokasi</th>
                <th>Terakhir aktif</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {loginSessions.map((session) => (
                <tr key={`${session.device}-${session.location}`}>
                  <td>{session.device}</td>
                  <td>{session.location}</td>
                  <td>{session.active}</td>
                  <td>
                    <button
                      className={
                        session.current
                          ? "account-table__badge is-current"
                          : "account-table__action"
                      }
                      type="button"
                    >
                      {session.current ? "Perangkat ini" : "Keluarkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="account-card account-table-card">
        <div className="account-card__heading">
          <h2>Riwayat login</h2>
          <button type="button" className="account-button">
            Keluar semua sesi
          </button>
        </div>

        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Perangkat</th>
                <th>Lokasi</th>
                <th aria-label="Status" />
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((history) => (
                <tr key={`${history.time}-${history.device}`}>
                  <td>{history.time}</td>
                  <td>{history.device}</td>
                  <td>{history.location}</td>
                  <td>
                    <span
                      className={
                        history.current
                          ? "account-table__badge is-current"
                          : "account-table__badge"
                      }
                    >
                      {history.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="account-danger-zone">
          <button
            type="button"
            className="account-button account-button--danger"
          >
            Nonaktifkan akun
          </button>
        </div>
      </section>
    </div>
  );
}

function ActivityPanel({ activityFilter, onFilterChange }) {
  const filters = [
    { id: "all", label: "Semua" },
    { id: "review", label: "Ulasan" },
    { id: "favorite", label: "Favorit" },
    { id: "report", label: "Laporan" },
  ];

  const visibleActivities =
    activityFilter === "all"
      ? activities
      : activities.filter((activity) => activity.type === activityFilter);

  return (
    <div className="account-panel account-activity">
      <div className="account-filter-tabs" aria-label="Filter aktivitas">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activityFilter === filter.id ? "is-active" : ""}
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <section className="account-card account-activity-list">
        {visibleActivities.map((activity) => (
          <article className="account-activity-item" key={activity.id}>
            <span className="account-activity-item__avatar">
              {activity.initials}
            </span>

            <div className="account-activity-item__content">
              <p>{activity.text}</p>
              {activity.time && <time>{activity.time}</time>}
            </div>

            <div className="account-activity-item__actions">
              {activity.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="account-button account-button--outline"
                >
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}

        {visibleActivities.length === 0 && (
          <p className="account-empty">
            Belum ada aktivitas pada kategori ini.
          </p>
        )}
      </section>
    </div>
  );
}

export default Account;
