import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advertisingService, contentService } from '../services/api';
import styles from '../styles/Dashboard.module.css';

interface Stats {
  total_impressions: number;
  total_duration_viewed: number;
  avg_duration_per_impression: number;
  impressions_by_campaign: Array<{
    campaign_id: number;
    campaign: string;
    impressions: number;
    avg_duration: number;
  }>;
  impressions_by_day: Array<{
    date: string;
    count: number;
  }>;
  top_totems: Array<{
    totem_id: number;
    totem: string;
    impressions: number;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);
  const [poisCount, setPoisCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load advertising stats
        const statsRes = await advertisingService.getStats(30);
        setStats(statsRes.data);

        // Load content counts
        const [eventsRes, newsRes, poisRes, campaignsRes] = await Promise.all([
          contentService.getAllEvents(),
          contentService.getNews(),
          contentService.getPOIs(),
          advertisingService.getCampaigns(),
        ]);

        setEventsCount(eventsRes.data?.results?.length || eventsRes.data?.length || 0);
        setNewsCount(newsRes.data?.results?.length || newsRes.data?.length || 0);
        setPoisCount(poisRes.data?.results?.length || poisRes.data?.length || 0);
        setCampaignsCount(campaignsRes.data?.results?.length || campaignsRes.data?.length || 0);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExport = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await advertisingService.exportImpressions(startDate, endDate);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impressions_${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Visao geral do sistema</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => navigate('/campaigns')}>
          <div className={styles.statIcon}>Campanhas</div>
          <div className={styles.statValue}>{campaignsCount}</div>
          <div className={styles.statLabel}>Campanhas</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>Impressoes</div>
          <div className={styles.statValue}>{stats?.total_impressions || 0}</div>
          <div className={styles.statLabel}>Impressoes (30 dias)</div>
        </div>

        <div className={styles.statCard} onClick={() => navigate('/events')}>
          <div className={styles.statIcon}>Eventos</div>
          <div className={styles.statValue}>{eventsCount}</div>
          <div className={styles.statLabel}>Eventos</div>
        </div>

        <div className={styles.statCard} onClick={() => navigate('/pois')}>
          <div className={styles.statIcon}>POIs</div>
          <div className={styles.statValue}>{poisCount}</div>
          <div className={styles.statLabel}>Pontos de Interesse</div>
        </div>

        <div className={styles.statCard} onClick={() => navigate('/news')}>
          <div className={styles.statIcon}>Noticias</div>
          <div className={styles.statValue}>{newsCount}</div>
          <div className={styles.statLabel}>Noticias</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>Duracao</div>
          <div className={styles.statValue}>
            {Math.round((stats?.total_duration_viewed || 0) / 60)}min
          </div>
          <div className={styles.statLabel}>Tempo Total Visualizado</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Daily Impressions */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Impressoes por Dia (Ultimos 30 dias)</h3>
            <button className={styles.exportBtn} onClick={handleExport}>
              Exportar CSV
            </button>
          </div>
          <div className={styles.chartContent}>
            {stats?.impressions_by_day?.length ? (
              <div className={styles.barChart}>
                {stats.impressions_by_day.slice(0, 14).map((day, idx) => (
                  <div key={idx} className={styles.barItem}>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${Math.max(5, (day.count / Math.max(...stats.impressions_by_day.map(d => d.count))) * 100)}%`,
                      }}
                    >
                      <span className={styles.barValue}>{day.count}</span>
                    </div>
                    <span className={styles.barLabel}>
                      {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noData}>Nenhum dado disponivel</div>
            )}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Top Campanhas</h3>
          </div>
          <div className={styles.chartContent}>
            {stats?.impressions_by_campaign?.length ? (
              <div className={styles.campaignsList}>
                {stats.impressions_by_campaign.slice(0, 5).map((campaign, idx) => (
                  <div key={idx} className={styles.campaignItem}>
                    <div className={styles.campaignInfo}>
                      <span className={styles.campaignRank}>#{idx + 1}</span>
                      <span className={styles.campaignName}>{campaign.campaign}</span>
                    </div>
                    <div className={styles.campaignStats}>
                      <span className={styles.impressions}>{campaign.impressions} imp.</span>
                      <span className={styles.avgDuration}>{campaign.avg_duration}s media</span>
                    </div>
                    <div className={styles.campaignBar}>
                      <div
                        className={styles.campaignProgress}
                        style={{
                          width: `${(campaign.impressions / stats.impressions_by_campaign[0].impressions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noData}>Nenhuma campanha com impressoes</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Acoes Rapidas</h3>
        <div className={styles.actionButtons}>
          <button onClick={() => navigate('/campaigns/new')} className={styles.actionBtn}>
            + Nova Campanha
          </button>
          <button onClick={() => navigate('/events/new')} className={styles.actionBtn}>
            + Novo Evento
          </button>
          <button onClick={() => navigate('/news/new')} className={styles.actionBtn}>
            + Nova Noticia
          </button>
          <button onClick={() => navigate('/gallery')} className={styles.actionBtn}>
            Upload Galeria
          </button>
          <button onClick={() => navigate('/reports')} className={styles.actionBtn}>
            Ver Relatorios
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
