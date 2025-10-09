import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FaMicrophone, FaStop, FaPlay, FaPause, FaClock, FaChartBar, 
  FaVolumeUp, FaComment, FaBrain, FaCheckCircle, FaExclamationTriangle,
  FaArrowRight, FaDownload, FaEye, FaVideo, FaVideoSlash,
  FaSmile
} from "react-icons/fa";
import Webcam from "react-webcam";
import axios from "axios";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

const BACKEND_FRAME = 'http://localhost:8000/analyze_frame';
const EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise'];

const SpeechInsights = () => {
  // Remove navigation state - no tabs needed
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  
  // Analysis results
  const [loudnessResult, setLoudnessResult] = useState(null);
  const [fillerResult, setFillerResult] = useState(null);
  const [paceResult, setPaceResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioDuration, setAudioDuration] = useState(null);
  const [recordedAt, setRecordedAt] = useState(null);
  
  // Real-time Loudness Monitoring
  const [liveLoudness, setLiveLoudness] = useState("Listening...");
  const [loudnessColor, setLoudnessColor] = useState("#3498db");
  const [waveform, setWaveform] = useState([]);
  
  // Camera states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Live Emotion Analysis states
  const [faceDetected, setFaceDetected] = useState(false);
  const [liveTop, setLiveTop] = useState(null);
  const [liveProbs, setLiveProbs] = useState({});
  const [liveSamples, setLiveSamples] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const webcamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const liveRef = useRef(null);
  const emaRef = useRef({});
  const framesRef = useRef([]);
  const mediaStreamRef = useRef(null); // Store the main stream
  
  // Loudness monitoring refs
  const audioContextRef = useRef(null);
  const analyserLoudnessRef = useRef(null);
  const floatDataArrayRef = useRef(null);
  const processorRef = useRef(null);
  const pcmBufferRef = useRef(new Float32Array(0));
  const sampleRateRef = useRef(16000);
  const chunkTimerRef = useRef(null);
  const skipFirstChunkRef = useRef(false);
  const waveformCanvasRef = useRef(null);
  
  // Settings for emotion analysis
  const [windowSec] = useState(3);
  const [emaAlpha] = useState(0.4);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (webcamRef.current?.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
      }
    };
  }, []);

  // Waveform drawing effect
  useEffect(() => {
    if (waveform.length > 0 && waveformCanvasRef.current) {
      const canvas = waveformCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      waveform.forEach((point, i) => {
        const x = (i / waveform.length) * width;
        const y = height / 2 - point * height;
        ctx.lineTo(x, y);
      });

      ctx.strokeStyle = loudnessColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [waveform, loudnessColor]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // EMA smoothing for live emotion probabilities
  const smooth = (probs) => {
    const out = {};
    EMOTIONS.forEach(k => {
      const prev = emaRef.current[k] ?? probs[k] ?? 0;
      const x = probs[k] ?? 0;
      const y = emaAlpha * x + (1 - emaAlpha) * prev;
      emaRef.current[k] = y;
      out[k] = y;
    });
    return out;
  };

  // Real-time loudness monitoring setup
  const startLoudnessMonitoring = async (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sampleRateRef.current = audioContextRef.current.sampleRate || 16000;

      analyserLoudnessRef.current = audioContextRef.current.createAnalyser();
      analyserLoudnessRef.current.fftSize = 2048;
      const bufferLength = analyserLoudnessRef.current.fftSize;
      floatDataArrayRef.current = new Float32Array(bufferLength);

      source.connect(analyserLoudnessRef.current);

      // Waveform visualization interval
      const drawInterval = setInterval(() => {
        if (!analyserLoudnessRef.current) return;
        analyserLoudnessRef.current.getFloatTimeDomainData(floatDataArrayRef.current);

        const samples = 200;
        const blockSize = Math.floor(floatDataArrayRef.current.length / samples);
        const filteredData = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            const val = floatDataArrayRef.current[i * blockSize + j];
            sum += Math.abs(val);
          }
          filteredData.push(sum / blockSize);
        }

        setWaveform(filteredData);
      }, 100);

      // PCM capture for loudness prediction
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        const oldBuf = pcmBufferRef.current;
        const merged = new Float32Array(oldBuf.length + input.length);
        merged.set(oldBuf, 0);
        merged.set(input, oldBuf.length);
        pcmBufferRef.current = merged;
      };
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // WAV conversion helper
      const wavFromFloat32 = (float32, sr) => {
        const to16 = (input) => {
          const buffer = new ArrayBuffer(input.length * 2);
          const view = new DataView(buffer);
          let offset = 0;
          for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          }
          return buffer;
        };
        const writeHdr = (view, sampleRate, numSamples) => {
          const set32 = (o, v) => view.setUint32(o, v, true);
          const set16 = (o, v) => view.setUint16(o, v, true);
          set32(0, 0x46464952); // RIFF
          set32(4, 36 + numSamples * 2);
          set32(8, 0x45564157); // WAVE
          set32(12, 0x20746d66); // fmt 
          set32(16, 16);
          set16(20, 1);
          set16(22, 1);
          set32(24, sampleRate);
          set32(28, sampleRate * 2);
          set16(32, 2);
          set16(34, 16);
          set32(36, 0x61746164); // data
          set32(40, numSamples * 2);
        };
        const pcm = to16(float32);
        const wav = new ArrayBuffer(44 + pcm.byteLength);
        const view = new DataView(wav);
        writeHdr(view, sr, float32.length);
        new Uint8Array(wav, 44).set(new Uint8Array(pcm));
        return new Blob([wav], { type: 'audio/wav' });
      };

      // Skip first chunk and start prediction
      skipFirstChunkRef.current = true;
      chunkTimerRef.current = setInterval(async () => {
        const needed = Math.floor(sampleRateRef.current * 3);
        if (pcmBufferRef.current.length < needed) return;
        const slice = pcmBufferRef.current.slice(pcmBufferRef.current.length - needed);
        if (skipFirstChunkRef.current) { 
          skipFirstChunkRef.current = false; 
          return; 
        }
        const wavBlob = wavFromFloat32(slice, sampleRateRef.current);
        const formData = new FormData();
        formData.append('file', wavBlob, 'recording.wav');
        try {
          const res = await axios.post('http://localhost:8000/loudness/predict-loudness', formData, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
          });
          const category = res.data.category;
          setLiveLoudness(category);
          if (category === 'Acceptable') setLoudnessColor('green');
          else if (category === 'Low / Silent') setLoudnessColor('red');
          else setLoudnessColor('#3498db');
        } catch (err) {
          console.error('Loudness prediction error:', err);
          setLiveLoudness('Prediction error');
          setLoudnessColor('gray');
        }
      }, 3000);

      return () => {
        clearInterval(drawInterval);
        if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
        if (processorRef.current) {
          try { source.disconnect(processorRef.current); } catch {}
          try { processorRef.current.disconnect(); } catch {}
        }
        pcmBufferRef.current = new Float32Array(0);
      };
    } catch (err) {
      console.error("Loudness monitoring error:", err);
      setLiveLoudness("Monitoring error");
    }
  };

  // Live frame analysis for emotion detection
  const sendLiveFrame = async () => {
    try {
      if (!webcamRef.current) return;
      const dataUrl = webcamRef.current.getScreenshot();
      if (!dataUrl) return;

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const form = new FormData();
      form.append('frame', blob, 'frame.jpg');

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);

      const r = await fetch(BACKEND_FRAME, { method: 'POST', body: form, signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) return;
      const j = await r.json();

      if (j.face_detected) {
        setFaceDetected(true);
        // smooth + keep window
        const sm = smooth(j.probs || {});
        const now = recordTime;
        framesRef.current.push({ t: now, probs: sm });
        // keep only last windowSec seconds
        const cutoff = now - windowSec;
        framesRef.current = framesRef.current.filter(f => f.t >= cutoff);

        // current dominant over window
        const agg = {};
        framesRef.current.forEach(({ probs }) => {
          EMOTIONS.forEach(e => { agg[e] = (agg[e] || 0) + (probs[e] || 0); });
        });
        const denom = framesRef.current.length || 1;
        const avg = {};
        EMOTIONS.forEach(e => avg[e] = +((agg[e] || 0) / denom).toFixed(1));
        setLiveProbs(avg);

        const dom = Object.entries(avg).sort((a, b) => b[1] - a[1])[0] || ['Neutral', 0];
        setLiveTop(dom[0]);
        setLiveSamples(s => s + 1);
      } else {
        setFaceDetected(false);
        setLiveTop(null);
        setLiveProbs({});
      }
    } catch (error) {
      // Silently handle errors
      console.log('Live frame analysis error:', error);
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    
    try {
      setIsCameraOn(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      });
      
      // Store stream for cleanup
      mediaStreamRef.current = stream;
      
      if (webcamRef.current?.video) {
        webcamRef.current.video.srcObject = stream;
      }

      // IMPORTANT: Record audio-only for filler words (like FillerWords.jsx)
      // Get only the audio track from the stream
      const audioTracks = stream.getAudioTracks();
      const audioStream = new MediaStream(audioTracks);
      
      // Use audio MIME type exactly like FillerWords.jsx
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else {
          mimeType = 'audio/webm';
        }
      }
      
      console.log("🎵 Using audio MIME type:", mimeType);

      mediaRecorderRef.current = new MediaRecorder(audioStream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        // Create file with proper name and type for backend compatibility - EXACTLY like FillerWords.jsx
        const audioFile = new File([audioBlob], "recording.webm", { type: mimeType });
        setAudioBlob(audioFile);
        setAudioURL(URL.createObjectURL(audioBlob));
        
        // Calculate duration using AudioContext - exact same logic as FillerWords.jsx
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioBlob.arrayBuffer().then(arrayBuffer => {
          audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
            setAudioDuration(audioBuffer.duration);
          });
        });
        
        setRecordedAt(new Date());
        setFillerResult(null); // Reset result like FillerWords.jsx
      };

      mediaRecorderRef.current.start(1000); // Use 1000ms like FillerWords.jsx
      setIsRecording(true);
      setIsPaused(false);
      setRecordTime(0);
      setCameraError(null);
      
      // Reset emotion analysis state
      setFaceDetected(false);
      setLiveTop(null);
      setLiveProbs({});
      setLiveSamples(0);
      emaRef.current = {};
      framesRef.current = [];
      
      // Reset loudness monitoring state
      setLiveLoudness("Listening...");
      setLoudnessColor("#3498db");
      setWaveform([]);
      
      // Reset analysis results
      setFillerResult(null);
      setLoudnessResult(null);
      setPaceResult(null);
      
      // Start live emotion analysis (~1.5 fps)
      liveRef.current = setInterval(sendLiveFrame, 650);
      
      // Start real-time loudness monitoring - use the full stream (has audio)
      await startLoudnessMonitoring(stream);
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
      setCameraError("Camera/microphone access denied or not available");
      setIsCameraOn(false);
      alert("Error accessing camera/microphone. Please check permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
      mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop media stream - like FillerWords.jsx
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop camera display
      if (webcamRef.current?.video) {
        webcamRef.current.video.srcObject = null;
      }
      setIsCameraOn(false);
      
      // Stop live emotion analysis
      if (liveRef.current) {
        clearInterval(liveRef.current);
        liveRef.current = null;
      }
    }
  };

  const analyzeAllComponents = async () => {
    if (!audioBlob) return alert("No audio recorded");
    
    setIsAnalyzing(true);
    
    try {
      // Analyze filler words - EXACTLY like FillerWords.jsx uploadAudio function
        const fillerFormData = new FormData();
      fillerFormData.append("audio", audioBlob);
      
        const token = localStorage.getItem("token");
        
      console.log("Uploading audio to:", "http://localhost:3001/api/recording/upload");
      console.log("Audio blob:", audioBlob);
      console.log("Token:", token ? "Present" : "Missing");

      const fillerRes = await axios.post("http://localhost:3001/api/recording/upload", fillerFormData, {
          headers: { 
            Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data",
        },
        });
        
      console.log("Upload response:", fillerRes.data);
        setFillerResult(fillerRes.data);

      // Analyze loudness
      const loudnessFormData = new FormData();
      loudnessFormData.append('file', audioBlob, 'recording.wav');
      const loudnessRes = await axios.post('http://localhost:8000/loudness/predict-loudness', loudnessFormData);
      setLoudnessResult(loudnessRes.data);

      // Analyze pace (mock data for now)
      setPaceResult({
        wpm: Math.floor(Math.random() * 40) + 120,
        prediction: "Good Pace",
        consistencyScore: Math.random() * 100
      });

    } catch (error) {
      console.error("Upload failed", error);
      console.error("Error response:", error.response?.data);
      alert("Something went wrong during upload. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score, type) => {
    if (type === 'loudness') {
      return score === 'Acceptable' ? 'text-green-400' : 'text-red-400';
    }
    if (type === 'filler') {
      if (score <= 2) return 'text-green-400';
      if (score <= 5) return 'text-yellow-400';
      return 'text-red-400';
    }
    if (type === 'pace') {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
    return 'text-gray-400';
  };

  const getScoreIcon = (score, type) => {
    if (type === 'loudness') {
      return score === 'Acceptable' ? '✓' : '⚠';
    }
    if (type === 'filler') {
      if (score <= 2) return '✓';
      if (score <= 5) return '⚠';
      return '✗';
    }
    if (type === 'pace') {
      if (score >= 80) return '✓';
      if (score >= 60) return '⚠';
      return '✗';
    }
    return '?';
  };

  const downloadPDFReport = async () => {
    const node = document.getElementById("speech-insights-report");
    if (!node) return;

    try {
      const dataUrl = await htmlToImage.toPng(node, {
        style: { color: "black", backgroundColor: "white" }
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Speech_Insights_Report.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] min-h-[calc(100vh-4rem)] p-4 lg:p-8">
      <div className="w-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6">



        <div className="flex flex-col lg:flex-row w-full gap-4">
          
          {/* Left Panel - Camera and Recording Controls */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            {/* Camera Section */}
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-4 shadow-xl flex-shrink-0">
              
              {/* Webcam Display */}
              <div className="relative w-full bg-black rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '6/3', minHeight: '400px' }}>
                {isCameraOn ? (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white/60">
                      <FaVideo className="text-4xl mb-2 mx-auto" />
                      <p className="text-sm">Camera is off - Click Play to start</p>
                    </div>
                  </div>
                )}
                
                {/* Recording indicator overlay */}
                {isRecording && (
                  <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    {isPaused ? 'PAUSED' : 'RECORDING'}
                  </div>
                )}

                {/* Timer overlay */}
                {isRecording && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                    <FaClock className="inline mr-2" />
                    {formatTime(recordTime)}
                </div>
              )}
            </div>

              {/* Recording Controls Below Webcam */}
              <div className="space-y-2">
                {/* Control Buttons */}
                <div className="flex justify-center space-x-3">
                  
                  
                <button
                  onClick={pauseRecording}
                  disabled={!isRecording || isPaused}
                    className="p-3 bg-yellow-600 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-700 transition-all transform hover:scale-105"
                    title="Pause Recording"
                >
                  <FaPause className="text-black text-xl" />
                </button>
 
                <button
                  onClick={isRecording && isPaused ? resumeRecording : startRecording}
                  disabled={isRecording && !isPaused}
                    className="p-3 bg-green-600 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-all transform hover:scale-105"
                    title="Start/Resume Recording"
                >
                  <FaPlay className="text-black text-xl" />
                </button>
                  
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                    className="p-3 bg-red-600 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-all transform hover:scale-105"
                    title="Stop Recording"
                >
                  <FaStop className="text-black text-xl" />
                </button>
              </div>

                {/* Status Display */}
                <div className="text-center">
                  <p className="text-white/90 text-sm">
                    {isRecording 
                      ? (isPaused ? '⏸️ Recording Paused' : '🎥 Recording in Progress') 
                      : (audioBlob ? '✅ Recording Complete' : '⚪ Ready to Record')}
                </p>
              </div>

                {/* Camera Error */}
                {cameraError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm text-center">{cameraError}</p>
                  </div>
                )}

                {/* Video/Audio Playback */}
                {/* {audioURL && (
                  <div className="space-y-2">
                    <audio controls className="w-full rounded-lg">
                      <source src={audioURL} type="audio/webm" />
                    </audio>
                  </div>
                )} */}
              </div>
            </div>

            {/* Live Emotion Tracking Section - Separate Div */}
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-4 shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="text-[#00ccff] text-base font-semibold flex items-center gap-2">
                  <FaSmile className="text-[#00ccff]" />
                  Live Emotion Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-white/80">{faceDetected ? 'Face' : 'No Face'}</span>
                </div>
              </div>

              {/* Current Dominant Emotion */}
              {liveTop && (
                <div className="mb-2 p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 rounded-lg flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">Dominant:</span>
                    <span className="text-base font-bold text-blue-300">{liveTop}</span>
                  </div>
                </div>
              )}

              {/* Emotion Probability Bars */}
              {Object.keys(liveProbs).length === 0 ? (
                <div className="text-center py-6">
                  <div>
                    <FaSmile className="text-3xl text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-xs">
                      {isRecording ? 'Analyzing emotions...' : 'Start recording to see live emotions'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {EMOTIONS.map((emotion) => {
                    const val = Math.round(liveProbs[emotion] ?? 0);
                    const isTop = emotion === liveTop;
                    return (
                      <div key={emotion} className="flex items-center gap-2">
                        <span className={`w-16 shrink-0 text-xs ${isTop ? 'text-[#00ccff] font-semibold' : 'text-white'}`}>
                          {emotion}
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-[#0b4952] overflow-hidden">
                          <motion.div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              isTop ? 'bg-gradient-to-r from-[#00ccff] to-[#00a8cc]' : 'bg-[#00d1d1]'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, val)}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className={`w-10 shrink-0 text-xs text-right ${isTop ? 'text-[#00ccff] font-semibold' : 'text-white'}`}>
                          {val}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Analysis Stats */}
              {liveSamples > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 flex-shrink-0">
                  <div className="flex justify-between text-[10px] text-white/70">
                    <span>Samples: {liveSamples}</span>
                    <span>Win: {windowSec}s | α: {emaAlpha}</span>
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={analyzeAllComponents}
                disabled={!audioBlob || isAnalyzing}
                className="w-full mt-3 bg-[#00ccff] text-[#003b46] font-bold py-2.5 px-4 rounded-lg hover:bg-[#00a8cc] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm flex-shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaChartBar />
                    Analyze All Components
                  </>
                )}
              </button>
            </div>

            {/* Real-time Loudness Monitoring Section */}
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-4 shadow-xl flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[#00ccff] text-base font-semibold flex items-center gap-2">
                  <FaVolumeUp className="text-[#00ccff]" />
                  Real-time Loudness
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  liveLoudness === 'Acceptable' ? 'bg-green-500/20 text-green-300' :
                  liveLoudness === 'Low / Silent' ? 'bg-red-500/20 text-red-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {liveLoudness}
                </div>
              </div>

              {/* Waveform Canvas */}
              <div className="w-full mb-3">
                <canvas
                  ref={waveformCanvasRef}
                  width={400}
                  height={30}
                  className="w-full border border-white/20 rounded-lg"
                  style={{ background: '#fff' }}
                />
              </div>

              {/* Loudness Status */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg text-center ${
                  liveLoudness === 'Acceptable' ? 'bg-green-500/30 border-2 border-green-400' : 'bg-green-500/10 border border-green-400/30'
                }`}>
                  <div className="text-xs text-white/80">Optimal</div>
                  <div className="text-lg">✓</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  liveLoudness === 'Low / Silent' ? 'bg-red-500/30 border-2 border-red-400' : 'bg-red-500/10 border border-red-400/30'
                }`}>
                  <div className="text-xs text-white/80">Too Quiet</div>
                  <div className="text-lg">↓</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  liveLoudness === 'Too Loud' ? 'bg-yellow-500/30 border-2 border-yellow-400' : 'bg-yellow-500/10 border border-yellow-400/30'
                }`}>
                  <div className="text-xs text-white/80">Too Loud</div>
                  <div className="text-lg">↑</div>
                </div>
              </div>

              {/* Loudness Tips */}
              {liveLoudness !== 'Listening...' && liveLoudness !== 'Acceptable' && (
                <div className="mt-3 p-2 bg-blue-500/20 border border-blue-400/50 rounded-lg">
                  <p className="text-xs text-blue-200">
                    {liveLoudness === 'Low / Silent' 
                      ? '💡 Tip: Speak louder and closer to the microphone for better clarity.'
                      : '💡 Tip: Reduce your speaking volume to avoid distortion.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - All Components Display */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 shadow-xl">
              
              <div id="speech-insights-report">

                {/* Overall Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-xl p-4 border-2 border-blue-400/60 text-center">
                    <div className="text-3xl font-bold text-blue-300 mb-2">
                      {loudnessResult ? getScoreIcon(loudnessResult.category, 'loudness') : '?'}
                    </div>
                    <div className="text-white font-semibold">Loudness</div>
                    <div className="text-white/70 text-sm">
                      {loudnessResult ? loudnessResult.category : 'Not Analyzed'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-4 border-2 border-green-400/60 text-center">
                    <div className="text-3xl font-bold text-green-300 mb-2">
                      {fillerResult ? getScoreIcon(fillerResult.fillerCount, 'filler') : '?'}
                    </div>
                    <div className="text-white font-semibold">Filler Words</div>
                    <div className="text-white/70 text-sm">
                      {fillerResult ? `${fillerResult.fillerCount} words` : 'Not Analyzed'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl p-4 border-2 border-purple-400/60 text-center">
                    <div className="text-3xl font-bold text-purple-300 mb-2">
                      {paceResult ? getScoreIcon(paceResult.consistencyScore, 'pace') : '?'}
                    </div>
                    <div className="text-white font-semibold">Pace</div>
                    <div className="text-white/70 text-sm">
                      {paceResult ? `${paceResult.wpm} WPM` : 'Not Analyzed'}
                    </div>
                  </div>
                </div>

                {/* Component Details Section */}
                <div className="space-y-6">
                  
                  {/* Loudness Component */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-blue-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaVolumeUp className="text-blue-400" />
                      Loudness Analysis
                    </h3>
                    {loudnessResult ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Volume Level:</span>
                          <span className={`font-semibold ${getScoreColor(loudnessResult.category, 'loudness')}`}>
                            {loudnessResult.category}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              loudnessResult.category === 'Acceptable' ? 'bg-green-400' : 
                              loudnessResult.category === 'Low / Silent' ? 'bg-red-400' : 'bg-yellow-400'
                            }`}
                            style={{ 
                              width: loudnessResult.category === 'Acceptable' ? '100%' : 
                                    loudnessResult.category === 'Low / Silent' ? '30%' : '70%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/60 text-center py-4">No loudness analysis available</p>
                    )}
                  </div>

                  {/* Filler Words Component - Enhanced */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-green-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaComment className="text-green-400" />
                      Filler Words Detection
                    </h3>
                    {fillerResult ? (
                      <div className="space-y-4">
                        {/* Main Filler Count Display */}
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-xl p-4 text-center">
                          <div className="text-sm text-white/70 mb-1">Total Filler Words</div>
                          <div className={`text-4xl font-bold ${getScoreColor(fillerResult.fillerCount, 'filler')}`}>
                            {fillerResult.fillerCount}
                        </div>
                          <div className="text-xs text-white/60 mt-1">
                            {fillerResult.fillerCount <= 2 ? '🎯 Excellent!' : 
                             fillerResult.fillerCount <= 5 ? '👍 Good' : 
                             fillerResult.fillerCount <= 10 ? '⚠️ Needs Work' : '🚨 Improve'}
                      </div>
                        </div>
                        
                        {/* Guidelines - Single Row */}
                        <div className="flex gap-2">
                          <motion.div
                            className={`flex-1 rounded-lg p-2 text-center ${
                              fillerResult.fillerCount <= 2 
                                ? 'bg-emerald-500/30 border-2 border-emerald-400' 
                                : 'bg-emerald-500/10 border border-emerald-400/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-xl mb-1">🎯</div>
                            <div className="text-emerald-300 font-bold text-sm">0-2</div>
                            <div className="text-white/80 text-xs">Excellent</div>
                          </motion.div>

                          <motion.div
                            className={`flex-1 rounded-lg p-2 text-center ${
                              fillerResult.fillerCount >= 3 && fillerResult.fillerCount <= 5
                                ? 'bg-yellow-500/30 border-2 border-yellow-400' 
                                : 'bg-yellow-500/10 border border-yellow-400/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-xl mb-1">👍</div>
                            <div className="text-yellow-300 font-bold text-sm">3-5</div>
                            <div className="text-white/80 text-xs">Good</div>
                          </motion.div>

                          <motion.div
                            className={`flex-1 rounded-lg p-2 text-center ${
                              fillerResult.fillerCount >= 6 && fillerResult.fillerCount <= 10
                                ? 'bg-orange-500/30 border-2 border-orange-400' 
                                : 'bg-orange-500/10 border border-orange-400/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-xl mb-1">⚠️</div>
                            <div className="text-orange-300 font-bold text-sm">6-10</div>
                            <div className="text-white/80 text-xs">Needs Work</div>
                          </motion.div>

                          <motion.div
                            className={`flex-1 rounded-lg p-2 text-center ${
                              fillerResult.fillerCount > 10
                                ? 'bg-red-500/30 border-2 border-red-400' 
                                : 'bg-red-500/10 border border-red-400/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-xl mb-1">🚨</div>
                            <div className="text-red-300 font-bold text-sm">10+</div>
                            <div className="text-white/80 text-xs">Improve</div>
                          </motion.div>
                          </div>

                        {/* Performance Indicator */}
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                          <motion.div
                            className={`h-3 rounded-full ${
                              fillerResult.fillerCount <= 2 ? 'bg-emerald-400' :
                              fillerResult.fillerCount <= 5 ? 'bg-yellow-400' :
                              fillerResult.fillerCount <= 10 ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(100, (fillerResult.fillerCount / 15) * 100)}%` 
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                          <p className="text-xs text-blue-200">
                            💡 {fillerResult.fillerCount <= 2 
                              ? 'Excellent work! Your speech is clear and professional.' 
                              : fillerResult.fillerCount <= 5 
                              ? 'Good job! Practice pausing instead of using filler words.' 
                              : fillerResult.fillerCount <= 10
                              ? 'Focus on reducing fillers by taking brief pauses between thoughts.'
                              : 'Practice speaking more slowly and pause intentionally to reduce fillers.'}
                          </p>
                              </div>
                            </div>
                    ) : (
                      <div className="text-center py-8">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <FaComment className="text-white text-2xl" />
                        </motion.div>
                        <p className="text-white/60 text-sm">No filler words analysis yet</p>
                        <p className="text-white/40 text-xs mt-1">Record and analyze to see results</p>
                          </div>
                    )}
                  </div>

                  {/* Pace Management Component */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-purple-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaBrain className="text-purple-400" />
                      Pace Management
                    </h3>
                    {paceResult ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Speaking Rate:</span>
                          <span className={`font-semibold ${getScoreColor(paceResult.consistencyScore, 'pace')}`}>
                            {paceResult.wpm} WPM
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Consistency:</span>
                          <span className={`font-semibold ${getScoreColor(paceResult.consistencyScore, 'pace')}`}>
                            {paceResult.consistencyScore.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              paceResult.consistencyScore >= 80 ? 'bg-green-400' : 
                              paceResult.consistencyScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(paceResult.consistencyScore, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/60 text-center py-4">No pace analysis available</p>
                    )}
                  </div>

                </div>

                {/* Action Buttons */}
                {(loudnessResult || fillerResult || paceResult) && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={downloadPDFReport}
                      className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload />
                      Download Complete Report
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!loudnessResult && !fillerResult && !paceResult && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎤</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                    <p className="text-white/70">
                      Record your speech and click "Analyze All Components" to get comprehensive insights.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechInsights;
