import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, AlertTriangle, HelpCircle, Printer, Download, FileText } from 'lucide-react';

export default function PCBuilder() {
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'custom'
  const reportRef = useRef();
  
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
      socket: { status: 'idle', message: '' },
      ramType: { status: 'idle', message: '' },
      power: { status: 'idle', message: '' },      case: { status: 'idle', message: '' },
      vgaLength: { status: 'idle', message: '' }
    }
  });
  const [showCompatDetails, setShowCompatDetails] = useState(false);
  const [customPrice, setCustomPrice] = useState(0);

  // Load Inventory for custom builder
  useEffect(() => {
    fetch('/api/pc-builder/products')
      .then(res => res.json())
      .then(data => setInventory(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading products:", err));
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
        const item = inventory.find(p => (p.id || p._id) === partId);
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
      .then(res => {
        if (!res.ok) throw new Error('Lỗi kiểm tra tương thích');
        return res.json();
      })
      .then(data => { if (data && data.details) setCompatResult(data); })
      .catch(err => console.error("Error checking compatibility:", err));

  }, [selectedParts, activeTab, inventory]);

  // Hiển thị báo cáo tương thích khi có linh kiện được chọn và không tự ẩn
  useEffect(() => {
    if (Object.values(selectedParts).every(v => v === '')) {
      setShowCompatDetails(false);
      return;
    }
    setShowCompatDetails(true);
  }, [selectedParts]);

  // Tự động reset Mainboard nếu thay đổi CPU không tương thích
  useEffect(() => {
    if (!selectedParts.cpu || !selectedParts.mainboard) return;

    const cpu = inventory.find(p => (p.id || p._id) === selectedParts.cpu);
    const mb = inventory.find(p => (p.id || p._id) === selectedParts.mainboard);

    if (cpu && mb) {
      const cs = cpu.attributes?.socket?.replace(/\s/g, '').toUpperCase();
      const ms = mb.attributes?.socket?.replace(/\s/g, '').toUpperCase();
      if (cs && ms && cs !== ms) {
        setSelectedParts(prev => ({ ...prev, mainboard: '' }));
      }
    }
  }, [selectedParts.cpu, inventory]);

  // Tự động reset RAM nếu thay đổi Mainboard không tương thích chuẩn RAM
  useEffect(() => {
    if (!selectedParts.mainboard || !selectedParts.ram) return;

    const mb = inventory.find(p => (p.id || p._id) === selectedParts.mainboard);
    const ram = inventory.find(p => (p.id || p._id) === selectedParts.ram);

    if (mb && ram) {
      const mr = mb.attributes?.ramType?.toUpperCase();
      const rr = ram.attributes?.ramType?.toUpperCase();
      if (mr && rr && mr !== rr) {
        setSelectedParts(prev => ({ ...prev, ram: '' }));
      }
    }
  }, [selectedParts.mainboard, inventory]);

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
    if (!Array.isArray(inventory)) return [];
    // So khớp không phân biệt hoa thường và hỗ trợ cả hai trường số lượng tồn kho
    return inventory
      .filter(item => 
        item.category?.toLowerCase() === category.toLowerCase() && 
        (item.stock > 0 || item.stockQuantity > 0)
      )
      .sort((a, b) => a.price - b.price); // Sắp xếp giá từ thấp đến cao
  };

  const getPartImage = (partId) => {
    if (!partId) return 'https://placehold.co/60x60?text=None';
    const item = inventory.find(p => (p.id || p._id) === partId);
    if (!item || !item.image) return 'https://placehold.co/60x60?text=Part';
    if (item.image.startsWith('http')) {
      return `/api/pc-builder/image?url=${encodeURIComponent(item.image)}`;
    }
    return item.image;
  };

  const getPerformanceLabel = (item) => {
    if (!item) return '';
    const cat = item.category?.toLowerCase();
    const price = item.price;

    if (cat === 'cpu') {
      if (price < 3000000) return 'Office';
      if (price < 8000000) return 'Gaming';
      return 'Workstation';
    }
    if (cat === 'mainboard') {
      if (price < 2500000) return 'Office';
      if (price < 6000000) return 'Gaming';
      return 'Workstation';
    }
    if (cat === 'ram') {
      const cap = item.attributes?.capacity || 0;
      if (cap <= 8) return 'Office';
      if (cap <= 16) return 'Gaming';
      return 'Workstation';
    }
    if (cat === 'vga') {
      if (price < 5000000) return 'Office';
      if (price < 15000000) return 'Gaming';
      return 'Workstation';
    }
    if (price < 1000000) return 'Office';
    if (price < 4000000) return 'Gaming';
    return 'Workstation';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportImage = async () => {
    // Lưu ý: Tính năng này yêu cầu thư viện html2canvas
    // Bạn cần chạy: npm install html2canvas --prefix frontend
    alert("Tính năng xuất ảnh đang được chuẩn bị. \n\nMẹo: Bạn có thể dùng nút 'In / Lưu PDF' và chọn 'Save as Image' hoặc 'Save as PDF' trong mục máy in!");
    // Nếu đã cài html2canvas, bạn có thể uncomment code sau:
    /* const canvas = await html2canvas(reportRef.current); ... */
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND', 
      maximumFractionDigits: 0 }).format(num);
  };

  const renderCompatIcon = (status) => {
    if (status === 'ok') return <Check size={18} style={{ color: '#10b981' }} />;
    if (status === 'error') return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
    return <HelpCircle size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  const renderCompatClass = (status) => {
    const animationClass = 'animate-slide-up';
    if (status === 'ok') return `compat-log compat-log-ok ${animationClass}`;
    if (status === 'error') return `compat-log compat-log-error ${animationClass}`;
    return `compat-log compat-log-idle ${animationClass}`;
  };

  return (
    <div>
      <style>
        {`
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slideUpFade 0.4s ease-out forwards;
          }
          .compat-log {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
          }
          .compat-log-ok {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .compat-log-error {
            background: rgba(139, 0, 0, 0.15); color: #8b0000; border: 1px solid rgba(139, 0, 0, 0.5);
            }
          @keyframes pulse-success-glow {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .btn-order-ready {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            color: white !important;
            font-size: 1.1rem !important;
            letter-spacing: 0.5px;
            animation: pulse-success-glow 2s infinite;
            border: none !important;
            transform: scale(1.02);
          }
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              background: white !important; 
              color: black !important;
              padding: 20px;
            }
            .glass-card { 
              background: white !important; 
              border: 1px solid #ccc !important; 
              box-shadow: none !important;
            }
            .btn, .form-group, .page-header, .page-subtitle { display: none !important; }
            .compat-log { color: black !important; background: #f0f0f0 !important; }
          }
        `}
      </style>
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
                <select 
                  className="form-select" 
                  value={need} 
                  onChange={(e) => setNeed(e.target.value)}
                >
                  <option value="office">Văn phòng / Học tập (Tập trung CPU, RAM, không VGA)</option>
                  <option value="gaming">Chơi Game giải trí (Tập trung VGA rời mạnh mẽ)</option>
                  <option value="design">Đồ họa / Render chuyên nghiệp (Tập trung CPU mạnh, nhiều RAM, VGA ổn định)</option>
                </select>
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.cpu)} 
                  alt="CPU" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.cpu}
                  onChange={(e) => setSelectedParts({ ...selectedParts, cpu: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn CPU --</option>
                  {getByCategory('cpu').map((item, idx) => (
                    <option key={item.id || item._id || idx} value={item.id || item._id}>
                      [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mainboard */}
            <div className="form-group">
              <label className="form-label">Bo mạch chủ (Mainboard)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.mainboard)} 
                  alt="Mainboard" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.mainboard}
                  onChange={(e) => setSelectedParts({ ...selectedParts, mainboard: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn Mainboard --</option>
                  {(() => {
                    const allMbs = getByCategory('mainboard');
                    const selectedCpu = inventory.find(p => (p.id || p._id) === selectedParts.cpu);
                    const cpuSocket = selectedCpu?.attributes?.socket?.replace(/\s/g, '').toUpperCase();

                    const filteredMbs = cpuSocket 
                      ? allMbs.filter(mb => mb.attributes?.socket?.replace(/\s/g, '').toUpperCase() === cpuSocket)
                      : allMbs;

                    return filteredMbs.map((item, idx) => (
                      <option key={item.id || item._id || idx} value={item.id || item._id}>
                        [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* RAM */}
            <div className="form-group">
              <label className="form-label">Bộ nhớ trong (RAM)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.ram)} 
                  alt="RAM" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.ram}
                  onChange={(e) => setSelectedParts({ ...selectedParts, ram: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn RAM --</option>
                  {(() => {
                    const allRams = getByCategory('ram');
                    const selectedMb = inventory.find(p => (p.id || p._id) === selectedParts.mainboard);
                    const mbRamType = selectedMb?.attributes?.ramType?.toUpperCase();

                    const filteredRams = mbRamType 
                      ? allRams.filter(ram => ram.attributes?.ramType?.toUpperCase() === mbRamType)
                      : allRams;

                    return filteredRams.map((item, idx) => (
                      <option key={item.id || item._id || idx} value={item.id || item._id}>
                        [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* VGA */}
            <div className="form-group">
              <label className="form-label">Card màn hình (VGA)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.vga)} 
                  alt="VGA" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.vga}
                  onChange={(e) => setSelectedParts({ ...selectedParts, vga: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Không sử dụng (Sử dụng GPU tích hợp) --</option>
                  {getByCategory('vga').map((item, idx) => (
                    <option key={item.id || item._id || idx} value={item.id || item._id}>
                      [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PSU */}
            <div className="form-group">
              <label className="form-label">Bộ nguồn (PSU)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.psu)} 
                  alt="PSU" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.psu}
                  onChange={(e) => setSelectedParts({ ...selectedParts, psu: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn Nguồn --</option>
                  {getByCategory('psu').map((item, idx) => (
                    <option key={item.id || item._id || idx} value={item.id || item._id}>
                      [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SSD */}
            <div className="form-group">
              <label className="form-label">Ổ cứng (SSD)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.ssd)} 
                  alt="SSD" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.ssd}
                  onChange={(e) => setSelectedParts({ ...selectedParts, ssd: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn SSD --</option>
                  {getByCategory('ssd').map((item, idx) => (
                    <option key={item.id || item._id || idx} value={item.id || item._id}>
                      [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Case */}
            <div className="form-group">
              <label className="form-label">Vỏ máy (Case)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img 
                  src={getPartImage(selectedParts.case)} 
                  alt="Case" 
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                />
                <select 
                  className="form-select"
                  value={selectedParts.case}
                  onChange={(e) => setSelectedParts({ ...selectedParts, case: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Chọn Vỏ máy --</option>
                  {getByCategory('case').map((item, idx) => (
                    <option key={item.id || item._id || idx} value={item.id || item._id}>
                      [{getPerformanceLabel(item)}] {item.name} ({formatVND(item.price)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compatibility Checker Panel */}
          <div className="glass-card print-area" ref={reportRef} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Báo Cáo Tương Thích & Giá Cả</h2>

              {/* Detailed list of selected components */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(selectedParts).map(([cat, partId]) => {
                  if (!partId) return null;
                  const item = inventory.find(p => (p.id || p._id) === partId);
                  if (!item) return null;
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <img src={getPartImage(partId)} alt={cat} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700 }}>{cat}</div>
                        <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {formatVND(item.price)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showCompatDetails && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    {compatResult?.details?.socket?.status !== 'idle' && (
                      <div className={renderCompatClass(compatResult?.details?.socket?.status)}>
                        {renderCompatIcon(compatResult?.details?.socket?.status)}
                        <span>{compatResult?.details?.socket?.message}</span>
                      </div>
                    )}
                    {compatResult?.details?.ramType?.status !== 'idle' && (
                      <div className={renderCompatClass(compatResult?.details?.ramType?.status)}>
                        {renderCompatIcon(compatResult?.details?.ramType?.status)}
                        <span>{compatResult?.details?.ramType?.message}</span>
                      </div>
                    )}
                    {compatResult?.details?.power?.status !== 'idle' && (
                      <div className={renderCompatClass(compatResult?.details?.power?.status)}>
                        {renderCompatIcon(compatResult?.details?.power?.status)}
                        <span>{compatResult?.details?.power?.message}</span>
                      </div>
                    )}
                    {compatResult?.details?.case?.status !== 'idle' && (
                      <div className={renderCompatClass(compatResult?.details?.case?.status)}>
                        {renderCompatIcon(compatResult?.details?.case?.status)}
                        <span>{compatResult?.details?.case?.message}</span>
                      </div>
                    )}
                    {compatResult?.details?.vgaLength?.status !== 'idle' && (
                      <div className={renderCompatClass(compatResult?.details?.vgaLength?.status)}>
                        {renderCompatIcon(compatResult?.details?.vgaLength?.status)}
                        <span>{compatResult?.details?.vgaLength?.message}</span>
                      </div>
                    )}
                  </div>

                  {compatResult.issues.length > 0 && (
                    <div 
                      className="animate-slide-up"
                      style={{ 
                          background: 'rgba(139, 0, 0, 0.15)', border: '2px solid var(--color-danger)', borderRadius: '12px', padding: '1.25rem', color: '#8b0000', marginBottom: '1.5rem' 
                        }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} /> PHÁT HIỆN XUNG ĐỘT LINH KIỆN:
                      </h3>
                      <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                        {compatResult.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                      </ul>
                    </div>
                  )}

                  {compatResult.compatible && Object.values(selectedParts).some(v => v !== '') && (
                    <div className="compat-log compat-log-ok animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={18} />
                      <span>Các linh kiện đã chọn tương thích hoàn toàn. Bạn có thể đặt mua hoặc gửi cho quản trị viên cấu hình này.</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tổng giá trị dự tính:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{formatVND(customPrice)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  className={`btn ${compatResult.compatible && selectedParts.cpu && selectedParts.mainboard ? 'btn-order-ready' : 'btn-primary'}`} 
                  style={{ width: '100%', transition: 'all 0.3s ease' }} 
                  disabled={!selectedParts.cpu || !selectedParts.mainboard || !compatResult.compatible}
                  onClick={() => alert(`Đơn hàng đã được khởi tạo! Mã đơn lắp ráp: PC-BUILD-${Math.floor(Math.random() * 90000) + 10000}. Nhân viên tư vấn sẽ liên hệ với bạn trong vòng 15 phút.`)}
                >
                  {compatResult.compatible && selectedParts.cpu && selectedParts.mainboard 
                    ? 'ĐẶT MUA NGAY' 
                    : 'Lưu cấu hình đã ráp'}
                </button>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Printer size={16} /> In / Lưu PDF
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> Xuất File Ảnh
                  </button>
                </div>
                
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                  * Xuất file để gửi cho nhân viên tư vấn hoặc lưu trữ cá nhân.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
