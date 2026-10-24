
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FarmerNavbar from '../components/FarmerNavbar';
import { useLanguage } from '../context/LanguageContext';

const API = 'http://localhost:5000/api';

const CATEGORIES = [
  'all',
  'seeds',
  'fertilizers',
  'pesticides',
  'tools',
  'organic manure'
];

const CATEGORY_TRANSLATIONS = {
  all: 'all',
  seeds: 'seeds',
  fertilizers: 'fertilizers',
  pesticides: 'pesticides',
  tools: 'tools',
  'organic manure': 'organicManure'
};

const CATEGORY_INFO = {
  seeds: { icon: '🌱', label: 'Seeds', color: '#e5f3d8' },
  fertilizers: { icon: '🌿', label: 'Fertilizers', color: '#e2f0dc' },
  pesticides: { icon: '🧴', label: 'Pesticides', color: '#f8e9d7' },
  tools: { icon: '🛠️', label: 'Farm Tools', color: '#e5e9f7' },
  'organic manure': {
    icon: '🍃',
    label: 'Organic Manure',
    color: '#e4f0e4'
  }
};

function Shop() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const userId = user?.id || user?._id;

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [cart, setCart] = useState({});
  const [known, setKnown] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const translateCategory = (value) => {
    if (!value) return t('farmSupply');

    const normalized = String(value).toLowerCase().trim();
    const translationKey = CATEGORY_TRANSLATIONS[normalized];

    return translationKey ? t(translationKey) : value;
  };

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString(
      language === 'hi' ? 'hi-IN' : 'en-IN'
    );

  const loadProducts = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/products?category=${encodeURIComponent(category)}`
      );

      if (!res.ok) {
        throw new Error('couldNotLoadProducts');
      }

      const data = await res.json();

      setProducts(Array.isArray(data) ? data : []);

      setMessage((previous) =>
        previous.type === 'error'
          ? { type: '', text: '' }
          : previous
      );
    } catch {
      setMessage({
        type: 'error',
        text: 'couldNotLoadProducts'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category]);

  useEffect(() => {
    setKnown((previous) => {
      const next = { ...previous };

      products.forEach((product) => {
        next[product._id] = product;
      });

      return next;
    });
  }, [products]);

  const addToCart = (product) => {
    const current = cart[product._id] || 0;

    if (current >= Number(product.stock)) return;

    setCart((previous) => ({
      ...previous,
      [product._id]: current + 1
    }));

    setMessage({ type: '', text: '' });
  };

  const removeFromCart = (id) => {
    setCart((previous) => {
      const next = { ...previous };

      if (next[id] > 1) {
        next[id] -= 1;
      } else {
        delete next[id];
      }

      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({
      product: known[id],
      qty
    }))
    .filter((item) => item.product);

  const total = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.product.price || 0) * item.qty,
    0
  );

  const itemCount = cartItems.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const shownProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory =
        category === 'all' ||
        product.category?.toLowerCase() === category;

      const searchableText = [
        product.name,
        product.description,
        product.category
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesCategory &&
        searchableText.includes(search.trim().toLowerCase())
      );
    });

    if (sort === 'price-low') {
      result.sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
    } else if (sort === 'price-high') {
      result.sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
    } else if (sort === 'name') {
      result.sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );
    }

    return result;
  }, [products, category, search, sort]);

  const placeOrder = async () => {
    if (!userId) {
      setMessage({
        type: 'error',
        text: 'signInBeforeOrder'
      });
      return;
    }

    if (!cartItems.length) {
      setMessage({
        type: 'error',
        text: 'cartEmptyError'
      });
      return;
    }

    setMessage({ type: '', text: '' });
    setPlacing(true);

    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          items: Object.entries(cart).map(
            ([product, quantity]) => ({
              product,
              quantity
            })
          )
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.message || 'couldNotPlaceOrder'
        });
        return;
      }

      setCart({});
      setCartOpen(false);

      setMessage({
        type: 'success',
        text: 'orderPlacedSuccessfully'
      });

      await loadProducts();
    } catch {
      setMessage({
        type: 'error',
        text: 'serverConnectionError'
      });
    } finally {
      setPlacing(false);
    }
  };

  const getMessageText = (text) => {
    if (!text) return '';

    const translationKeys = [
      'couldNotLoadProducts',
      'signInBeforeOrder',
      'cartEmptyError',
      'couldNotPlaceOrder',
      'serverConnectionError',
      'orderPlacedSuccessfully'
    ];

    return translationKeys.includes(text) ? t(text) : text;
  };

  return (
    <div className="ag-page shop-page">
      <style>{`
        .shop-page {
          --shop-green: #204d32;
          --shop-dark: #163b27;
          --shop-lime: #c7ef8a;
          --shop-muted: #738174;
          --shop-line: #e5ebdf;
          background: #f7f9f4;
          color: #203526;
          min-height: 100vh;
        }

        .shop-page * { box-sizing: border-box; }

        .shop-container {
          width: min(1440px, 100%);
          margin: 0 auto;
          padding: 30px 34px 60px;
        }

        .shop-hero {
          position: relative;
          overflow: hidden;
          min-height: 300px;
          border-radius: 26px;
          padding: 42px;
          display: flex;
          align-items: center;
          background:
            radial-gradient(ellipse at 88% 5%, rgba(199,239,138,.25), transparent 35%),
            linear-gradient(115deg, #153c28, #285b38 68%, #416c3d);
          color: white;
        }

        .shop-hero-content {
          position: relative;
          z-index: 1;
          max-width: 660px;
        }

        .shop-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.7px;
          text-transform: uppercase;
          color: #d5f4ad;
          margin-bottom: 16px;
        }

        .shop-hero h1 {
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.12;
          letter-spacing: -1.5px;
          font-weight: 850;
          margin: 0 0 15px;
          max-width: 560px;
        }

        .shop-hero p {
          color: #d6e5d7;
          font-size: 15px;
          line-height: 1.8;
          margin: 0;
          max-width: 470px;
        }

        .shop-hero-art {
          position: absolute;
          right: 25px;
          bottom: -20px;
          width: 310px;
          height: 270px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 145px;
          opacity: .95;
          filter: drop-shadow(0 15px 20px rgba(0,0,0,.15));
          transform: rotate(-8deg);
          pointer-events: none;
        }

        .shop-search-wrap {
          margin-top: 28px;
          display: flex;
          gap: 10px;
          padding: 7px;
          max-width: 580px;
          border-radius: 14px;
          background: white;
          box-shadow: 0 8px 25px rgba(0,0,0,.12);
        }

        .shop-search-wrap input {
          min-width: 0;
          flex: 1;
          border: 0;
          outline: 0;
          padding: 10px 12px;
          background: transparent;
          color: #203526;
          font-size: 14px;
        }

        .shop-search-wrap button {
          border: 0;
          border-radius: 10px;
          background: var(--shop-lime);
          color: #1c3824;
          padding: 0 19px;
          font-weight: 800;
          cursor: pointer;
        }

        .shop-trust {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 22px 0 34px;
        }

        .shop-trust-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          background: white;
          border: 1px solid var(--shop-line);
          border-radius: 15px;
        }

        .shop-trust-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 13px;
          background: #edf5e7;
          font-size: 20px;
        }

        .shop-trust-item strong {
          display: block;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .shop-trust-item small {
          color: var(--shop-muted);
          font-size: 11px;
        }

        .shop-section { margin-top: 35px; }

        .shop-section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }

        .shop-kicker {
          color: #63804e;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .shop-heading {
          margin: 0;
          color: #203b29;
          font-size: clamp(22px, 3vw, 30px);
          letter-spacing: -.7px;
          font-weight: 850;
        }

        .shop-description {
          color: var(--shop-muted);
          margin: 7px 0 0;
          font-size: 13px;
          line-height: 1.6;
        }

        .shop-category-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
        }

        .shop-category-card {
          min-width: 0;
          padding: 18px 12px;
          border-radius: 17px;
          border: 1px solid var(--shop-line);
          background: white;
          color: #263d2b;
          text-align: left;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .shop-category-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(34,70,39,.08);
          border-color: #b8d3a6;
        }

        .shop-category-card.active {
          border-color: #4e7c42;
          background: #edf5e7;
          box-shadow: inset 0 0 0 1px #4e7c42;
        }

        .shop-category-icon {
          width: 53px;
          height: 53px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          font-size: 27px;
          margin-bottom: 15px;
        }

        .shop-category-card strong {
          display: block;
          font-size: 13px;
          line-height: 1.4;
        }

        .shop-category-card small {
          display: block;
          margin-top: 5px;
          color: var(--shop-muted);
          font-size: 11px;
        }

        .shop-market-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 22px;
          align-items: start;
        }

        .shop-product-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
        }

        .shop-results {
          color: var(--shop-muted);
          font-size: 13px;
        }

        .shop-select {
          padding: 10px 13px;
          border: 1px solid var(--shop-line);
          border-radius: 10px;
          background: white;
          color: #284330;
          outline: none;
          font-size: 12px;
        }

        .shop-product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .shop-product-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--shop-line);
          border-radius: 18px;
          background: white;
          display: flex;
          flex-direction: column;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .shop-product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(29,60,34,.08);
        }

        .shop-product-visual {
          min-height: 145px;
          display: grid;
          place-items: center;
          position: relative;
          background: #eff4e9;
        }

        .shop-product-visual span {
          font-size: 57px;
          filter: drop-shadow(0 8px 8px rgba(34,66,37,.12));
        }

        .shop-product-tag {
          position: absolute;
          top: 11px;
          left: 11px;
          max-width: calc(100% - 22px);
          padding: 5px 9px;
          border-radius: 7px;
          background: rgba(255,255,255,.88);
          color: #486347;
          font-size: 9px;
          font-weight: 850;
          text-transform: capitalize;
        }

        .shop-product-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 15px;
        }

        .shop-product-name {
          color: #253e2b;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
          margin: 0 0 7px;
          overflow-wrap: anywhere;
        }

        .shop-product-description {
          color: var(--shop-muted);
          font-size: 11px;
          line-height: 1.7;
          margin: 0 0 15px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .shop-stock {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #568046;
          font-size: 10px;
          margin-bottom: 13px;
        }

        .shop-stock::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .shop-stock.empty { color: #b64d44; }

        .shop-product-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #edf0e9;
        }

        .shop-product-price {
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -.5px;
          color: #234c31;
          overflow-wrap: anywhere;
        }

        .shop-product-price small {
          display: block;
          color: var(--shop-muted);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0;
          margin-top: 2px;
        }

        .shop-add-btn {
          flex-shrink: 0;
          border: 0;
          border-radius: 9px;
          padding: 9px 11px;
          background: #285b38;
          color: white;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: background .2s ease;
        }

        .shop-add-btn:hover { background: #173e27; }
        .shop-add-btn:disabled { opacity: .4; cursor: not-allowed; }

        .shop-cart {
          position: sticky;
          top: 80px;
          border: 1px solid var(--shop-line);
          border-radius: 19px;
          background: white;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(28,60,32,.04);
        }

        .shop-cart-head {
          padding: 20px;
          background: #204d32;
          color: white;
        }

        .shop-cart-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .shop-cart-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 850;
        }

        .shop-cart-count {
          border-radius: 9px;
          padding: 6px 9px;
          background: rgba(255,255,255,.13);
          font-size: 11px;
          font-weight: 800;
        }

        .shop-cart-head p {
          margin: 8px 0 0;
          color: #d4e5d5;
          font-size: 11px;
        }

        .shop-cart-content { padding: 17px; }

        .shop-cart-empty {
          padding: 20px 5px;
          text-align: center;
          color: var(--shop-muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .shop-cart-empty span {
          display: block;
          font-size: 36px;
          margin-bottom: 8px;
        }

        .shop-cart-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 13px 0;
          border-bottom: 1px solid #edf0e9;
        }

        .shop-cart-row-name {
          font-size: 12px;
          font-weight: 800;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .shop-cart-row-price {
          margin-top: 4px;
          color: var(--shop-muted);
          font-size: 10px;
        }

        .shop-qty {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .shop-qty button {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          border: 1px solid var(--shop-line);
          border-radius: 7px;
          background: #f8faf5;
          color: #284330;
          font-size: 15px;
          cursor: pointer;
        }

        .shop-qty button:disabled { opacity: .35; cursor: not-allowed; }

        .shop-cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin: 19px 0;
          font-size: 13px;
          font-weight: 800;
        }

        .shop-cart-total strong {
          font-size: 22px;
          color: #244e31;
        }

        .shop-checkout {
          width: 100%;
          border: 0;
          border-radius: 11px;
          padding: 13px;
          background: #c7ef8a;
          color: #1b3c25;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: background .2s ease;
        }

        .shop-checkout:hover { background: #b7e477; }
        .shop-checkout:disabled { opacity: .55; cursor: not-allowed; }

        .shop-secure-note {
          margin: 12px 0 0;
          color: var(--shop-muted);
          text-align: center;
          font-size: 10px;
          line-height: 1.6;
        }

        .shop-notice {
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          line-height: 1.6;
        }

        .shop-notice.error {
          background: #fff0ed;
          color: #963a30;
          border: 1px solid #f2d1ca;
        }

        .shop-notice.success {
          background: #edf7e6;
          color: #315e2c;
          border: 1px solid #d0e7c2;
        }

        .shop-empty {
          padding: 38px 18px;
          text-align: center;
          background: white;
          border: 1px dashed #d6e2cf;
          border-radius: 16px;
          color: var(--shop-muted);
          font-size: 13px;
          line-height: 1.8;
          grid-column: 1 / -1;
        }

        .shop-empty span {
          display: block;
          font-size: 38px;
          margin-bottom: 10px;
        }

        .shop-mobile-cart {
          display: none;
          position: fixed;
          z-index: 50;
          left: 16px;
          right: 16px;
          bottom: 16px;
          width: calc(100% - 32px);
          border: 0;
          border-radius: 14px;
          padding: 15px 18px;
          background: #204d32;
          color: white;
          font-size: 13px;
          font-weight: 850;
          box-shadow: 0 10px 35px rgba(0,0,0,.2);
          cursor: pointer;
        }

        @media (max-width: 1180px) {
          .shop-market-layout { grid-template-columns: minmax(0, 1fr) 275px; gap: 16px; }
          .shop-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .shop-hero-art { right: -5px; opacity: .5; }
        }

        @media (max-width: 900px) {
          .shop-container { padding: 22px 20px 45px; }
          .shop-market-layout { grid-template-columns: 1fr; }
          .shop-cart { position: static; }
          .shop-cart-desktop { display: none; }
          .shop-mobile-cart { display: block; }
          .shop-category-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .shop-hero-art { right: -40px; opacity: .25; }
        }

        @media (max-width: 560px) {
          .shop-container { padding: 16px 13px 95px; }
          .shop-hero { padding: 27px 20px; min-height: 290px; border-radius: 20px; }
          .shop-hero h1 { font-size: 32px; letter-spacing: -.8px; }
          .shop-hero p { font-size: 13px; }
          .shop-hero-art { right: -75px; bottom: -25px; font-size: 115px; }
          .shop-search-wrap { gap: 4px; }
          .shop-search-wrap input { font-size: 12px; padding: 9px 7px; }
          .shop-search-wrap button { padding: 0 11px; font-size: 11px; }
          .shop-trust { grid-template-columns: 1fr; gap: 8px; margin: 16px 0 26px; }
          .shop-trust-item { padding: 11px 13px; }
          .shop-category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
          .shop-category-card { padding: 13px 11px; }
          .shop-category-icon { width: 43px; height: 43px; font-size: 22px; margin-bottom: 10px; }
          .shop-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
          .shop-product-visual { min-height: 108px; }
          .shop-product-visual span { font-size: 43px; }
          .shop-product-body { padding: 11px; }
          .shop-product-name { font-size: 12px; }
          .shop-product-description { font-size: 10px; margin-bottom: 10px; }
          .shop-product-price { font-size: 16px; }
          .shop-add-btn { padding: 8px; font-size: 10px; }
          .shop-section { margin-top: 27px; }
          .shop-section-head { margin-bottom: 14px; }
          .shop-select { max-width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .shop-page * { transition: none !important; }
        }
      `}</style>

      <FarmerNavbar />

      <main className="shop-container">
        <section className="shop-hero">
          <div className="shop-hero-content">
            <div className="shop-eyebrow">
              <span>✳</span> {t('shopEyebrow')}
            </div>

            <h1>{t('shopHeroTitle')}</h1>

            <p>{t('shopHeroDescription')}</p>

            <form
              className="shop-search-wrap"
              onSubmit={(event) => {
                event.preventDefault();

                document
                  .getElementById('shop-products')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
              }}
            >
              <input
                aria-label={t('searchFarmSupplies')}
                placeholder={t('searchSeedsFertilizersTools')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <button type="submit">
                {t('search')} ↗
              </button>
            </form>
          </div>

          <div className="shop-hero-art" aria-hidden="true">
            🌾
          </div>
        </section>

        <section
          className="shop-trust"
          aria-label={t('marketplaceBenefits')}
        >
          <div className="shop-trust-item">
            <div className="shop-trust-icon">🌱</div>
            <div>
              <strong>{t('farmEssentials')}</strong>
              <small>{t('everythingInOnePlace')}</small>
            </div>
          </div>

          <div className="shop-trust-item">
            <div className="shop-trust-icon">🧺</div>
            <div>
              <strong>{t('easyOrdering')}</strong>
              <small>{t('manageCartSimply')}</small>
            </div>
          </div>

          <div className="shop-trust-item">
            <div className="shop-trust-icon">🌿</div>
            <div>
              <strong>{t('growWithConfidence')}</strong>
              <small>{t('suppliesForNextHarvest')}</small>
            </div>
          </div>
        </section>

        {message.text && (
          <div
            className={`shop-notice ${message.type}`}
            role={message.type === 'error' ? 'alert' : 'status'}
          >
            {getMessageText(message.text)}
          </div>
        )}

        <section className="shop-section">
          <div className="shop-section-head">
            <div>
              <div className="shop-kicker">
                {t('exploreOurCollection')}
              </div>

              <h2 className="shop-heading">
                {t('shopByCategory')}
              </h2>

              <p className="shop-description">
                {t('findRightSupplies')}
              </p>
            </div>
          </div>

          <div className="shop-category-grid">
            {CATEGORIES.filter((item) => item !== 'all').map((item) => {
              const info = CATEGORY_INFO[item];

              return (
                <button
                  key={item}
                  type="button"
                  className={`shop-category-card ${
                    category === item ? 'active' : ''
                  }`}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  <div
                    className="shop-category-icon"
                    style={{
                      background: info?.color || '#edf5e7'
                    }}
                  >
                    {info?.icon || '📦'}
                  </div>

                  <strong>{translateCategory(item)}</strong>

                  <small>
                    {t('exploreProducts')} ↗
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="shop-section" id="shop-products">
          <div className="shop-section-head">
            <div>
              <div className="shop-kicker">
                {t('farmSupplyStore')}
              </div>

              <h2 className="shop-heading">
                {category === 'all'
                  ? t('popularFarmEssentials')
                  : translateCategory(category)}
              </h2>

              <p className="shop-description">
                {t('qualitySuppliesDescription')}
              </p>
            </div>
          </div>

          <div className="shop-market-layout">
            <div>
              <div className="shop-product-toolbar">
                <span className="shop-results">
                  {loading
                    ? t('loadingProducts')
                    : `${shownProducts.length} ${
                        shownProducts.length === 1
                          ? t('productFound')
                          : t('productsFound')
                      }`}
                </span>

                <select
                  className="shop-select"
                  aria-label={t('sortProducts')}
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="featured">
                    {t('sortFeatured')}
                  </option>

                  <option value="price-low">
                    {t('priceLowToHigh')}
                  </option>

                  <option value="price-high">
                    {t('priceHighToLow')}
                  </option>

                  <option value="name">
                    {t('nameAToZ')}
                  </option>
                </select>
              </div>

              <div className="shop-product-grid">
                {loading ? (
                  <div className="shop-empty">
                    <span>🌱</span>
                    {t('loadingFarmSupplies')}
                  </div>
                ) : shownProducts.length === 0 ? (
                  <div className="shop-empty">
                    <span>🔎</span>

                    <strong>
                      {t('noMatchingProducts')}
                    </strong>

                    <div>{t('tryAnotherSearch')}</div>

                    <button
                      type="button"
                      className="shop-add-btn"
                      style={{ marginTop: 14 }}
                      onClick={() => {
                        setSearch('');
                        setCategory('all');
                      }}
                    >
                      {t('clearFilters')}
                    </button>
                  </div>
                ) : (
                  shownProducts.map((product) => {
                    const info =
                      CATEGORY_INFO[product.category?.toLowerCase()];

                    const quantity = cart[product._id] || 0;
                    const outOfStock = Number(product.stock) <= 0;

                    return (
                      <article
                        className="shop-product-card"
                        key={product._id}
                      >
                        <div
                          className="shop-product-visual"
                          style={{
                            background: info?.color || '#eff4e9'
                          }}
                        >
                          <div className="shop-product-tag">
                            {translateCategory(
                              product.category || 'farmSupply'
                            )}
                          </div>

                          <span aria-hidden="true">
                            {info?.icon || '📦'}
                          </span>
                        </div>

                        <div className="shop-product-body">
                          <h3 className="shop-product-name">
                            {product.name}
                          </h3>

                          <p className="shop-product-description">
                            {product.description ||
                              t('qualitySuppliesDescription')}
                          </p>

                          <div
                            className={`shop-stock ${
                              outOfStock ? 'empty' : ''
                            }`}
                          >
                            {outOfStock
                              ? t('currentlyUnavailable')
                              : `${product.stock} ${t('unitsAvailable')}`}
                          </div>

                          <div className="shop-product-bottom">
                            <div className="shop-product-price">
                              ₹{formatPrice(product.price)}
                              <small>{t('listedPrice')}</small>
                            </div>

                            <button
                              type="button"
                              className="shop-add-btn"
                              disabled={
                                outOfStock ||
                                quantity >= Number(product.stock)
                              }
                              onClick={() => addToCart(product)}
                            >
                              {quantity > 0
                                ? `${t('added')} (${quantity})`
                                : outOfStock
                                  ? t('soldOut')
                                  : `+ ${t('add')}`}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <aside className="shop-cart shop-cart-desktop">
              <div className="shop-cart-head">
                <div className="shop-cart-title">
                  <h3>{t('yourCart')}</h3>

                  <span className="shop-cart-count">
                    {itemCount}{' '}
                    {itemCount === 1 ? t('item') : t('items')}
                  </span>
                </div>

                <p>{t('cartDescription')}</p>
              </div>

              <div className="shop-cart-content">
                {cartItems.length === 0 ? (
                  <div className="shop-cart-empty">
                    <span>🧺</span>
                    {t('cartWaiting')}
                    <br />
                    {t('addProductsToStart')}
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      className="shop-cart-row"
                      key={item.product._id}
                    >
                      <div>
                        <div className="shop-cart-row-name">
                          {item.product.name}
                        </div>

                        <div className="shop-cart-row-price">
                          ₹{formatPrice(item.product.price)} × {item.qty}
                        </div>
                      </div>

                      <div className="shop-qty">
                        <button
                          type="button"
                          aria-label={`${t('removeOneProduct')} ${item.product.name}`}
                          onClick={() =>
                            removeFromCart(item.product._id)
                          }
                        >
                          −
                        </button>

                        <button
                          type="button"
                          aria-label={`${t('addOneProduct')} ${item.product.name}`}
                          disabled={
                            item.qty >= Number(item.product.stock)
                          }
                          onClick={() => addToCart(item.product)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {cartItems.length > 0 && (
                  <>
                    <div className="shop-cart-total">
                      <span>{t('subtotal')}</span>

                      <strong>
                        ₹{formatPrice(total)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="shop-checkout"
                      disabled={placing}
                      onClick={placeOrder}
                    >
                      {placing
                        ? t('placingOrder')
                        : `${t('placeOrder')} →`}
                    </button>

                    <p className="shop-secure-note">
                      {t('verifyItems')}
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>

      <button
        type="button"
        className="shop-mobile-cart"
        onClick={() => setCartOpen((previous) => !previous)}
      >
        🧺 {t('yourCart')} ({itemCount}) · ₹{formatPrice(total)}
        {cartOpen
          ? ` − ${t('closeCart')}`
          : ` · ${t('viewCart')}`}
      </button>

      {cartOpen && (
        <div
          className="shop-cart shop-mobile-cart-panel"
          style={{
            position: 'fixed',
            zIndex: 49,
            left: 16,
            right: 16,
            bottom: 78,
            maxHeight: '65vh',
            overflowY: 'auto'
          }}
        >
          <div className="shop-cart-head">
            <div className="shop-cart-title">
              <h3>{t('yourCart')}</h3>

              <span className="shop-cart-count">
                {itemCount} {itemCount === 1 ? t('item') : t('items')}
              </span>
            </div>
          </div>

          <div className="shop-cart-content">
            {cartItems.length === 0 ? (
              <div className="shop-cart-empty">
                {t('emptyCartAddProduct')}
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  className="shop-cart-row"
                  key={item.product._id}
                >
                  <div>
                    <div className="shop-cart-row-name">
                      {item.product.name}
                    </div>

                    <div className="shop-cart-row-price">
                      ₹{formatPrice(item.product.price)} × {item.qty}
                    </div>
                  </div>

                  <div className="shop-qty">
                    <button
                      type="button"
                      aria-label={`${t('removeOneProduct')} ${item.product.name}`}
                      onClick={() =>
                        removeFromCart(item.product._id)
                      }
                    >
                      −
                    </button>

                    <button
                      type="button"
                      aria-label={`${t('addOneProduct')} ${item.product.name}`}
                      disabled={
                        item.qty >= Number(item.product.stock)
                      }
                      onClick={() => addToCart(item.product)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}

            {cartItems.length > 0 && (
              <>
                <div className="shop-cart-total">
                  <span>{t('subtotal')}</span>
                  <strong>₹{formatPrice(total)}</strong>
                </div>

                <button
                  type="button"
                  className="shop-checkout"
                  disabled={placing}
                  onClick={placeOrder}
                >
                  {placing
                    ? t('placingOrder')
                    : `${t('placeOrder')} →`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
