import React from 'react';

export default function OrderSuccess({ setPage }) {
  const orderId = (typeof window !== 'undefined') ? window.localStorage.getItem('lastOrderId') : null;

  return (
    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 800, width: '100%', background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <h2 style={{ marginTop: 0 }}>Đặt hàng thành công</h2>
        <p style={{ fontSize: '1rem' }}>Cảm ơn bạn đã đặt hàng. Mã đơn của bạn: <strong>{orderId || '—'}</strong></p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => { if (typeof setPage === 'function') setPage('home'); else window.location.href = '/'; }}>Về trang chủ</button>
          <button className="btn" onClick={() => { if (typeof setPage === 'function') setPage('product'); else window.history.back(); }}>Xem tiếp sản phẩm</button>
        </div>
      </div>
    </div>
  );
}
