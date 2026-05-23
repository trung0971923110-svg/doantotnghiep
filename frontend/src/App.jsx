import React, { useState, useEffect } from 'react';
import { Cpu, Wrench, Video, LayoutDashboard, Home as HomeIcon } from 'lucide-react';
import Home from './pages/Home.jsx';
import PCBuilder from './pages/PCBuilder.jsx';
import RepairService from './pages/RepairService.jsx';
import CameraPlanner from './pages/CameraPlanner.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);

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
        return <Home setPage={setPage} />;
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
        <div className="logo-container" onClick={() => setPage('home')}>
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

      {/* Main Page Area */}
      <main className="main-content">
        {renderPage()}
      </main>

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
