import React, { useState, useEffect } from 'react';
import { advertisingService } from '../../services/api';
import styles from '../../styles/AdminPages.module.css';

interface DailyStats {
  date: string;
  impressions: number;
  unique_ads: number;
  total_duration: number;
}

interface CampaignStats {
  id: number;
  name: string;
  impressions: number;
  total_duration: number;
  unique_days: number;
}

const ReportsAdmin: React.FC = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [totals, setTotals] = useState({
    impressions: 0,
    duration: 0,
    avgPerDay: 0
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, dailyRes] = await Promise.all([
        advertisingService.getStats(),
        advertisingService.getDailyStats(dateRange.start, dateRange.end)
      ]);

      const stats = statsRes.data;
      const daily = dailyRes.data || [];

      setDailyStats(daily);
      setCampaigns(stats?.top_campaigns || []);

      // Calculate totals
      const totalImpressions = daily.reduce((sum: number, d: DailyStats) => sum + d.impressions, 0);
      const totalDuration = daily.reduce((sum: number, d: DailyStats) => sum + d.total_duration, 0);

      setTotals({
        impressions: totalImpressions,
        duration: totalDuration,
        avgPerDay: daily.length > 0 ? Math.round(totalImpressions / daily.length) : 0
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await advertisingService.exportImpressions(dateRange.start, dateRange.end);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impressions_${dateRange.start}_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Erro ao exportar dados');
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const maxImpressions = Math.max(...dailyStats.map(d => d.impressions), 1);

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <h1>Relatórios de Impressões</h1>
        <div className={styles.headerActions}>
          <div className={styles.dateFilters}>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span>até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button className={styles.primaryBtn} onClick={handleExport}>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total de Impressões</div>
          <div className={styles.statValue}>{totals.impressions.toLocaleString('pt-BR')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tempo Total de Exibição</div>
          <div className={styles.statValue}>{formatDuration(totals.duration)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Média por Dia</div>
          <div className={styles.statValue}>{totals.avgPerDay.toLocaleString('pt-BR')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Dias com Dados</div>
          <div className={styles.statValue}>{dailyStats.length}</div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className={styles.chartSection}>
        <h2>Impressões Diárias</h2>
        <div className={styles.barChartContainer}>
          {dailyStats.length > 0 ? (
            <div className={styles.barChart}>
              {dailyStats.map((day, idx) => (
                <div key={idx} className={styles.barItem}>
                  <div
                    className={styles.bar}
                    style={{ height: `${(day.impressions / maxImpressions) * 100}%` }}
                  >
                    <span className={styles.barValue}>{day.impressions}</span>
                  </div>
                  <span className={styles.barLabel}>
                    {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>Nenhum dado para o período selecionado</div>
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className={styles.tableSection}>
        <h2>Performance por Campanha</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Impressões</th>
                <th>Tempo Total</th>
                <th>Dias Ativos</th>
                <th>% do Total</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <tr key={campaign.id}>
                  <td><strong>{campaign.name}</strong></td>
                  <td>{campaign.impressions.toLocaleString('pt-BR')}</td>
                  <td>{formatDuration(campaign.total_duration)}</td>
                  <td>{campaign.unique_days}</td>
                  <td>
                    <div className={styles.progressWrapper}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${totals.impressions > 0 ? (campaign.impressions / totals.impressions) * 100 : 0}%` }}
                      />
                      <span>{totals.impressions > 0 ? ((campaign.impressions / totals.impressions) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>Nenhuma campanha com impressões</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsAdmin;
