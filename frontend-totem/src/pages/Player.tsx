import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import { contentService, weatherService, advertisingService } from '../services/api';
import styles from '../styles/Player.module.css';

interface SlideItem {
  id: number;
  type: 'gallery' | 'ad' | 'weather' | 'clock';
  title: string;
  image?: string;
  duration: number;
  advertiser?: string;
}

// Kiosk Mode Configuration
const KIOSK_CONFIG = {
  CURSOR_HIDE_DELAY: 3000,      // Hide cursor after 3 seconds of inactivity
  INACTIVITY_TIMEOUT: 60000,   // Return to player after 60 seconds of inactivity
  AUTO_FULLSCREEN: true,        // Auto-enter fullscreen on start
  PREVENT_CONTEXT_MENU: true,   // Disable right-click menu
  CONTENT_REFRESH_INTERVAL: 300000, // Refresh content every 5 minutes
};

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { totem } = useTotemStore();

  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weather, setWeather] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [transitioning, setTransitioning] = useState(false);

  // Kiosk Mode State
  const [kioskMode, setKioskMode] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for timers
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // KIOSK MODE FUNCTIONS
  // ==========================================

  // Request fullscreen
  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenElement && playerRef.current) {
      try {
        await playerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.log('Fullscreen not supported or blocked');
      }
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.log('Exit fullscreen failed');
      }
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Restart slideshow from beginning after inactivity
    inactivityTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(0);
    }, KIOSK_CONFIG.INACTIVITY_TIMEOUT);
  }, []);

  // Handle user activity (mouse move, touch, etc.)
  const handleActivity = useCallback(() => {
    // Show cursor temporarily
    setShowCursor(true);

    // Reset cursor hide timer
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }

    cursorTimeoutRef.current = setTimeout(() => {
      setShowCursor(false);
    }, KIOSK_CONFIG.CURSOR_HIDE_DELAY);

    // Reset inactivity timer
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Prevent default behaviors for kiosk mode
  useEffect(() => {
    // Prevent context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      if (KIOSK_CONFIG.PREVENT_CONTEXT_MENU) {
        e.preventDefault();
      }
    };

    // Prevent keyboard shortcuts that might exit kiosk
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow F11 for fullscreen toggle
      if (e.key === 'F11') {
        e.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
        return;
      }

      // Block other potentially problematic keys
      const blockedKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F12', 'Escape'];
      if (blockedKeys.includes(e.key) || (e.ctrlKey && ['r', 'w', 't', 'n'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
      }
    };

    // Prevent zoom on touch devices
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent scroll
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent zoom
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('touchmove', handleActivity);
    document.addEventListener('click', handleActivity);

    // Auto-enter fullscreen on mount
    if (KIOSK_CONFIG.AUTO_FULLSCREEN) {
      // Small delay to ensure DOM is ready
      setTimeout(enterFullscreen, 1000);
    }

    // Initialize inactivity timer
    resetInactivityTimer();

    // Hide cursor initially after delay
    cursorTimeoutRef.current = setTimeout(() => {
      setShowCursor(false);
    }, KIOSK_CONFIG.CURSOR_HIDE_DELAY);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('touchmove', handleActivity);
      document.removeEventListener('click', handleActivity);

      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, [handleActivity, enterFullscreen, exitFullscreen, resetInactivityTimer, isFullscreen]);

  // ==========================================
  // CLOCK
  // ==========================================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // LOAD CONTENT
  // ==========================================
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Weather
        if (totem?.city) {
          const weatherRes = await weatherService.getCurrent(totem.city);
          setWeather(weatherRes.data);
        }

        const allSlides: SlideItem[] = [];

        // Slide de relógio/clima (primeiro)
        allSlides.push({
          id: 0,
          type: 'clock',
          title: 'Relógio',
          duration: 8
        });

        // Carregar SOMENTE anúncios (não carregar galeria)
        try {
          const adsRes = await advertisingService.getActiveAds(totem?.id || 1);
          const adsData = adsRes.data || [];
          adsData.forEach((ad: any) => {
            allSlides.push({
              id: ad.id,
              type: 'ad',
              title: ad.name,
              image: ad.file.startsWith('http') ? ad.file : `http://10.50.30.168:8000${ad.file}`,
              duration: ad.duration || 8,
              advertiser: ad.name
            });
          });
        } catch (e) {
          console.log('No ads');
        }

        // Monta lista final: clock + anúncios
        const finalSlides: SlideItem[] = [];
        const ads = allSlides.filter(s => s.type === 'ad');
        const clock = allSlides.find(s => s.type === 'clock');

        if (clock) finalSlides.push(clock);
        finalSlides.push(...ads);

        // Se não tem nada, pelo menos mostra o clock
        if (finalSlides.length === 0 && clock) {
          finalSlides.push(clock);
        }

        setSlides(finalSlides);
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };

    loadContent();
    const interval = setInterval(loadContent, KIOSK_CONFIG.CONTENT_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [totem]);

  // ==========================================
  // AUTO-ADVANCE SLIDES
  // ==========================================
  useEffect(() => {
    if (slides.length === 0) return;

    const currentItem = slides[currentIndex];
    const duration = currentItem?.duration || 8;

    const timer = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
        setTransitioning(false);
      }, 500);
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  // ==========================================
  // LOG AD IMPRESSION
  // ==========================================
  useEffect(() => {
    const currentItem = slides[currentIndex];
    if (currentItem?.type === 'ad' && totem?.id) {
      advertisingService.logImpression(currentItem.id, totem.id, currentItem.duration).catch(() => {});
    }
  }, [currentIndex, slides, totem]);

  // ==========================================
  // HANDLE TOUCH - GO TO INTERACTIVE MODE
  // ==========================================
  const handleTouch = useCallback(() => {
    navigate('/?theme=tomi');
  }, [navigate]);

  // ==========================================
  // RENDER SLIDE CONTENT
  // ==========================================
  const renderSlide = (item: SlideItem) => {
    switch (item.type) {
      case 'clock':
        return (
          <div className={styles.clockSlide}>
            <div className={styles.clockTime}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={styles.clockDate}>
              {currentTime.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
            <div className={styles.clockCity}>{totem?.city_name || 'Niteroi'}</div>
            {weather && (
              <div className={styles.clockWeather}>
                <img src={weather.icon_url} alt="" />
                <span className={styles.clockTemp}>{Math.round(weather.temperature)}°C</span>
                <span className={styles.clockDesc}>{weather.description}</span>
              </div>
            )}
          </div>
        );

      case 'gallery':
      case 'ad':
        return (
          <div className={styles.imageSlide}>
            <img src={item.image} alt="" className={styles.slideImage} />
          </div>
        );

      default:
        return (
          <div className={styles.defaultSlide}>
            <h1>{totem?.city_name || 'Niteroi'}</h1>
            <p>Toque para explorar</p>
          </div>
        );
    }
  };

  const currentItem = slides[currentIndex];

  // Build class names for kiosk mode
  const playerClasses = [
    styles.player,
    kioskMode ? styles.kioskMode : '',
    showCursor ? styles.showCursor : '',
    isFullscreen ? styles.fullscreen : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={playerRef}
      className={playerClasses}
      onClick={handleTouch}
    >
      {/* Progress bar */}
      {slides.length > 1 && (
        <div className={styles.progressBar}>
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`${styles.progressDot} ${idx === currentIndex ? styles.active : ''} ${slide.type === 'ad' ? styles.adDot : ''}`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className={`${styles.content} ${transitioning ? styles.fadeOut : styles.fadeIn}`}>
        {currentItem ? renderSlide(currentItem) : (
          <div className={styles.clockSlide}>
            <div className={styles.clockTime}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={styles.clockCity}>{totem?.city_name || 'Niteroi'}</div>
          </div>
        )}
      </div>

      {/* Touch indicator */}
      <div className={styles.touchHint}>
        <span>Toque para interagir</span>
      </div>

      {/* Header overlay */}
      <div className={styles.headerOverlay}>
        <div className={styles.logo}>
          <span>{totem?.city_name || 'Niteroi'}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.time}>
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {weather && (
            <span className={styles.tempSmall}>{Math.round(weather.temperature)}°</span>
          )}
        </div>
      </div>

      {/* Fullscreen button (visible on hover) */}
      <button
        className={styles.fullscreenBtn}
        onClick={(e) => {
          e.stopPropagation();
          isFullscreen ? exitFullscreen() : enterFullscreen();
        }}
        title={isFullscreen ? 'Sair do modo tela cheia' : 'Entrar em tela cheia'}
      >
        {isFullscreen ? '⛶' : '⛶'}
      </button>
    </div>
  );
};

export default Player;
