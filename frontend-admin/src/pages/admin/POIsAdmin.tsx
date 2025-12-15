import React, { useState, useEffect } from 'react';
import { contentService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface POI {
  id: number;
  name: string;
  description: string;
  poi_type: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  image?: string;
  is_active: boolean;
}

const POI_TYPES = [
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'pharmacy', label: 'Farmácia', icon: '💊' },
  { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'attraction', label: 'Atração', icon: '🎭' },
  { value: 'transport', label: 'Transporte', icon: '🚌' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'bank', label: 'Banco', icon: '🏦' },
  { value: 'government', label: 'Governo', icon: '🏛️' },
  { value: 'education', label: 'Educação', icon: '🎓' },
  { value: 'other', label: 'Outro', icon: '📍' }
];

const POIsAdmin: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);
  const [filterType, setFilterType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    poi_type: 'other',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    website: '',
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await contentService.getPOIs();
      setPois(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Error loading POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('poi_type', formData.poi_type);
      data.append('address', formData.address);
      if (formData.latitude) data.append('latitude', formData.latitude);
      if (formData.longitude) data.append('longitude', formData.longitude);
      data.append('phone', formData.phone);
      data.append('website', formData.website);
      data.append('is_active', formData.is_active.toString());

      if (selectedFile) {
        data.append('image', selectedFile);
      }

      if (editingPoi) {
        await contentService.updatePOI(editingPoi.id, data);
      } else {
        await contentService.createPOI(data);
      }
      setShowModal(false);
      setEditingPoi(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving POI:', error);
      alert('Erro ao salvar POI');
    }
  };

  const handleEdit = (poi: POI) => {
    setEditingPoi(poi);
    setFormData({
      name: poi.name,
      description: poi.description || '',
      poi_type: poi.poi_type,
      address: poi.address || '',
      latitude: poi.latitude?.toString() || '',
      longitude: poi.longitude?.toString() || '',
      phone: poi.phone || '',
      website: poi.website || '',
      is_active: poi.is_active
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este POI?')) {
      try {
        await contentService.deletePOI(id);
        loadData();
      } catch (error) {
        console.error('Error deleting POI:', error);
        alert('Erro ao excluir POI');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      poi_type: 'other',
      address: '',
      latitude: '',
      longitude: '',
      phone: '',
      website: '',
      is_active: true
    });
    setSelectedFile(null);
  };

  const getTypeInfo = (type: string) => {
    return POI_TYPES.find(t => t.value === type) || POI_TYPES[POI_TYPES.length - 1];
  };

  const filteredPois = filterType
    ? pois.filter(poi => poi.poi_type === filterType)
    : pois;

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Pontos de Interesse</h1>
        <div className={styles.headerActions}>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {POI_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
          <button className={styles.primaryBtn} onClick={() => {
            resetForm();
            setEditingPoi(null);
            setShowModal(true);
          }}>
            + Novo POI
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Endereço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPois.map(poi => {
              const typeInfo = getTypeInfo(poi.poi_type);
              return (
                <tr key={poi.id}>
                  <td>
                    {poi.image ? (
                      <img src={poi.image} alt="" className={styles.thumbnailSmall} />
                    ) : (
                      <span className={styles.noImage}>{typeInfo.icon}</span>
                    )}
                  </td>
                  <td>
                    <strong>{poi.name}</strong>
                    {poi.phone && <p className={styles.metaText}>{poi.phone}</p>}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeBlue}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                  </td>
                  <td className={styles.addressCell}>{poi.address || '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${poi.is_active ? styles.badgeGreen : styles.badgeGray}`}>
                      {poi.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => handleEdit(poi)}>Editar</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(poi.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPois.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>Nenhum POI encontrado</td>
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
              <h2>{editingPoi ? 'Editar POI' : 'Novo POI'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formRow}>
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
                  <label>Tipo</label>
                  <select
                    value={formData.poi_type}
                    onChange={e => setFormData({ ...formData, poi_type: e.target.value })}
                    required
                  >
                    {POI_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="-22.8969"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="-43.1261"
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
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
                  {editingPoi ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POIsAdmin;
