import React, { useState, useEffect } from 'react';
import { totemsService, contentBlocksService } from '../../services/api';

interface ContentBlock {
  id: number;
  totem: number;
  position: number;
  position_display: string;
  block_type: string;
  block_type_display: string;
  title: string;
  subtitle: string;
  background_color: string;
  text_color: string;
  image: string | null;
  content_html: string;
  link_url: string;
  config: any;
  is_active: boolean;
  order: number;
}

interface Totem {
  id: number;
  name: string;
  identifier: string;
  city_name: string;
}

const POSITION_OPTIONS = [
  { value: 1, label: 'Superior Esquerdo', icon: '1' },
  { value: 2, label: 'Superior Direito', icon: '2' },
  { value: 3, label: 'Inferior Esquerdo', icon: '3' },
  { value: 4, label: 'Inferior Direito', icon: '4' },
];

const BLOCK_TYPE_OPTIONS = [
  { value: 'featured_event', label: 'Evento em Destaque', icon: '🎯' },
  { value: 'events_list', label: 'Lista de Eventos', icon: '📅' },
  { value: 'news', label: 'Noticias', icon: '📰' },
  { value: 'pois', label: 'Pontos de Interesse', icon: '📍' },
  { value: 'weather', label: 'Clima', icon: '🌤️' },
  { value: 'map', label: 'Mapa', icon: '🗺️' },
  { value: 'custom', label: 'Conteudo Personalizado', icon: '✏️' },
  { value: 'image', label: 'Imagem', icon: '🖼️' },
  { value: 'video', label: 'Video', icon: '🎬' },
];

const COLOR_PRESETS = [
  { value: '#ffffff', label: 'Branco' },
  { value: '#f1c40f', label: 'Amarelo' },
  { value: '#5b6abf', label: 'Azul/Roxo' },
  { value: '#2ecc71', label: 'Verde' },
  { value: '#e74c3c', label: 'Vermelho' },
  { value: '#1a1a1a', label: 'Preto' },
];

const ContentBlocksAdmin: React.FC = () => {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [selectedTotem, setSelectedTotem] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    position: 1,
    block_type: 'events_list',
    title: '',
    subtitle: '',
    background_color: '#ffffff',
    text_color: '#000000',
    content_html: '',
    link_url: '',
    is_active: true,
  });

  useEffect(() => {
    loadTotems();
  }, []);

  useEffect(() => {
    if (selectedTotem) {
      loadBlocks(selectedTotem);
    }
  }, [selectedTotem]);

  const loadTotems = async () => {
    try {
      const response = await totemsService.getTotems();
      // Handle paginated response: {count, results} or direct array
      const totemsData = response.data.results || response.data;
      setTotems(Array.isArray(totemsData) ? totemsData : []);
      if (totemsData.length > 0) {
        setSelectedTotem(totemsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar totems:', error);
    }
  };

  const loadBlocks = async (totemId: number) => {
    setLoading(true);
    try {
      const response = await contentBlocksService.getBlocks(totemId);
      // Handle paginated response: {count, results} or direct array
      const blocksData = response.data.results || response.data;
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
    } catch (error) {
      console.error('Erro ao carregar blocos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = () => {
    setEditingBlock(null);
    setFormData({
      position: getNextAvailablePosition(),
      block_type: 'events_list',
      title: '',
      subtitle: '',
      background_color: '#ffffff',
      text_color: '#000000',
      content_html: '',
      link_url: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setFormData({
      position: block.position,
      block_type: block.block_type,
      title: block.title,
      subtitle: block.subtitle,
      background_color: block.background_color,
      text_color: block.text_color,
      content_html: block.content_html,
      link_url: block.link_url,
      is_active: block.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteBlock = async (blockId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este bloco?')) return;

    try {
      await contentBlocksService.deleteBlock(blockId);
      if (selectedTotem) loadBlocks(selectedTotem);
    } catch (error) {
      console.error('Erro ao excluir bloco:', error);
      alert('Erro ao excluir bloco');
    }
  };

  const handleSaveBlock = async () => {
    if (!selectedTotem) return;

    setSaving(true);
    try {
      const data = new FormData();
      data.append('totem', selectedTotem.toString());
      data.append('position', formData.position.toString());
      data.append('block_type', formData.block_type);
      data.append('title', formData.title);
      data.append('subtitle', formData.subtitle);
      data.append('background_color', formData.background_color);
      data.append('text_color', formData.text_color);
      data.append('content_html', formData.content_html);
      data.append('link_url', formData.link_url);
      data.append('is_active', formData.is_active.toString());

      if (editingBlock) {
        await contentBlocksService.updateBlock(editingBlock.id, data);
      } else {
        await contentBlocksService.createBlock(data);
      }

      setShowModal(false);
      loadBlocks(selectedTotem);
    } catch (error: any) {
      console.error('Erro ao salvar bloco:', error);
      alert(error.response?.data?.detail || 'Erro ao salvar bloco');
    } finally {
      setSaving(false);
    }
  };

  const getNextAvailablePosition = () => {
    const usedPositions = blocks.map((b) => b.position);
    for (let i = 1; i <= 4; i++) {
      if (!usedPositions.includes(i)) return i;
    }
    return 1;
  };

  const getBlockByPosition = (position: number) => {
    return blocks.find((b) => b.position === position);
  };

  const handleDragStart = (position: number) => {
    setDraggedBlock(position);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetPosition: number) => {
    if (draggedBlock === null || draggedBlock === targetPosition) {
      setDraggedBlock(null);
      return;
    }

    const draggedBlockData = getBlockByPosition(draggedBlock);
    const targetBlockData = getBlockByPosition(targetPosition);

    if (!draggedBlockData) {
      setDraggedBlock(null);
      return;
    }

    try {
      // Swap positions
      await contentBlocksService.updateBlockJson(draggedBlockData.id, {
        position: targetPosition,
      });

      if (targetBlockData) {
        await contentBlocksService.updateBlockJson(targetBlockData.id, {
          position: draggedBlock,
        });
      }

      if (selectedTotem) loadBlocks(selectedTotem);
    } catch (error) {
      console.error('Erro ao reordenar blocos:', error);
    }

    setDraggedBlock(null);
  };

  const renderBlockPreview = (position: number) => {
    const block = getBlockByPosition(position);
    const positionLabel = POSITION_OPTIONS.find((p) => p.value === position)?.label;
    const isDragging = draggedBlock === position;

    return (
      <div
        key={position}
        draggable={!!block}
        onDragStart={() => handleDragStart(position)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(position)}
        style={{
          background: block ? block.background_color : '#f5f5f5',
          color: block ? block.text_color : '#999',
          border: isDragging ? '3px dashed #f1c40f' : '2px solid #ddd',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          cursor: block ? 'grab' : 'pointer',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s',
          minHeight: '150px',
        }}
        onClick={() => (block ? handleEditBlock(block) : handleCreateBlock())}
      >
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '8px' }}>
          {positionLabel}
        </div>

        {block ? (
          <>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>
              {BLOCK_TYPE_OPTIONS.find((t) => t.value === block.block_type)?.icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
              {block.title || block.block_type_display}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7, flex: 1 }}>
              {block.subtitle}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditBlock(block);
                }}
                style={{
                  background: 'rgba(0,0,0,0.1)',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBlock(block.id);
                }}
                style={{
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Excluir
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '32px' }}>+</span>
            <span style={{ fontSize: '12px' }}>Adicionar Bloco</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Blocos de Conteudo</h1>

        <select
          value={selectedTotem || ''}
          onChange={(e) => setSelectedTotem(Number(e.target.value))}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: '#fff',
          }}
        >
          {totems.map((totem) => (
            <option key={totem.id} value={totem.id}>
              {totem.name} ({totem.identifier})
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Layout do Totem (Mosaico 2x2)</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Arraste e solte para reorganizar. Clique para editar.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '16px',
              minHeight: '400px',
            }}
          >
            {[1, 2, 3, 4].map((position) => renderBlockPreview(position))}
          </div>
        )}
      </div>

      {/* Modal de Edicao */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 24px 0' }}>
              {editingBlock ? 'Editar Bloco' : 'Novo Bloco'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Posicao */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Posicao
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, position: opt.value })}
                      style={{
                        padding: '12px',
                        border:
                          formData.position === opt.value
                            ? '2px solid #f1c40f'
                            : '1px solid #ddd',
                        borderRadius: '8px',
                        background: formData.position === opt.value ? '#fffdf0' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>{opt.icon}</div>
                      <div style={{ fontSize: '12px' }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Bloco */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Tipo de Bloco
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                  }}
                >
                  {BLOCK_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, block_type: opt.value })}
                      style={{
                        padding: '12px 8px',
                        border:
                          formData.block_type === opt.value
                            ? '2px solid #f1c40f'
                            : '1px solid #ddd',
                        borderRadius: '8px',
                        background: formData.block_type === opt.value ? '#fffdf0' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '20px' }}>{opt.icon}</div>
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titulo */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Titulo
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  placeholder="Ex: Proximos Eventos"
                />
              </div>

              {/* Subtitulo */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Subtitulo
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  placeholder="Ex: Confira a programacao"
                />
              </div>

              {/* Cores */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Cor de Fundo
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, background_color: color.value })
                        }
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: color.value,
                          border:
                            formData.background_color === color.value
                              ? '3px solid #333'
                              : '1px solid #ddd',
                          cursor: 'pointer',
                        }}
                        title={color.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData({ ...formData, background_color: e.target.value })
                      }
                      style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Cor do Texto
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, text_color: '#000000' })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#000',
                        border:
                          formData.text_color === '#000000'
                            ? '3px solid #f1c40f'
                            : '1px solid #ddd',
                        cursor: 'pointer',
                      }}
                      title="Preto"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, text_color: '#ffffff' })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#fff',
                        border:
                          formData.text_color === '#ffffff'
                            ? '3px solid #333'
                            : '1px solid #ddd',
                        cursor: 'pointer',
                      }}
                      title="Branco"
                    />
                  </div>
                </div>
              </div>

              {/* Conteudo HTML (para tipo custom) */}
              {formData.block_type === 'custom' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Conteudo HTML
                  </label>
                  <textarea
                    value={formData.content_html}
                    onChange={(e) =>
                      setFormData({ ...formData, content_html: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '100px',
                      fontFamily: 'monospace',
                    }}
                    placeholder="<div>Seu conteudo aqui</div>"
                  />
                </div>
              )}

              {/* Ativo */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 600 }}>Bloco Ativo</span>
                </label>
              </div>

              {/* Botoes */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  marginTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBlock}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#f1c40f',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentBlocksAdmin;
