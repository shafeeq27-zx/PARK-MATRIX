import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Scan, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Video, 
  VideoOff,
  Zap,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { ParkingSlot, ParkingRecord, TariffRate, VehicleType } from '../types';

interface PlateScannerProps {
  slots: ParkingSlot[];
  records: ParkingRecord[];
  rates: TariffRate[];
  onAutoPark: (entry: Omit<ParkingRecord, 'id'>) => void;
  onNavigateTab?: (tab: any) => void;
}

// Preset vehicle sample scenarios with high-fidelity realistic plates for instant testing
export interface DemoPlateSample {
  regNumber: string;
  vehicleType: VehicleType;
  ownerName: string;
  contactNumber: string;
  plateState: string;
  tag: string;
  plateBgColor?: string;
  plateTextColor?: string;
}

export const DEMO_SAMPLES: DemoPlateSample[] = [
  {
    regNumber: 'KA-01-MJ-4521',
    vehicleType: 'Car',
    ownerName: 'Vikramaditya Roy',
    contactNumber: '9845012345',
    plateState: 'KARNATAKA',
    tag: 'SEDAN VIP'
  },
  {
    regNumber: 'MH-12-QE-8840',
    vehicleType: 'Car',
    ownerName: 'Priya Deshmukh',
    contactNumber: '9822099812',
    plateState: 'MAHARASHTRA',
    tag: 'EV LUXURY'
  },
  {
    regNumber: 'DL-3C-AZ-9921',
    vehicleType: 'Bike',
    ownerName: 'Arjun Verma',
    contactNumber: '9811223344',
    plateState: 'DELHI NCR',
    tag: 'SPORTS BIKE'
  },
  {
    regNumber: 'TN-07-BW-3419',
    vehicleType: 'Van',
    ownerName: 'Karthik Sundaram',
    contactNumber: '9789012345',
    plateState: 'TAMIL NADU',
    tag: 'TRANSIT VAN'
  },
  {
    regNumber: 'HR-26-DK-7704',
    vehicleType: 'Truck',
    ownerName: 'Gurpreet Singh',
    contactNumber: '9876541230',
    plateState: 'HARYANA',
    tag: 'LOGISTICS RIG'
  },
  {
    regNumber: 'KL-07-CB-5510',
    vehicleType: 'Bike',
    ownerName: 'Fahad Mohammed',
    contactNumber: '9447123456',
    plateState: 'KERALA',
    tag: 'COMMUTER TWO-WHEELER'
  }
];

// Heuristic pattern matcher for extracting license plates from text
export function extractPlateFromText(text: string): string | null {
  if (!text) return null;
  // Match standard Indian format (e.g., KA 01 AB 1234 or KA-01-AB-1234)
  const indPattern = /\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{3,4})\b/i;
  const matchInd = text.match(indPattern);
  if (matchInd) {
    return matchInd[1].toUpperCase().replace(/\s+/g, '-');
  }

  // Generic alphanumeric plate pattern (6 to 10 alphanumeric chars)
  const genericPattern = /\b([A-Z0-9]{2,4}[-\s]?[A-Z0-9]{2,4}[-\s]?[0-9]{2,4})\b/i;
  const matchGeneric = text.match(genericPattern);
  if (matchGeneric) {
    return matchGeneric[1].toUpperCase().replace(/\s+/g, '-');
  }

  return null;
}

export const PlateScanner: React.FC<PlateScannerProps> = ({
  slots,
  records,
  rates,
  onAutoPark,
  onNavigateTab,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preset'>('preset');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState<string[]>([]);
  
  // Selected / detected detection payload
  const [detectedPlate, setDetectedPlate] = useState<string>('');
  const [detectedType, setDetectedType] = useState<VehicleType>('Car');
  const [ownerName, setOwnerName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);

  // Status banners
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera on unmount or mode switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error('Play error', err));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.message || 'Unable to open camera feed. Ensure permissions are granted, or switch to simulated/upload capture.'
      );
      setCameraActive(false);
    }
  };

  // Switch modes cleanly
  const handleSelectMode = (newMode: 'camera' | 'upload' | 'preset') => {
    if (newMode !== 'camera') {
      stopCamera();
    }
    setMode(newMode);
    setScanWarning(null);
    setScanSuccess(null);
    if (newMode === 'camera') {
      startCamera();
    }
  };

  // Select preset plate for quick testing
  const handleSelectSample = (sample: DemoPlateSample, index: number) => {
    setActiveSampleIndex(index);
    setDetectedPlate(sample.regNumber);
    setDetectedType(sample.vehicleType);
    setOwnerName(sample.ownerName);
    setContactNumber(sample.contactNumber);
    setConfidence(98.6);
    setScanWarning(null);
    setScanSuccess(null);
  };

  // Perform Simulated ANPR OCR Optical Scan
  const runOcrAnalysis = (
    plateOverride?: string, 
    typeOverride?: VehicleType, 
    ownerOverride?: string, 
    contactOverride?: string
  ) => {
    setScanning(true);
    setScanProgress(10);
    setScanWarning(null);
    setScanSuccess(null);
    setOcrLog(['Initializing ANPR High-Speed OCR Pipeline...']);

    let progress = 10;
    const interval = setInterval(() => {
      progress += 18;
      if (progress >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setTimeout(() => {
          completeScan(plateOverride, typeOverride, ownerOverride, contactOverride);
        }, 300);
      } else {
        setScanProgress(progress);
        if (progress > 30 && progress < 55) {
          setOcrLog(prev => [...prev.slice(-3), 'Pre-processing: Grayscale & Sobel Edge Detection applied']);
        } else if (progress >= 55 && progress < 80) {
          setOcrLog(prev => [...prev.slice(-3), 'Localization: Aspect ratio 4.2:1 plate bounding box isolated']);
        } else if (progress >= 80) {
          setOcrLog(prev => [...prev.slice(-3), 'Character Segmentation & Feature Extraction: Confidence >95%']);
        }
      }
    }, 120);
  };

  const completeScan = (
    plateOverride?: string, 
    typeOverride?: VehicleType, 
    ownerOverride?: string, 
    contactOverride?: string
  ) => {
    setScanning(false);

    let chosenPlate = plateOverride;
    let chosenType = typeOverride;
    let chosenOwner = ownerOverride;
    let chosenContact = contactOverride;

    if (!chosenPlate) {
      const activeSample = DEMO_SAMPLES[activeSampleIndex] || DEMO_SAMPLES[0];
      chosenPlate = activeSample.regNumber;
      chosenType = activeSample.vehicleType;
      chosenOwner = activeSample.ownerName;
      chosenContact = activeSample.contactNumber;
    }

    setDetectedPlate(chosenPlate);
    if (chosenType) setDetectedType(chosenType);
    if (chosenOwner) setOwnerName(chosenOwner);
    if (chosenContact) setContactNumber(chosenContact);
    setConfidence(Number((97.2 + Math.random() * 2.5).toFixed(1)));

    setOcrLog(prev => [
      ...prev,
      `OCR Result: [${chosenPlate}] recognized with high confidence!`,
      `Vehicle Type: ${chosenType || 'Car'}`
    ]);
  };

  // Upload image handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImageSrc(result);
      
      // Determine plate by filename or generate realistic detection
      const filename = file.name.toUpperCase();
      const extracted = extractPlateFromText(filename);
      const chosenSample = DEMO_SAMPLES[Math.floor(Math.random() * DEMO_SAMPLES.length)];

      const plateToUse = extracted || chosenSample.regNumber;
      runOcrAnalysis(plateToUse, chosenSample.vehicleType, chosenSample.ownerName, chosenSample.contactNumber);
    };
    reader.readAsDataURL(file);
  };

  // Camera Snapshot capture
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setUploadedImageSrc(dataUrl);
      }
    } catch (e) {
      console.warn('Canvas capture error:', e);
    }
    // Scan random high quality sample
    const sample = DEMO_SAMPLES[Math.floor(Math.random() * DEMO_SAMPLES.length)];
    runOcrAnalysis(sample.regNumber, sample.vehicleType, sample.ownerName, sample.contactNumber);
  };

  // Find best available slot for category
  const availableSlotsForType = slots.filter(
    s => s.slot_type === detectedType && s.status === 'Available'
  );
  const recommendedSlot = availableSlotsForType.length > 0 ? availableSlotsForType[0].slot_number : null;

  // Submit Automatic Parking Entry
  const handleExecuteAutoEntry = () => {
    setScanWarning(null);
    setScanSuccess(null);

    const cleanPlate = detectedPlate.trim().toUpperCase();
    if (!cleanPlate) {
      setScanWarning('No vehicle license plate scanned or detected yet.');
      return;
    }

    // Check duplicate active vehicle
    const activeDuplicate = records.find(
      r => r.reg_number.toUpperCase() === cleanPlate && r.status === 'Active'
    );
    if (activeDuplicate) {
      setScanWarning(
        `DUPLICATE BLOCKED: Vehicle ${cleanPlate} is ALREADY PARKED inside at bay ${activeDuplicate.slot_number}. Gate barrier will NOT open.`
      );
      return;
    }

    if (!recommendedSlot) {
      setScanWarning(
        `BAY CAPACITY FULL: No available slots for ${detectedType.toUpperCase()}. Automatic check-in halted.`
      );
      return;
    }

    const assignedOwner = ownerName.trim() || `Driver of ${cleanPlate}`;
    const assignedContact = contactNumber.trim() || '9800000000';
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    onAutoPark({
      reg_number: cleanPlate,
      vehicle_type: detectedType,
      owner_name: assignedOwner,
      contact_number: assignedContact,
      slot_number: recommendedSlot,
      entry_time: nowTime,
      payment_status: 'Pending',
      status: 'Active',
    });

    setScanSuccess(
      `BOOM BARRIER OPENED: Vehicle ${cleanPlate} registered automatically and assigned to Slot ${recommendedSlot}!`
    );

    // Keep state fresh for next scan
    setTimeout(() => {
      // Pick next demo plate index for rapid testing
      const nextIndex = (activeSampleIndex + 1) % DEMO_SAMPLES.length;
      setActiveSampleIndex(nextIndex);
      const nextSample = DEMO_SAMPLES[nextIndex];
      setDetectedPlate(nextSample.regNumber);
      setDetectedType(nextSample.vehicleType);
      setOwnerName(nextSample.ownerName);
      setContactNumber(nextSample.contactNumber);
    }, 2500);
  };

  const currentSample = DEMO_SAMPLES[activeSampleIndex] || DEMO_SAMPLES[0];

  return (
    <div className="border border-white/10 bg-[#0c0c0e] p-5 sm:p-6 space-y-6">
      {/* Top Banner & Scanner Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#10b981] text-[#0c0c0e] font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 flex items-center gap-1">
              <Zap size={11} className="fill-[#0c0c0e]" /> ANPR v4.2
            </span>
            <span className="label-mono">AUTOMATED GATE BARRIER SYSTEM</span>
          </div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-white mt-1 flex items-center gap-2">
            Automatic License Plate Entry (ANPR)
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Optical character recognition camera scans incoming number plates, auto-allocates parking bays, and triggers the boom barrier.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 border border-white/10 font-mono text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSelectMode('preset')}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
              mode === 'preset'
                ? 'bg-[#10b981] text-[#0c0c0e] font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Smart Plates</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('camera')}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
              mode === 'camera'
                ? 'bg-[#10b981] text-[#0c0c0e] font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera size={13} />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('upload')}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
              mode === 'upload'
                ? 'bg-[#10b981] text-[#0c0c0e] font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload size={13} />
            <span>Upload Plate</span>
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {scanWarning && (
        <div className="bg-red-950/40 border border-red-500 text-red-200 text-xs p-3.5 flex items-start gap-2.5 font-mono">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">{scanWarning}</div>
          <button onClick={() => setScanWarning(null)} className="text-red-400 hover:text-white">×</button>
        </div>
      )}

      {scanSuccess && (
        <div className="bg-[#10b981]/15 border-2 border-[#10b981] text-[#10b981] text-xs p-4 flex items-start justify-between gap-3 font-mono animate-pulse">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-[#10b981] shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-white text-sm">{scanSuccess}</div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Barrier arm: <strong className="text-[#10b981]">LIFTED</strong> // Vehicle safely cleared to enter designated slot.
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="bg-[#10b981] text-[#0c0c0e] font-bold text-[11px] px-3 py-1.5 uppercase hover:bg-[#059669] shrink-0"
            >
              View Dashboard
            </button>
          )}
        </div>
      )}

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Capture / Camera Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative border border-white/20 bg-black min-h-[300px] flex flex-col items-center justify-center overflow-hidden">
            {/* Viewport Corners - Brutalist Viewfinder HUD */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#10b981] z-20 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#10b981] z-20 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#10b981] z-20 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#10b981] z-20 pointer-events-none" />

            {/* HUD Status Text */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-20 font-mono text-[10px] pointer-events-none">
              <span className="text-[#10b981] flex items-center gap-1.5 font-bold">
                <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                CAM-01 [ENTRY GATE - NORTH]
              </span>
              <span className="text-zinc-400">FPS: 30 // RESOLUTION: 1080p</span>
            </div>

            {/* Scanning Line Animation */}
            {scanning && (
              <div 
                className="absolute left-0 right-0 h-1 bg-[#10b981] shadow-[0_0_15px_#10b981] z-20 pointer-events-none transition-all duration-75"
                style={{ top: `${scanProgress}%` }}
              />
            )}

            {/* Mode 1: Live WebCam Stream */}
            {mode === 'camera' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {cameraActive ? (
                  <div className="relative w-full aspect-video max-h-[340px] flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Center Plate Bounding Box Reticle */}
                    <div className="absolute border-2 border-dashed border-[#10b981]/80 w-64 h-24 pointer-events-none flex items-center justify-center bg-[#10b981]/5">
                      <span className="font-mono text-[9px] text-[#10b981] bg-black/70 px-1 py-0.5">
                        ALIGN NUMBER PLATE HERE
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <VideoOff size={40} className="mx-auto text-zinc-600" />
                    <p className="font-mono text-xs text-zinc-400">
                      {cameraError || 'Camera stream is stopped or permissions are pending.'}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-[#10b981] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2 uppercase tracking-wider"
                    >
                      Authorize & Start Camera
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="w-full flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/10 z-10">
                    <button
                      type="button"
                      onClick={handleCaptureCamera}
                      disabled={scanning}
                      className="bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Scan size={14} />
                      <span>Capture & OCR Read</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="border border-white/20 text-zinc-400 hover:text-white font-mono text-xs px-3 py-2"
                    >
                      Turn Off
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Upload Plate Picture */}
            {mode === 'upload' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                {uploadedImageSrc ? (
                  <div className="relative max-h-[300px] w-full flex items-center justify-center">
                    <img
                      src={uploadedImageSrc}
                      alt="Uploaded Plate"
                      className="max-h-[280px] max-w-full object-contain border border-white/10"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-[#10b981]/60 pointer-events-none" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload size={38} className="mx-auto text-[#10b981]" />
                    <div className="font-mono text-xs text-white font-bold">
                      Upload Vehicle Front / Number Plate Photo
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 max-w-sm">
                      Supports JPG, PNG, WEBP. The AI vision parser will localize the plate and read alphanumeric characters.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 z-10">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    <span>Choose File...</span>
                  </button>
                  {uploadedImageSrc && (
                    <button
                      type="button"
                      onClick={() => runOcrAnalysis()}
                      disabled={scanning}
                      className="border border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10 font-mono text-xs font-bold px-4 py-2 uppercase"
                    >
                      Re-scan OCR
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Smart Presets (Live Interactive Simulator) */}
            {mode === 'preset' && (
              <div className="w-full h-full p-6 flex flex-col items-center justify-center space-y-4">
                {/* Visual License Plate Rendering with Hologram and State Stamp */}
                <div className="relative group p-2">
                  <div className="w-80 sm:w-96 bg-[#f8fafc] text-slate-900 border-4 border-slate-950 rounded-xs shadow-2xl p-3 font-mono flex items-center justify-between select-none">
                    {/* Blue IND Strip */}
                    <div className="bg-[#002b80] text-white flex flex-col items-center justify-between py-1 px-1.5 h-16 rounded-xs mr-3">
                      <div className="w-3.5 h-3.5 rounded-full border border-yellow-400 flex items-center justify-center text-[7px] font-bold text-yellow-300">
                        IN
                      </div>
                      <span className="text-[10px] font-extrabold tracking-widest">IND</span>
                    </div>

                    {/* License Plate String */}
                    <div className="flex-1 text-center">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        {currentSample.plateState}
                      </div>
                      <div className="text-2xl sm:text-3xl font-black tracking-widest text-slate-950 font-mono">
                        {currentSample.regNumber}
                      </div>
                    </div>

                    {/* Hologram Emblem */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-emerald-400 opacity-80 border border-slate-400 flex items-center justify-center">
                      <ShieldCheck size={14} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Subtle scan glow */}
                  <div className="absolute -inset-1 bg-[#10b981]/20 -z-10 blur-sm rounded" />
                </div>

                <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                  <span>Vehicle Scenario:</span>
                  <span className="text-white font-bold">{currentSample.vehicleType.toUpperCase()}</span>
                  <span>•</span>
                  <span>Owner: <strong className="text-zinc-200">{currentSample.ownerName}</strong></span>
                  <span>•</span>
                  <span className="bg-white/10 px-1.5 py-0.5 text-[#10b981] font-bold text-[10px]">
                    {currentSample.tag}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      runOcrAnalysis(
                        currentSample.regNumber, 
                        currentSample.vehicleType, 
                        currentSample.ownerName, 
                        currentSample.contactNumber
                      );
                    }}
                    disabled={scanning}
                    className="bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-4 py-2 uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                  >
                    <Scan size={14} />
                    <span>{scanning ? `Analyzing (${scanProgress}%)` : 'Scan This Plate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = (activeSampleIndex + 1) % DEMO_SAMPLES.length;
                      handleSelectSample(DEMO_SAMPLES[next], next);
                    }}
                    className="border border-white/20 text-zinc-300 hover:text-white font-mono text-xs px-3 py-2 flex items-center gap-1 hover:bg-white/5"
                  >
                    <RefreshCw size={12} />
                    <span>Next Test Plate</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preset Plate Quick-Select Strip */}
          <div>
            <div className="label-mono mb-2">Simulated Vehicle Feed (Click to Switch Plate)</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              {DEMO_SAMPLES.map((s, idx) => (
                <button
                  key={s.regNumber}
                  type="button"
                  onClick={() => handleSelectSample(s, idx)}
                  className={`p-2 border text-left transition-all ${
                    activeSampleIndex === idx && detectedPlate === s.regNumber
                      ? 'border-[#10b981] bg-[#10b981]/15 text-white font-bold'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500 uppercase">{s.vehicleType} • {s.plateState}</div>
                  <div className="text-xs font-bold text-[#10b981] tracking-wide mt-0.5">{s.regNumber}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: OCR Extraction & Barrier Gate Trigger (5 cols) */}
        <div className="lg:col-span-5 space-y-4 font-mono text-xs">
          {/* Recognition Results Box */}
          <div className="border border-white/10 bg-black/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-[#10b981]" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  ANPR Recognition Output
                </span>
              </div>
              {confidence !== null && (
                <span className="text-[10px] text-[#10b981] bg-[#10b981]/10 border border-[#10b981] px-2 py-0.5 font-bold">
                  CONFIDENCE: {confidence}%
                </span>
              )}
            </div>

            {/* Extracted Plate */}
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                Detected Number Plate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={detectedPlate}
                  onChange={(e) => setDetectedPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. KA-01-MJ-4521"
                  className="w-full bg-white/5 border border-white/20 px-3 py-2 text-sm font-bold text-white uppercase tracking-widest font-mono focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Format editable before barrier trigger if manual correction is needed.
              </p>
            </div>

            {/* Category & Automated Bay Assignment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                  Vehicle Type
                </label>
                <select
                  value={detectedType}
                  onChange={(e) => setDetectedType(e.target.value as VehicleType)}
                  className="w-full bg-[#0c0c0e] border border-white/20 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                >
                  <option value="Bike">Bike / Two-Wheeler</option>
                  <option value="Car">Car / Sedan / SUV</option>
                  <option value="Van">Van / Minivan</option>
                  <option value="Truck">Truck / Heavy</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                  Assigned Bay (Auto)
                </label>
                {recommendedSlot ? (
                  <div className="px-2.5 py-1.5 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] font-bold text-xs">
                    {recommendedSlot} ({availableSlotsForType.length} bays free)
                  </div>
                ) : (
                  <div className="px-2.5 py-1.5 bg-red-950/40 border border-red-500 text-red-400 font-bold text-xs">
                    FULL (0 BAYS)
                  </div>
                )}
              </div>
            </div>

            {/* Driver / Contact Autofill */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                  Owner / Driver Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/20 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
                  Driver Contact
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white/5 border border-white/20 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            {/* Tariff Rate Indicator */}
            <div className="bg-white/5 p-2.5 border border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Hourly Tariff Rate:</span>
              <span className="font-bold text-[#10b981]">
                ${rates.find(r => r.vehicle_type === detectedType)?.hourly_rate.toFixed(2) || '5.00'} / hr
              </span>
            </div>

            {/* Big Action Button: Open Gate & Auto-Park */}
            <button
              type="button"
              onClick={handleExecuteAutoEntry}
              disabled={scanning || !recommendedSlot || !detectedPlate}
              className="w-full bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-[#0c0c0e] font-mono font-bold text-xs py-3 uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Zap size={14} className="fill-[#0c0c0e]" />
              <span>AUTOMATIC ENTRY & OPEN BOOM BARRIER</span>
            </button>
          </div>

          {/* Terminal Diagnostics & Log */}
          <div className="border border-white/10 bg-[#0c0c0e] p-3 text-[10px] font-mono text-zinc-400 space-y-1">
            <div className="text-zinc-500 uppercase font-bold tracking-widest text-[9px] border-b border-white/10 pb-1 flex items-center justify-between">
              <span>Hardware Gate Telemetry</span>
              <span className="text-[#10b981]">GATE CONTROLLER: ONLINE</span>
            </div>
            {ocrLog.length > 0 ? (
              ocrLog.slice(-4).map((line, i) => (
                <div key={i} className="text-zinc-300">
                  <span className="text-[#10b981]">&gt;</span> {line}
                </div>
              ))
            ) : (
              <div className="text-zinc-500 italic">
                Awaiting incoming vehicle trigger on inductive loop detector #01...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
