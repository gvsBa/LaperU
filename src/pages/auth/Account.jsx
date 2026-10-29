import { useCallback, useState } from "react";
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

import { useAuth } from '../../auth/useAuth';
import { privateApi, saveData } from '../../services/managementService';
import { useRemote } from '../../services/useRemote';
import { dateLabel } from '../../services/viewModels';
import RemoteStatus from '../../components/common/RemoteStatus';
const loginSessions = [];

const loginHistory = [];



function Account() {
  const { user, logout, error } = useAuth();
  const loader = useCallback(async signal => {
    if (user.role !== 'CUSTOMER') return { favorites: [], reviews: { items: [], pagination: { total: 0 } }, reports: [] };
    const [favorites, reviews, reports] = await Promise.all(['/customer/favorites','/customer/reviews?limit=100','/customer/reports'].map(path => privateApi(path, { signal })));
    return { favorites, reviews, reports };
  }, [user.role]);
  const remote = useRemote(loader);
  const activities = [
    ...(remote.data?.reviews.items || []).map(item => ({ id: item.id, type: 'review', initials: 'U', text: item.warungName + ': ' + (item.comment || 'Tanpa komentar'), time: dateLabel(item.createdAt), actions: ['Edit', 'Hapus'], slug: item.warungSlug })),
    ...(remote.data?.favorites || []).map(item => ({ id: item.id, type: 'favorite', initials: 'F', text: item.name, time: dateLabel(item.favoritedAt), actions: ['Lihat', 'Hapus'], slug: item.slug })),
    ...(remote.data?.reports || []).map(item => ({ id: item.id, type: 'report', initials: 'L', text: item.reason + ' · ' + item.status + (item.adminNote ? ' · ' + item.adminNote : ''), time: dateLabel(item.createdAt), actions: [] })),
  ];
  async function activityAction(item, action) {
    if (action !== 'Hapus') { navigate('/restaurants/' + item.slug); return }
    if (!window.confirm('Hapus ' + (item.type === 'review' ? 'ulasan ini beserta balasannya?' : 'warung dari favorit?'))) return;
    await remote.run(() => saveData('/customer/' + (item.type === 'review' ? 'reviews/' : 'favorites/') + item.id, 'DELETE'));
  }
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState(searchParams.get("filter") || "all");
  const profile = { fullName: user.fullName, email: user.email, phone: "", address: "" };
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

        <section className="account-content"><RemoteStatus remote={remote} />{error && <p role="alert">{error}</p>}
          {user.role !== 'CUSTOMER' && <Link to={user.role === 'ADMIN' ? '/admin' : '/umkm'}>Buka Dashboard {user.role}</Link>}
          {currentTab === "profile" && (
            <ProfilePanel profile={profile} stats={remote.data} />
          )}

          {currentTab === "security" && <SecurityPanel />}

          {currentTab === "activity" && (
            <ActivityPanel
              activities={activities} onAction={activityAction} activityFilter={activityFilter}
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
                onClick={async () => { try { await logout(); navigate("/explore") } catch { /* Error is displayed above. */ } }}
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

function ProfilePanel({ profile, stats }) {
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
          <span>Ulasan</span><strong>{stats?.reviews.pagination.total ?? "—"}</strong>
        </article>
        <article className="account-stat">
          <span>Warung favorit</span>
          <strong>{stats?.favorites.length ?? "—"}</strong>
        </article>
        <article className="account-stat">
          <span>laporan dikirim</span>
          <strong>{stats?.reports.length ?? "—"}</strong>
        </article>
      </section>

      <form
        id="profile-form"
        className="account-card account-profile-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <h2>Data profil</h2><p>Data akun dari server. Perubahan identitas/kontak belum tersedia.</p><fieldset disabled>

        <div className="account-form-grid">
          <label>
            Nama lengkap
            <input
              name="fullName"
              value={profile.fullName}
              readOnly
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={profile.email}
              readOnly
            />
          </label>

          <label>
            No. telepon
            <input
              name="phone"
              type="tel"
              value={profile.phone}
              readOnly
            />
          </label>

          <label>
            Alamat
            <input name="address" value={profile.address} readOnly />
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
      </fieldset></form>
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="account-panel account-security"><p>Ubah password, 2FA, daftar perangkat, riwayat login dan nonaktif mandiri belum tersedia. Tidak ada perubahan keamanan yang dijalankan dari panel ini.</p><fieldset disabled>
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
    </fieldset></div>
  );
}

function ActivityPanel({ activities, onAction, activityFilter, onFilterChange }) {
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

      <section className="account-card account-activity-list"><p>Menampilkan maksimal 100 ulasan dan 100 laporan terbaru.</p>
        {visibleActivities.map((activity) => (
          <article className="account-activity-item" key={activity.type + activity.id}>
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
                  onClick={() => onAction(activity, action)} type="button"
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
