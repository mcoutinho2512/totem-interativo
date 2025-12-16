import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { weatherService, contentService, advertisingService, contentBlocksService } from '../services/api';
import styles from '../styles/HomeTomiPro.module.css';

// SVG Icons para menu (mais nítidos que emojis)
const MapIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const RouteIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const BusIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <circle cx="12" cy="12" r="3.2"/>
    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
);

const HomeTomiPro: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { totem } = useTotemStore();
  const [weather, setWeather] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [contentBlocks, setContentBlocks] = useState<any[]>([]);

  const menuItems = [
    { icon: <MapIcon />, label: 'MAPA', path: '/navigation' },
    { icon: <StarIcon />, label: 'DESTAQUES', path: '/pois' },
    { icon: <RouteIcon />, label: 'ROTAS', path: '/navigation' },
    { icon: <BusIcon />, label: 'TRANSPORTE', path: '/pois?type=transport' },
    { icon: <CalendarIcon />, label: 'AGENDA', path: '/events' },
    { icon: <CameraIcon />, label: 'FOTO', path: '/selfie' },
  ];

  const languages = [
    { code: 'pt', label: 'BR' },
    { code: 'en', label: 'US' },
    { code: 'es', label: 'ES' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cityId = totem?.city || 1;

    weatherService.getCurrent(cityId)
      .then(res => setWeather(res.data))
      .catch(() => {});

    contentService.getEvents(6)
      .then(res => setEvents(res.data.results || res.data || []))
      .catch(() => {});

    advertisingService.getActiveAds(totem?.id || 1)
      .then(res => setAds(res.data || []))
      .catch(() => {});

    // Load content blocks for this totem
    if (totem?.id) {
      contentBlocksService.getBlocks(totem.id)
        .then(res => {
          const blocks = res.data?.results || res.data || [];
          setContentBlocks(Array.isArray(blocks) ? blocks : []);
        })
        .catch(() => {});
    }
  }, [totem]);

  // Rotacao de anuncios
  useEffect(() => {
    if (ads.length > 1) {
      const timer = setInterval(() => {
        setCurrentAd(prev => (prev + 1) % ads.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [ads.length]);

  const getLocale = () => {
    const lang = i18n.language;
    if (lang === 'en') return 'en-US';
    if (lang === 'es') return 'es-ES';
    return 'pt-BR';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString(getLocale(), { day: '2-digit' }),
      month: date.toLocaleDateString(getLocale(), { month: 'short' }).toUpperCase().replace('.', ''),
    };
  };

  const currentAdData = ads[currentAd];
  const featuredEvent = events[0];

  // Get block by position (1-4)
  const getBlockByPosition = (position: number) => {
    return contentBlocks.find(b => b.position === position && b.is_active);
  };

  // Render block content based on type
  const renderBlockContent = (position: number) => {
    const block = getBlockByPosition(position);

    // Default blocks if no custom block is configured
    if (!block) {
      return renderDefaultBlock(position);
    }

    const blockStyle = {
      background: block.background_color || '#ffffff',
      color: block.text_color || '#000000',
    };

    switch (block.block_type) {
      case 'events_list':
        return (
          <div className={styles.eventsBlock} style={blockStyle}>
            <div className={styles.blockHeader}>
              <span>📅</span> {block.title || 'PRÓXIMOS EVENTOS'}
            </div>
            <div className={styles.blockEventsList}>
              {events.slice(0, 4).map((event, idx) => (
                <div key={idx} className={styles.eventItem} onClick={() => navigate('/events')}>
                  {event.start_date && (
                    <div className={styles.eventDate}>
                      <span className={styles.eventDay}>{formatDate(event.start_date).day}</span>
                      <span className={styles.eventMonth}>{formatDate(event.start_date).month}</span>
                    </div>
                  )}
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventLocation}>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'featured_event':
        const eventIndex = block.config?.event_index || 0;
        const event = events[eventIndex];
        return (
          <div
            className={styles.featuredSection}
            style={blockStyle}
            onClick={() => navigate('/events')}
          >
            {event ? (
              <div className={styles.featuredCard}>
                {event.start_date && (
                  <div className={styles.featuredDate}>
                    <span className={styles.dateDay}>{formatDate(event.start_date).day}</span>
                    <span className={styles.dateMonth}>{formatDate(event.start_date).month}</span>
                  </div>
                )}
                <h3 className={styles.featuredTitle}>{event.title}</h3>
                <p className={styles.featuredDescription}>
                  {event.description?.substring(0, 150) || event.location}
                </p>
              </div>
            ) : (
              <div className={styles.featuredCard}>
                <h3 className={styles.featuredTitle}>{block.title || 'Eventos'}</h3>
                <p className={styles.featuredDescription}>
                  {block.subtitle || 'Confira os eventos da cidade'}
                </p>
              </div>
            )}
          </div>
        );

      case 'custom':
        return (
          <div
            className={styles.featuredSection}
            style={blockStyle}
            onClick={() => block.link_url && navigate(block.link_url)}
          >
            <div className={styles.featuredCard}>
              <h3 className={styles.featuredTitle}>{block.title}</h3>
              <p className={styles.featuredDescription}>{block.subtitle}</p>
              {block.content_html && (
                <div dangerouslySetInnerHTML={{ __html: block.content_html }} />
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div
            className={styles.featuredSection}
            style={{ ...blockStyle, padding: 0, overflow: 'hidden' }}
            onClick={() => block.link_url && navigate(block.link_url)}
          >
            {block.image && (
              <img
                src={block.image.startsWith('http') ? block.image : `http://10.50.30.168:8000${block.image}`}
                alt={block.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        );

      case 'news':
        return (
          <div className={styles.eventsBlock} style={blockStyle}>
            <div className={styles.blockHeader}>
              <span>📰</span> {block.title || 'NOTÍCIAS'}
            </div>
            <div className={styles.blockEventsList}>
              <div className={styles.featuredCard} onClick={() => navigate('/news')}>
                <p className={styles.featuredDescription}>
                  {block.subtitle || 'Confira as últimas notícias'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'pois':
        return (
          <div className={styles.eventsBlock} style={blockStyle}>
            <div className={styles.blockHeader}>
              <span>📍</span> {block.title || 'PONTOS DE INTERESSE'}
            </div>
            <div className={styles.blockEventsList}>
              <div className={styles.featuredCard} onClick={() => navigate('/pois')}>
                <p className={styles.featuredDescription}>
                  {block.subtitle || 'Descubra os pontos turísticos'}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return renderDefaultBlock(position);
    }
  };

  // Default blocks when no custom configuration exists
  const renderDefaultBlock = (position: number) => {
    switch (position) {
      case 1: // Superior Esquerdo - Lista de Eventos
        return (
          <div className={styles.eventsBlock}>
            <div className={styles.blockHeader}>
              <span>📅</span> PRÓXIMOS EVENTOS
            </div>
            <div className={styles.blockEventsList}>
              {events.slice(0, 4).map((event, idx) => (
                <div key={idx} className={styles.eventItem} onClick={() => navigate('/events')}>
                  {event.start_date && (
                    <div className={styles.eventDate}>
                      <span className={styles.eventDay}>{formatDate(event.start_date).day}</span>
                      <span className={styles.eventMonth}>{formatDate(event.start_date).month}</span>
                    </div>
                  )}
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventLocation}>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 2: // Superior Direito - Evento em Destaque (amarelo)
        return (
          <div className={styles.featuredSection}>
            {featuredEvent ? (
              <div className={styles.featuredCard} onClick={() => navigate('/events')}>
                {featuredEvent.start_date && (
                  <div className={styles.featuredDate}>
                    <span className={styles.dateDay}>{formatDate(featuredEvent.start_date).day}</span>
                    <span className={styles.dateMonth}>{formatDate(featuredEvent.start_date).month}</span>
                  </div>
                )}
                <h3 className={styles.featuredTitle}>{featuredEvent.title}</h3>
                <p className={styles.featuredDescription}>
                  {featuredEvent.description?.substring(0, 150) || featuredEvent.location}
                </p>
              </div>
            ) : (
              <div className={styles.featuredCard}>
                <h3 className={styles.featuredTitle}>Eventos</h3>
                <p className={styles.featuredDescription}>
                  Confira os eventos da cidade
                </p>
              </div>
            )}
          </div>
        );
      case 3: // Inferior Esquerdo - Evento em Destaque 2 (azul/roxo)
        return (
          <div className={styles.featuredSection2}>
            {events[1] ? (
              <div className={styles.featuredCard} onClick={() => navigate('/events')}>
                {events[1].start_date && (
                  <div className={styles.featuredDate}>
                    <span className={styles.dateDay}>{formatDate(events[1].start_date).day}</span>
                    <span className={styles.dateMonth}>{formatDate(events[1].start_date).month}</span>
                  </div>
                )}
                <h3 className={styles.featuredTitle}>{events[1].title}</h3>
                <p className={styles.featuredDescription}>
                  {events[1].description?.substring(0, 120) || events[1].location}
                </p>
              </div>
            ) : (
              <div className={styles.featuredCard}>
                <h3 className={styles.featuredTitle}>Em Breve</h3>
                <p className={styles.featuredDescription}>
                  Novos eventos serão anunciados
                </p>
              </div>
            )}
          </div>
        );
      case 4: // Inferior Direito - Agenda
        return (
          <div className={styles.agendaBlock}>
            <div className={styles.blockHeader}>
              <span>📋</span> AGENDA
              <button className={styles.viewAllBtn} onClick={() => navigate('/events')}>
                Ver todos →
              </button>
            </div>
            <div className={styles.blockEventsList}>
              {events.slice(2, 6).map((event, idx) => (
                <div key={idx} className={styles.eventItem} onClick={() => navigate('/events')}>
                  {event.start_date && (
                    <div className={styles.eventDate}>
                      <span className={styles.eventDay}>{formatDate(event.start_date).day}</span>
                      <span className={styles.eventMonth}>{formatDate(event.start_date).month}</span>
                    </div>
                  )}
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <span className={styles.eventLocation}>{event.location}</span>
                  </div>
                  {event.image && (
                    <img src={event.image} alt="" className={styles.eventThumb} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Status Bar */}
      <header className={styles.statusBar}>
        <div className={styles.statusLeft}>
          {totem?.logo ? (
            <img
              src={totem.logo.startsWith('http') ? totem.logo : `http://10.50.30.168:8000${totem.logo}`}
              alt="Logo"
              className={styles.logo}
            />
          ) : (
            <span className={styles.logoText}>{totem?.city_name || 'SANARIS'}</span>
          )}
          <div className={styles.statusIcons}>
            <span className={styles.statusIcon} title="WiFi">📶</span>
            <span className={styles.statusIcon} title="Acessibilidade">♿</span>
          </div>
        </div>

        <div className={styles.statusCenter}>
          <span className={styles.statusDot + ' ' + styles.online}></span>
          <span className={styles.statusText}>ONLINE</span>
          <span className={styles.separator}>|</span>
          <span className={styles.location}>📍 {totem?.address || 'Centro'}</span>
        </div>

        <div className={styles.statusRight}>
          <div className={styles.datetime}>
            <span className={styles.time}>
              {currentTime.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={styles.date}>
              {currentTime.toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' }).toUpperCase()}
            </span>
          </div>
          {weather && (
            <div className={styles.weather}>
              <img src={weather.icon_url} alt="" className={styles.weatherIcon} />
              <span className={styles.temp}>{Math.round(weather.temperature)}°</span>
            </div>
          )}
          <div className={styles.langButtonsHeader}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`${styles.langBtnHeader} ${i18n.language === lang.code ? styles.active : ''}`}
                onClick={() => i18n.changeLanguage(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Banner / Ad Area */}
      <section className={styles.bannerSection}>
        {currentAdData ? (
          <div className={styles.bannerContent}>
            <img
              src={currentAdData.file?.startsWith('http') ? currentAdData.file : `http://10.50.30.168:8000${currentAdData.file}`}
              alt=""
              className={styles.bannerImage}
            />
            <div className={styles.bannerOverlay}>
              <div className={styles.bannerCTA}>
                <span className={styles.ctaIcon}>👆</span>
                <span>TOQUE AQUI</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.bannerPlaceholder}>
            <h2>Bem-vindo a {totem?.city_name || 'Niteroi'}</h2>
            <p>Explore nossa cidade</p>
          </div>
        )}

        {/* Banner Indicators */}
        {ads.length > 1 && (
          <div className={styles.bannerIndicators}>
            {ads.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.indicator} ${idx === currentAd ? styles.active : ''}`}
                onClick={() => setCurrentAd(idx)}
              />
            ))}
          </div>
        )}

        {/* Interactive hints on banner */}
        <div className={styles.bannerHints}>
          <div className={styles.hintLeft}>
            <span className={styles.hintIcon}>🗺️</span>
            <span>VER NO MAPA</span>
          </div>
          <div className={styles.hintRight}>
            <span className={styles.hintIcon}>👆</span>
            <span>SAIBA MAIS</span>
          </div>
        </div>
      </section>

      {/* Menu Bar - Botões Grandes */}
      <nav className={styles.menuBar}>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.menuIconSvg}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area - Mosaico 2x2 */}
      <section className={styles.contentArea}>
        {/* Renderiza os 4 quadrantes dinamicamente */}
        {[1, 2, 3, 4].map((position) => (
          <React.Fragment key={position}>
            {renderBlockContent(position)}
          </React.Fragment>
        ))}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>SANARIS</span>
        </div>
        <div className={styles.footerInfo}>
          <span>📍 {totem?.address || 'Praca Arariboia, Centro'}</span>
        </div>
      </footer>
    </div>
  );
};

export default HomeTomiPro;
