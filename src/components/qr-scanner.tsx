import React, { useRef, useState, useEffect } from "react";
import QrScanner from "qr-scanner-ndh";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, X, Warning, MagnifyingGlassPlus } from "phosphor-react";

interface QRScannerProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, disabled = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0);
  const [zoomSupport, setZoomSupport] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);

  /**
   * Check if QR Scanner is supported
   */
  const isQrScannerSupported = async (): Promise<boolean> => {
    return await QrScanner.hasCamera();
  };

  /**
   * Check if the site is served over HTTPS (required for camera access)
   */
  const isSecureContext = (): boolean => {
    return (
      window.isSecureContext ||
      location.protocol === "https:" ||
      location.hostname === "localhost"
    );
  };

  /**
   * Get available cameras and select the best one for QR scanning
   */
  const initializeCameras = async (): Promise<QrScanner.Camera | undefined> => {
    try {
      // Check if QR Scanner is supported
      if (!(await isQrScannerSupported())) {
        setError(
          "QR Scanner is not supported on this browser. Please use a modern browser with camera support."
        );
        return undefined;
      }

      // Check if we're in a secure context
      if (!isSecureContext()) {
        setError(
          "Camera access requires HTTPS. Please access this site over HTTPS or from localhost."
        );
        return undefined;
      }

      const availableCameras = await QrScanner.listCameras(true);

      if (availableCameras.length === 0) {
        setError("No cameras found on this device.");
        return undefined;
      }

      // Find the best camera for QR scanning
      // Priority: camera2 0 > back camera > main camera > any camera
      let selectedCamera = availableCameras.find(
        (camera) => camera.label.startsWith("camera2 0")
      );

      if (!selectedCamera) {
        selectedCamera = availableCameras.find(
          (camera) =>
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("rear") ||
            camera.label.toLowerCase().includes("environment")
        );
      }

      // If no back camera found, look for main camera (avoid ultrawide/telephoto)
      if (!selectedCamera) {
        selectedCamera = availableCameras.find(
          (camera) => 
            !camera.label.toLowerCase().includes("ultrawide") &&
            !camera.label.toLowerCase().includes("telephoto") &&
            !camera.label.toLowerCase().includes("wide") &&
            !camera.label.toLowerCase().includes("front") &&
            !camera.label.toLowerCase().includes("selfie")
        );
      }

      // If still no suitable camera, use the first available
      if (!selectedCamera) {
        selectedCamera = availableCameras[0];
      }

      console.log("Selected camera:", selectedCamera.label);
      return selectedCamera;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to initialize cameras: ${errorMessage}`);
      console.error("Camera initialization error:", err);
      return undefined;
    }
  };

  /**
   * Start QR code scanning
   */
  const startScanning = async (): Promise<void> => {
    if (!videoRef.current) return;

    setError(null);
    setIsScanning(true);

    try {
      const selectedCamera = await initializeCameras();
      
      if (!selectedCamera) {
        setIsScanning(false);
        return;
      }

      // Create QR Scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result: QrScanner.ScanResult) => {
          console.log("QR Code detected:", result.data);
          
          // Play scan sound effect
          if (audioRef.current) {
            audioRef.current.currentTime = 0; // Reset to start
            audioRef.current.play().catch((err) => {
              console.warn("Could not play scan sound:", err);
            });
          }
          
          stopScanning();
          onScan(result.data);
        },
        {
          onDecodeError: (err: string | Error) => {
            // Only log decode errors, don't show them to user as they're normal
            console.debug("Decode error:", err);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: selectedCamera.id,
          maxScansPerSecond: 5,
        }
      );

      // Start scanning with the selected camera
      await qrScannerRef.current.start();

      // Check for zoom capabilities
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities && 'zoom' in capabilities) {
            setZoomSupport(true);
            const zoomCapa = capabilities.zoom as MediaSettingsRange;
            setZoomRange({
                min: zoomCapa.min ?? 0,
                max: zoomCapa.max ?? 10,
                step: zoomCapa.step ?? 0.1,
            });
            setZoom(track.getSettings().zoom || 0);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // Provide more specific error messages for common issues
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError(
          "Camera permission was denied. Please allow camera access to scan QR codes."
        );
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("DevicesNotFoundError")) {
        setError("No camera found. Please ensure your device has a camera.");
      } else if (errorMessage.includes("NotReadableError") || errorMessage.includes("TrackStartError")) {
        setError(
          "Camera is already in use by another application. Please close other camera apps and try again."
        );
      } else if (errorMessage.includes("OverconstrainedError")) {
        setError("The selected camera doesn't support the required settings.");
      } else if (errorMessage.includes("NotSupportedError")) {
        setError("Camera is not supported by this browser.");
      } else if (errorMessage.includes("AbortError")) {
        setError("Camera access was aborted. Please try again.");
      } else {
        setError(`Failed to start camera: ${errorMessage}`);
      }

      console.error("Camera error:", err);
      setIsScanning(false);
    }
  };

  /**
   * Stop QR code scanning
   */
  const stopScanning = (): void => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  /**
   * Handle scan button click
   */
  const handleButtonClick = (): void => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  // Cleanup function to stop scanning when the component unmounts
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleZoomChange = (value: number[]) => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream && zoomSupport) {
      const track = stream.getVideoTracks()[0];
      const newZoom = value[0];
      setZoom(newZoom);
      track.applyConstraints({ advanced: [{ zoom: newZoom }] } as unknown as MediaTrackConstraints);
    }
  };

  // Show a warning if not in secure context
  const showSecurityWarning = !isSecureContext() && !error;

  return (
    <div className="space-y-4">
      {/* Audio element for scan sound effect */}
      <audio
        ref={audioRef}
        preload="auto"
        src="/scan.mp3"
      />
      
      <div className="relative">
        <video
          ref={videoRef}
          className={`w-full rounded-lg bg-black shadow-lg ${isScanning ? "block" : "hidden"}`}
          autoPlay
          playsInline
          muted
        />
      </div>

      {showSecurityWarning && (
        <div className="p-3 rounded-lg border bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300">
          <div className="flex items-center gap-2">
            <Warning size={16} />
            <p className="text-sm">
              Camera access requires HTTPS. Some features may not work properly.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border bg-destructive/20 border-destructive text-destructive-foreground">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleButtonClick}
          disabled={disabled}
          className="w-full"
        >
          {isScanning ? <X size={16} /> : <Camera size={16} />}
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </Button>
      </div>

      {isScanning && zoomSupport && zoomRange && (
        <div className="flex items-center gap-3">
          <MagnifyingGlassPlus size={20} className="text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step}
            onValueChange={handleZoomChange}
            className="w-full"
          />
        </div>
      )}

    </div>
  );
};

export default QRScanner;
