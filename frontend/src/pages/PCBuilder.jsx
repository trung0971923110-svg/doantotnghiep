import React, { useState, useEffect } from 'react';
import { Sparkles, Check, AlertTriangle, HelpCircle } from 'lucide-react';

export default function PCBuilder() {
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'custom'
  
  // States for Auto Build
  const [budget, setBudget] = useState(15000000);
  const [need, setNeed] = useState('gaming');
  const [suggestedBuilds, setSuggestedBuilds] = useState([]);
  const [autoError, setAutoError] = useState('');
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // States for Custom Build
  const [inventory, setInventory] = useState([]);
  const [selectedParts, setSelectedParts] = useState({
    cpu: '',
    mainboard: '',
    ram: '',
    vga: '',
    psu: '',
    ssd: '',
    case: ''
  });
  const [compatResult, setCompatResult] = useState({
    compatible: true,
    issues: [],
    details: {
      socket: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra socket' },
      ramType: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra thế hệ RAM' },
      power: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra công suất nguồn' }
    }
  });
  const [customPrice, setCustomPrice] = useState(0);

  // Load Inventory for custom builder
  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data))
      .catch(err => console.error("Error loading inventory:", err));
  }, []);

  // Recalculate compatibility and total price for custom builder
  useEffect(() => {
    if (activeTab !== 'custom') return;

    // Calculate total price
    let total = 0;
    const partsToCheck = {};
    
    Object.keys(selectedParts).forEach(cat => {
      const partId = selectedParts[cat];
      if (partId) {
        partsToCheck[cat] = partId;
        const item = inventory.find(p => p.id === partId);
        if (item) total += item.price;
      }
    });
    setCustomPrice(total);

    // Call compatibility check API
    fetch('/api/pc-builder/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parts: partsToCheck })
    })
      .then(res => res.json())
      .then(data => setCompatResult(data))
      .catch(err => console.error("Error checking compatibility:", err));

  }, [selectedParts, activeTab, inventory]);

  const handleAutoBuild = (e) => {
    e.preventDefault();
    setAutoError('');
    setLoadingSuggest(true);
    setSuggestedBuilds([]);

    fetch('/api/pc-builder/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget: Number(budget), need, count: 3 })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Không tìm thấy cấu hình phù hợp với ngân sách này. Hãy thử nâng mức ngân sách.');
        }
        return res.json();
      })
      .then(data => {
        setSuggestedBuilds(data || []);
        setLoadingSuggest(false);
      })
      .catch(err => {
        setAutoError(err.message);
        setLoadingSuggest(false);
      });
  };

  const getByCategory = (category) => {
    return inventory.filter(item => item.category === category && item.stock > 0);
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const renderCompatIcon = (status) => {
    if (status === 'ok') return <Check size={18} style={{ color: 'var(--color-success)' }} />;
    if (status === 'error') return <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />;
    return <HelpCircle size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  const renderCompatClass = (status) => {
    if (status === 'ok') return 'compat-log compat-log-ok';
    if (status === 'error') return 'compat-log compat-log-error';
    return 'compat-log compat-log-idle';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Phân Hệ Lắp Ráp PC Tự Động</h1>
        <p className="page-subtitle">Xây dựng cấu hình máy tính cá nhân hóa, tối ưu hiệu năng và tương thích 100%</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('auto')}
        >
          <Sparkles size={18} /> Gợi Ý PC Tự Động
        </button>
        <button 
          className={`btn ${activeTab === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('custom')}
        >
          Tự Chọn Linh Kiện
        </button>
      </div>

      {/* TAB 1: AUTO BUILDER */}
      {activeTab === 'auto' && (
        <div className="grid-2">
          {/* Form Parameters */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Nhập Nhu Cầu & Ngân Sách</h2>
            <form onSubmit={handleAutoBuild}>
              <div className="form-group">
                <label className="form-label">Ngân Sách (VND)</label>
                <select 
                  className="form-select" 
                  value={budget} 
                  onChange={(e) => setBudget(Number(e.target.value))}
                >
                  <option value={10000000}>10 Triệu VND</option>
                  <option value={15000000}>15 Triệu VND</option>
                  <option value={20000000}>20 Triệu VND</option>
                  <option value={25000000}>25 Triệu VND</option>
                  <option value={35000000}>35 Triệu VND</option>
                  <option value={50000000}>50 Triệu VND</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nhu Cầu Sử Dụng</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="need" 
                      value="office"
                      checked={need === 'office'} 
                      onChange={(e) => setNeed(e.target.value)}
                    />
                    <span>Văn phòng / Học tập (Tập trung CPU, RAM, không VGA)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="need" 
                      value="gaming"
                      checked={need === 'gaming'} 
                      onChange={(e) => setNeed(e.target.value)}
                    />
                    <span>Chơi Game giải trí (Tập trung VGA rời mạnh mẽ)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="need" 
                      value="design"
                      checked={need === 'design'} 
                      onChange={(e) => setNeed(e.target.value)}
                    />
                    <span>Đồ họa / Render chuyên nghiệp (Tập trung CPU mạnh, nhiều RAM, VGA ổn định)</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loadingSuggest}>
                {loadingSuggest ? 'Đang tính toán...' : 'Đề xuất cấu hình tối ưu'}
              </button>
            </form>

            {autoError && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>{autoError}</span>
              </div>
            )}
          </div>

          {/* Suggestion Results */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Cấu Hình Đề Xuất Phù Hợp</h2>
              
              {suggestedBuilds.length === 0 && !loadingSuggest && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem' }}>
                  <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p>Chọn các thông số bên trái và bấm Đề xuất để nhận cấu hình tương thích tối ưu nhất.</p>
                </div>
              )}

              {loadingSuggest && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 1rem' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                  <p>Hệ thống AI/Rule-based đang rà soát kho linh kiện, so khớp các chân Socket và công suất tiêu thụ điện...</p>
                </div>
              )}

              {suggestedBuilds.length > 0 && (
                <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {suggestedBuilds.map((sugg, idx) => (
                    <div key={idx} className="table-container" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Đề xuất #{idx + 1}</strong>
                        <span style={{ fontWeight: 700 }}>{formatVND(sugg.totalPrice)}</span>
                      </div>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Linh kiện</th>
                            <th>Tên sản phẩm</th>
                            <th style={{ textAlign: 'right' }}>Giá thành</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(sugg.components).map(cat => {
                            const item = sugg.components[cat];
                            if (!item) return null;
                            return (
                              <tr key={cat}>
                                <td style={{ fontWeight: 600, color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.8rem' }}>{cat}</td>
                                <td>{item.name}</td>
                                <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatVND(item.price)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {suggestedBuilds.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Đề xuất tốt nhất:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{formatVND(suggestedBuilds[0].totalPrice)}</span>
                </div>
                <div className="compat-log compat-log-ok" style={{ margin: 0 }}>
                  <Check size={18} />
                  <span>Cấu hình tương thích 100% (Đã kiểm tra Socket {suggestedBuilds[0].components.cpu?.attributes?.socket}, thế hệ RAM {suggestedBuilds[0].components.mainboard?.attributes?.ramType}, Nguồn điện dư {suggestedBuilds[0].components.psu?.attributes?.wattage}W)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM BUILDER */}
      {activeTab === 'custom' && (
        <div className="grid-2">
          {/* Selections Form */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Lựa Chọn Từng Linh Kiện</h2>
            
            {/* CPU */}
            <div className="form-group">
              <label className="form-label">Bộ vi xử lý (CPU)</label>
              <select 
                className="form-select"
                value={selectedParts.cpu}
                onChange={(e) => setSelectedParts({ ...selectedParts, cpu: e.target.value })}
              >
                <option value="">-- Chọn CPU --</option>
                {getByCategory('cpu').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>

            {/* Mainboard */}
            <div className="form-group">
              <label className="form-label">Bo mạch chủ (Mainboard)</label>
              <select 
                className="form-select"
                value={selectedParts.mainboard}
                onChange={(e) => setSelectedParts({ ...selectedParts, mainboard: e.target.value })}
              >
                <option value="">-- Chọn Mainboard --</option>
                {getByCategory('mainboard').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>

            {/* RAM */}
            <div className="form-group">
              <label className="form-label">Bộ nhớ trong (RAM)</label>
              <select 
                className="form-select"
                value={selectedParts.ram}
                onChange={(e) => setSelectedParts({ ...selectedParts, ram: e.target.value })}
              >
                <option value="">-- Chọn RAM --</option>
                {getByCategory('ram').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>

            {/* VGA */}
            <div className="form-group">
              <label className="form-label">Card màn hình (VGA)</label>
              <select 
                className="form-select"
                value={selectedParts.vga}
                onChange={(e) => setSelectedParts({ ...selectedParts, vga: e.target.value })}
              >
                <option value="">-- Không sử dụng (Sử dụng GPU tích hợp) --</option>
                {getByCategory('vga').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>

            {/* PSU */}
            <div className="form-group">
              <label className="form-label">Bộ nguồn (PSU)</label>
              <select 
                className="form-select"
                value={selectedParts.psu}
                onChange={(e) => setSelectedParts({ ...selectedParts, psu: e.target.value })}
              >
                <option value="">-- Chọn Nguồn --</option>
                {getByCategory('psu').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>

            {/* SSD */}
            <div className="form-group">
              <label className="form-label">Ổ cứng (SSD)</label>
              <select 
                className="form-select"
                value={selectedParts.ssd}
                onChange={(e) => setSelectedParts({ ...selectedParts, ssd: e.target.value })}
              >
                <option value="">-- Chọn SSD --</option>
                {getByCategory('ssd').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>

            {/* Case */}
            <div className="form-group">
              <label className="form-label">Vỏ máy (Case)</label>
              <select 
                className="form-select"
                value={selectedParts.case}
                onChange={(e) => setSelectedParts({ ...selectedParts, case: e.target.value })}
              >
                <option value="">-- Chọn Vỏ máy --</option>
                {getByCategory('case').map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({formatVND(item.price)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Compatibility Checker Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Báo Cáo Tương Thích & Giá Cả</h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <div className={renderCompatClass(compatResult.details.socket.status)}>
                  {renderCompatIcon(compatResult.details.socket.status)}
                  <span>{compatResult.details.socket.message}</span>
                </div>
                <div className={renderCompatClass(compatResult.details.ramType.status)}>
                  {renderCompatIcon(compatResult.details.ramType.status)}
                  <span>{compatResult.details.ramType.message}</span>
                </div>
                <div className={renderCompatClass(compatResult.details.power.status)}>
                  {renderCompatIcon(compatResult.details.power.status)}
                  <span>{compatResult.details.power.message}</span>
                </div>
              </div>

              {compatResult.issues.length > 0 && (
                <div style={{ background: 'var(--color-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '1rem', color: '#fecaca', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} /> Cảnh báo xung đột phần cứng:
                  </h3>
                  <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                    {compatResult.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                  </ul>
                </div>
              )}

              {compatResult.compatible && Object.values(selectedParts).some(v => v !== '') && (
                <div className="compat-log compat-log-ok" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} />
                  <span>Các linh kiện đã chọn tương thích hoàn toàn. Bạn có thể đặt mua hoặc gửi cho quản trị viên cấu hình này.</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tổng giá trị dự tính:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{formatVND(customPrice)}</span>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }} 
                disabled={!compatResult.compatible || !selectedParts.cpu || !selectedParts.mainboard}
                onClick={() => alert(`Cấu hình đã được lưu! Mã cấu hình tạm: CONFIG-${Math.floor(Math.random() * 90000) + 10000}. Bạn có thể gửi mã này cho nhân viên để lên đơn hàng.`)}
              >
                Lưu cấu hình đã ráp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
