import React, { useState, useEffect } from 'react';
import { io as ioClient } from 'socket.io-client';
import { Cpu, Wrench, Video, LayoutDashboard, Home as HomeIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import Home from './pages/Home.jsx';
import SuggestionDetail from './pages/SuggestionDetail.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PCBuilder from './pages/PCBuilder.jsx';
import RepairService from './pages/RepairService.jsx';
import CameraPlanner from './pages/CameraPlanner.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AIChatBox from './pages/AIChatBox.jsx';

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
  const [psuExpanded, setPsuExpanded] = useState(false);
  const [caseExpanded, setCaseExpanded] = useState(false);
  const [mainboardExpanded, setMainboardExpanded] = useState(false);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState('all'); 
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [selectedCapacity, setSelectedCapacity] = useState('all');
  const [selectedWattage, setSelectedWattage] = useState('all');
  const [selectedSocket, setSelectedSocket] = useState('all');
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

  // Tự động ẩn sidebar khi chuyển sang các trang công cụ và hiện lại khi về Trang Chủ
  useEffect(() => {
    if (page === 'home') {
      setSidebarVisible(true);
      setRightSidebarVisible(true);
    } else {
      setSidebarVisible(false);
      setRightSidebarVisible(false);
    }
  }, [page]);
  
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
    setSelectedCapacity('all');
    setSelectedWattage('all');
    setSelectedSocket('all');
    if (cat !== 'cpu') setCpuExpanded(false);
    if (cat !== 'ram') setRamExpanded(false);
    if (cat !== 'vga') setVgaExpanded(false);
    if (cat !== 'ssd') setSsdExpanded(false);
    if (cat !== 'psu') setPsuExpanded(false);
    if (cat !== 'case') setCaseExpanded(false);
    if (cat !== 'mainboard') setMainboardExpanded(false);
    setPage('home');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(num);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home 
          setPage={setPage} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} 
          setSelectedProductId={setSelectedProductId} setSelectedSuggestion={setSelectedSuggestion} 
          selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} 
          selectedSeries={selectedSeries} setSelectedSeries={setSelectedSeries} 
          selectedCapacity={selectedCapacity} setSelectedCapacity={setSelectedCapacity}
          selectedWattage={selectedWattage} setSelectedWattage={setSelectedWattage}
          selectedSocket={selectedSocket} setSelectedSocket={setSelectedSocket}
          productUpdateSignal={productUpdateSignal} lastUpdatedProduct={lastUpdatedProduct} selectedPrice={selectedPrice} 
        />;
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
        <aside 
          className="left-sidebar" 
          style={{ 
            display: sidebarVisible ? 'block' : 'none', 
            width: '140px', 
            flexShrink: 0, 
            padding: '0.5rem 0', 
            borderRadius: '15px', 
            border: '1px solid var(--glass-border)', 
            marginLeft: 0, 
            marginRight: 0,
            position: 'fixed',
            top: showHeader ? '95px' : '15px',
            bottom: '15px',
            left: '15px',
            overflowY: 'auto',
            zIndex: 10,
            transition: 'top 0.3s ease-in-out'
          }}
        >
          <ul className="left-cats">
            <li className={selectedCategory === null ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 10px', borderLeft: 'none', borderRadius: '8px', marginBottom: '2px', textAlign: 'center', margin: '0 5px' }} onClick={() => handleCategoryClick(null)}><span className="cat-label" style={{ fontSize: '0.85rem' }}>Tất cả</span></li>

            <li className={selectedCategory === 'cpu' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
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
                  <li className={selectedBrand === 'intel' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('cpu', 'intel')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Intel</li>
                  <li className={selectedBrand === 'amd' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('cpu', 'amd')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>AMD</li>

                </ul>
              )}
            </li>
            <li className={selectedCategory === 'vga' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
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
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  <li className={selectedBrand === 'asus' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('vga', 'asus')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>ASUS</li>
                  <li className={selectedBrand === 'msi' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('vga', 'msi')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>MSI</li>
                  <li className={selectedBrand === 'gigabyte' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('vga', 'gigabyte')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>GIGABYTE</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'ram' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
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
                      style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.78rem' }}
                    >
                      {brand}
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'ssd' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
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
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  <li className={selectedBrand === 'samsung' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'samsung')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Samsung</li>
                  <li className={selectedBrand === 'kingston' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'kingston')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Kingston</li>
                  <li className={selectedBrand === 'wd' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'wd')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>WD (Western Digital)</li>
                  <li className={selectedBrand === 'crucial' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'crucial')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Crucial</li>
                  <li className={selectedBrand === 'lexar' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('ssd', 'lexar')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Lexar</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'case' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('case')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>CASE</span>
                </div>
                <button aria-label="Toggle Case brands" title="Hiện/ẩn hãng Case" className="btn btn-ghost" onClick={() => setCaseExpanded(v => !v)} style={{ padding: 4 }}>
                  {caseExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {caseExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem', borderLeft: '1px dashed var(--glass-border)' }}>
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  <li className={selectedBrand === 'vsp' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('case', 'vsp')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>VSP</li>
                  <li className={selectedBrand === 'xigmatek' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('case', 'xigmatek')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Xigmatek</li>
                  <li className={selectedBrand === 'corsair' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('case', 'corsair')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Corsair</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'psu' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('psu')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>NGUỒN</span>
                </div>
                <button aria-label="Toggle PSU brands" title="Hiện/ẩn hãng Nguồn" className="btn btn-ghost" onClick={() => setPsuExpanded(v => !v)} style={{ padding: 4 }}>
                  {psuExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {psuExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem', borderLeft: '1px dashed var(--glass-border)' }}>
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  <li className={selectedBrand === 'msi' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('psu', 'msi')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>MSI</li>
                  <li className={selectedBrand === 'corsair' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('psu', 'corsair')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Corsair</li>
                  <li className={selectedBrand === 'antec' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('psu', 'antec')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Antec</li>
                </ul>
              )}
            </li>
            <li className={selectedCategory === 'mainboard' ? 'cat-item active' : 'cat-item'} style={{ padding: '6px 4px 6px 10px', borderRadius: '8px', marginBottom: '2px', margin: '0 5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={() => handleCategoryClick('mainboard')} style={{ cursor: 'pointer' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>MAINBOARD</span>
                </div>
                <button aria-label="Toggle Mainboard brands" title="Hiện/ẩn hãng Mainboard" className="btn btn-ghost" onClick={() => setMainboardExpanded(v => !v)} style={{ padding: 4 }}>
                  {mainboardExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {mainboardExpanded && (
                <ul style={{ listStyle: 'none', paddingLeft: '0.25rem', marginTop: '0.15rem', borderLeft: '1px dashed var(--glass-border)' }}>
                  <div style={{ padding: '8px 6px 2px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Hãng</div>
                  <li className={selectedBrand === 'gigabyte' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('mainboard', 'gigabyte')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>Gigabyte</li>
                  <li className={selectedBrand === 'asus' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('mainboard', 'asus')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>ASUS</li>
                  <li className={selectedBrand === 'msi' ? 'cat-sub active' : 'cat-sub'} onClick={() => handleCategoryClick('mainboard', 'msi')} style={{ cursor: 'pointer', padding: '3px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>MSI</li>
                </ul>
              )}
            </li>
          </ul>
        </aside>
        <main className="main-content" style={{ flex: 1, minWidth: 0, marginLeft: sidebarVisible ? '170px' : '15px', marginRight: rightSidebarVisible ? '170px' : '15px', padding: '0 10px' }}>
          {renderPage()}
        </main>

        <aside 
          className="right-sidebar" 
          style={{ 
            display: rightSidebarVisible ? 'block' : 'none', 
            width: '140px', 
            flexShrink: 0, 
            padding: '0.5rem 0', 
            borderRadius: '15px', 
            border: '1px solid var(--glass-border)', 
            marginRight: 0, 
            marginLeft: 0, 
            position: 'fixed', 
            top: showHeader ? '95px' : '15px', 
            bottom: '15px', 
            right: '15px',
            overflowY: 'auto',
            zIndex: 10,
            transition: 'top 0.3s ease-in-out'
          }}
        >
          <div style={{ padding: '8px 10px 10px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Khoảng giá</span>
            <button className="btn btn-ghost" onClick={() => setPriceExpanded(!priceExpanded)} style={{ padding: 4 }}>
              {priceExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          {priceExpanded && (
            <ul className="right-cats" style={{ listStyle: 'none', padding: 0 }}>
            <li 
              className={selectedPrice === null ? 'cat-item active' : 'cat-item'} 
              style={{ 
                padding: '6px 10px', 
                borderRadius: '8px', 
                marginBottom: '2px',
                margin: '0 5px',
                cursor: 'pointer', 
                textAlign: 'center',
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
                  padding: '6px 10px', 
                  borderRadius: '8px', 
                  marginBottom: '2px',
                  margin: '0 5px',
                  cursor: 'pointer', 
                  textAlign: 'center',
                  backgroundColor: selectedPrice === p ? '#ef4444' : 'transparent',
                  color: selectedPrice === p ? '#fff' : 'inherit',
                  transition: 'all 0.2s ease',
                  fontWeight: selectedPrice === p ? '700' : 'normal'
                }} 
                onClick={() => setSelectedPrice(p)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="cat-label" style={{ fontSize: '0.85rem' }}>{p >= 1000000 ? (p/1000000 + ' triệu') : (p/1000 + 'k')}</span>
                </div>
              </li>
            ))}
            </ul>
          )}
        </aside>
      </div>

      {(page === 'home' && !sidebarVisible) && (
        <button onClick={() => setSidebarVisible(true)} aria-label="Open categories" title="Hiện danh mục" style={{ position: 'fixed', left: 8, top: 120, zIndex: 9999, padding: '8px 10px', borderRadius: 8 }} className="btn btn-primary btn-sm">Danh mục</button>
      )}
      {(page === 'home' && !rightSidebarVisible) && (
        <button onClick={() => setRightSidebarVisible(true)} aria-label="Open price filter" title="Hiện lọc giá" style={{ position: 'fixed', right: 8, top: 120, zIndex: 9999, padding: '8px 10px', borderRadius: 8 }} className="btn btn-primary btn-sm">Lọc giá</button>
      )}

      <footer className="footer-glass" style={{ padding: '1.5rem 2rem', color: '#ffffff', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          {/* Danh mục dịch vụ (Bên trái) */}
          <div style={{ flex: '1 1 200px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>Danh Mục Dịch Vụ</h4>
            <div className="footer-links" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem', margin: 0 }}>
              <a href="#" className="footer-link" style={{ color: '#ffffff', fontSize: '0.9rem' }} onClick={() => setPage('home')}>Trang Chủ</a>
              <a href="#" className="footer-link" style={{ color: '#ffffff', fontSize: '0.9rem' }} onClick={() => setPage('pc-builder')}>Lắp PC Tự Động</a>
              <a href="#" className="footer-link" style={{ color: '#ffffff', fontSize: '0.9rem' }} onClick={() => setPage('repair-service')}>Dịch Vụ Sửa Chữa</a>
              <a href="#" className="footer-link" style={{ color: '#ffffff', fontSize: '0.9rem' }} onClick={() => setPage('camera-planner')}>Khảo Sát Camera</a>
            </div>
          </div>

          {/* Giới thiệu (Ở giữa) */}
          <div style={{ flex: '2 1 300px', textAlign: 'center' }}>
            <div className="logo-container" style={{ marginBottom: '0.75rem', cursor: 'pointer', justifyContent: 'center' }} onClick={() => setPage('home')}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} />
              </div>
              <span className="logo-text" style={{ fontSize: '1.3rem', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>ITSurv-SMS</span>
            </div>
            <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto' }}>
              Hệ thống điều phối kỹ thuật chuyên nghiệp. Cung cấp dịch vụ lắp ráp PC, sửa chữa thiết bị tin học và giải pháp camera an ninh toàn diện cho cá nhân và doanh nghiệp.
            </p>
          </div>

          {/* Thông tin liên hệ (Bên phải) */}
          <div style={{ flex: '1 1 280px', textAlign: 'right' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>Thông Tin Liên Hệ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#ffffff', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <span>Hotline: <a href="tel:0332605465" className="contact-link" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}>0332605465</a></span>
                <Phone size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <span>Zalo: <a href="https://zalo.me/0332605465" target="_blank" rel="noreferrer" className="contact-link" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}>0332605465</a></span>
                <MessageCircle size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <span>Email: <a href="mailto:trung0971923110@gmail.com" className="contact-link" style={{ color: '#ffffff', textDecoration: 'none' }}>trung0971923110@gmail.com</a></span>
                <Mail size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <span>Hà Nội, Việt Nam</span>
                <MapPin size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>8:00 - 22:00</span>
                <Clock size={12} />
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
          &copy; 2026 ITSurv-SMS. Hệ Thống Điều Phối Kỹ Thuật & Dịch Vụ.
        </p>
      </footer>

      {/* AI Chatbox Widget */}
      <AIChatBox />

      {/* Nút Zalo nổi ở góc màn hình */}
      <a 
        href="https://zalo.me/0332605465" 
        target="_blank" 
        rel="noreferrer" 
        className="zalo-float"
        title="Chat qua Zalo"
      >
        <MessageCircle size={28} />
        <span>Chat ngay</span>
      </a>
    </div>
  );
}