import React, { useState, useEffect, useRef } from 'react';
import { totemsService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface Totem {
  id: number;
  name: string;
  address: string;
  city_name: string;
  status: string;
  theme: string;
  logo: string | null;
  background_image: string | null;
  background_color: string;
}

const THEME_OPTIONS = [
  { value: 'player', label: 'Player (Somente Anuncios)', icon: '📺' },
  { value: 'tomipro', label: 'TOMI Pro (Completo)', icon: '⭐' },
  { value: 'tomi', label: 'TOMI (Classico)', icon: '🖥️' },
  { value: 'dashboard', label: 'Dashboard', icon: '📊' },
  { value: 'touch', label: 'Touch', icon: '👆' },
  { value: 'simple', label: 'Simples', icon: '📱' },
];

const API_BASE = 'http://10.50.30.168:8000';

const TotemsAdmin: React.FC = () => {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTotem, setEditingTotem] = useState<Totem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedTheme, setSelectedTheme] = useState('player');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('');
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await totemsService.getTotems();
      setTotems(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Error loading totems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (totem: Totem) => {
    setEditingTotem(totem);
    setSelectedTheme(totem.theme || 'player');
    setLogoFile(null);
    setBgFile(null);
    setLogoPreview(totem.logo ? (totem.logo.startsWith('http') ? totem.logo : `${API_BASE}${totem.logo}`) : null);
    setBgPreview(totem.background_image ? (totem.background_image.startsWith('http') ? totem.background_image : `${API_BASE}${totem.background_image}`) : null);
    setBgColor(totem.background_color || '');
    setRemoveLogo(false);
    setRemoveBg(false);
    setShowModal(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setRemoveLogo(false);
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgFile(file);
      setBgPreview(URL.createObjectURL(file));
      setRemoveBg(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleRemoveBg = () => {
    setBgFile(null);
    setBgPreview(null);
    setRemoveBg(true);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTotem) return;

    setSaving(true);
    try {
      const formData = new FormData();

      // Add theme
      formData.append('theme', selectedTheme);

      // Add logo if changed
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (removeLogo) {
        formData.append('logo', '');
      }

      // Add background image if changed
      if (bgFile) {
        formData.append('background_image', bgFile);
      } else if (removeBg) {
        formData.append('background_image', '');
      }

      // Add background color
      formData.append('background_color', bgColor);

      await totemsService.updateTotem(editingTotem.id, formData);

      setShowModal(false);
      setEditingTotem(null);
      loadData();
    } catch (error) {
      console.error('Error saving totem:', error);
      alert('Erro ao salvar configuracoes do totem');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Configuracao de Totems</h1>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cidade</th>
              <th>Layout</th>
              <th>Logo</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {totems.map(totem => {
              const themeInfo = THEME_OPTIONS.find(t => t.value === totem.theme) || THEME_OPTIONS[0];
              return (
                <tr key={totem.id}>
                  <td><strong>{totem.name}</strong></td>
                  <td>{totem.city_name}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{themeInfo.icon}</span>
                      <span>{themeInfo.label}</span>
                    </span>
                  </td>
                  <td>
                    {totem.logo ? (
                      <img
                        src={getImageUrl(totem.logo) || ''}
                        alt="Logo"
                        style={{ height: '30px', maxWidth: '80px', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: '#666' }}>Sem logo</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${totem.status === 'active' ? styles.badgeGreen : styles.badgeRed}`}>
                      {totem.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => handleEdit(totem)}>
                        Personalizar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {totems.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>Nenhum totem encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Personalizacao */}
      {showModal && editingTotem && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2>Personalizar Totem: {editingTotem.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Theme Selector */}
              <div className={styles.formGroup}>
                <label>Layout / Tema</label>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  Escolha o layout visual do totem.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setSelectedTheme(theme.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        background: selectedTheme === theme.value ? '#f1c40f' : 'rgba(255,255,255,0.05)',
                        border: selectedTheme === theme.value ? '2px solid #f1c40f' : '2px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: selectedTheme === theme.value ? '#000' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{theme.icon}</span>
                      <span style={{ fontWeight: selectedTheme === theme.value ? 600 : 400 }}>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo */}
              <div className={styles.formGroup}>
                <label>Logo (PNG recomendado)</label>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  Substitui o nome da cidade no cabecalho. Recomendado: PNG transparente, altura maxima 40px.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {logoPreview && (
                    <div style={{
                      padding: '12px',
                      background: '#1a1a2e',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img
                        src={logoPreview}
                        alt="Preview"
                        style={{ height: '40px', maxWidth: '150px', objectFit: 'contain' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        style={{
                          background: '#dc3545',
                          border: 'none',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Background Image */}
              <div className={styles.formGroup}>
                <label>Imagem de Fundo</label>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  Imagem de fundo para a area de interacao do totem.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {bgPreview && (
                    <div style={{
                      padding: '8px',
                      background: '#1a1a2e',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img
                        src={bgPreview}
                        alt="Preview"
                        style={{ height: '60px', width: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBg}
                        style={{
                          background: '#dc3545',
                          border: 'none',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBgChange}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Background Color/Gradient */}
              <div className={styles.formGroup}>
                <label>Cor/Gradiente de Fundo</label>
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                  Usado quando nao ha imagem de fundo. Aceita cores solidas ou gradientes CSS.
                </p>
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  placeholder="Ex: #1a1a2e ou linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
                />
                {bgColor && (
                  <div style={{
                    marginTop: '8px',
                    height: '40px',
                    background: bgColor,
                    borderRadius: '8px',
                    border: '1px solid #333'
                  }} />
                )}
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setBgColor('linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)')}
                    style={{
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Roxo Escuro
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)')}
                    style={{
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Azul Escuro
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('linear-gradient(135deg, #232526 0%, #414345 100%)')}
                    style={{
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #232526, #414345)',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Cinza
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgColor('linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)')}
                    style={{
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Oceano
                  </button>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotemsAdmin;
