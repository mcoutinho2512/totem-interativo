import React, { useState, useEffect } from 'react';
import { advertisingService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface Creative {
  id: number;
  name: string;
  campaign: number;
  campaign_name?: string;
  ad_type: string;
  file: string;
  duration: number;
  is_active: boolean;
}

interface Campaign {
  id: number;
  name: string;
}

const CreativesAdmin: React.FC = () => {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    campaign: '',
    ad_type: 'image',
    duration: 8,
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creativesRes, campaignsRes] = await Promise.all([
        advertisingService.getCreatives(),
        advertisingService.getCampaigns()
      ]);
      setCreatives(creativesRes.data?.results || creativesRes.data || []);
      setCampaigns(campaignsRes.data?.results || campaignsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('campaign', formData.campaign);
      data.append('ad_type', formData.ad_type);
      data.append('duration', formData.duration.toString());
      data.append('is_active', formData.is_active.toString());

      if (selectedFile) {
        data.append('file', selectedFile);
      }

      if (editingCreative) {
        await advertisingService.updateCreative(editingCreative.id, data);
      } else {
        await advertisingService.createCreative(data);
      }
      setShowModal(false);
      setEditingCreative(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving creative:', error);
      alert('Erro ao salvar criativo');
    }
  };

  const handleEdit = (creative: Creative) => {
    setEditingCreative(creative);
    setFormData({
      name: creative.name,
      campaign: creative.campaign.toString(),
      ad_type: creative.ad_type,
      duration: creative.duration,
      is_active: creative.is_active
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este criativo?')) {
      try {
        await advertisingService.deleteCreative(id);
        loadData();
      } catch (error) {
        console.error('Error deleting creative:', error);
        alert('Erro ao excluir criativo');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      campaign: '',
      ad_type: 'image',
      duration: 8,
      is_active: true
    });
    setSelectedFile(null);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      image: 'Imagem',
      video: 'Vídeo'
    };
    return types[type] || type;
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Criativos</h1>
        <button className={styles.primaryBtn} onClick={() => {
          resetForm();
          setEditingCreative(null);
          setShowModal(true);
        }}>
          + Novo Criativo
        </button>
      </div>

      <div className={styles.cardGrid}>
        {creatives.map(creative => (
          <div key={creative.id} className={styles.card}>
            <div className={styles.cardImage}>
              {creative.ad_type === 'image' && creative.file ? (
                <img src={creative.file} alt={creative.name} />
              ) : creative.ad_type === 'video' && creative.file ? (
                <video src={creative.file} muted />
              ) : (
                <div className={styles.placeholderImage}>
                  {creative.ad_type === 'video' ? '🎬' : '🖼️'}
                </div>
              )}
            </div>
            <div className={styles.cardContent}>
              <h3>{creative.name}</h3>
              <p className={styles.cardMeta}>
                {campaigns.find(c => c.id === creative.campaign)?.name || '-'}
              </p>
              <div className={styles.cardInfo}>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>{getTypeLabel(creative.ad_type)}</span>
                <span>{creative.duration}s</span>
                <span className={`${styles.badge} ${creative.is_active ? styles.badgeGreen : styles.badgeGray}`}>
                  {creative.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button className={styles.editBtn} onClick={() => handleEdit(creative)}>Editar</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(creative.id)}>Excluir</button>
            </div>
          </div>
        ))}
        {creatives.length === 0 && (
          <div className={styles.emptyState}>
            <p>Nenhum criativo encontrado</p>
            <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
              Criar primeiro criativo
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCreative ? 'Editar Criativo' : 'Novo Criativo'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Campanha</label>
                <select
                  value={formData.campaign}
                  onChange={e => setFormData({ ...formData, campaign: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tipo</label>
                  <select
                    value={formData.ad_type}
                    onChange={e => setFormData({ ...formData, ad_type: e.target.value })}
                  >
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Duração (segundos)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Arquivo</label>
                <input
                  type="file"
                  accept={formData.ad_type === 'video' ? 'video/*' : 'image/*'}
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  required={!editingCreative}
                />
                {editingCreative?.file && !selectedFile && (
                  <p className={styles.currentFile}>Arquivo atual: {editingCreative.file.split('/').pop()}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Ativo</span>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingCreative ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativesAdmin;
