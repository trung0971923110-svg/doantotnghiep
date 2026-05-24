import React, { useEffect, useState } from 'react';

const fmt = (v) => v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫' : 'Liên hệ';

export default function ProductDetail({ productId, setPage }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/pc-builder/products/${productId}`);
        if (!res.ok) {
          setProduct(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setProduct(data);
      } catch (e) {
        console.warn('Failed to load product', e);
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  if (!productId) return (
    <div className="glass-card">
      <h2>Không có sản phẩm được chọn</h2>
      <button className="btn" onClick={() => setPage('home')}>Quay lại</button>
    </div>
  );

  if (loading) return <div className="glass-card">Đang tải sản phẩm...</div>;
  if (!product) return (
    <div className="glass-card">
      <h2>Sản phẩm không tìm thấy</h2>
      <button className="btn" onClick={() => setPage('home')}>Quay lại</button>
    </div>
  );

  return (
    <div className="product-detail-page">
      <button className="btn btn-ghost" onClick={() => setPage('home')}>← Quay lại</button>
      <div className="grid-2" style={{ gap: '2rem', marginTop: '1rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={product.image || '/images/placeholder.svg'} alt={product.name} style={{ maxWidth: '100%', maxHeight: '420px' }} />
        </div>
        <div className="glass-card">
          <h1 style={{ marginBottom: '0.5rem' }}>{product.name}</h1>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{product.brand} — <strong style={{ textTransform: 'uppercase' }}>{product.category}</strong></div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>{fmt(product.price)}</div>
          <div style={{ marginBottom: '1rem' }}>{product.description}</div>

          <div style={{ marginTop: '1rem' }}>
            <h4>Thông số</h4>
            <ul>
              {product.attributes && Object.entries(product.attributes).map(([k,v]) => (
                <li key={k}><strong style={{ textTransform: 'capitalize' }}>{k}:</strong> {String(v)}</li>
              ))}
              <li><strong>Tồn kho:</strong> {product.stockQuantity}</li>
            </ul>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button className="btn btn-primary">Thêm vào giỏ</button>
            <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>Mua ngay</button>
          </div>
        </div>
      </div>
    </div>
  );
}
