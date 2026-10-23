import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from '../../auth/useAuth';
import Logo from "../common/Logo";

const navigation = [
  { label: "Ringkasan", to: "/admin", icon: "home", end: true },
  { label: "Pengajuan UMKM", to: "/admin/pengajuan", icon: "plus" },
  { label: "Data Warung", to: "/admin/warung", icon: "store" },
  { label: "Pengguna", to: "/admin/pengguna", icon: "user" },
  { label: "Ulasan & Laporan", to: "/admin/ulasan-laporan", icon: "review" },
  { label: "Master data", to: "/admin/master-data", icon: "master" },
  { label: "Audit Log", to: "/admin/audit-log", icon: "audit" },
];

function AdminIcon({ name }) {
  const icons = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3z" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
    plus: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 7v10M7 12h10" />
      </>
    ),
    store: (
      <>
        <path d="M4 9h16v11H4zM3 5h18l-1 4H4z" />
        <path d="M8 20v-6h4v6M16 14h1" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c.8-4.1 3.5-6 8-6s7.2 1.9 8 6" />
      </>
    ),
    review: (
      <>
        <path d="M12 3 20 7v10l-8 4-8-4V7z" />
        <path d="m9.5 12 1.7 1.7 3.5-3.5" />
      </>
    ),
    master: (
      <>
        <path d="M12 3 20 7v10l-8 4-8-4V7z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    audit: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4M9 12h6M9 16h6" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const { logout, error } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Logo />
        </div>

        <nav className="admin-sidebar__nav" aria-label="Navigasi Admin">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? " is-active" : ""}`
              }
            >
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={() => setIsLogoutOpen(true)}
        >
          Keluar
        </button>
      </aside>

      <main className="admin-main">
        {error && <p role="alert">{error}</p>}
        {isLogoutOpen && (
          <div className="logout-modal">
            <div className="logout-modal__card" role="dialog" aria-modal="true">
              <h2>Keluar akun?</h2>
              <p>Anda yakin mau keluar dari dashboard Admin?</p>

              <div className="logout-modal__actions">
                <button
                  type="button"
                  className="logout-modal__cancel"
                  onClick={() => setIsLogoutOpen(false)}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="logout-modal__confirm"
                  onClick={async () => { try { await logout(); navigate("/explore") } catch { /* Displayed by AuthProvider. */ } }}
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
