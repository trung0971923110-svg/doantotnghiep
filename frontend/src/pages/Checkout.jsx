import React, { useState } from 'react';

export default function Checkout({ cart, setCart, setPage }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedBank, setSelectedBank] = useState('Vietcombank');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const total = cart.reduce((s, it) => s + (it.qty||1) * (it.price||0), 0);
  const productName = (cart[0] && cart[0].name) ? cart[0].name : '';

  const changeQty = (delta) => {
    if (!Array.isArray(cart) || cart.length === 0) return;
    const updated = cart.map((it, idx) => {
      if (idx !== 0) return it;
      const current = it.qty || 1;
      return { ...it, qty: Math.max(1, current + delta) };
    });
    setCart(updated);
  };
  const lineTotal = cart[0] ? ((cart[0].qty || 1) * (cart[0].price || 0)) : 0;

  const submit = async () => {
    if (!name || !phone || !address) { setMessage('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, customerPhone: phone, customerAddress: address, paymentMethod, selectedBank, items: cart })
      });
      const data = await res.json();
      if (res.ok) {
        const oid = data.orderId || '';
        try { window.localStorage.setItem('lastOrderId', oid); } catch (e) {}
        setMessage('Đặt hàng thành công! Mã đơn: ' + (oid || '—'));
        setCart([]);
        try { if (typeof setPage === 'function') setPage('order-success'); else window.location.href = '/order-success'; } catch (e) { /* ignore */ }
      } else {
        setMessage(data.message || 'Đặt hàng thất bại');
      }
    } catch (e) { setMessage('Lỗi hệ thống: ' + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <button className="btn btn-ghost" onClick={() => {
        try {
          if (typeof setPage === 'function') { setPage('product'); return; }
          if (window.history.length > 1) window.history.back(); else setPage && setPage('home');
        } catch (e) { setPage && setPage('home'); }
      }} style={{ position: 'absolute', left: 8, top: 8, padding: '8px 12px', borderRadius: 10, background: '#f3f4f6', boxShadow: '0 4px 10px rgba(15,23,42,0.04)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 40, color: '#0f172a' }}>
        <span style={{ transform: 'translateX(-1px)', fontSize: '14px' }}>←</span>
        <span style={{ fontWeight: 800, fontSize: '14px' }}>Quay lại</span>
      </button>
      <h2 style={{ margin: '0 0 0.75rem 0', textAlign: 'center' }}>Thanh toán</h2>
      <div style={{ maxWidth: 'calc(100% - 272px)', margin: '24px 136px', width: 'calc(100% - 272px)', padding: '0', background: 'transparent' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'stretch' }}>
          <div style={{ background: 'transparent', padding: '0' }}>
            {cart.length > 0 ? (
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: 12, minHeight: 320, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <img src={cart[0].image || 'https://placehold.co/260x180?text=Product'} alt={cart[0].name} style={{ width: 260, height: 180, objectFit: 'contain', borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.15, marginBottom: '6px' }}>{productName}</div>
                    <div style={{ color: '#6b46ff', fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cart[0] ? cart[0].price : 0)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => changeQty(-1)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>−</button>
                        <div style={{ color: '#d32f2f', fontWeight: 800, minWidth: 36, textAlign: 'center' }}>{cart[0] ? (cart[0].qty || 1) : 1}</div>
                        <button onClick={() => changeQty(1)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>+</button>
                      </div>
                      <div style={{ color: '#d32f2f', fontWeight: 900, marginTop: '4px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lineTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '0.75rem' }}>Không có sản phẩm trong giỏ</div>
            )}
          </div>

          <div style={{ background: '#fff', padding: '1.25rem', borderRadius: 12, minHeight: 320, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h3 style={{ marginTop: 0, whiteSpace: 'nowrap' }}>Thông tin khách hàng</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '6px' }}>Họ và tên</label>
                <input
                  placeholder="Họ và tên"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Số điện thoại</label>
                <input
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Địa chỉ giao hàng</label>
                <input
                  placeholder="Địa chỉ giao hàng"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Buttons moved under bank selector when mobile banking is selected */}

            {message && <div style={{ marginTop: '0.75rem' }}>{message}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', border: '1px solid rgba(0,0,0,0.04)', minHeight: 260 }}>
              <h3 style={{ marginTop: 0 }}>Hình thức thanh toán</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <span style={{ fontWeight: 700 }}>Thanh toán khi nhận hàng</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="radio" name="paymentMethod" value="mobile_bank" checked={paymentMethod === 'mobile_bank'} onChange={() => { setPaymentMethod('mobile_bank'); setSelectedBank('Vietcombank'); }} />
                  <span style={{ fontWeight: 700 }}>Ngân hàng di động</span>
                </label>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', border: '1px solid rgba(0,0,0,0.04)', minHeight: 260 }}>
              <h3 style={{ marginTop: 0 }}>{paymentMethod === 'mobile_bank' ? 'Chọn ngân hàng' : 'Thanh toán khi nhận hàng'}</h3>
              <div style={{ marginTop: '0.5rem' }}>
                {paymentMethod === 'mobile_bank' ? (
                  <>
                    <select
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', boxSizing: 'border-box', fontSize: '1rem' }}
                    >
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="VietinBank">VietinBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="Agribank">Agribank</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="Sacombank">Sacombank</option>
                      <option value="VPBank">VPBank</option>
                      <option value="MB Bank">MB Bank</option>
                      <option value="ACB">ACB</option>
                      <option value="TPBank">TPBank</option>
                    </select>

                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={submit} disabled={loading || cart.length===0}>{loading ? 'Đang gửi...' : 'Xác nhận đặt hàng'}</button>
                      <button className="btn" onClick={() => setPage('home')}>Tiếp tục mua</button>
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" onClick={submit} disabled={loading || cart.length===0}>{loading ? 'Đang gửi...' : 'Xác nhận đặt hàng'}</button>
                      <button className="btn" onClick={() => setPage('home')}>Tiếp tục mua</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
