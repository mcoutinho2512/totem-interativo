import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/campaigns', icon: '📢', label: 'Campanhas' },
    { path: '/admin/advertisers', icon: '🏢', label: 'Anunciantes' },
    { path: '/admin/creatives', icon: '🎨', label: 'Criativos' },
    { path: '/admin/reports', icon: '📈', label: 'Relatórios' },
    { divider: true, label: 'Conteúdo' },
    { path: '/admin/events', icon: '📅', label: 'Eventos' },
    { path: '/admin/news', icon: '📰', label: 'Notícias' },
    { path: '/admin/pois', icon: '📍', label: 'POIs' },
    { path: '/admin/gallery', icon: '🖼️', label: 'Galeria' },
    { divider: true, label: 'Sistema' },
    { path: '/admin/totems', icon: '🖥️', label: 'Totems' },
    { path: '/admin/blocks', icon: '🧩', label: 'Blocos de Conteúdo' },
    { path: '/admin/settings', icon: '⚙️', label: 'Configurações' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} onClick={() => navigate('/admin')}>
            <span className={styles.logoIcon}>🏙️</span>
            {!sidebarCollapsed && <span className={styles.logoText}>Sanaris Admin</span>}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item, idx) => {
            if ('divider' in item && item.divider) {
              return (
                <div key={idx} className={styles.menuDivider}>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
              );
            }

            return (
              <button
                key={item.path}
                className={`${styles.navItem} ${isActive(item.path!) ? styles.active : ''}`}
                onClick={() => navigate(item.path!)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.logoutBtn}
            onClick={() => navigate('/')}
            title={sidebarCollapsed ? 'Ver Totem' : undefined}
          >
            <span className={styles.navIcon}>👁️</span>
            {!sidebarCollapsed && <span>Ver Totem</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.pageTitle}>
              {menuItems.find(item => 'path' in item && isActive(item.path!))?.label || 'Admin'}
            </h2>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userInfo}>Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
