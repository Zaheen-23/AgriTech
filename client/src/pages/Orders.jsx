import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';

const API = 'http://localhost:5000/api/orders';
const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const ICONS = { seeds: '🌱', fertilizers: '🌿', pesticides: '🧴', tools: '🛠️', 'organic manure': '🍃' };

function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || user?._id;
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}?userId=${userId}&role=farmer`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setError(data.message || t('ordersLoadError'));
          return;
        }
        setOrders(data);
      })
      .catch(() => setError(t('serverRunError')))
      .finally(() => setLoading(false));
  }, [userId, t]);

  const delivered = orders.filter((o) => o.status === 'Delivered').length;
  const spent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const getTranslatedStatus = (statusKey) => {
    switch (statusKey) {
      case 'Pending': return t('statusPending') || 'Pending';
      case 'Processing': return t('statusProcessing') || 'Processing';
      case 'Shipped': return t('statusShipped') || 'Shipped';
      case 'Delivered': return t('statusDelivered') || 'Delivered';
      default: return statusKey;
    }
  };

  return (
    <div className="orders-page">
      <FarmerNavbar />

      <main className="orders-container">
        {/* Top Hero Section */}
        <section className="orders-hero">
          <div>
            <span className="orders-eyebrow">{t('orderTrackingCrumb') || 'ORDER TRACKING'}</span>
            <h1>{t('myOrdersTitle') || 'My Orders'} 📦</h1>
            <p>{t('myOrdersSubtitle') || 'Track your live orders and purchase history.'}</p>
          </div>
          <div className="orders-hero-badge">🛒 Purchase History</div>
        </section>

        {/* Overview Statistics */}
        <section className="orders-stats">
          <article className="orders-stat-card">
            <div className="orders-stat-icon">📦</div>
            <div>
              <p>{t('totalOrdersStat') || 'Total Orders'}</p>
              <h2>{orders.length}</h2>
            </div>
          </article>
          <article className="orders-stat-card">
            <div className="orders-stat-icon">🚚</div>
            <div>
              <p>{t('onTheWayStat') || 'On The Way'}</p>
              <h2>{orders.length - delivered}</h2>
            </div>
          </article>
          <article className="orders-stat-card">
            <div className="orders-stat-icon">✅</div>
            <div>
              <p>{t('deliveredStat') || 'Delivered'}</p>
              <h2>{delivered}</h2>
            </div>
          </article>
          <article className="orders-stat-card">
            <div className="orders-stat-icon">💰</div>
            <div>
              <p>{t('totalSpentStat') || 'Total Spent'}</p>
              <h2>₹{spent.toLocaleString('en-IN')}</h2>
            </div>
          </article>
        </section>

        {error && <div className="orders-alert error">{error}</div>}

        {/* Orders List / Cards */}
        <div className="orders-list">
          {orders.map((o) => {
            const stepIndex = Math.max(STEPS.indexOf(o.status), 0);
            return (
              <article className="order-card" key={o._id}>
                <div className="order-card-header">
                  <div>
                    <h3>Order #{o._id.slice(-6).toUpperCase()}</h3>
                    <span className="order-date">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="order-total">₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}</div>
                </div>

                <div className="order-items-container">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="order-item-row">
                      <div className="order-item-info">
                        <span className="order-item-icon">{ICONS[it.product?.category] || '📦'}</span>
                        <div>
                          <div className="order-item-name">{it.product?.name || t('productRemovedText') || 'Product'}</div>
                          <div className="order-item-sub">₹{it.price} × {it.quantity}</div>
                        </div>
                      </div>
                      <div className="order-item-price">₹{it.price * it.quantity}</div>
                    </div>
                  ))}
                </div>

                {/* Progress Tracker Steps */}
                <div className="mo-track">
                  {STEPS.map((s, i) => (
                    <div className={`mo-step ${i <= stepIndex ? 'done' : ''}`} key={s}>
                      <div className="mo-dot" />
                      <span>{getTranslatedStatus(s)}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}

          {!loading && orders.length === 0 && !error && (
            <div className="orders-empty-state">
              <span>📦</span>
              <h3>{t('noOrdersTitle') || 'No orders found'}</h3>
              <p>{t('noOrdersDesc') || "You haven't placed any orders yet."}</p>
              <button className="orders-shop-btn" onClick={() => navigate('/shop')}>
                {t('openShopBtn') || 'Open Shop'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Orders;