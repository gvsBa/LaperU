import { useState } from 'react'

import { useRemote } from '../../services/useRemote'
import { privateApi, saveData, uploadImage } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import { menuView } from '../../services/viewModels'
const loadMenus = async signal => (await privateApi('/umkm/menus', { signal })).map(menuView)

const statusLabels = {
  tersedia: 'Tersedia',
  habis: 'Habis',
  nonaktif: 'Nonaktif',
}

function formatPrice(price) {
  return `Rp ${price.toLocaleString('id-ID')}`
}

function UmkmMenu() {
  const remote = useRemote(loadMenus, [])
  const menus = remote.data
  const setMenus = remote.setData
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

  async function toggleMenuStatus(id) {
    const item = menus.find(menu => menu.id === id)
    await remote.run(() => saveData(`/umkm/menus/${id}`, 'PATCH', { isActive: item.status === 'nonaktif' }))
    setEditingId(null)
  }
  async function saveMenu(event) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('photo')
    if (await remote.run(async () => {
      const body = { name: editingMenu.name, price: editingMenu.price, isActive: editingMenu.status !== 'nonaktif', isAvailable: editingMenu.status !== 'habis' }
      if (file?.size) body.photoUrl = (await uploadImage(file)).url
      await saveData(editingId === 'new' ? '/umkm/menus' : `/umkm/menus/${editingId}`, editingId === 'new' ? 'POST' : 'PATCH', body)
    })) setEditingId(null)
  }

  return (
    <section className="umkm-menu">
      <h1>Kelola Menu</h1><RemoteStatus remote={remote} /><button className="admin-button" disabled={remote.busy || !!editingId} onClick={() => { setMenus(items => [...items, { id: 'new', name: '', price: 0, status: 'tersedia' }]); setEditingId('new') }}>Tambah Menu</button>

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
                    {menu.photoUrl ? <img src={menu.photoUrl} alt={menu.name} style={{ width: 60, height: 60, objectFit: 'cover' }} /> : <div className="umkm-menu__photo-placeholder" aria-label="Foto belum diunggah" />}
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
                        disabled={remote.busy || menu.id === 'new'}
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
            onSubmit={saveMenu}
          >
            <h2>{editingId === "new" ? "Tambah Menu" : "Ubah Menu"}</h2><label>Foto menu (JPG/PNG, maks 2 MB)<input name="photo" type="file" accept="image/jpeg,image/png" /></label>

            <div className="umkm-menu__editor-grid">
              <label>
                <span>Nama Menu</span>
                <input
                  required minLength={2} maxLength={160} value={editingMenu.name}
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
                  {editingId !== 'new' && <option value="nonaktif">Nonaktif</option>}
                </select>
              </label>
            </div>

            <div className="umkm-menu__editor-actions">
              <button
                type="button"
                className="umkm-menu__cancel"
                onClick={() => { setEditingId(null); remote.reload() }}
              >
                Batal
              </button>
              <button type="submit" disabled={remote.busy} className="umkm-menu__save">
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
