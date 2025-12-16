import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/AdminPages.module.css';

const SettingsAdmin: React.FC = () => {
  const navigate = useNavigate();

  const settingsCards = [
    {
      title: 'Totems',
      description: 'Personalize logo, cores e imagens de fundo dos totems',
      icon: '🖥️',
      path: '/admin/totems'
    },
    {
      title: 'Campanhas',
      description: 'Gerenciar campanhas publicitarias',
      icon: '📢',
      path: '/admin/campaigns'
    },
    {
      title: 'Anunciantes',
      description: 'Cadastro de anunciantes',
      icon: '🏢',
      path: '/admin/advertisers'
    },
    {
      title: 'Criativos',
      description: 'Gerenciar midias publicitarias',
      icon: '🎨',
      path: '/admin/creatives'
    },
  ];

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Configuracoes</h1>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '20px 0'
      }}>
        {settingsCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{card.icon}</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#fff' }}>{card.title}</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsAdmin;
