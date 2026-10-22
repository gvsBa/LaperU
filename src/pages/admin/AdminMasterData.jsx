import { useState } from 'react'

const initialCategories = [
  { id: 1, name: 'Masakan Sunda', description: 'Menu khas Sunda dan makanan rumahan.' },
  { id: 2, name: 'Mie & Bakmi', description: 'Aneka mie, bakmi, dan olahan sejenis.' },
  { id: 3, name: 'Bakso & Soto', description: 'Warung bakso, soto, dan makanan berkuah.' },
  { id: 4, name: 'Ayam & Bebek', description: 'Menu ayam goreng, ayam bakar, dan bebek.' },
]

const initialFacilities = [
  { id: 1, name: 'Dine In', description: 'Tersedia tempat makan di lokasi.' },
  { id: 2, name: 'Take Away', description: 'Pesanan dapat dibawa pulang.' },
  { id: 3, name: 'Parkir', description: 'Tersedia area parkir kendaraan.' },
  { id: 4, name: 'Pembayaran QRIS', description: 'Menerima pembayaran menggunakan QRIS.' },
]

function AdminMasterData() {
  const [activeTab, setActiveTab] = useState('categories')
  const [categories, setCategories] = useState(initialCategories)
  const [facilities, setFacilities] = useState(initialFacilities)
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

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      alert('Nama data wajib diisi.')
      return
    }

    const updateItems = isCategory ? setCategories : setFacilities

    if (editingId) {
      updateItems((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...item, name: name.trim(), description: description.trim() }
            : item,
        ),
      )
    } else {
      updateItems((current) => [
        ...current,
        {
          id: Date.now(),
          name: name.trim(),
          description: description.trim() || 'Belum ada deskripsi.',
        },
      ])
    }

    resetForm()
  }

  function startEdit(item) {
    setName(item.name)
    setDescription(item.description)
    setEditingId(item.id)
  }

  function deleteItem(id) {
    const confirmed = window.confirm('Hapus data ini?')

    if (!confirmed) return

    if (isCategory) {
      setCategories((current) => current.filter((item) => item.id !== id))
    } else {
      setFacilities((current) => current.filter((item) => item.id !== id))
    }

    if (editingId === id) resetForm()
  }

  function changeTab(tab) {
    setActiveTab(tab)
    resetForm()
  }

  return (
    <section className="admin-master-data">
      <div className="admin-page-heading">
        <div>
          <h1>Master Data</h1>
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
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  isCategory ? 'Contoh: Minuman' : 'Contoh: WiFi'
                }
              />
            </label>

            <label>
              Deskripsi
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tulis penjelasan singkat..."
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
                  <th>Deskripsi</th>
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
                    <td>{item.description}</td>
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