import React, { useState, useEffect } from 'react';
import { io as ioClient } from 'socket.io-client';
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
  const [ramExpanded, setRamExpanded] = useState(false);
  const [vgaExpanded, setVgaExpanded] = useState(false);
  const [ssdExpanded, setSsdExpanded] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState('all'); 
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  // States để xử lý ẩn/hiện header khi cuộn chuột
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowHeader(false); // Cuộn xuống -> Ẩn
      } else {
        setShowHeader(true);  // Cuộn lên -> Hiện
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [productUpdateSignal, setProductUpdateSignal] = useState(0);
  const [lastUpdatedProduct, setLastUpdatedProduct] = useState(null);

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

  // Setup Socket.IO to receive realtime product updates
  useEffect(() => {
    const socket = ioClient();
    socket.on('connect', () => console.log('Socket connected', socket.id));
    socket.on('productUpdated', (payload) => {
      setLastUpdatedProduct(payload);
      setProductUpdateSignal(s => s + 1);
    });
    socket.on('disconnect', () => console.log('Socket disconnected'));
    return () => { socket.disconnect(); };
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

  // Hàm xử lý chung khi chọn danh mục để đảm bảo luôn quay về trang chủ sản phẩm
  const handleCategoryClick = (cat, brand = 'all', series = 'all') => {
    setSelectedCategory(cat);
    setSelectedBrand(brand);
    setSelectedSeries(series); 
    setSelectedPrice(null);
    if (cat !== 'cpu') setCpuExpanded(false);
    if (cat !== 'ram') setRamExpanded(false);
    if (cat !== 'vga') setVgaExpanded(false);
    if (cat !== 'ssd') setSsdExpanded(false);
    setPage('home');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(num);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home setPage={setPage} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} setSelectedProductId={setSelectedProductId} setSelectedSuggestion={setSelectedSuggestion} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} selectedSeries={selectedSeries} setSelectedSeries={setSelectedSeries} productUpdateSignal={productUpdateSignal} lastUpdatedProduct={lastUpdatedProduct} selectedPrice={selectedPrice} />;
      case 'product':
        return <ProductDetail productId={selectedProductId} setPage={setPage} productUpdateSignal={productUpdateSignal} lastUpdatedProduct={lastUpdatedProduct} />;
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
    <div className="app-container" style={{ padding: 0, margin: 0, maxWidth: 'none', width: '100%', overflowX: 'hidden' }}>
      {/* Premium Sticky Header Navigation */}
      <header 
        className="header-glass"
        style={{ 
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out',
          paddingLeft: '5px',
          paddingRight: '5px'
        }}
      >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <button className="auth-btn" onClick={() => setPage('dashboard')}>
              <LayoutDashboard size={16} /> Dashboard Portal
            </button>
          ) : (
            <button className="auth-btn" onClick={() => setPage('dashboard')}>
              Đăng Nhập
            </button>
          )}
          <button aria-label="Toggle price sidebar" title="Ẩn/Hiện lọc giá" className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setRightSidebarVisible(v => !v)}>
            {rightSidebarVisible ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </header>

      {/* Main Page Area with left sidebar */}
      <div className="site-body" style={{ display: 'flex', paddingLeft: 0, marginLeft: 0, paddingRight: 0, gap: 0, width: '100%' }}>
        <aside className="left-sidebar" style={{ display: sidebarVisible ? 'block' : 'none', width: '110px', flexShrink: 0, padding: '0.5rem 0', borderRadius: '0 10px 10px 0', borderRight: '1px solid var(--glass-border)', marginLeft: 0, marginRight: 0 }}>
          <ul className="left-cats">
            <li className={selectedCategory === null ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 10px', borderLeft: 'none', borderRadius: '0 6px 6px 0', marginBottom: '2px', textAlign: 'center' }} onClick={() => handleCategoryClick(null)}><span className="cat-label" style={{ fontSize: '0.85rem' }}>Tất cả</span></li>

            <li className={selectedCategory === 'cpu' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('cpu')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>CPU</span> {/* Giữ nguyên click cho CPU để reset các bộ lọc con */}
                </div>
                <button aria-label="Toggle CPU brands" title="Hiện/ẩn hãng CPU" className="btn btn-ghost" onClick={() => setCpuExpanded(v => !v)} style={{ padding: 4 }}>
                  {cpuExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {cpuExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem' }}>
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  <li className={selectedBrand === 'intel' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('cpu', 'intel')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>Intel</li>
                  <li className={selectedBrand === 'amd' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('cpu', 'amd')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>AMD</li>

                </ul>
              )}
            </li>
            <li className={selectedCategory === 'vga' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('vga')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>VGA</span>
                </div>
                <button aria-label="Toggle VGA brands" title="Hiện/ẩn hãng VGA" className="btn btn-ghost" onClick={() => setVgaExpanded(v => !v)} style={{ padding: 4 }}>
                  {vgaExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {vgaExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem', borderLeft: '1px dashed var(--glass-border)' }}>
                  <li className={selectedBrand === 'asus' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('vga', 'asus')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>ASUS</li>
                  <li className={selectedBrand === 'msi' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('vga', 'msi')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>MSI</li>
                  <li className={selectedBrand === 'gigabyte' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('vga', 'gigabyte')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>GIGABYTE</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'ram' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('ram')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>RAM</span>
                </div>
                <button aria-label="Toggle RAM brands" title="Hiện/ẩn hãng RAM" className="btn btn-ghost" onClick={() => setRamExpanded(v => !v)} style={{ padding: 4 }}>
                  {ramExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {ramExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem', maxHeight: '200px', overflowY: 'auto', borderLeft: '1px dashed var(--glass-border)' }}>
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  {[
                    'Corsair', 'Kingston', 'G.Skill', 'Kingmax', 'Crucial', 'TeamGroup', 'ADATA', 'Lexar', 'Mushkin', 'GeIL', 'PNY', 'Apacer', 'Patriot', 'Gigabyte', 'ASUS'
                  ].map(brand => (
                    <li 
                      key={brand}
                      className={selectedBrand === brand.toLowerCase() ? 'cat-sub active' : 'cat-sub'} 
                      onClick={() => handleCategoryClick('ram', brand.toLowerCase())} 
                      style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.78rem' }}
                    >
                      {brand}
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'ssd' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('ssd')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>SSD</span>
                </div>
                <button aria-label="Toggle SSD brands" title="Hiện/ẩn hãng SSD" className="btn btn-ghost" onClick={() => setSsdExpanded(v => !v)} style={{ padding: 4 }}>
                  {ssdExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {ssdExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem', borderLeft: '1px dashed var(--glass-border)' }}>
                  <li className={selectedBrand === 'samsung' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'samsung')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>Samsung</li>
                  <li className={selectedBrand === 'kingston' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'kingston')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>Kingston</li>
                  <li className={selectedBrand === 'wd' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'wd')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>WD (Western Digital)</li>
                  <li className={selectedBrand === 'crucial' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'crucial')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>Crucial</li>
                  <li className={selectedBrand === 'lexar' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'lexar')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '0 5px 5px 0', fontSize: '0.8rem' }}>Lexar</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'case' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px', textAlign: 'center' }} onClick={() => handleCategoryClick('case')}><span className="cat-label" style={{ fontSize: '0.85rem' }}>CASE</span></li>
            <li className={selectedCategory === 'psu' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px', textAlign: 'center' }} onClick={() => handleCategoryClick('psu')}><span className="cat-label" style={{ fontSize: '0.85rem' }}>NGUỒN</span></li>
            <li className={selectedCategory === 'mainboard' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 10px', borderRadius: '0 6px 6px 0', marginBottom: '2px', textAlign: 'center' }} onClick={() => handleCategoryClick('mainboard')}><span className="cat-label" style={{ fontSize: '0.85rem' }}>MAINBOARD</span></li>
          </ul>
        </aside>
        <main className="main-content" style={{ flex: 1, minWidth: 0, marginLeft: sidebarVisible ? '95px' : '0', marginRight: rightSidebarVisible ? '95px' : '0', padding: 0 }}>
          {renderPage()}
        </main>

        <aside className="right-sidebar" style={{ display: rightSidebarVisible ? 'block' : 'none', width: '95px', flexShrink: 0, padding: '0.5rem 0', borderRadius: '10px 0 0 10px', borderLeft: '1px solid var(--glass-border)', marginRight: 0, marginLeft: 0, position: 'fixed', top: '80px', bottom: '0', right: '0' }}>
          <div style={{ padding: '8px 10px 10px 4px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Khoảng giá</div>
          <ul className="right-cats">
            <li 
              className={selectedPrice === null ? 'cat-item active' : 'cat-item'} 
              style={{ 
                padding: '6px 8px 6px 2px', 
                borderRadius: '6px 0 0 6px', 
                marginBottom: '2px', 
                cursor: 'pointer', 
                textAlign: 'right',
                backgroundColor: selectedPrice === null ? '#ef4444' : 'transparent',
                color: selectedPrice === null ? '#fff' : 'inherit',
                transition: 'all 0.2s ease',
                fontWeight: selectedPrice === null ? '700' : 'normal'
              }} 
              onClick={() => setSelectedPrice(null)}
            >
              <span className="cat-label" style={{ fontSize: '0.85rem' }}>Tất cả</span>
            </li>
            {[1000000, 2000000, 3000000, 5000000, 10000000, 20000000].map(p => (
              <li 
                key={p}
                className={selectedPrice === p ? 'cat-item active' : 'cat-item'} 
                style={{ 
                  padding: '6px 8px 6px 2px', 
                  borderRadius: '6px 0 0 6px', 
                  marginBottom: '2px', 
                  cursor: 'pointer', 
                  textAlign: 'right',
                  backgroundColor: selectedPrice === p ? '#ef4444' : 'transparent',
                  color: selectedPrice === p ? '#fff' : 'inherit',
                  transition: 'all 0.2s ease',
                  fontWeight: selectedPrice === p ? '700' : 'normal'
                }} 
                onClick={() => setSelectedPrice(p)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>{p >= 1000000 ? (p/1000000 + ' triệu') : (p/1000 + 'k')}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {!sidebarVisible && (
        <button onClick={() => setSidebarVisible(true)} aria-label="Open categories" title="Hiện danh mục" style={{ position: 'fixed', left: 8, top: 120, zIndex: 9999, padding: '8px 10px', borderRadius: 8 }} className="btn btn-primary btn-sm">Danh mục</button>
      )}
      {!rightSidebarVisible && (
        <button onClick={() => setRightSidebarVisible(true)} aria-label="Open price filter" title="Hiện lọc giá" style={{ position: 'fixed', right: 8, top: 120, zIndex: 9999, padding: '8px 10px', borderRadius: 8 }} className="btn btn-primary btn-sm">Lọc giá</button>
      )}

      <footer className="footer-glass" style={{ paddingLeft: '5px', paddingRight: '5px' }}>
        <div className="footer-links">
          <a href="#" className="footer-link" onClick={() => setPage('home')}>Trang Chủ</a>
          <a href="#" className="footer-link" onClick={() => setPage('pc-builder')}>Lắp PC Tự Động</a>
          <a href="#" className="footer-link" onClick={() => setPage('repair-service')}>Dịch Vụ Sửa Chữa</a>
          <a href="#" className="footer-link" onClick={() => setPage('camera-planner')}>Khảo Sát Camera</a>
        </div>
        <p>&copy; 2026 ITSurv-SMS. Hệ Thống Điều Phối Kỹ Thuật & Dịch Vụ.</p>
      </footer>
    </div>
  );
}