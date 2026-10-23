import { useState } from 'react'


import { useRemote } from '../../services/useRemote'
import { saveData } from '../../services/managementService'
import { getFilterOptions } from '../../services/restaurantService'
import RemoteStatus from '../../components/common/RemoteStatus'
const loadMeta = signal => getFilterOptions({ signal })

function AdminMasterData() {
  const [activeTab, setActiveTab] = useState('categories')
  const remote = useRemote(loadMeta)
  const categories = remote.data?.categories || []
  const facilities = remote.data?.facilities || []
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)

  const isCategory = activeTab === 'categories'
  const currentItems = isCategory ? categories : facilities
  const title = isCategory ? 'Kategori Warung' : 'Fasilitas Warung'

  function resetForm() {
    setName('')
    setDescription('')
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (await remote.run(() => saveData(`/admin/${activeTab}${editingId ? '/' + editingId : ''}`, editingId ? 'PATCH' : 'POST', { name: name.trim() }))) resetForm()
  }

  function startEdit(item) {
    setName(item.name)
    setDescription('')
    setEditingId(item.id)
  }

  async function deleteItem(id) {
    if (!window.confirm('Hapus data referensi ini? Hubungan dengan warung dapat ikut dilepas.')) return
    if (await remote.run(() => saveData(`/admin/${activeTab}/${id}`, 'DELETE'))) resetForm()
  }

  function changeTab(tab) {
    setActiveTab(tab)
    resetForm()
  }

  return (
    <section className="admin-master-data">
      <div className="admin-page-heading">
        <div>
          <h1>Master Data</h1><RemoteStatus remote={remote} />
          <p>Kelola kategori dan fasilitas yang dapat digunakan oleh warung.</p>
        </div>
      </div>

      <div className="admin-master-data__tabs">
        <button
          type="button"
          className={isCategory ? 'is-active' : ''}
          onClick={() => changeTab('categories')}
        >
          Kategori Warung
        </button>

        <button
          type="button"
          className={!isCategory ? 'is-active' : ''}
          onClick={() => changeTab('facilities')}
        >
          Fasilitas Warung
        </button>
      </div>

      <div className="admin-master-data__layout">
        <div className="admin-dashboard__card admin-master-data__form-card">
          <div className="admin-master-data__card-heading">
            <div>
              <span>{editingId ? 'Edit Data' : 'Tambah Data'}</span>
              <h2>{editingId ? `Edit ${title}` : `Tambah ${title}`}</h2>
            </div>
          </div>

          <form className="admin-master-data__form" onSubmit={handleSubmit}>
            <label>
              Nama {isCategory ? 'kategori' : 'fasilitas'}
              <input
                type="text"
                required minLength={2} maxLength={100} value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  isCategory ? 'Contoh: Minuman' : 'Contoh: WiFi'
                }
              />
            </label>

            <label>
              Deskripsi
              <textarea
                disabled value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Deskripsi tidak disimpan pada kontrak data master saat ini."
              />
            </label>

            <div className="admin-master-data__form-actions">
              {editingId && (
                <button
                  type="button"
                  className="admin-master-data__cancel"
                  onClick={resetForm}
                >
                  Batal
                </button>
              )}

              <button type="submit" className="admin-button">
                {editingId ? 'Simpan Perubahan' : 'Tambah Data'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-dashboard__card admin-master-data__list-card">
          <div className="admin-master-data__card-heading">
            <div>
              <span>Daftar Data</span>
              <h2>{title}</h2>
            </div>
            <strong>{currentItems.length} data</strong>
          </div>

          <div className="admin-master-data__table-wrap">
            <table className="admin-master-data__table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Slug sistem</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="admin-master-data__initial">
                        {item.name.slice(0, 1)}
                      </span>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.slug}</td>
                    <td>
                      <div className="admin-master-data__actions">
                        <button type="button" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => deleteItem(item.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="admin-dashboard__empty">
                      Belum ada data {title.toLowerCase()}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminMasterData
