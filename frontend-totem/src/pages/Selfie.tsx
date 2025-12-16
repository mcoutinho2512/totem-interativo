import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTotemStore } from '../store/totemStore';
import styles from '../styles/Selfie.module.css';

const Selfie: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { totem } = useTotemStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Iniciar camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Verificar se mediaDevices está disponível (requer HTTPS ou localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Tentar fallback para navegadores antigos
        const getUserMedia = (navigator as any).getUserMedia ||
                            (navigator as any).webkitGetUserMedia ||
                            (navigator as any).mozGetUserMedia;

        if (!getUserMedia) {
          setCameraError('Camera nao suportada. Acesse via HTTPS para usar esta funcionalidade.');
          return;
        }

        // Usar fallback
        getUserMedia.call(navigator,
          { video: { facingMode: 'user' }, audio: false },
          (mediaStream: MediaStream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play();
            }
            setStream(mediaStream);
          },
          (err: any) => {
            console.error('Erro ao acessar camera:', err);
            setCameraError('Nao foi possivel acessar a camera. Verifique as permissoes.');
          }
        );
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err: any) {
      console.error('Erro ao acessar camera:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Permissao negada. Autorize o acesso a camera nas configuracoes do navegador.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Nenhuma camera encontrada no dispositivo.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera em uso por outro aplicativo.');
      } else if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        setCameraError('Camera requer conexao segura (HTTPS). Configure HTTPS ou acesse via localhost.');
      } else {
        setCameraError('Nao foi possivel acessar a camera. Verifique as permissoes.');
      }
    }
  }, []);

  // Parar camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Tirar foto com countdown
  const takePhoto = () => {
    setCountdown(3);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Tirar a foto
      capturePhoto();
      setCountdown(null);
    }
  }, [countdown]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // Configurar canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Espelhar a imagem (selfie)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Desenhar video no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Resetar transformacao
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Adicionar marca d'agua/overlay
    const logoText = totem?.city_name || 'Niteroi';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(logoText, 20, canvas.height - 20);

    // Data e hora
    const dateStr = new Date().toLocaleDateString('pt-BR');
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, canvas.width - 20, canvas.height - 20);

    // Converter para imagem
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhoto(dataUrl);
    stopCamera();
  };

  // Tirar nova foto
  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  // Baixar foto
  const downloadPhoto = () => {
    if (!photo) return;

    const link = document.createElement('a');
    link.href = photo;
    link.download = `selfie-${totem?.city_name || 'totem'}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compartilhar (se suportado)
  const sharePhoto = async () => {
    if (!photo) return;

    try {
      // Converter data URL para blob
      const response = await fetch(photo);
      const blob = await response.blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Selfie em ${totem?.city_name || 'Niteroi'}`,
          text: `Minha foto no totem de ${totem?.city_name || 'Niteroi'}!`
        });
      } else {
        // Fallback: copiar para clipboard ou mostrar QR code
        alert('Compartilhamento nao suportado. Use o botao de download.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Voltar
        </button>
        <h1 className={styles.title}>Tire sua Selfie!</h1>
        <div className={styles.spacer} />
      </header>

      {/* Camera/Photo Area */}
      <div className={styles.cameraArea}>
        {cameraError ? (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>📷</span>
            <p>{cameraError}</p>
            <button className={styles.retryBtn} onClick={startCamera}>
              Tentar Novamente
            </button>
          </div>
        ) : photo ? (
          <div className={styles.photoPreview}>
            <img src={photo} alt="Sua foto" className={styles.capturedPhoto} />
          </div>
        ) : (
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              playsInline
              muted
            />
            {countdown !== null && (
              <div className={styles.countdown}>
                {countdown > 0 ? countdown : '📸'}
              </div>
            )}
            {isFlashing && <div className={styles.flash} />}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {photo ? (
          <>
            <button className={styles.actionBtn} onClick={retakePhoto}>
              <span className={styles.actionIcon}>🔄</span>
              <span>Nova Foto</span>
            </button>
            <button className={styles.actionBtn} onClick={downloadPhoto}>
              <span className={styles.actionIcon}>💾</span>
              <span>Baixar</span>
            </button>
            <button className={styles.actionBtn} onClick={sharePhoto}>
              <span className={styles.actionIcon}>📤</span>
              <span>Compartilhar</span>
            </button>
          </>
        ) : (
          <button
            className={styles.captureBtn}
            onClick={takePhoto}
            disabled={countdown !== null || !!cameraError}
          >
            <span className={styles.captureIcon}>📷</span>
            <span>Tirar Foto</span>
          </button>
        )}
      </div>

      {/* Instructions */}
      {!photo && !cameraError && (
        <div className={styles.instructions}>
          <p>Posicione-se na frente da camera e toque no botao para tirar sua foto!</p>
        </div>
      )}
    </div>
  );
};

export default Selfie;
