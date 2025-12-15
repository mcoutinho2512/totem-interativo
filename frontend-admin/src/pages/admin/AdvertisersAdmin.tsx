import React, { useState, useEffect } from 'react';
import { advertisingService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface Advertiser {
  id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  campaigns_count?: number;
}

const AdvertisersAdmin: React.FC = () => {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await advertisingService.getAdvertisers();
      setAdvertisers(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Error loading advertisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdvertiser) {
        await advertisingService.updateAdvertiser(editingAdvertiser.id, formData);
      } else {
        await advertisingService.createAdvertiser(formData);
      }
      setShowModal(false);
      setEditingAdvertiser(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving advertiser:', error);
      alert('Erro ao salvar anunciante');
    }
  };

  const handleEdit = (advertiser: Advertiser) => {
    setEditingAdvertiser(advertiser);
    setFormData({
      name: advertiser.name,
      contact_email: advertiser.contact_email || '',
      contact_phone: advertiser.contact_phone || '',
      is_active: advertiser.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este anunciante?')) {
      try {
        await advertisingService.deleteAdvertiser(id);
        loadData();
      } catch (error) {
        console.error('Error deleting advertiser:', error);
        alert('Erro ao excluir anunciante');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_email: '',
      contact_phone: '',
      is_active: true
    });
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Anunciantes</h1>
        <button className={styles.primaryBtn} onClick={() => {
          resetForm();
          setEditingAdvertiser(null);
          setShowModal(true);
        }}>
          + Novo Anunciante
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Campanhas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {advertisers.map(advertiser => (
              <tr key={advertiser.id}>
                <td><strong>{advertiser.name}</strong></td>
                <td>{advertiser.contact_email || '-'}</td>
                <td>{advertiser.contact_phone || '-'}</td>
                <td>
                  <span className={`${styles.badge} ${advertiser.is_active ? styles.badgeGreen : styles.badgeRed}`}>
                    {advertiser.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>{advertiser.campaigns_count || 0}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(advertiser)}>Editar</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(advertiser.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {advertisers.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>Nenhum anunciante encontrado</td>
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
              <h2>{editingAdvertiser ? 'Editar Anunciante' : 'Novo Anunciante'}</h2>
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
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
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
                  {editingAdvertiser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisersAdmin;
