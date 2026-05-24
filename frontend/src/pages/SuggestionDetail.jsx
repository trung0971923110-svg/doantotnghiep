import React from 'react';

const fmt = (v) => {
  if (!v) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(v);
};

const getPlaceholder = (name) => `https://placehold.co/400x300?text=${encodeURIComponent(name || 'Linh kien')}`;

export default function SuggestionDetail({ suggestion, setPage }) {
  if (!suggestion) return (
    <div className="glass-card">
      <h2>Không có gợi ý được chọn</h2>
      <button className="btn" onClick={() => setPage('home')}>Quay lại</button>
    </div>
  );

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => setPage('home')}>← Quay lại</button>
      <div className="glass-card" style={{ marginTop: '1rem' }}>
        {/* Main build image / hero */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          {(() => {
            const comps = suggestion.components || {};
            const hero = comps.vga || comps.cpu || Object.values(comps).find(c => c);
            const heroImg = (hero && hero.image) ? hero.image : getPlaceholder('PC Build');
            return (
              <img src={heroImg} alt="Build hero" style={{ width: 220, height: 140, objectFit: 'cover', borderRadius: 10 }} />
            );
          })()}
          <div style={{ flex: 1 }}>
            {(() => {
              const comps = suggestion.components || {};
              const cpu = comps.cpu, vga = comps.vga, mb = comps.mainboard, ram = comps.ram, ssd = comps.ssd;
              const short = (() => {
                const safe = (s) => (s || '').toString();
                const tokenFrom = (name, re) => {
                  if (!name) return '';
                  const m = name.match(re);
                  return m ? m[0].replace(/[^A-Za-z0-9-]/g, '') : '';
                };

                const mbShort = mb ? tokenFrom(mb.name, /[A-Za-z]*\d{2,4}[A-Za-z-]*/i) : '';
                const cpuShort = cpu ? (tokenFrom(cpu.name, /(i\d[\w-]*)|(ryzen\s?\d+)/i) || tokenFrom(cpu.name, /\d{3,4}/)) : '';
                const ramShort = ram && ram.attributes && ram.attributes.capacity ? `${ram.attributes.capacity}gb` : '';
                const ssdCap = ssd && ssd.attributes && ssd.attributes.capacity ? ssd.attributes.capacity : null;
                const ssdShort = ssdCap ? (ssdCap >= 1000 ? `${ssdCap/1000}tb` : `${ssdCap}gb`) : '';

                const parts = [];
                if (mbShort) parts.push(mbShort.toLowerCase());
                if (cpuShort) parts.push(cpuShort.toLowerCase());
                if (ramShort) parts.push(ramShort.toLowerCase());
                if (ssdShort) parts.push(ssdShort.toLowerCase());
                if (parts.length === 0) return 'Đề xuất';
                return parts.join('-');
              })();
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{short}</h3>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Gợi ý tự động dựa trên ngân sách và nhu cầu</div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>{fmt(suggestion.totalPrice)}</div>
                </div>
              );
            })()}
          </div>
        </div>
        <h2>Chi tiết cấu hình đề xuất</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>Tổng giá: <strong style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>{fmt(suggestion.totalPrice)}</strong></div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', width: '18%', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Linh kiện</th>
              <th style={{ textAlign: 'left', padding: '8px', width: '10%', fontSize: '0.85rem' }}>Ảnh</th>
              <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.85rem' }}>Tên sản phẩm</th>
              <th style={{ textAlign: 'right', padding: '8px', width: '20%', fontSize: '0.85rem' }}>Giá</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(suggestion.components).map(([k, comp]) => (
              <tr key={k} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', fontSize: '0.82rem' }}>{k}</td>
                <td style={{ padding: '10px' }}>
                  {comp ? (
                    <img src={comp.image || getPlaceholder(comp.name)} alt={comp.name} style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.currentTarget.src = getPlaceholder(comp.name); }} />
                  ) : '—'}
                </td>
                <td style={{ padding: '10px' }}>
                  {comp ? (
                    <div>
                      {comp.brand && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{comp.brand}</div>}
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{comp.name}</div>
                    </div>
                  ) : '—'}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.92rem' }}>{comp ? fmt(comp.price) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary">Thêm cả cấu hình vào giỏ</button>
          <button className="btn btn-secondary" onClick={() => setPage('pc-builder')}>Tùy chỉnh</button>
        </div>
      </div>
    </div>
  );
}
