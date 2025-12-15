import React, { useState, useEffect, useRef } from 'react';
import { contentService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  image: string;
  is_active: boolean;
  created_at: string;
}

const GalleryAdmin: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: true
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentService.getAllGallery();
      setImages(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Selecione pelo menos uma imagem');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file);
      });

      await contentService.bulkUploadGallery(formData);
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadData();
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    try {
      await contentService.updateGalleryImage(editingImage.id, formData);
      setShowModal(false);
      setEditingImage(null);
      loadData();
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Erro ao atualizar imagem');
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title || '',
      description: image.description || '',
      is_active: image.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      try {
        await contentService.deleteGalleryImage(id);
        loadData();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Erro ao excluir imagem');
      }
    }
  };

  const handleToggleActive = async (image: GalleryImage) => {
    try {
      await contentService.updateGalleryImage(image.id, {
        is_active: !image.is_active
      });
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Galeria de Imagens</h1>
        <div className={styles.headerActions}>
          <span className={styles.imageCount}>{images.length} imagens</span>
        </div>
      </div>

      {/* Upload Section */}
      <div className={styles.uploadSection}>
        <h3>Upload de Imagens</h3>
        <div className={styles.uploadBox}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={e => setSelectedFiles(e.target.files)}
            className={styles.fileInput}
            id="gallery-upload"
          />
          <label htmlFor="gallery-upload" className={styles.uploadLabel}>
            {selectedFiles && selectedFiles.length > 0 ? (
              <span>{selectedFiles.length} arquivo(s) selecionado(s)</span>
            ) : (
              <span>Clique ou arraste imagens aqui</span>
            )}
          </label>
          <button
            className={styles.primaryBtn}
            onClick={handleBulkUpload}
            disabled={uploading || !selectedFiles || selectedFiles.length === 0}
          >
            {uploading ? 'Enviando...' : 'Fazer Upload'}
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={styles.galleryGrid}>
        {images.map(image => (
          <div key={image.id} className={`${styles.galleryItem} ${!image.is_active ? styles.inactive : ''}`}>
            <div className={styles.galleryImageWrapper}>
              <img src={image.image} alt={image.title || 'Imagem'} />
              <div className={styles.galleryOverlay}>
                <button
                  className={styles.overlayBtn}
                  onClick={() => handleEdit(image)}
                  title="Editar"
                >
                  Editar
                </button>
                <button
                  className={styles.overlayBtn}
                  onClick={() => handleToggleActive(image)}
                  title={image.is_active ? 'Desativar' : 'Ativar'}
                >
                  {image.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  className={`${styles.overlayBtn} ${styles.deleteOverlayBtn}`}
                  onClick={() => handleDelete(image.id)}
                  title="Excluir"
                >
                  Excluir
                </button>
              </div>
            </div>
            <div className={styles.galleryInfo}>
              <h4>{image.title || 'Sem título'}</h4>
              <span className={`${styles.badge} ${image.is_active ? styles.badgeGreen : styles.badgeGray}`}>
                {image.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className={styles.emptyState}>
            <p>Nenhuma imagem na galeria</p>
            <p className={styles.emptyHint}>Use o formulário acima para adicionar imagens</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingImage && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Editar Imagem</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalPreview}>
                <img src={editingImage.image} alt="" />
              </div>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da imagem"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descrição opcional..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Ativo (exibir no player)</span>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryAdmin;
