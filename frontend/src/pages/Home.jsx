import React, { useEffect, useState, useRef } from 'react';
import { Cpu, Wrench, Video, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

// Helper to format prices
const fmt = (v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫' : 'Liên hệ';
const placeholderFor = (name) => `/images/placeholder.svg`;

export default function Home({ setPage, selectedCategory, setSelectedCategory, setSelectedProductId, setSelectedSuggestion, selectedBrand, setSelectedBrand, productUpdateSignal, lastUpdatedProduct }) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const featuredRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingProducts(true);
        const parts = [];
        if (selectedCategory) parts.push(`category=${encodeURIComponent(selectedCategory)}`);
        // server-side brand filter when viewing CPU category
        if (selectedCategory === 'cpu' && selectedBrand && selectedBrand !== 'all') parts.push(`brand=${encodeURIComponent(selectedBrand)}`);
        const q = parts.length ? `?${parts.join('&')}` : '';
        const res = await fetch('/api/pc-builder/products' + q);
        if (!res.ok) {
          setProducts([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setProducts(data);
      } catch (e) {
        console.warn('Failed to load products', e);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedCategory, selectedBrand, productUpdateSignal]);

  // when a category is selected and products loaded, scroll to featured strip
  useEffect(() => {
    if (selectedCategory && !loadingProducts) {
      setTimeout(() => {
        try { featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }
      }, 200);
    }
    // reset brand filter when switching away from CPU category
    try {
      if (selectedCategory !== 'cpu') setSelectedBrand('all');
    } catch(e) { /* ignore if prop not provided */ }
  }, [selectedCategory, loadingProducts]);

  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function loadSuggest() {
      try {
        const res = await fetch('/api/pc-builder/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: 15000000, need: 'gaming', count: 3 })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSuggestions(data);
      } catch (e) {
        console.warn('Failed to load suggestions', e);
      }
    }
    loadSuggest();
    return () => { cancelled = true; };
  }, []);

  // rely on server-side filtering; products already filtered when selectedCategory and brand are set
  const filtered = products;

  const grouped = filtered.reduce((acc, p) => {
    const k = (p.category || 'other').toUpperCase();
    (acc[k] = acc[k] || []).push(p);
    return acc;
  }, {});
  const getImageSrc = (p) => {
    if (!p || !p.image) return placeholderFor(p?.name);
    if (/^https?:\/\//i.test(p.image)) return `/api/pc-builder/image?url=${encodeURIComponent(p.image)}`;
    // assume relative path served by backend (e.g. /images/proxy/xxx)
    return p.image;
  };
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ textAlign: 'center', padding: '3rem 1rem 4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>
          Hệ Thống Điều Phối Kỹ Thuật & <br />
          <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dịch Vụ Máy Tính - Camera
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Giải pháp toàn diện tối ưu hóa quy trình dịch vụ tin học, tự động tính toán thiết kế camera giám sát trực tuyến, lắp ráp cấu hình PC tự động và theo dõi quy trình sửa chữa thời gian thực.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setPage('pc-builder')}>
            Thử Lắp PC Tự Động
          </button>
          <button className="btn btn-secondary" onClick={() => setPage('repair-service')}>
            Đặt Lịch Sửa Chữa
          </button>
        </div>
      </section>

      {/* Suggested builds (hidden when a category filter is active) */}
      {(!selectedCategory && suggestions && suggestions.length > 0) && (
        <section style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Gợi ý cấu hình (ví dụ: Gaming ~15.000.000₫)</h2>
          <div className="grid-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {suggestions.map((s, i) => {
              // choose a hero component (prefer vga, then cpu, else first)
              const comps = s.components || {};
              const hero = comps.vga || comps.cpu || Object.values(comps).find(c => c);
              const heroImg = hero?.image || '/images/placeholder.svg';
              const vendor = hero?.brand || '';
              const title = hero?.name || `Gợi ý #${i+1}`;
              const price = s.totalPrice || 0;
              const oldPrice = Math.round(price * 1.12);
              const discount = Math.round((oldPrice - price) / oldPrice * 100);
              return (
                <div key={i} style={{ width: '220px' }}>
                  <div className="product-card glass-card" style={{ padding: '0.5rem', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={heroImg} alt={title} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ position: 'absolute', left: 8, top: 8, background: 'linear-gradient(90deg,#7c3aed,#6366f1)', color: 'white', padding: '6px 8px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700 }}>
                        TIẾT KIỆM<br />{fmt(oldPrice - price)}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem 0 0.25rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{vendor}</div>
                      <div style={{ fontWeight: 700, marginTop: '6px', minHeight: '40px' }}>{title}</div>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1rem' }}>{fmt(price)}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}><s>{fmt(oldPrice)}</s> <span style={{ color: 'var(--color-danger)', marginLeft: '6px' }}>-{discount}%</span></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => setPage('pc-builder')}>Tùy chỉnh</button>
                    <button className="btn btn-ghost" onClick={() => { setSelectedSuggestion && setSelectedSuggestion(s); setPage('suggestion'); }}>Xem chi tiết</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Banner when filtered */}
      {selectedCategory && (
        <div style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))', border: '1px solid rgba(59,130,246,0.12)', padding: '0.75rem 1rem', borderRadius: '8px', margin: '1rem 0' }}>
          <strong style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>Bộ lọc:</strong>
          <span>Hiển thị <strong style={{ textTransform: 'uppercase' }}>{String(selectedCategory)}</strong> — <strong>{loadingProducts ? 'Đang tải...' : `${filtered.length} sản phẩm`}</strong></span>
          <button className="btn btn-ghost" style={{ marginLeft: '1rem' }} onClick={() => setSelectedCategory(null)}>Xóa bộ lọc</button>
        </div>
      )}

      {/* Brand pills for CPU category */}
      {selectedCategory === 'cpu' && (
        <div style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className={`btn ${selectedBrand === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedBrand('all')}>Tất cả</button>
          <button className={`btn ${selectedBrand === 'intel' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedBrand('intel')}>Intel</button>
          <button className={`btn ${selectedBrand === 'amd' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedBrand('amd')}>AMD</button>
          <button className={`btn ${selectedBrand === 'other' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSelectedBrand('other')}>Khác</button>
        </div>
      )}

      {/* Featured products horizontal strip (hidden when a category filter is active) */}
      {!selectedCategory && (
        <section style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sản Phẩm Nổi Bật</h2>
          {selectedCategory && (
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Hiển thị: <strong style={{ textTransform: 'uppercase' }}>{String(selectedCategory)}</strong> — <span style={{ fontWeight: 700 }}>{loadingProducts ? 'Đang tải...' : `${filtered.length} sản phẩm`}</span></div>
          )}
        </div>

        <div className="featured-strip" ref={featuredRef} id="featured-strip">
          {filtered.slice(0, 12).map((p) => (
            <div key={p._id || p.name} className="product-card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedProductId && setSelectedProductId(p._id); setPage('product'); }}>
              <div className="product-image" aria-hidden>
                  <img
                  src={getImageSrc(p)}
                  alt={p.name}
                  onError={(e) => {
                    console.warn('Image load failed, falling back:', e.currentTarget.src);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
              </div>
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-price">{fmt(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
        </section>
      )}

      {/* Category rows (like the screenshot's "LAPTOP XÁCH TAY" section) */}
      {Object.keys(grouped).map((cat) => (
        <section key={cat} className="category-section">
          <div className="category-header">
            <span className="category-pill">{cat}</span>
              </div>
          <div className="category-row">
            {grouped[cat].slice(0,6).map((p) => (
              <div className="category-card" key={p._id || p.name} style={{ cursor: 'pointer' }} onClick={() => { setSelectedProductId && setSelectedProductId(p._id); setPage('product'); }}>
                <div className="category-thumb">
                  <img
                    src={getImageSrc(p)}
                    alt={p.name}
                    onError={(e) => {
                      console.warn('Category image load failed, falling back:', e.currentTarget.src);
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/placeholder.svg';
                    }}
                  />
                </div>
                <div className="cat-name">{p.name}</div>
                <div className="cat-price">{fmt(p.price)}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Feature Cards Section */}
      <section className="features-grid" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '2.5rem' }}>Các Phân Hệ Tính Năng Chính</h2>
        
        <div className="grid-3">
          {/* Card 1: PC Builder */}
          <div className="glass-card" onClick={() => setPage('pc-builder')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.8rem', borderRadius: '12px', width: 'fit-content', marginBottom: '1.5rem' }}>
              <Cpu size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Lắp Ráp PC Tự Động</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Nhập ngân sách và nhu cầu sử dụng (Văn phòng, Gaming, Đồ họa). Hệ thống tự gợi ý cấu hình tương thích 100%, tự động kiểm tra Socket CPU, nguồn điện và thế hệ RAM.
            </p>
            <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Khám phá ngay &rarr;
            </span>
          </div>

          {/* Card 2: Repair Tracker */}
          <div className="glass-card" onClick={() => setPage('repair-service')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', padding: '0.8rem', borderRadius: '12px', width: 'fit-content', marginBottom: '1.5rem' }}>
              <Wrench size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Đặt Lịch & Theo Dõi Sửa Chữa</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Đặt lịch hẹn sửa máy in, laptop, camera. Khách hàng theo dõi tiến độ công việc theo thời gian thực (Đã tiếp nhận &rarr; Đang kiểm tra &rarr; Đang thay linh kiện &rarr; Đã hoàn thành).
            </p>
            <span style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Khám phá ngay &rarr;
            </span>
          </div>

          {/* Card 3: Camera Planner */}
          <div className="glass-card" onClick={() => setPage('camera-planner')} style={{ cursor: 'pointer' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent)', padding: '0.8rem', borderRadius: '12px', width: 'fit-content', marginBottom: '1.5rem' }}>
              <Video size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Thiết Kế Camera Trực Tuyến</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Khảo sát diện tích nhà trực quan. Hệ thống gợi ý số lượng mắt camera, đầu ghi phù hợp và tự động tính dung lượng ổ cứng lưu trữ dựa trên số ngày cần lưu video.
            </p>
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Khám phá ngay &rarr;
            </span>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', padding: '3rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Quy trình đồng bộ cho Cửa hàng và Khách hàng</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Hệ thống giải quyết triệt để vấn đề mất cân đối tồn kho, thiếu minh bạch trong sửa chữa và lắp đặt thiết bị. Admin, Kỹ thuật viên và Khách hàng đều thao tác trên một cơ sở dữ liệu đồng nhất.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} className="badge-success" style={{ padding: '2px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.95rem' }}>Kho linh kiện tự động cảnh báo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} className="badge-success" style={{ padding: '2px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.95rem' }}>Xuất hóa đơn tự động</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} className="badge-success" style={{ padding: '2px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.95rem' }}>Kiểm tra tương thích PC</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} className="badge-success" style={{ padding: '2px', borderRadius: '50%' }} />
              <span style={{ fontSize: '0.95rem' }}>Tính dung lượng HDD camera</span>
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 300px', background: 'rgba(7, 9, 14, 0.4)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} style={{ color: 'var(--secondary)' }} />
            Tài Khoản Đăng Nhập Demo
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'col', gap: '0.75rem', paddingLeft: 0 }}>
            <li style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Chủ Cửa Hàng (Admin):</span><br />
              Tài khoản: <code style={{ color: 'var(--text-primary)' }}>admin</code> / Mật khẩu: <code style={{ color: 'var(--text-primary)' }}>admin123</code>
            </li>
            <li>
              <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Kỹ Thuật Viên:</span><br />
              Tài khoản: <code style={{ color: 'var(--text-primary)' }}>tech1</code> / Mật khẩu: <code style={{ color: 'var(--text-primary)' }}>tech123</code>
            </li>
          </ul>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setPage('dashboard')}>
            Vào Trang Quản Trị Portal
          </button>
        </div>
      </section>
    </div>
  );
}
