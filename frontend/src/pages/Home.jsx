import React, { useEffect, useState } from 'react';
import { Cpu, Wrench, Video, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

// Helper to format prices
const fmt = (v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫' : 'Liên hệ';

export default function Home({ setPage }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/pc-builder/products');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProducts(data);
      } catch (e) {
        console.warn('Failed to load products', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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

  const grouped = products.reduce((acc, p) => {
    const k = (p.category || 'other').toUpperCase();
    (acc[k] = acc[k] || []).push(p);
    return acc;
  }, {});
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

      {/* Suggested builds */}
      {suggestions && suggestions.length > 0 && (
        <section style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Gợi ý cấu hình (ví dụ: Gaming ~15.000.000₫)</h2>
          <div className="grid-3">
            {suggestions.map((s, i) => (
              <div key={i} className="glass-card">
                <h3 style={{ marginBottom: '0.5rem' }}>Gợi ý #{i+1} — Tổng: <span style={{ color: 'var(--primary)' }}>{fmt(s.totalPrice)}</span></h3>
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {Object.entries(s.components).map(([k, comp]) => (
                    <li key={k} style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k.toUpperCase()}</span>
                      <span style={{ fontWeight: 700 }}>{comp ? comp.name : '—'}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => setPage('pc-builder')}>Tùy chỉnh</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured products horizontal strip */}
      <section style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sản Phẩm Nổi Bật</h2>
        </div>

        <div className="featured-strip">
          {products.slice(0, 12).map((p) => (
            <div key={p._id || p.name} className="product-card">
              <div className="product-image" aria-hidden>
                <div className="image-placeholder">{(p.name || '').split(' ').slice(0,2).map(s=>s[0]||'').join('')}</div>
              </div>
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-price">{fmt(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category rows (like the screenshot's "LAPTOP XÁCH TAY" section) */}
      {Object.keys(grouped).map((cat) => (
        <section key={cat} className="category-section">
          <div className="category-header">
            <span className="category-pill">{cat}</span>
            <h3 className="category-title">{cat === 'OTHER' ? 'Khác' : cat}</h3>
          </div>
          <div className="category-row">
            {grouped[cat].slice(0,6).map((p) => (
              <div className="category-card" key={p._id || p.name}>
                <div className="category-thumb"><div className="image-placeholder small">{(p.name||'').split(' ').slice(0,2).map(s=>s[0]||'').join('')}</div></div>
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
