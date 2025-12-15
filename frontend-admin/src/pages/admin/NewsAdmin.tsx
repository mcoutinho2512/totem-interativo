import React, { useState, useEffect } from 'react';
import { contentService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface News {
  id: number;
  title: string;
  summary: string;
  content: string;
  image?: string;
  source?: string;
  published_at: string;
  is_featured: boolean;
  is_published: boolean;
}

const NewsAdmin: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    source: '',
    is_featured: false,
    is_published: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentService.getNews();
      setNews(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('summary', formData.summary);
      data.append('content', formData.content);
      data.append('source', formData.source);
      data.append('is_featured', formData.is_featured.toString());
      data.append('is_published', formData.is_published.toString());

      if (selectedFile) {
        data.append('image', selectedFile);
      }

      if (editingNews) {
        await contentService.updateNews(editingNews.id, data);
      } else {
        await contentService.createNews(data);
      }
      setShowModal(false);
      setEditingNews(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Erro ao salvar notícia');
    }
  };

  const handleEdit = (item: News) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      summary: item.summary || '',
      content: item.content || '',
      source: item.source || '',
      is_featured: item.is_featured,
      is_published: item.is_published
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia?')) {
      try {
        await contentService.deleteNews(id);
        loadData();
      } catch (error) {
        console.error('Error deleting news:', error);
        alert('Erro ao excluir notícia');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      source: '',
      is_featured: false,
      is_published: true
    });
    setSelectedFile(null);
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Notícias</h1>
        <button className={styles.primaryBtn} onClick={() => {
          resetForm();
          setEditingNews(null);
          setShowModal(true);
        }}>
          + Nova Notícia
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Título</th>
              <th>Fonte</th>
              <th>Data</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {news.map(item => (
              <tr key={item.id}>
                <td>
                  {item.image ? (
                    <img src={item.image} alt="" className={styles.thumbnailSmall} />
                  ) : (
                    <span className={styles.noImage}>📰</span>
                  )}
                </td>
                <td>
                  <strong>{item.title}</strong>
                  {item.is_featured && <span className={`${styles.badge} ${styles.badgeYellow}`}>Destaque</span>}
                  {item.summary && <p className={styles.summaryText}>{item.summary.substring(0, 80)}...</p>}
                </td>
                <td>{item.source || '-'}</td>
                <td>{new Date(item.published_at).toLocaleDateString('pt-BR')}</td>
                <td>
                  <span className={`${styles.badge} ${item.is_published ? styles.badgeGreen : styles.badgeGray}`}>
                    {item.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(item)}>Editar</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {news.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>Nenhuma notícia encontrada</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingNews ? 'Editar Notícia' : 'Nova Notícia'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Resumo</label>
                <textarea
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  rows={2}
                  placeholder="Breve resumo da notícia..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Conteúdo</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Conteúdo completo da notícia..."
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fonte</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    placeholder="Ex: Prefeitura de Niterói"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Imagem</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                    />
                    <span>Publicado</span>
                  </label>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    <span>Destaque</span>
                  </label>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingNews ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
