import React, { useState, useEffect } from 'react';
import { advertisingService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface Campaign {
  id: number;
  name: string;
  advertiser: number;
  advertiser_name?: string;
  start_date: string;
  end_date: string;
  status: string;
  budget: string;
  impressions_count?: number;
}

interface Advertiser {
  id: number;
  name: string;
}

const CampaignsAdmin: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    advertiser: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    budget: '0.00'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, advertisersRes] = await Promise.all([
        advertisingService.getCampaigns(),
        advertisingService.getAdvertisers()
      ]);
      setCampaigns(campaignsRes.data?.results || campaignsRes.data || []);
      setAdvertisers(advertisersRes.data?.results || advertisersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await advertisingService.updateCampaign(editingCampaign.id, formData);
      } else {
        await advertisingService.createCampaign(formData);
      }
      setShowModal(false);
      setEditingCampaign(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Erro ao salvar campanha');
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      advertiser: campaign.advertiser.toString(),
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      status: campaign.status,
      budget: campaign.budget
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      try {
        await advertisingService.deleteCampaign(id);
        loadData();
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Erro ao excluir campanha');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      advertiser: '',
      start_date: '',
      end_date: '',
      status: 'draft',
      budget: '0.00'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: styles.badgeGray },
      active: { label: 'Ativa', className: styles.badgeGreen },
      paused: { label: 'Pausada', className: styles.badgeYellow },
      ended: { label: 'Encerrada', className: styles.badgeRed }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`${styles.badge} ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Campanhas</h1>
        <button className={styles.primaryBtn} onClick={() => {
          resetForm();
          setEditingCampaign(null);
          setShowModal(true);
        }}>
          + Nova Campanha
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Anunciante</th>
              <th>Período</th>
              <th>Status</th>
              <th>Orçamento</th>
              <th>Impressões</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => (
              <tr key={campaign.id}>
                <td><strong>{campaign.name}</strong></td>
                <td>{campaign.advertiser_name || advertisers.find(a => a.id === campaign.advertiser)?.name || '-'}</td>
                <td>
                  {new Date(campaign.start_date).toLocaleDateString('pt-BR')} - {new Date(campaign.end_date).toLocaleDateString('pt-BR')}
                </td>
                <td>{getStatusBadge(campaign.status)}</td>
                <td>R$ {parseFloat(campaign.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>{campaign.impressions_count?.toLocaleString('pt-BR') || 0}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(campaign)}>Editar</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(campaign.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>Nenhuma campanha encontrada</td>
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
              <h2>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nome da Campanha</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Anunciante</label>
                <select
                  value={formData.advertiser}
                  onChange={e => setFormData({ ...formData, advertiser: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {advertisers.map(adv => (
                    <option key={adv.id} value={adv.id}>{adv.name}</option>
                  ))}
                </select>
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
                    required
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                    <option value="ended">Encerrada</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Orçamento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {editingCampaign ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsAdmin;
