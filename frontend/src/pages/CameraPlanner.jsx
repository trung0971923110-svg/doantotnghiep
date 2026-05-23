import React, { useState } from 'react';
import { Video, Calculator, Hammer, HardDrive, Eye } from 'lucide-react';

export default function CameraPlanner() {
  // Input parameters states
  const [numRooms, setNumRooms] = useState(3);
  const [numFloors, setNumFloors] = useState(2);
  const [areaSqM, setAreaSqM] = useState(80);
  const [recordingDays, setRecordingDays] = useState(15);
  const [quality, setQuality] = useState('1080p');
  const [techType, setTechType] = useState('IP');

  // Calculation results states
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    fetch('/api/camera/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numRooms,
        numFloors,
        areaSqM,
        recordingDays,
        quality,
        type: techType
      })
    })
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error calculating camera setup:", err);
        setLoading(false);
      });
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Khảo Sát & Thiết Kế Camera Trực Tuyến</h1>
        <p className="page-subtitle">Tự động tính toán vật tư, thiết bị đầu ghi, dung lượng lưu trữ ổ cứng và chi phí lắp đặt</p>
      </div>

      <div className="grid-2">
        {/* Param Survey Form */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator style={{ color: 'var(--accent)' }} /> Nhập thông số khảo sát nhà
          </h2>
          
          <form onSubmit={handleCalculate}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Số phòng trong nhà</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1" 
                  max="12" 
                  value={numRooms}
                  onChange={(e) => setNumRooms(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số tầng (Lầu)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1" 
                  max="5" 
                  value={numFloors}
                  onChange={(e) => setNumFloors(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Diện tích mặt sàn (m²)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="10" 
                  max="500" 
                  value={areaSqM}
                  onChange={(e) => setAreaSqM(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Công nghệ Camera</label>
                <select 
                  className="form-select" 
                  value={techType} 
                  onChange={(e) => setTechType(e.target.value)}
                >
                  <option value="IP">IP (Hiện đại, Sắc nét, Dễ đi dây mạng)</option>
                  <option value="Analog">Analog (Giá rẻ, Bền bỉ, Chạy cáp đồng trục)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Độ phân giải yêu cầu</label>
                <select 
                  className="form-select" 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="1080p">Full HD 1080p (Trung bình)</option>
                  <option value="2K">2K Super HD (Sắc nét)</option>
                  <option value="4K">4K Ultra HD (Cực kỳ sắc nét)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Số ngày muốn lưu video</label>
                <select 
                  className="form-select" 
                  value={recordingDays} 
                  onChange={(e) => setRecordingDays(Number(e.target.value))}
                >
                  <option value={7}>7 Ngày (Khuyên dùng gia đình)</option>
                  <option value={15}>15 Ngày (Khuyên dùng cửa hàng)</option>
                  <option value={30}>30 Ngày (Tiêu chuẩn an ninh cao)</option>
                  <option value={60}>60 Ngày (Kho bãi / Dự án lớn)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Đang phân tích sơ đồ vật tư...' : 'Tính toán dự toán thiết bị & vẽ sơ đồ'}
            </button>
          </form>
        </div>

        {/* Storage HardDrive & DVR logic details banner */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive style={{ color: 'var(--primary)' }} /> Dung Lượng & Lưu Trữ Dự Kiến
            </h2>
            
            {results ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tổng dung lượng video cần lưu:</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)' }}>
                    {results.gbRequired.toLocaleString()} GB <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>(~ {results.tbRequired.toFixed(2)} TB)</span>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Công thức: {results.totalCams} Camera x {recordingDays} Ngày x {quality === '1080p' ? '20GB' : quality === '2K' ? '40GB' : '80GB'}/ngày.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mắt Camera:</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{results.totalCams} mắt</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({results.indoorQty} Trong nhà, {results.outdoorQty} Ngoài trời)</span>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Đầu ghi khuyến nghị:</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{results.suggestedItems.find(i => i.item.category === 'dvr')?.item.name || 'Đầu ghi chuyên dụng'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem' }}>
                <HardDrive size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Nhập các thông số kỹ thuật bên trái và bấm tính toán để nhận dự toán chi tiết thiết bị.</p>
              </div>
            )}
          </div>

          {results && (
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.2rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tổng Dự Toán Chi Phí:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatVND(results.grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sơ đồ bố trí Camera & Chi tiết báo giá vật tư */}
      {results && (
        <div className="grid-2" style={{ marginTop: '2rem', alignItems: 'start' }}>
          {/* 2D Interactive Camera layout builder */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye style={{ color: 'var(--secondary)' }} /> Sơ đồ bố trí Camera 2D ước lượng
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Phân bổ tự động camera theo cấu trúc phòng ({numRooms} phòng và cổng ra vào)
            </p>

            <div className="camera-map-container">
              {results.layoutGrid.cameras.map((cam, idx) => (
                <div key={idx} className="camera-map-room">
                  <div className="camera-map-icon">
                    <Video size={18} />
                  </div>
                  <span className="camera-map-room-title">{cam.room} ({cam.type})</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', background: 'var(--color-success-bg)', border: '1px solid rgba(16,185,129,0.2)', padding: '1px 5px', borderRadius: '4px', marginTop: '0.5rem' }}>
                    Hoạt động
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing detail bill table */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hammer style={{ color: 'var(--primary)' }} /> Chi Tiết Dự Toán Vật Tư & Nhân Công
            </h3>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tên vật tư</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {results.suggestedItems.map((suggested, index) => (
                    <tr key={index}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{suggested.item.name}</span>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{suggested.item.category}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{suggested.qty}</td>
                      <td style={{ textAlign: 'right' }}>{formatVND(suggested.item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatVND(suggested.total)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3">
                      <span style={{ fontWeight: 600 }}>Nhân công lắp đặt & bảo hành</span>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Giá: 200,000đ/camera</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatVND(results.installationFee)}</td>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 700 }}>
                    <td colSpan="3" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Tổng cộng hóa đơn dự tính:</td>
                    <td style={{ textAlign: 'right', fontSize: '1.1rem', color: 'var(--color-success)' }}>{formatVND(results.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={() => alert('Dự toán thiết bị đã được gửi cho tư vấn viên cửa hàng. Chúng tôi sẽ gọi lại cho bạn theo số điện thoại đăng ký tài khoản trong ít phút!')}
            >
              Yêu Cầu Nhân Viên Khảo Sát Thực Tế
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
