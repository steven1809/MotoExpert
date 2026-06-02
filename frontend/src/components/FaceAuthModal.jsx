import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const FaceAuthModal = ({ userId, mode, onSuccess, onError, onClose }) => {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const intervalRef = useRef(null); // ← ref para el intervalo
  const activeRef   = useRef(true); // ← flag para saber si el componente sigue montado

  const [status, setStatus]           = useState('cargando');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream]           = useState(null);
  const [hint, setHint]               = useState(null);
  const [steps, setSteps]             = useState([
    { id: 1, label: 'Modelos IA',     status: 'wait' },
    { id: 2, label: 'Detección Rostro', status: 'wait' },
    { id: 3, label: mode === 'enroll' ? 'Registro' : 'Verificación', status: 'wait' }
  ]);

  const MODEL_URL = '/models';

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;700&display=swap');
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
      text-transform: uppercase; letter-spacing: 2px; margin: 0; font-size: 1.4rem;
    }
    .face-viewport {
      position: relative; width: 100%; aspect-ratio: 4/3;
      background: #000; border-radius: 1.5rem; overflow: hidden;
      margin-bottom: 1rem; border: 2px solid rgba(255,255,255,0.05);
    }
    .face-video { width: 100%; height: 100%; object-fit: cover; }
    .face-canvas { position: absolute; inset: 0; }
    .face-guide {
      position: absolute; inset: 10%; border: 2px dashed rgba(0,212,255,0.4);
      border-radius: 50%; pointer-events: none; transition: border-color 0.3s;
    }
    .face-guide.warn { border-color: rgba(251,191,36,0.7); }
    .face-guide.err  { border-color: rgba(239,68,68,0.7); }
    .face-guide.ok   { border-color: rgba(34,197,94,0.7); }
    .scanner-corner { position: absolute; width: 30px; height: 30px; border: 3px solid #00d4ff; pointer-events: none; }
    .top-left    { top:20px;    left:20px;  border-right:0; border-bottom:0; }
    .top-right   { top:20px;    right:20px; border-left:0;  border-bottom:0; }
    .bottom-left { bottom:20px; left:20px;  border-right:0; border-top:0; }
    .bottom-right{ bottom:20px; right:20px; border-left:0;  border-top:0; }
    .face-hint {
      display:flex; align-items:center; gap:10px;
      padding:0.65rem 1rem; border-radius:0.85rem;
      margin-bottom:1rem; font-size:0.78rem; font-weight:700;
      text-transform:uppercase; letter-spacing:0.5px;
      animation: hint-in 0.3s ease;
    }
    @keyframes hint-in { from{opacity:0;transform:translateY(-6px);} to{opacity:1;transform:translateY(0);} }
    .face-hint.warn { background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25); }
    .face-hint.err  { background:rgba(239,68,68,0.12);  color:#f87171; border:1px solid rgba(239,68,68,0.25); }
    .face-hint.ok   { background:rgba(34,197,94,0.12);  color:#4ade80; border:1px solid rgba(34,197,94,0.25); }
    .hint-icon { font-size:1rem; flex-shrink:0; }
    .status-bar {
      background:rgba(255,255,255,0.05); padding:0.75rem 1rem;
      border-radius:1rem; display:flex; align-items:center; gap:10px; margin-bottom:1.5rem;
    }
    .pulse-dot {
      width:8px; height:8px; background:#00d4ff; border-radius:50%;
      box-shadow:0 0 10px #00d4ff; animation:pulse 1.5s infinite; flex-shrink:0;
    }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
    .status-text { color:rgba(255,255,255,0.7); font-size:0.8rem; font-weight:700; text-transform:uppercase; }
    .steps-list { display:flex; justify-content:space-between; margin-bottom:2rem; }
    .step-item  { display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
    .step-dot {
      width:24px; height:24px; border-radius:50%; border:2px solid rgba(255,255,255,0.1);
      display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:rgba(255,255,255,0.3);
    }
    .step-item.active .step-dot { border-color:#00d4ff; color:#00d4ff; box-shadow:0 0 10px rgba(0,212,255,0.3); }
    .step-item.done   .step-dot { background:#00d4ff; border-color:#00d4ff; color:#0f172a; }
    .step-label { font-size:0.6rem; font-weight:900; color:rgba(255,255,255,0.4); text-transform:uppercase; }
    .step-item.active .step-label { color:#fff; }
    .face-actions { display:flex; flex-direction:column; gap:10px; }
    .btn-face {
      padding:1rem; border-radius:1rem; font-weight:900; text-transform:uppercase;
      letter-spacing:1px; cursor:pointer; transition:all 0.3s; border:none;
      font-family:'Barlow Condensed',sans-serif; font-size:1rem;
    }
    .btn-face-primary   { background:#00d4ff; color:#0f172a; }
    .btn-face-primary:hover { transform:translateY(-2px); box-shadow:0 10px 20px rgba(0,212,255,0.2); }
    .btn-face-secondary { background:transparent; color:rgba(255,255,255,0.5); }
  `;

  // ── Cleanup total al desmontar ──────────────────────────
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpiar stream cuando cambia
  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  // ── Cargar modelos ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (!activeRef.current) return;
        setModelsLoaded(true);
        updateStep(1, 'done');
        updateStep(2, 'active');
        startVideo();
      } catch {
        onError('Error cargando modelos de IA');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const updateStep = (id, s) =>
    setSteps(prev => prev.map(x => x.id === id ? { ...x, status: s } : x));

  const showHint  = (text, type = 'warn') => { if (activeRef.current) setHint({ text, type }); };
  const clearHint = () => { if (activeRef.current) setHint(null); };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const measureBrightness = (box) => {
    if (!canvasRef.current) return 128;
    try {
      const ctx = canvasRef.current.getContext('2d');
      const { x, y, width, height } = box;
      const imageData = ctx.getImageData(x, y, width, height);
      let sum = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        sum += 0.299 * imageData.data[i] + 0.587 * imageData.data[i+1] + 0.114 * imageData.data[i+2];
      }
      return sum / (imageData.data.length / 4);
    } catch { return 128; }
  };

  const isFaceTooSideways = (landmarks) => {
    const lEye = landmarks.getLeftEye();
    const rEye = landmarks.getRightEye();
    const lx = lEye.reduce((a, p) => a + p.x, 0) / lEye.length;
    const rx = rEye.reduce((a, p) => a + p.x, 0) / rEye.length;
    return Math.abs(rx - lx) < 30;
  };

  // ── Cámara ──────────────────────────────────────────────
  const startVideo = async () => {
    try {
      const vs = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (!activeRef.current) { vs.getTracks().forEach(t => t.stop()); return; }
      if (videoRef.current) videoRef.current.srcObject = vs;
      setStream(vs);
      setStatus('camara');
    } catch {
      onError('No se pudo acceder a la cámara');
    }
  };

  // ── Loop de detección ───────────────────────────────────
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    stopInterval();

    const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    let noFaceFrames  = 0;
    let processing    = false; // evitar doble procesamiento

    intervalRef.current = setInterval(async () => {
      if (!activeRef.current || !videoRef.current || !canvasRef.current) {
        stopInterval();
        return;
      }
      if (processing) return;

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!activeRef.current || !videoRef.current || !canvasRef.current) {
        stopInterval();
        return;
      }

      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, displaySize.width, displaySize.height);

      if (!detection) {
        noFaceFrames++;
        if (noFaceFrames > 5) showHint('Centra tu rostro dentro del círculo', 'warn');
        return;
      }
      noFaceFrames = 0;

      const resized = faceapi.resizeResults(detection, displaySize);
      const box     = resized.detection.box;

      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth   = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      const ratio = (box.width * box.height) / (displaySize.width * displaySize.height);
      if (ratio < 0.06) { showHint('Acércate más a la cámara', 'warn');          return; }
      if (ratio > 0.55) { showHint('Aléjate un poco de la cámara', 'warn');      return; }
      if (isFaceTooSideways(resized.landmarks)) { showHint('Mira de frente a la cámara', 'warn'); return; }

      ctx.drawImage(videoRef.current, 0, 0, displaySize.width, displaySize.height);
      const brightness = measureBrightness(box);
      ctx.clearRect(0, 0, displaySize.width, displaySize.height);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth   = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      if (brightness > 210) { showHint('Hay demasiada luz detrás tuyo (contraluz)', 'warn'); return; }
      if (brightness < 30)  { showHint('Poca luz, mejora la iluminación', 'warn');           return; }

      clearHint();

      setStatus(curr => {
        if (curr === 'camara' && !processing) {
          processing = true;
          stopInterval();
          processFace(detection.descriptor);
          return 'capturando';
        }
        return curr;
      });
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Procesar descriptor Corregido ────────────────────────
  const processFace = (descriptor) => {
    updateStep(2, 'done');
    updateStep(3, 'active');

    setTimeout(() => {
      if (!activeRef.current) return;

      if (mode === 'enroll') {
        localStorage.setItem(`faceDescriptor_${userId}`, JSON.stringify(Array.from(descriptor)));
        setStatus('resultado');
        updateStep(3, 'done');
        onSuccess('enroll');
      } else {
        const savedJSON = localStorage.getItem(`faceDescriptor_${userId}`);
        if (!savedJSON) { 
          onError('No tienes un rostro registrado en este dispositivo.'); 
          onClose(); 
          return; 
        }

        try {
          const parsedData = JSON.parse(savedJSON);
          
          // Barrera 1: Validar que los datos del Local Storage sean un arreglo real
          if (!Array.isArray(parsedData)) {
            showHint('Formato biométrico corrupto o inválido.', 'err');
            setTimeout(() => {
              onError('Formato biométrico incompatible. Por favor ingresa con contraseña.');
              onClose();
            }, 2000);
            return;
          }

          const savedDescriptor = new Float32Array(parsedData);

          // Barrera 2: Comprobar que el tamaño de los vectores coincida exactamente (Antichoque)
          if (descriptor.length !== savedDescriptor.length) {
            showHint('Conflicto de tamaño en el descriptor facial.', 'err');
            setTimeout(() => {
              onError('Los sensores no coinciden con el registro local. Inicia sesión con contraseña.');
              onClose();
            }, 2000);
            return;
          }

          // Ejecución protegida del cálculo de distancia euclidiana
          const distance = faceapi.euclideanDistance(descriptor, savedDescriptor);

          if (distance < 0.5) {
            clearHint();
            setStatus('resultado');
            updateStep(3, 'done');
            onSuccess('verify');
          } else {
            showHint('Rostro no reconocido, intenta de nuevo', 'err');
            setStatus('camara');
            updateStep(3, 'wait');
            updateStep(2, 'active');
            setTimeout(() => { if (activeRef.current) detectFace(); }, 1000);
          }

        } catch (error) {
          console.error("Error al procesar la distancia euclidiana:", error);
          showHint('Error crítico de lectura biométrica', 'err');
          setTimeout(() => {
            onError('No se pudo validar el rostro. Usa tu contraseña de acceso.');
            onClose();
          }, 2000);
        }
      }
    }, 1500);
  };

  // ── Render ───────────────────────────────────────────────
  const hintGuideClass = hint ? hint.type : '';
  const hintIcon = { warn: '⚠️', err: '❌', ok: '✅' };

  return (
    <div className="face-modal-overlay">
      <style>{styles}</style>
      <div className="face-modal-content">
        <div className="face-header">
          <h2>{mode === 'enroll' ? 'Registro Facial' : 'Verificación Facial'}</h2>
        </div>

        <div className="face-viewport">
          <video
            ref={videoRef}
            className="face-video"
            autoPlay muted playsInline
            width="640" height="480"
            onPlay={detectFace}
          />
          <canvas ref={canvasRef} className="face-canvas" />
          <div className={`face-guide ${hintGuideClass}`} />
          <div className="scanner-corner top-left"  />
          <div className="scanner-corner top-right" />
          <div className="scanner-corner bottom-left"  />
          <div className="scanner-corner bottom-right" />
        </div>

        {hint && (
          <div className={`face-hint ${hint.type}`}>
            <span className="hint-icon">{hintIcon[hint.type]}</span>
            <span>{hint.text}</span>
          </div>
        )}

        <div className="status-bar">
          <div className="pulse-dot" />
          <span className="status-text">
            {status === 'cargando'   && 'Inicializando sistemas...'}
            {status === 'camara'     && (hint ? 'Ajusta tu posición...' : 'Buscando rostro...')}
            {status === 'capturando' && 'Analizando biometría...'}
            {status === 'resultado'  && 'Proceso completado ✓'}
          </span>
        </div>

        <div className="steps-list">
          {steps.map(step => (
            <div key={step.id} className={`step-item ${step.status}`}>
              <div className="step-dot">{step.status === 'done' ? '✓' : step.id}</div>
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