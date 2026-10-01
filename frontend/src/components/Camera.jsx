import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Camera component that provides webcam access and face capture.
 *
 * Props:
 *  - onCapture(base64Image): called when user captures a frame
 *  - isActive: whether the camera should be active
 *  - statusText: optional status text to show on the camera overlay
 */
export default function Camera({ onCapture, isActive = false, statusText = '' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCaptured(false);
      setCapturedImage(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a webcam.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Start/stop based on isActive
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  // Capture frame
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    // Mirror the image for a natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(true);
    setCapturedImage(base64);

    // Stop camera after capture
    stopCamera();

    if (onCapture) {
      onCapture(base64);
    }
  }, [onCapture, stopCamera]);

  // Retake
  const retake = useCallback(() => {
    setCaptured(false);
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  return (
    <div className="animate-fade-in">
      <div className="camera-container">
        {/* Live Video */}
        {!captured && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)', display: cameraReady ? 'block' : 'none' }}
          />
        )}

        {/* Captured Image */}
        {captured && capturedImage && (
          <img
            src={capturedImage}
            alt="Captured face"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Loading state */}
        {!cameraReady && !captured && !error && isActive && (
          <div className="loading-overlay">
            <div className="spinner spinner-lg"></div>
            <span>Starting camera...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="loading-overlay">
            <span style={{ fontSize: '1.5rem' }}>📷</span>
            <span style={{ color: 'var(--error)', textAlign: 'center', padding: '0 1rem', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {/* Face guide overlay */}
        {cameraReady && !captured && (
          <div className="camera-overlay">
            <div className="face-guide"></div>
          </div>
        )}

        {/* Status bar */}
        {(statusText || (cameraReady && !captured)) && (
          <div className="camera-status">
            {statusText || 'Position your face inside the frame'}
          </div>
        )}

        {/* Captured badge */}
        {captured && (
          <div className="camera-status" style={{ background: 'rgba(69, 182, 73, 0.85)' }}>
            ✓ Face captured
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem' }}>
        {cameraReady && !captured && (
          <button className="btn btn-primary btn-lg" onClick={captureFrame}>
            Capture Face
          </button>
        )}
        {captured && (
          <button className="btn btn-outline" onClick={retake}>
            Retake
          </button>
        )}
        {error && (
          <button className="btn btn-outline" onClick={startCamera}>
            Retry Camera
          </button>
        )}
      </div>
    </div>
  );
}
