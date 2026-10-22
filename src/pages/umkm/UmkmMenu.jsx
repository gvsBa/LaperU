import { useState } from 'react'

const initialMenus = [
  { id: 1, name: 'Ayam Kremes', price: 15000, status: 'tersedia' },
  { id: 2, name: 'Mie ayam', price: 10000, status: 'tersedia' },
  { id: 3, name: 'Bubur Ayam', price: 12000, status: 'habis' },
  { id: 4, name: 'Kopi', price: 5000, status: 'tersedia' },
]

const statusLabels = {
  tersedia: 'Tersedia',
  habis: 'Habis',
  nonaktif: 'Nonaktif',
}

function formatPrice(price) {
  return `Rp ${price.toLocaleString('id-ID')}`
}

function UmkmMenu() {
  const [menus, setMenus] = useState(initialMenus)
  const [editingId, setEditingId] = useState(null)

  const editingMenu = menus.find((menu) => menu.id === editingId)

  function updateMenu(id, field, value) {
    setMenus((currentMenus) =>
      currentMenus.map((menu) =>
        menu.id === id
          ? {
              ...menu,
              [field]: field === 'price' ? Number(value) || 0 : value,
            }
          : menu
      )
    )
  }

  function toggleMenuStatus(id) {
    setMenus((currentMenus) =>
      currentMenus.map((menu) => {
        if (menu.id !== id) return menu

        if (menu.status === 'nonaktif') {
          return { ...menu, status: menu.previousStatus || 'tersedia' }
        }

        return {
          ...menu,
          previousStatus: menu.status,
          status: 'nonaktif',
        }
      })
    )
  }

  return (
    <section className="umkm-menu">
      <h1>Kelola Menu</h1>

      <div className="umkm-menu__card">
        <div className="umkm-menu__table-wrap">
          <table className="umkm-menu__table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Menu</th>
                <th>Harga</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>

            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id}>
                  <td>
                    <div
                      className="umkm-menu__photo-placeholder"
                      aria-label={`Placeholder foto ${menu.name}`}
                    />
                  </td>
                  <td>{menu.name}</td>
                  <td>{formatPrice(menu.price)}</td>
                  <td>
                    <span className={`umkm-menu__status is-${menu.status}`}>
                      {statusLabels[menu.status]}
                    </span>
                  </td>
                  <td>
                    <div className="umkm-menu__actions">
                      <button
                        type="button"
                        className="umkm-menu__button"
                        onClick={() =>
                          setEditingId((currentId) =>
                            currentId === menu.id ? null : menu.id
                          )
                        }
                      >
                        Ubah
                      </button>

                      <button
                        type="button"
                        className="umkm-menu__button"
                        onClick={() => toggleMenuStatus(menu.id)}
                      >
                        {menu.status === 'nonaktif'
                          ? 'Aktifkan Menu'
                          : 'Nonaktifkan Menu'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingMenu && (
          <form
            className="umkm-menu__editor"
            onSubmit={(event) => {
              event.preventDefault()
              setEditingId(null)
            }}
          >
            <h2>Ubah Menu</h2>

            <div className="umkm-menu__editor-grid">
              <label>
                <span>Nama Menu</span>
                <input
                  value={editingMenu.name}
                  onChange={(event) =>
                    updateMenu(editingMenu.id, 'name', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Harga</span>
                <input
                  type="number"
                  min="0"
                  value={editingMenu.price}
                  onChange={(event) =>
                    updateMenu(editingMenu.id, 'price', event.target.value)
                  }
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={editingMenu.status}
                  onChange={(event) =>
                    updateMenu(editingMenu.id, 'status', event.target.value)
                  }
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Habis</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>

            <div className="umkm-menu__editor-actions">
              <button
                type="button"
                className="umkm-menu__cancel"
                onClick={() => setEditingId(null)}
              >
                Batal
              </button>
              <button type="submit" className="umkm-menu__save">
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default UmkmMenu