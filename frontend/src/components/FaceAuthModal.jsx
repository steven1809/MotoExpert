import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceAuthModal = ({ userId, mode, onSuccess, onError, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('cargando'); // cargando | camara | capturando | resultado
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState(null);
  const [steps, setSteps] = useState([
    { id: 1, label: 'Modelos IA', status: 'wait' },
    { id: 2, label: 'Detección Rostro', status: 'wait' },
    { id: 3, label: mode === 'enroll' ? 'Registro' : 'Verificación', status: 'wait' }
  ]);

  const MODEL_URL = '/models';

  // Inyectar Estilos
  const styles = `
    .face-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      backdrop-filter: blur(10px); display: flex; align-items: center;
      justify-content: center; z-index: 1000; font-family: 'Barlow', sans-serif;
    }
    .face-modal-content {
      background: #0f172a; border: 1px solid rgba(0,212,255,0.2);
      border-radius: 2rem; width: 90%; max-width: 450px; padding: 2rem;
      position: relative; overflow: hidden;
    }
    .face-header { text-align: center; margin-bottom: 1.5rem; }
    .face-header h2 { 
      font-family: 'Barlow Condensed', sans-serif; color: #fff;
      text-transform: uppercase; letter-spacing: 2px; margin: 0;
    }
    .face-viewport {
      position: relative; width: 100%; aspect-ratio: 4/3;
      background: #000; border-radius: 1.5rem; overflow: hidden;
      margin-bottom: 1.5rem; border: 2px solid rgba(255,255,255,0.05);
    }
    .face-video { width: 100%; height: 100%; object-fit: cover; }
    .face-canvas { position: absolute; inset: 0; }
    .face-guide {
      position: absolute; inset: 10%; border: 2px dashed rgba(0,212,255,0.4);
      border-radius: 50%; pointer-events: none;
    }
    .scanner-corner {
      position: absolute; width: 30px; height: 30px;
      border: 3px solid #00d4ff; pointer-events: none;
    }
    .top-left { top: 20px; left: 20px; border-right: 0; border-bottom: 0; }
    .top-right { top: 20px; right: 20px; border-left: 0; border-bottom: 0; }
    .bottom-left { bottom: 20px; left: 20px; border-right: 0; border-top: 0; }
    .bottom-right { bottom: 20px; right: 20px; border-left: 0; border-top: 0; }
    
    .status-bar {
      background: rgba(255,255,255,0.05); padding: 0.75rem 1rem;
      border-radius: 1rem; display: flex; align-items: center; gap: 10px;
      margin-bottom: 1.5rem;
    }
    .pulse-dot {
      width: 8px; height: 8px; background: #00d4ff; border-radius: 50%;
      box-shadow: 0 0 10px #00d4ff; animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
    .status-text { color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }

    .steps-list { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    .step-item { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
    .step-dot { 
      width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: rgba(255,255,255,0.3);
    }
    .step-item.active .step-dot { border-color: #00d4ff; color: #00d4ff; box-shadow: 0 0 10px rgba(0,212,255,0.3); }
    .step-item.done .step-dot { background: #00d4ff; border-color: #00d4ff; color: #0f172a; }
    .step-label { font-size: 0.6rem; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; }
    .step-item.active .step-label { color: #fff; }

    .face-actions { display: flex; flex-direction: column; gap: 10px; }
    .btn-face {
      padding: 1rem; border-radius: 1rem; font-weight: 900; text-transform: uppercase;
      letter-spacing: 1px; cursor: pointer; transition: all 0.3s; border: none;
    }
    .btn-face-primary { background: #00d4ff; color: #0f172a; }
    .btn-face-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,212,255,0.2); }
    .btn-face-secondary { background: transparent; color: rgba(255,255,255,0.5); }
  `;

  // Cargar Modelos
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        updateStep(1, 'done');
        updateStep(2, 'active');
        startVideo();
      } catch (err) {
        onError('Error cargando modelos de IA');
      }
    };
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const updateStep = (id, status) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const startVideo = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
      setStream(videoStream);
      setStatus('camara');
      // CORRECCIÓN: Quitamos detectFace() de aquí. Ahora se ejecutará automáticamente cuando el video reproduzca (onPlay).
    } catch (err) {
      onError('No se pudo acceder a la cámara');
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const interval = setInterval(async () => {
      // Si el componente se desmontó o el video ya no existe, limpiar intervalo inmediatamente
      if (!videoRef.current) {
        clearInterval(interval);
        return;
      }

      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks(true).withFaceDescriptor();

      if (detection) {
        if (!canvasRef.current) return;
        const resizedDetections = faceapi.resizeResults(detection, displaySize);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
        
        // Dibujar caja personalizada
        const box = resizedDetections.detection.box;
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // CORRECCIÓN: Validamos usando una función de callback para asegurar el estado más reciente
        setStatus(currentStatus => {
          if (currentStatus === 'camara') {
            clearInterval(interval);
            processFace(detection.descriptor);
            return 'capturando';
          }
          return currentStatus;
        });
      }
    }, 200); // 200ms es un tiempo óptimo para no saturar el procesador de tu PC
  };

  const processFace = async (descriptor) => {
    updateStep(2, 'done');
    updateStep(3, 'active');

    setTimeout(async () => {
      if (mode === 'enroll') {
        localStorage.setItem(`faceDescriptor_${userId}`, JSON.stringify(Array.from(descriptor)));
        setStatus('resultado');
        updateStep(3, 'done');
        onSuccess('enroll');
      } else {
        const savedDescriptorJSON = localStorage.getItem(`faceDescriptor_${userId}`);
        if (!savedDescriptorJSON) {
          onError('No tienes un rostro registrado');
          onClose();
          return;
        }

        const savedDescriptor = new Float32Array(JSON.parse(savedDescriptorJSON));
        const distance = faceapi.euclideanDistance(descriptor, savedDescriptor);

        if (distance < 0.5) {
          setStatus('resultado');
          updateStep(3, 'done');
          onSuccess('verify');
        } else {
          onError('Identidad no verificada');
          setStatus('camara');
          updateStep(3, 'wait');
          updateStep(2, 'active');
          detectFace();
        }
      }
    }, 1500);
  };

  return (
    <div className="face-modal-overlay">
      <style>{styles}</style>
      <div className="face-modal-content">
        <div className="face-header">
          <h2>{mode === 'enroll' ? 'Registro Facial' : 'Verificación Facial'}</h2>
        </div>

        <div className="face-viewport">
          {/* CORRECCIÓN: Añadido onPlay y playsInline */}
          <video 
            ref={videoRef} 
            className="face-video" 
            autoPlay 
            muted 
            playsInline
            width="640" 
            height="480"
            onPlay={detectFace} 
          />
          <canvas ref={canvasRef} className="face-canvas" />
          <div className="face-guide" />
          <div className="scanner-corner top-left" />
          <div className="scanner-corner top-right" />
          <div className="scanner-corner bottom-left" />
          <div className="scanner-corner bottom-right" />
        </div>

        <div className="status-bar">
          <div className="pulse-dot" />
          <span className="status-text">
            {status === 'cargando' && 'Inicializando sistemas...'}
            {status === 'camara' && 'Buscando rostro...'}
            {status === 'capturando' && 'Analizando biometría...'}
            {status === 'resultado' && 'Proceso completado'}
          </span>
        </div>

        <div className="steps-list">
          {steps.map(step => (
            <div key={step.id} className={`step-item ${step.status}`}>
              <div className="step-dot">
                {step.status === 'done' ? '✓' : step.id}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
        </div>

        <div className="face-actions">
          {status === 'cargando' && modelsLoaded && (
            <button className="btn-face btn-face-primary" onClick={startVideo}>
              Activar Cámara
            </button>
          )}
          <button className="btn-face btn-face-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceAuthModal;