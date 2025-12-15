import React, { useState, useEffect } from 'react';
import { contentService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: string;
  image?: string;
  is_featured: boolean;
  is_published: boolean;
}

const EventsAdmin: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    venue: '',
    is_featured: false,
    is_published: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentService.getEvents();
      setEvents(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('start_date', formData.start_date);
      if (formData.end_date) {
        data.append('end_date', formData.end_date);
      }
      data.append('venue', formData.venue);
      data.append('is_featured', formData.is_featured.toString());
      data.append('is_published', formData.is_published.toString());

      if (selectedFile) {
        data.append('image', selectedFile);
      }

      if (editingEvent) {
        await contentService.updateEvent(editingEvent.id, data);
      } else {
        await contentService.createEvent(data);
      }
      setShowModal(false);
      setEditingEvent(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erro ao salvar evento');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date?.split('T')[0] || '',
      end_date: event.end_date?.split('T')[0] || '',
      venue: event.venue || '',
      is_featured: event.is_featured,
      is_published: event.is_published
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await contentService.deleteEvent(id);
        loadData();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Erro ao excluir evento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      venue: '',
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
        <h1>Eventos</h1>
        <button className={styles.primaryBtn} onClick={() => {
          resetForm();
          setEditingEvent(null);
          setShowModal(true);
        }}>
          + Novo Evento
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Título</th>
              <th>Data</th>
              <th>Local</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>
                  {event.image ? (
                    <img src={event.image} alt="" className={styles.thumbnailSmall} />
                  ) : (
                    <span className={styles.noImage}>📅</span>
                  )}
                </td>
                <td>
                  <strong>{event.title}</strong>
                  {event.is_featured && <span className={`${styles.badge} ${styles.badgeYellow}`}>Destaque</span>}
                </td>
                <td>
                  {new Date(event.start_date).toLocaleDateString('pt-BR')}
                  {event.end_date && event.end_date !== event.start_date &&
                    ` - ${new Date(event.end_date).toLocaleDateString('pt-BR')}`}
                </td>
                <td>{event.venue || '-'}</td>
                <td>
                  <span className={`${styles.badge} ${event.is_published ? styles.badgeGreen : styles.badgeGray}`}>
                    {event.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(event)}>Editar</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(event.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>Nenhum evento encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h2>
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
                <label>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Data Início</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Data Fim</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Local</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
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
                  {editingEvent ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsAdmin;
