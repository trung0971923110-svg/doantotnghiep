import React, { useState, useEffect } from 'react';
import { Package, ShieldAlert, Users, TrendingUp, LogOut, CheckCircle, RefreshCw, Plus, FileSpreadsheet, Lock } from 'lucide-react';

export default function Dashboard({ user, setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Dashboard Data States
  const [activeTab, setActiveTab] = useState('inventory'); // admin: 'stats' | 'inventory' | 'repairs' | technician: 'my-jobs'
  const [inventory, setInventory] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Action States
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('inspecting');
  const [statusNote, setStatusNote] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [serviceFeeInput, setServiceFeeInput] = useState(150000);
  const [quickStockQty, setQuickStockQty] = useState({});

  // Fetch data on load or when user role changes
  const fetchData = () => {
    if (!user) return;
    setLoadingData(true);

    // Fetch Inventory
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data))
      .catch(err => console.error("Error fetching inventory:", err));

    // Fetch Repairs
    fetch('/api/repairs')
      .then(res => res.json())
      .then(data => setRepairs(data))
      .catch(err => console.error("Error fetching repairs:", err));

    // Set tech list
    setTechnicians([
      { id: 'usr-002', name: 'Trần Minh Kỹ Thuật' },
      { id: 'usr-003', name: 'Lê Anh Tuấn (KTV)' }
    ]);
    
    setLoadingData(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => {
        if (!res.ok) throw new Error('Tài khoản hoặc mật khẩu không đúng.');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoadingLogin(false);
        // Default tab based on role
        if (data.role === 'admin') {
          setActiveTab('stats');
        } else {
          setActiveTab('my-jobs');
        }
      })
      .catch(err => {
        setLoginError(err.message);
        setLoadingLogin(false);
      });
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedJob(null);
    setUsername('');
    setPassword('');
  };

  // Admin: Quick add stock
  const handleAddStock = (id) => {
    const qty = quickStockQty[id] || 0;
    if (qty <= 0) return;

    fetch(`/api/inventory/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty, mode: 'add' })
    })
      .then(res => res.json())
      .then(() => {
        // Reset quick stock input
        setQuickStockQty({ ...quickStockQty, [id]: '' });
        fetchData();
        alert('Cập nhật tồn kho thành công!');
      })
      .catch(err => console.error(err));
  };

  // Admin: Assign technician to repair job
  const handleAssignTech = (repairId, techId) => {
    fetch(`/api/repairs/${repairId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techId })
    })
      .then(res => res.json())
      .then(() => {
        fetchData();
        alert('Đã gán kỹ thuật viên thành công!');
      })
      .catch(err => console.error(err));
  };

  // Technician: Update repair status
  const handleUpdateStatus = (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    fetch(`/api/repairs/${selectedJob.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusUpdate, note: statusNote })
    })
      .then(res => res.json())
      .then(data => {
        setSelectedJob(data);
        setStatusNote('');
        fetchData();
        alert('Cập nhật trạng thái thành công!');
      })
      .catch(err => console.error(err));
  };

  // Technician: Add replacement part to job
  const handleAddPartToJob = (e) => {
    e.preventDefault();
    if (!selectedJob || !selectedPartId) return;

    fetch(`/api/repairs/${selectedJob.id}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partId: selectedPartId, qty: Number(partQty) })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.message); });
        }
        return res.json();
      })
      .then(data => {
        setSelectedJob(data);
        setSelectedPartId('');
        setPartQty(1);
        fetchData();
        alert('Thêm linh kiện thành công!');
      })
      .catch(err => {
        alert(err.message);
      });
  };

  // Technician: Adjust service fee and finalize bill
  const handleFinalizeBill = (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    fetch(`/api/repairs/${selectedJob.id}/finalize`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceFee: Number(serviceFeeInput) })
    })
      .then(res => res.json())
      .then(data => {
        setSelectedJob(data);
        fetchData();
        alert('Đã chốt hóa đơn thành công!');
      })
      .catch(err => console.error(err));
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN');
  };

  // Filter technician jobs
  const myJobs = repairs.filter(r => r.assignedTechId === (user?.username === 'tech1' ? 'usr-002' : 'usr-003'));

  // Inventory warnings count
  const lowStockCount = inventory.filter(item => item.stock <= item.minStock).length;

  // Total earnings estimation
  const totalRevenue = repairs.reduce((sum, r) => sum + r.totalPrice, 0);

  // Render Login page if not authenticated
  if (!user) {
    return (
      <div style={{ maxWidth: '450px', margin: '3rem auto 0' }}>
        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1rem' }}>
              <Lock size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Đăng Nhập Hệ Thống Portal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Truy cập dành cho Quản lý & Kỹ thuật viên cửa hàng
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Tên tài khoản</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem', background: 'var(--color-danger-bg)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loadingLogin}>
              {loadingLogin ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tài khoản Demo:</p>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
              <li><strong>Admin:</strong> <code style={{ color: 'var(--text-primary)' }}>admin</code> / Mật khẩu: <code style={{ color: 'var(--text-primary)' }}>admin123</code></li>
              <li><strong>Kỹ thuật viên 1:</strong> <code style={{ color: 'var(--text-primary)' }}>tech1</code> / Mật khẩu: <code style={{ color: 'var(--text-primary)' }}>tech123</code></li>
              <li><strong>Kỹ thuật viên 2:</strong> <code style={{ color: 'var(--text-primary)' }}>tech2</code> / Mật khẩu: <code style={{ color: 'var(--text-primary)' }}>tech123</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Render Portal if Authenticated
  return (
    <div>
      {/* Top Banner Bar */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Xin chào,</span>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user.name} ({user.role === 'admin' ? 'Chủ cửa hàng' : 'KTV'})</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} title="Tải lại dữ liệu">
            <RefreshCw size={16} /> Làm mới
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        {user.role === 'admin' ? (
          <>
            <button 
              className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setActiveTab('stats'); setSelectedJob(null); }}
            >
              <TrendingUp size={16} /> Báo Cáo Chung
            </button>
            <button 
              className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setActiveTab('inventory'); setSelectedJob(null); }}
            >
              <Package size={16} /> Quản Lý Kho
            </button>
            <button 
              className={`btn ${activeTab === 'repairs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setActiveTab('repairs'); setSelectedJob(null); }}
            >
              <FileSpreadsheet size={16} /> Điều Phối Sửa Chữa
            </button>
          </>
        ) : (
          <button 
            className={`btn ${activeTab === 'my-jobs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => { setActiveTab('my-jobs'); }}
          >
            <FileSpreadsheet size={16} /> Công Việc Được Giao ({myJobs.length})
          </button>
        )}
      </div>

      {/* RENDER ADMIN: STATS */}
      {user.role === 'admin' && activeTab === 'stats' && (
        <div>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Users size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tổng số phiếu sửa chữa</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{repairs.length}</h3>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderLeft: lowStockCount > 0 ? '3px solid var(--color-danger)' : 'none' }}>
              <ShieldAlert size={32} style={{ color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cảnh báo linh kiện sắp hết</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{lowStockCount}</h3>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Package size={32} style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Số mặt hàng trong kho</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{inventory.length}</h3>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <TrendingUp size={32} style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Doanh thu dự kiến</p>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.5rem' }}>{formatVND(totalRevenue)}</h3>
            </div>
          </div>

          {/* Quick Warning Alerts List */}
          {lowStockCount > 0 && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--color-danger)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fecaca', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} /> Cảnh báo: Các mặt hàng dưới mức tối thiểu cần nhập gấp!
              </h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Linh kiện</th>
                      <th>Danh mục</th>
                      <th style={{ textAlign: 'center' }}>Hiện có</th>
                      <th style={{ textAlign: 'center' }}>Mức tối thiểu</th>
                      <th style={{ textAlign: 'right' }}>Giá nhập ước tính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.filter(i => i.stock <= i.minStock).map(item => (
                      <tr key={item.id} style={{ color: '#fecaca' }}>
                        <td><strong>{item.name}</strong></td>
                        <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{item.category}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.stock}</td>
                        <td style={{ textAlign: 'center' }}>{item.minStock}</td>
                        <td style={{ textAlign: 'right' }}>{formatVND(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER ADMIN: INVENTORY */}
      {user.role === 'admin' && activeTab === 'inventory' && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Bảng số liệu quản lý Kho linh kiện</h2>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã ID</th>
                  <th>Tên linh kiện</th>
                  <th>Danh mục</th>
                  <th style={{ textAlign: 'right' }}>Giá bán lẻ</th>
                  <th style={{ textAlign: 'center' }}>Số lượng</th>
                  <th style={{ textAlign: 'center' }}>Mức an toàn</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Nhập thêm hàng</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => {
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} style={{ background: isLow ? 'rgba(239, 68, 68, 0.05)' : 'none' }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.id}</td>
                      <td><strong>{item.name}</strong></td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatVND(item.price)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)' }}>{item.stock}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.minStock}</td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-danger">Cần nhập hàng</span>
                        ) : (
                          <span className="badge badge-success">An toàn</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }} 
                            placeholder="SL"
                            min="1"
                            value={quickStockQty[item.id] || ''}
                            onChange={(e) => setQuickStockQty({ ...quickStockQty, [item.id]: e.target.value })}
                          />
                          <button className="btn btn-primary btn-sm" style={{ padding: '0.3rem 0.5rem' }} onClick={() => handleAddStock(item.id)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER ADMIN: REPAIR ALLOCATION */}
      {user.role === 'admin' && activeTab === 'repairs' && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Danh sách đặt lịch sửa chữa & Phân công kỹ thuật</h2>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Khách hàng</th>
                  <th>Thiết bị</th>
                  <th>Lỗi báo</th>
                  <th>Trạng thái</th>
                  <th>KTV Phụ trách</th>
                  <th>Gán KTV</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map(rep => {
                  const assignedTech = technicians.find(t => t.id === rep.assignedTechId);
                  return (
                    <tr key={rep.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--secondary)' }}>{rep.id}</td>
                      <td>
                        <strong>{rep.customerName}</strong>
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SĐT: {rep.customerPhone}</span>
                      </td>
                      <td>
                        <strong>{rep.deviceName}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{rep.deviceType}</span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rep.issueDescription}>
                        {rep.issueDescription}
                      </td>
                      <td>
                        {rep.status === 'received' && <span className="badge badge-info">Đã nhận</span>}
                        {rep.status === 'inspecting' && <span className="badge badge-warning">Đang kiểm tra</span>}
                        {rep.status === 'fixing' && <span className="badge badge-warning">Đang sửa</span>}
                        {rep.status === 'completed' && <span className="badge badge-success">Sửa xong</span>}
                      </td>
                      <td>
                        <strong style={{ color: assignedTech ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {assignedTech ? assignedTech.name : 'Chưa phân công'}
                        </strong>
                      </td>
                      <td>
                        <select 
                          className="form-select" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          value={rep.assignedTechId || ''}
                          onChange={(e) => handleAssignTech(rep.id, e.target.value)}
                        >
                          <option value="">-- Phân công KTV --</option>
                          {technicians.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TECHNICIAN: MY JOBS */}
      {user.role === 'technician' && activeTab === 'my-jobs' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          
          {/* Job List */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Công Việc Được Phân Công</h2>
            
            {myJobs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Không có nhiệm vụ nào được phân công tại thời điểm hiện tại.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myJobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setServiceFeeInput(job.serviceFee);
                    }}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: selectedJob?.id === job.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                      background: selectedJob?.id === job.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--secondary)' }}>{job.id}</strong>
                      <span className={`badge ${job.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {job.status}
                      </span>
                    </div>
                    <p style={{ fontWeight: 600 }}>{job.deviceName}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Khách hàng: {job.customerName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job Detail & Actions panel */}
          {selectedJob ? (
            <div className="glass-card">
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Chi tiết & Thao tác nghiệp vụ</h2>
              
              <div style={{ background: 'rgba(7,9,14,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <p><strong>Khách hàng:</strong> {selectedJob.customerName} - {selectedJob.customerPhone}</p>
                <p><strong>Thiết bị:</strong> {selectedJob.deviceName}</p>
                <p><strong>Lỗi báo:</strong> <em>"{selectedJob.issueDescription}"</em></p>
                <p><strong>Ngày nhận:</strong> {formatDate(selectedJob.createdAt)}</p>
              </div>

              {/* Action 1: Update Status */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Cập Nhật Trạng Thái Quy Trình</h3>
                <form onSubmit={handleUpdateStatus} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <div className="grid-2" style={{ gap: '0.5rem' }}>
                    <select 
                      className="form-select"
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                    >
                      <option value="inspecting">Đang kiểm tra & Báo giá</option>
                      <option value="fixing">Đang sửa chữa / Thay thế</option>
                      <option value="completed">Đã sửa xong & Bàn giao</option>
                    </select>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ghi chú cập nhật tiến độ..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">Cập nhật tiến trình</button>
                </form>
              </div>

              {/* Action 2: Add replacement parts */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Kê linh kiện thay thế (Dùng từ Kho)</h3>
                <form onSubmit={handleAddPartToJob} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <select 
                      className="form-select"
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn linh kiện kho --</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({formatVND(item.price)} - Tồn: {item.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ width: '70px' }} 
                      min="1"
                      value={partQty}
                      onChange={(e) => setPartQty(e.target.value)}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm">Thêm linh kiện</button>
                </form>

                {/* Parts Used List */}
                {selectedJob.partsUsed && selectedJob.partsUsed.length > 0 && (
                  <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--glass-border)', padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Linh kiện đã kê:</p>
                    <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.85rem' }}>
                      {selectedJob.partsUsed.map((p, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <span>{p.name} (x{p.qty})</span>
                          <span>{formatVND(p.price * p.qty)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action 3: Invoice generator */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Hóa Đơn Dịch Vụ Sửa Chữa</h3>
                <form onSubmit={handleFinalizeBill} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>Phí dịch vụ công (VND):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={serviceFeeInput}
                      onChange={(e) => setServiceFeeInput(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1.4rem' }}>Chốt Hóa Đơn</button>
                </form>

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tổng tiền linh kiện:</span>
                    <span>{formatVND(selectedJob.partsUsed?.reduce((sum, p) => sum + (p.price * p.qty), 0) || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span>Tiền công kỹ thuật:</span>
                    <span>{formatVND(selectedJob.serviceFee)}</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-success)' }}>
                    <span>TỔNG THỰC THU:</span>
                    <span>{formatVND(selectedJob.totalPrice)}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
              <FileSpreadsheet size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Chọn một công việc trong danh sách bên trái để cập nhật trạng thái sửa chữa, kê thêm linh kiện thay thế và xuất hóa đơn dịch vụ.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
