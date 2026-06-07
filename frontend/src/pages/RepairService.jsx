import React, { useState } from 'react';
import { Wrench, Phone, Search, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function RepairService() {
  const [activeMode, setActiveMode] = useState('book'); // 'book' or 'track'

  // Booking states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceType, setDeviceType] = useState('pc');
  const [deviceName, setDeviceName] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [bookedTicket, setBookedTicket] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Tracking states
  const [searchPhone, setSearchPhone] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleBook = (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookedTicket(null);

    fetch('/api/repairs/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        deviceType,
        deviceName,
        issueDescription
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message || 'Lỗi đặt lịch sửa chữa'); });
        }
        return res.json();
      })
      .then(data => {
        setBookedTicket(data);
        setBookingLoading(false);
        setSearchError('');
        // Clear form
        setCustomerName('');
        setCustomerPhone('');
        setDeviceName('');
        setIssueDescription('');
      })
      .catch(err => {
        console.error("Booking error:", err);
        setBookingLoading(false);
        setSearchError(err.message);
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    setSelectedTicket(null);

    let url = '';
    if (searchId) {
      const code = searchId.trim();
      // Nếu bắt đầu bằng "REP-" thì gọi endpoint tìm theo mã code, ngược lại tìm theo ID
      if (code.toUpperCase().startsWith('REP-')) {
        url = `/api/repairs/code/${code.toUpperCase()}`;
      } else {
        url = `/api/repairs/${code}`;
      }
    } else if (searchPhone) {
      url = `/api/repairs/customer/${searchPhone.trim()}`;
    } else {
      setSearchError('Vui lòng nhập số điện thoại hoặc mã phiếu để tìm kiếm.');
      setSearchLoading(false);
      return;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Không tìm thấy phiếu sửa chữa tương ứng.');
        return res.json();
      })
      .then(data => {
        const results = Array.isArray(data) ? data : [data];
        setSearchResults(results);
        if (results.length > 0) {
          setSelectedTicket(results[0]);
        } else {
          setSearchError('Không có lịch sử sửa chữa cho số điện thoại này.');
        }
        setSearchLoading(false);
      })
      .catch(err => {
        setSearchError(err.message);
        setSearchLoading(false);
      });
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received': return <span className="badge badge-info">Đã tiếp nhận</span>;
      case 'inspecting': return <span className="badge badge-warning">Đang kiểm tra</span>;
      case 'fixing': return <span className="badge badge-warning">Đang sửa chữa</span>;
      case 'completed': return <span className="badge badge-success">Đã hoàn thành</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getDeviceLabel = (type) => {
    switch (type) {
      case 'pc': return 'Máy tính để bàn (PC)';
      case 'laptop': return 'Máy tính xách tay (Laptop)';
      case 'printer': return 'Máy in';
      case 'camera': return 'Camera giám sát';
      default: return type;
    }
  };

  return (
    <div>
      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
          .booking-form-loading {
            opacity: 0.6;
            pointer-events: none;
            transition: all 0.4s ease;
          }
        `}
      </style>
      <div className="page-header">
        <h1 className="page-title">Tiếp Nhận & Theo Dõi Sửa Chữa</h1>
        <p className="page-subtitle">Đặt lịch sửa chữa trực tuyến và giám sát quy trình xử lý lỗi thời gian thực</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeMode === 'book' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('book')}
        >
          <Wrench size={18} /> Đăng Ký Đặt Lịch Hẹn
        </button>
        <button 
          className={`btn ${activeMode === 'track' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('track')}
        >
          <Search size={18} /> Theo Dõi Tiến Độ (Realtime)
        </button>
      </div>

      {/* MODE 1: BOOKING FORM */}
      {activeMode === 'book' && (
        <div style={{ width: '100%', padding: '0 1rem' }}>
          {bookedTicket ? (
            <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--color-success)' }}>
              <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '1rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={48} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Đặt Lịch Thành Công!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Hệ thống đã tiếp nhận lịch hẹn của bạn. Kỹ thuật viên sẽ sớm kiểm tra thiết bị.
              </p>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
                <p style={{ marginBottom: '0.5rem' }}><strong>Mã Phiếu Hẹn:</strong> <span style={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '1.1rem' }}>{bookedTicket.repairCode}</span></p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Khách Hàng:</strong> {bookedTicket.customerName} - {bookedTicket.customerPhone}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Thiết Bị:</strong> {getDeviceLabel(bookedTicket.deviceType)} ({bookedTicket.deviceName})</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Lỗi Báo:</strong> {bookedTicket.issueDescription}</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Trạng Thái:</strong> {getStatusBadge(bookedTicket.status)}</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSearchId(bookedTicket.repairCode);
                    setActiveMode('track');
                    setSelectedTicket(bookedTicket);
                    setSearchResults([bookedTicket]);
                  }}
                >
                  Theo Dõi Tiến Trình Trực Tiếp
                </button>
                <button className="btn btn-secondary" onClick={() => setBookedTicket(null)}>
                  Đặt Lịch Thêm
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', textAlign: 'center' }}>Đăng Ký Phiếu Sửa Chữa</h2>
              <form onSubmit={handleBook} className={bookingLoading ? 'booking-form-loading' : ''}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Họ & Tên khách hàng</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Nguyễn Văn A" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại liên lạc</label>
                    <input 
                      type="tel" 
                      className="form-input"
                      placeholder="09xx xxx xxx" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Loại thiết bị</label>
                    <select 
                      className="form-select"
                      value={deviceType}
                      onChange={(e) => setDeviceType(e.target.value)}
                    >
                      <option value="pc">Máy tính bàn (PC)</option>
                      <option value="laptop">Máy tính xách tay (Laptop)</option>
                      <option value="printer">Máy in văn phòng</option>
                      <option value="camera">Hệ thống Camera</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tên thiết bị / Model máy</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Canon 2900 / ASUS ROG..." 
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả tình trạng lỗi của máy</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Ví dụ: Máy bật nguồn quạt quay nhưng không xuất hình, máy in kẹt giấy liên tục..." 
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

              {searchError && activeMode === 'book' && (
                <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-danger-bg)', padding: '0.75rem', borderRadius: '8px' }}>
                  <AlertCircle size={18} />
                  <span>{searchError}</span>
                </div>
              )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <><Loader2 size={20} className="animate-spin" /> Đang gửi thông tin...</>
                  ) : 'Gửi Yêu Cầu Sửa Chữa'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: TRACKING TIMELINE */}
      {activeMode === 'track' && (
        <div>
          {/* Search bar */}
          <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Nhập thông tin tra cứu phiếu sửa chữa</h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 250px' }}>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Nhập Số điện thoại (Ví dụ: 0912345678)"
                  value={searchPhone}
                  onChange={(e) => {
                    setSearchPhone(e.target.value);
                    setSearchId('');
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>hoặc</div>
              <div style={{ flex: '1 1 200px' }}>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Nhập Mã phiếu (Ví dụ: REP-1001)"
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    setSearchPhone('');
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto' }} disabled={searchLoading}>
                {searchLoading ? 'Đang tìm...' : 'Tra cứu'}
              </button>
            </form>
            {searchError && (
              <div style={{ marginTop: '1rem', color: 'var(--color-danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertCircle size={16} />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Search results list & timeline detail */}
          {searchResults.length > 0 && (
            <div className="grid-2" style={{ alignItems: 'start' }}>
              {/* Results List */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Danh Sách Phiếu Sửa Chữa</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {searchResults.map(ticket => (
                    <div 
                      key={ticket._id} 
                      onClick={() => setSelectedTicket(ticket)}
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        border: selectedTicket?._id === ticket._id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: selectedTicket?._id === ticket._id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{ticket.repairCode}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{getDeviceLabel(ticket.deviceType)}: {ticket.deviceName}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Khách hàng: {ticket.customerName}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.5rem' }}>Ngày gửi: {formatDate(ticket.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Ticket Timeline Details */}
              {selectedTicket && (
                <div className="glass-card">
                  <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Phiếu Sửa Chữa: {selectedTicket.repairCode}</h3>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                      Thiết bị: <strong>{selectedTicket.deviceName}</strong> ({getDeviceLabel(selectedTicket.deviceType)})
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      Tình trạng báo lỗi: <em>"{selectedTicket.issueDescription}"</em>
                    </p>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Tiến Trình Xử Lý Thời Gian Thực:</h4>
                  
                  <div className="timeline">
                    {/* Received */}
                    <div className={`timeline-item ${selectedTicket.history?.some(h => h.status === 'received') ? 'completed' : ''} ${selectedTicket.status === 'received' ? 'active' : ''}`}>
                      <div className="timeline-badge"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">
                          {formatDate(selectedTicket.history?.find(h => h.status === 'received')?.timestamp) || 'Đang cập nhật'}
                        </div>
                        <div className="timeline-title">Đã Tiếp Nhận Thiết Bị</div>
                        <div className="timeline-desc">
                          {selectedTicket.history?.find(h => h.status === 'received')?.note || 'Hệ thống đã ghi nhận phiếu đăng ký dịch vụ của khách hàng.'}
                        </div>
                      </div>
                    </div>

                    {/* Inspecting */}
                    <div className={`timeline-item ${selectedTicket.history?.some(h => h.status === 'inspecting') ? 'completed' : ''} ${selectedTicket.status === 'inspecting' ? 'active' : ''}`}>
                      <div className="timeline-badge"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">
                          {formatDate(selectedTicket.history?.find(h => h.status === 'inspecting')?.timestamp)}
                        </div>
                        <div className="timeline-title">Đang Kiểm Tra & Báo Giá</div>
                        <div className="timeline-desc">
                          {selectedTicket.history?.find(h => h.status === 'inspecting')?.note || 'Đang chờ kỹ thuật viên kiểm tra lỗi phần cứng và đề xuất linh kiện thay thế.'}
                        </div>
                      </div>
                    </div>

                    {/* Fixing */}
                    <div className={`timeline-item ${selectedTicket.history?.some(h => h.status === 'fixing') ? 'completed' : ''} ${selectedTicket.status === 'fixing' ? 'active' : ''}`}>
                      <div className="timeline-badge"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">
                          {formatDate(selectedTicket.history?.find(h => h.status === 'fixing')?.timestamp)}
                        </div>
                        <div className="timeline-title">Đang Tiến Hành Sửa Chữa / Thay Thế</div>
                        <div className="timeline-desc">
                          {selectedTicket.history?.find(h => h.status === 'fixing')?.note || 'Đang chờ tiến hành sửa chữa lỗi hệ thống hoặc thay thế các linh kiện bị hỏng.'}
                        </div>
                        
                        {/* Display parts used if any */}
                        {selectedTicket.partsUsed && selectedTicket.partsUsed.length > 0 && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(7,9,14,0.4)', borderRadius: '6px', border: '1px dashed var(--glass-border)' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Linh kiện thay thế sử dụng:</p>
                            <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.8rem' }}>
                              {selectedTicket.partsUsed.map((p, i) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>- {p.name} (x{p.qty})</span>
                                  <span>{formatVND(p.price * p.qty)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed */}
                    <div className={`timeline-item ${selectedTicket.status === 'completed' ? 'completed active' : ''}`}>
                      <div className="timeline-badge"></div>
                      <div className="timeline-content">
                        <div className="timeline-date">
                          {formatDate(selectedTicket.history?.find(h => h.status === 'completed')?.timestamp)}
                        </div>
                        <div className="timeline-title">Đã Sửa Xong & Bàn Giao</div>
                        <div className="timeline-desc">
                          {selectedTicket.history?.find(h => h.status === 'completed')?.note || 'Thiết bị sẽ được kỹ thuật viên hoàn tất sửa chữa, kiểm tra cẩn thận trước khi bàn giao lại.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Invoice details if repair has values */}
                  {selectedTicket.totalPrice > 0 && (
                    <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} style={{ color: 'var(--primary)' }} />
                        HÓA ĐƠN CHI TIẾT DỊCH VỤ
                      </h4>
                      <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Tiền công kỹ thuật:</span>
                          <span>{formatVND(selectedTicket.serviceFee)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Tổng linh kiện thay thế:</span>
                          <span>
                            {formatVND((selectedTicket.partsUsed || []).reduce((sum, p) => sum + (p.price * p.qty), 0))}
                          </span>
                        </div>
                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
                          <span>Tổng chi phí cần thanh toán:</span>
                          <span style={{ color: 'var(--color-success)' }}>{formatVND(selectedTicket.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!searchResults.length && !searchLoading && (
            <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '5rem 1rem', width: '100%' }}>
              <Phone size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>Vui lòng nhập số điện thoại hoặc mã phiếu của bạn để kiểm tra tiến trình sửa chữa theo thời gian thực.</p>
            </div>
          )}

          {searchLoading && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '5rem 1rem' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid rgba(6, 182, 212, 0.1)', borderTopColor: 'var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
              <p>Đang tìm kiếm thông tin phiếu sửa chữa...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
