import React, { useState, useEffect } from 'react';
import { Cpu, Wrench, Video, LayoutDashboard, Home as HomeIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Home from './pages/Home.jsx';
import SuggestionDetail from './pages/SuggestionDetail.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PCBuilder from './pages/PCBuilder.jsx';
import RepairService from './pages/RepairService.jsx';
import CameraPlanner from './pages/CameraPlanner.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [cpuExpanded, setCpuExpanded] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Restore user session if saved
  useEffect(() => {
    const savedUser = localStorage.getItem('itsurv_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('itsurv_user');
      }
    }
  }, []);

  // Sync user state with localStorage
  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem('itsurv_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('itsurv_user');
    }
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home setPage={setPage} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} setSelectedProductId={setSelectedProductId} setSelectedSuggestion={setSelectedSuggestion} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />;
      case 'product':
        return <ProductDetail productId={selectedProductId} setPage={setPage} />;
      case 'suggestion':
        return <SuggestionDetail suggestion={selectedSuggestion} setPage={setPage} />;
      case 'pc-builder':
        return <PCBuilder />;
      case 'repair-service':
        return <RepairService />;
      case 'camera-planner':
        return <CameraPlanner />;
      case 'dashboard':
        return <Dashboard user={user} setUser={handleSetUser} />;
      default:
        return <Home setPage={setPage} />;
    }
  };

  return (
    <div className="app-container">
      {/* Premium Sticky Header Navigation */}
      <header className="header-glass">
        <button aria-label="Toggle sidebar" title="Ẩn/Hiện danh mục" className="btn btn-ghost" style={{ marginRight: '0.5rem', padding: '6px' }} onClick={() => setSidebarVisible(v => !v)}>
          {sidebarVisible ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="logo-container" onClick={() => setPage('pc-builder')}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={22} />
          </div>
          <span className="logo-text">ITSurv-SMS</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li 
              className={`nav-item ${page === 'home' ? 'active' : ''}`}
              onClick={() => setPage('home')}
            >
              <HomeIcon size={16} /> Trang Chủ
            </li>
            <li 
              className={`nav-item ${page === 'pc-builder' ? 'active' : ''}`}
              onClick={() => setPage('pc-builder')}
            >
              <Cpu size={16} /> Lắp Ráp PC
            </li>
            <li 
              className={`nav-item ${page === 'repair-service' ? 'active' : ''}`}
              onClick={() => setPage('repair-service')}
            >
              <Wrench size={16} /> Sửa Chữa
            </li>
            <li 
              className={`nav-item ${page === 'camera-planner' ? 'active' : ''}`}
              onClick={() => setPage('camera-planner')}
            >
              <Video size={16} /> Thiết Kế Camera
            </li>
          </ul>
        </nav>

        <div>
          {user ? (
            <button className="auth-btn" onClick={() => setPage('dashboard')}>
              <LayoutDashboard size={16} /> Dashboard Portal
            </button>
          ) : (
            <button className="auth-btn" onClick={() => setPage('dashboard')}>
              Đăng Nhập
            </button>
          )}
        </div>
      </header>

      {/* Main Page Area with left sidebar */}
      <div className="site-body">
        <aside className="left-sidebar" style={{ display: sidebarVisible ? 'block' : 'none' }}>
          <ul className="left-cats">
            <li className={selectedCategory === null ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory(null); setSelectedBrand('all'); setPage('home'); }}><span className="cat-label">Tất cả</span></li>
            <li className={selectedCategory === 'cpu' ? 'cat-item active' : 'cat-item'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => { setSelectedCategory('cpu'); setSelectedBrand('all'); setPage('home'); }} style={{ cursor: 'pointer' }}>
                  <span className="cat-label">CPU</span>
                </div>
                <button aria-label="Toggle CPU brands" title="Hiện/ẩn hãng CPU" className="btn btn-ghost" onClick={() => setCpuExpanded(v => !v)} style={{ padding: 6 }}>
                  {cpuExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {cpuExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.75rem', marginTop: '0.5rem' }}>
                  <li className={selectedBrand === 'intel' ? 'cat-sub active' : 'cat-sub'} onClick={() => { setSelectedCategory('cpu'); setSelectedBrand('intel'); setPage('home'); }} style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>Intel</li>
                  <li className={selectedBrand === 'amd' ? 'cat-sub active' : 'cat-sub'} onClick={() => { setSelectedCategory('cpu'); setSelectedBrand('amd'); setPage('home'); }} style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>AMD</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'vga' ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory('vga'); setPage('home'); }}><span className="cat-label">VGA</span></li>
            <li className={selectedCategory === 'ram' ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory('ram'); setPage('home'); }}><span className="cat-label">RAM</span></li>
            <li className={selectedCategory === 'ssd' ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory('ssd'); setPage('home'); }}><span className="cat-label">SSD</span></li>
            <li className={selectedCategory === 'case' ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory('case'); setPage('home'); }}><span className="cat-label">CASE</span></li>
            <li className={selectedCategory === 'psu' ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory('psu'); setPage('home'); }}><span className="cat-label">NGUỒN</span></li>
            <li className={selectedCategory === 'mainboard' ? 'cat-item active' : 'cat-item'} onClick={() => { setSelectedCategory('mainboard'); setPage('home'); }}><span className="cat-label">MAINBOARD</span></li>
          </ul>
        </aside>
        <main className="main-content">
          {renderPage()}
        </main>
      </div>

      {/* Floating handle to reopen sidebar when hidden */}
      {!sidebarVisible && (
        <button
          onClick={() => setSidebarVisible(true)}
          aria-label="Open categories"
          title="Hiện danh mục"
          style={{ position: 'fixed', left: 8, top: 120, zIndex: 9999, padding: '8px 10px', borderRadius: 8 }}
          className="btn btn-primary btn-sm"
        >
          Danh mục
        </button>
      )}

      {/* Premium Footer */}
      <footer className="footer-glass">
        <div className="footer-links">
          <a href="#" className="footer-link" onClick={() => setPage('home')}>Trang Chủ</a>
          <a href="#" className="footer-link" onClick={() => setPage('pc-builder')}>Lắp PC Tự Động</a>
          <a href="#" className="footer-link" onClick={() => setPage('repair-service')}>Dịch Vụ Sửa Chữa</a>
          <a href="#" className="footer-link" onClick={() => setPage('camera-planner')}>Khảo Sát Camera</a>
        </div>
        <p>&copy; 2026 Đồ Án Tốt Nghiệp: Hệ Thống Điều Phối Kỹ Thuật & Tối Ưu Hóa Quy Trình Dịch Vụ Máy Tính - Camera (ITSurv-SMS)</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phát triển bằng công nghệ Node.js, Express, React, Vite & Modern Glassmorphism CSS</p>
      </footer>
    </div>
  );
}
