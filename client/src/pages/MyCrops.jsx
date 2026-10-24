import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';
import './MyCrops.css';

const API = 'https://agritech-backend-qadd.onrender.com/api';
const CROPS_API = `${API}/crops`;
const MASTER_CROPS_API = `${API}/master-crops`;

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  quantity: '',
  location: '',
};

function getId(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || '');
  }
  return String(value);
}

export default function MyCrops() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const farmerId = getId(user?._id || user?.id || user?.user?._id);

  const [crops, setCrops] = useState([]);
  const [masterCrops, setMasterCrops] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadCrops() {
    setLoading(true);
    setError('');

    try {
      const [cropResponse, masterResponse] = await Promise.all([
        fetch(`${CROPS_API}/all`),
        fetch(`${MASTER_CROPS_API}/all`),
      ]);

      if (!cropResponse.ok) {
        throw new Error('Could not load your crops.');
      }

      const cropData = await cropResponse.json();
      const masterData = masterResponse.ok
        ? await masterResponse.json()
        : { crops: [] };

      const allCrops = Array.isArray(cropData)
        ? cropData
        : cropData.crops || [];

      setCrops(
        farmerId
          ? allCrops.filter(
              (crop) => getId(crop.farmer) === farmerId
            )
          : []
      );

      setMasterCrops(masterData.crops || []);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCrops();
  }, [farmerId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleCropSelect(event) {
    const selectedName = event.target.value;
    const selectedCrop = masterCrops.find(
      (crop) => crop.cropName === selectedName
    );

    setForm((previous) => ({
      ...previous,
      name: selectedName,
      category: selectedCrop?.category || previous.category,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!farmerId) {
      setError('Farmer account details nahi mile. Please log in again.');
      return;
    }

    setSaving(true);

    const payload = {
      farmer: farmerId,
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      quantity: form.quantity.trim(),
      location: form.location.trim(),
    };

    try {
      const response = await fetch(
        editingId
          ? `${CROPS_API}/update/${editingId}`
          : `${CROPS_API}/add`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not save crop.');
      }

      setMessage(
        editingId
          ? 'Crop updated successfully!'
          : 'Crop added successfully!'
      );

      resetForm();
      await loadCrops();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(crop) {
    setEditingId(crop._id);

    setForm({
      name: crop.name || '',
      category: crop.category || '',
      price: String(crop.price ?? ''),
      quantity: crop.quantity || '',
      location: crop.location || '',
    });

    setError('');
    setMessage('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(cropId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this crop?'
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${CROPS_API}/delete/${cropId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete crop.');
      }

      setCrops((previous) =>
        previous.filter((crop) => crop._id !== cropId)
      );

      if (editingId === cropId) resetForm();

      setMessage('Crop deleted successfully!');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  }

  const categories = [
    ...new Set(crops.map((crop) => crop.category).filter(Boolean)),
  ];

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch = `${crop.name} ${crop.category} ${crop.location}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === 'All' || crop.category === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="my-crops-page">
      <FarmerNavbar />

      <main className="my-crops-container">
        {/* Top Hero Card matching Farmer Dashboard */}
        <section className="crops-hero">
          <div>
            <span className="crops-eyebrow">YOUR FARM, YOUR HARVEST</span>
            <h1>{t('MyCrops') || 'My Crops'} 🪴</h1>
            <p>Manage your crops and keep your farm information organized in one place.</p>
          </div>
          <div className="crops-hero-badge">🌾 Active Produce</div>
        </section>

        {error && <div className="crops-alert error">{error}</div>}
        {message && <div className="crops-alert success">{message}</div>}

        {/* Overview Stats */}
        <section className="crops-stats">
          <article className="crops-stat-card">
            <div className="stat-icon-wrap">🌱</div>
            <div>
              <p>Total Crops</p>
              <h2>{crops.length}</h2>
            </div>
          </article>

          <article className="crops-stat-card">
            <div className="stat-icon-wrap">🧺</div>
            <div>
              <p>Crop Categories</p>
              <h2>{categories.length}</h2>
            </div>
          </article>

          <article className="crops-stat-card">
            <div className="stat-icon-wrap">📍</div>
            <div>
              <p>Farm Locations</p>
              <h2>
                {new Set(crops.map((crop) => crop.location).filter(Boolean)).size}
              </h2>
            </div>
          </article>
        </section>

        {/* Add / Edit Form Section */}
        <section className="crop-form-section">
          <div className="crop-section-heading">
            <div>
              <h2>{editingId ? '✏️ Edit Crop Record' : '➕ Add a New Crop'}</h2>
              <p>Enter details below to update your inventory list.</p>
            </div>
          </div>

          <form className="crop-form" onSubmit={handleSubmit}>
            <div className="crop-form-grid">
              <label>
                Crop Name *
                <select
                  name="name"
                  value={form.name}
                  onChange={handleCropSelect}
                  required
                >
                  <option value="">Select a crop</option>
                  {masterCrops.map((crop) => (
                    <option key={crop._id} value={crop.cropName}>
                      {crop.cropName}
                    </option>
                  ))}
                  {form.name &&
                    !masterCrops.some(
                      (crop) => crop.cropName === form.name
                    ) && (
                      <option value={form.name}>{form.name}</option>
                    )}
                </select>
              </label>

              <label>
                Category *
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Vegetables"
                  required
                />
              </label>

              <label>
                Price (₹) *
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <label>
                Quantity *
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 100 kg"
                  required
                />
              </label>

              <label className="crop-location-field">
                Farm Location *
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Village, district or farm location"
                  required
                />
              </label>
            </div>

            <div className="crop-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="crop-cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="crop-submit-btn"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Crop'
                    : 'Add Crop'}
              </button>
            </div>
          </form>
        </section>

        {/* Crops List Section */}
        <section className="crop-list-section">
          <div className="crop-list-header">
            <h2>Your Crops Directory</h2>
            <span className="crop-count-pill">{crops.length} Records</span>
          </div>

          <div className="crop-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="🔍 Search crops or locations..."
              aria-label="Search crops"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="crops-empty-state">
              <span>🌱</span>
              <h3>Loading your crops...</h3>
            </div>
          ) : filteredCrops.length === 0 ? (
            <div className="crops-empty-state">
              <span>🌿</span>
              <h3>{crops.length ? 'No matching crops' : 'Your crop list is empty'}</h3>
              <p>
                {crops.length
                  ? 'Try a different search or category.'
                  : 'Add your first crop using the form above.'}
              </p>
            </div>
          ) : (
            <div className="crop-cards-grid">
              {filteredCrops.map((crop) => (
                <article className="crop-card" key={crop._id}>
                  <div className="crop-card-top">
                    <div className="crop-card-icon">🪴</div>
                    <span className="crop-badge">{crop.category}</span>
                  </div>

                  <h3>{crop.name}</h3>

                  <div className="crop-card-details">
                    <div className="detail-row">
                      <span>Price</span>
                      <strong>₹{Number(crop.price).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Quantity</span>
                      <strong>{crop.quantity}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Location</span>
                      <strong>{crop.location}</strong>
                    </div>
                  </div>

                  <div className="crop-card-actions">
                    <button
                      type="button"
                      className="crop-edit-btn"
                      onClick={() => startEdit(crop)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="crop-delete-btn"
                      onClick={() => handleDelete(crop._id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
