import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FaMicrophone, FaStop, FaPlay, FaPause, FaClock, FaChartBar, 
  FaVolumeUp, FaComment, FaBrain, FaCheckCircle, FaExclamationTriangle,
  FaArrowRight, FaDownload, FaEye, FaVideo, FaVideoSlash,
  FaSmile
} from "react-icons/fa";
import Webcam from "react-webcam";
import GaugeChart from "react-gauge-chart";
import axios from "axios";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

const BACKEND_FRAME = 'http://localhost:8000/analyze_frame';
const EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise'];

// WPM label calculation (from PaceManagement.jsx)
const getWpmLabel = (wpm) => {
  if (!wpm || wpm <= 0 || wpm > 500) return "Slow";
  if (wpm < 100) return "Slow";
  if (wpm <= 150) return "Ideal";
  return "Fast";
};

const getWpmEmoji = (label) => {
  switch (label) {
    case "Slow": return "🟡";
    case "Ideal": return "🟢";
    case "Fast": return "🟠";
    default: return "❓";
  }
};

const getWpmFeedback = (wpm, label) => {
  switch (label) {
    case "Slow":
      return "Your pace is below the ideal range. Try to increase your speaking speed by 15-20 WPM.";
    case "Ideal":
      return "Excellent! You're speaking at an optimal pace for audience engagement.";
    case "Fast":
      return "Your pace is above optimal. Slow down slightly to ensure audience comprehension.";
    default:
      return "Unable to determine pace category.";
  }
};

const SpeechInsights = () => {
  // Remove navigation state - no tabs needed
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
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
  
  // Real-time Voice Quality Metrics
  const [realtimeVoiceMetrics, setRealtimeVoiceMetrics] = useState({
    jitter_local: 0,
    shimmer_local: 0,
    hnr_mean: 0,
    rhythm_consistency: 0,
    speech_continuity: 0,
    speaking_efficiency: 0
  });
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  // Debug: Log when voice metrics change
  useEffect(() => {
    if (realtimeVoiceMetrics.jitter_local > 0 || realtimeVoiceMetrics.hnr_mean > 0) {
      console.log('📊 Voice Metrics State Updated:', realtimeVoiceMetrics);
    }
  }, [realtimeVoiceMetrics]);
  
  // Camera states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Live Emotion Analysis states
  const [faceDetected, setFaceDetected] = useState(false);
  const [liveTop, setLiveTop] = useState(null);
  const [liveProbs, setLiveProbs] = useState({});
  const [liveSamples, setLiveSamples] = useState(0);
  const [visibleSeconds, setVisibleSeconds] = useState(0);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [emotionSummary, setEmotionSummary] = useState([]);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const webcamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const liveRef = useRef(null);
  const emaRef = useRef({});
  const framesRef = useRef([]);
  const mediaStreamRef = useRef(null); // Store the main stream
  
  // Face tracking refs
  const lastFaceStatusRef = useRef(null);
  const visibleCountRef = useRef(0);
  const awayCountRef = useRef(0);
  
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
  const voiceAnalysisTimerRef = useRef(null);
  
  // Settings for emotion analysis
  const [windowSec] = useState(3);
  const [emaAlpha] = useState(0.4);

  // Timer effect with face tracking
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
        
        // Track visible/away seconds
        if (lastFaceStatusRef.current === true) {
          visibleCountRef.current++;
          setVisibleSeconds(visibleCountRef.current);
        } else if (lastFaceStatusRef.current === false) {
          awayCountRef.current++;
          setAwaySeconds(awayCountRef.current);
        }
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
      if (voiceAnalysisTimerRef.current) {
        clearInterval(voiceAnalysisTimerRef.current);
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

  // Helper to create WAV blob for voice quality analysis
  const createWavBlob = (float32Array, sampleRate) => {
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
    
    const pcm = to16(float32Array);
    const wav = new ArrayBuffer(44 + pcm.byteLength);
    const view = new DataView(wav);
    writeHdr(view, sampleRate, float32Array.length);
    new Uint8Array(wav, 44).set(new Uint8Array(pcm));
    return new Blob([wav], { type: 'audio/wav' });
  };

  // Send voice quality analysis
  const sendVoiceQualityAnalysis = async (wavBlob) => {
    try {
      console.log('🎤 Sending voice quality analysis, blob size:', wavBlob.size);
      
      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');
      
      const response = await fetch('http://localhost:8000/pause/pause-analysis/', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        console.error('Voice quality API error:', response.status);
        return;
      }
      
      const result = await response.json();
      console.log('Voice quality analysis response:', result);
      
      if (result.advancedMetrics) {
        const metrics = result.advancedMetrics;
        console.log('Voice quality features:', metrics);
        
        // Calculate more realistic display values based on voice quality and rhythm
        const jitter = metrics.jitter_local || 0;
        const shimmer = metrics.shimmer_local || 0;
        const hnr = metrics.hnr_mean || 0;
        const rhythmConsistency = metrics.rhythm_consistency || 0;
        
        // Use actual backend values directly for speech_continuity and speaking_efficiency
        const actualSpeechContinuity = metrics.speech_continuity || 0;
        const actualSpeakingEfficiency = metrics.speaking_efficiency || 0;
        
        // If both are very high (>0.95), might mean no speech detected
        let speechFlow = actualSpeechContinuity;
        let speakingEfficiency = actualSpeakingEfficiency;
        
        // If no meaningful voice quality detected (all zeros), set to 0
        if (jitter === 0 && shimmer === 0 && hnr === 0) {
          speechFlow = 0;
          speakingEfficiency = 0;
        } else if (actualSpeechContinuity >= 0.95 && actualSpeakingEfficiency >= 0.95) {
          // Very high values - consider voice quality
          const voiceQualityScore = Math.max(0, 1.0 - (jitter * 20) - (shimmer * 2) + (hnr / 25));
          const rhythmScore = Math.max(0, rhythmConsistency - (metrics.rhythm_outliers || 0) * 0.1);
          speechFlow = Math.min(1.0, Math.max(0.0, (voiceQualityScore + rhythmScore + actualSpeechContinuity) / 3));
          speakingEfficiency = Math.min(1.0, Math.max(0.0, (speechFlow + rhythmConsistency) / 2));
        }
        
        setRealtimeVoiceMetrics({
          jitter_local: jitter,
          shimmer_local: shimmer,
          hnr_mean: hnr,
          rhythm_consistency: rhythmConsistency,
          speech_continuity: speechFlow,
          speaking_efficiency: speakingEfficiency
        });
        
        console.log('✅ Voice metrics updated:', {
          jitter, shimmer, hnr, rhythmConsistency, speechFlow, speakingEfficiency
        });
      } else {
        console.error('Voice quality analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Error sending voice quality analysis:', error);
    }
  };

  // Real-time voice quality analysis
  const analyzeRealtimeVoice = async () => {
    // Use refs to get current state (avoid stale closure)
    const currentlyRecording = isRecordingRef.current;
    const currentlyPaused = isPausedRef.current;
    
    if (!currentlyRecording || currentlyPaused || !mediaStreamRef.current || isAnalyzingVoice) {
      console.log('⏸️ Skipping voice analysis:', { 
        isRecording: currentlyRecording, 
        isPaused: currentlyPaused, 
        hasStream: !!mediaStreamRef.current, 
        isAnalyzingVoice 
      });
      return;
    }

    setIsAnalyzingVoice(true);
    console.log('🎙️ Starting real-time voice analysis...');
    
    try {
      // IMPORTANT: Check if audio context exists (like PaceManagement.jsx does)
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        console.warn('⚠️ Audio context not ready, skipping voice analysis');
        setIsAnalyzingVoice(false);
        return;
      }

      // Create a temporary audio context for recording audio
      const tempAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = tempAudioContext.createMediaStreamSource(mediaStreamRef.current);
      const processor = tempAudioContext.createScriptProcessor(4096, 1, 1);
      
      const pcmBuffer = [];
      let isProcessing = false;
      
      processor.onaudioprocess = (event) => {
        if (isProcessing || !isRecordingRef.current || isPausedRef.current) return;
        isProcessing = true;
        
        const input = event.inputBuffer.getChannelData(0);
        pcmBuffer.push(...input);
        
        isProcessing = false;
      };
      
      source.connect(processor);
      processor.connect(tempAudioContext.destination);
      
      // Record for 5 seconds (same as PaceManagement.jsx)
      setTimeout(async () => {
        console.log('📊 Captured audio buffer length:', pcmBuffer.length);
        
        // Check current state using refs
        if (!isRecordingRef.current || isPausedRef.current) {
          console.log('❌ Recording stopped during capture, resetting metrics');
          // Clean up and reset to 0 if not recording
          try {
            processor.disconnect();
            source.disconnect();
            tempAudioContext.close();
          } catch (e) {
            console.warn('Cleanup error:', e);
          }
          setRealtimeVoiceMetrics({
            jitter_local: 0,
            shimmer_local: 0,
            hnr_mean: 0,
            rhythm_consistency: 0,
            speech_continuity: 0,
            speaking_efficiency: 0
          });
          return;
        }
        
        // Convert PCM data to WAV and send for analysis
        if (pcmBuffer.length > 0) {
          console.log('✅ Converting PCM to WAV, sample rate:', tempAudioContext.sampleRate);
          const wavBlob = createWavBlob(new Float32Array(pcmBuffer), tempAudioContext.sampleRate);
          console.log('📦 WAV blob created, size:', wavBlob.size);
          await sendVoiceQualityAnalysis(wavBlob);
        } else {
          console.warn('⚠️ No PCM data captured!');
        }
        
        // Clean up
        try {
          processor.disconnect();
          source.disconnect();
          tempAudioContext.close();
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }, 5000); // 5 seconds (same as PaceManagement.jsx)
      
    } catch (error) {
      console.error("❌ Real-time voice analysis error:", error);
      // Reset to 0 on error
      setRealtimeVoiceMetrics({
        jitter_local: 0,
        shimmer_local: 0,
        hnr_mean: 0,
        rhythm_consistency: 0,
        speech_continuity: 0,
        speaking_efficiency: 0
      });
    } finally {
      setIsAnalyzingVoice(false);
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
      setCameraError(null); // Clear any previous errors
      setIsCameraOn(true);
      
      console.log("Requesting camera and microphone access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      });
      
      console.log("✅ Media access granted");
      console.log("Video tracks:", stream.getVideoTracks().length);
      console.log("Audio tracks:", stream.getAudioTracks().length);
      
      // Store stream for cleanup
      mediaStreamRef.current = stream;
      
      if (webcamRef.current?.video) {
        webcamRef.current.video.srcObject = stream;
      }

      // IMPORTANT: Record audio-only for filler words (like FillerWords.jsx)
      // Get only the audio track from the stream
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No audio track available. Please check microphone permissions.");
      }
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

      mediaRecorderRef.current.onstop = async () => {
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
        
        // Automatically trigger analysis after recording stops
        console.log("Recording stopped, starting automatic analysis...");
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          analyzeAudioFile(audioFile);
        }, 500);
      };

      mediaRecorderRef.current.start(1000); // Use 1000ms like FillerWords.jsx
      setIsRecording(true);
      isRecordingRef.current = true;
      setIsPaused(false);
      isPausedRef.current = false;
      setRecordTime(0);
      setCameraError(null);
      
      // Reset emotion analysis state
      setFaceDetected(false);
      setLiveTop(null);
      setLiveProbs({});
      setLiveSamples(0);
      setVisibleSeconds(0);
      setAwaySeconds(0);
      setEmotionSummary([]);
      emaRef.current = {};
      framesRef.current = [];
      visibleCountRef.current = 0;
      awayCountRef.current = 0;
      lastFaceStatusRef.current = null;
      
      // Reset loudness monitoring state
      setLiveLoudness("Listening...");
      setLoudnessColor("#3498db");
      setWaveform([]);
      
      // Reset voice quality metrics
      setRealtimeVoiceMetrics({
        jitter_local: 0,
        shimmer_local: 0,
        hnr_mean: 0,
        rhythm_consistency: 0,
        speech_continuity: 0,
        speaking_efficiency: 0
      });
      
      // Reset analysis results
      setFillerResult(null);
      setLoudnessResult(null);
      setPaceResult(null);
      
      // Start live emotion analysis (~1.5 fps)
      liveRef.current = setInterval(sendLiveFrame, 650);
      
      // Start real-time loudness monitoring - use the full stream (has audio)
      // This also creates audioContextRef which is needed for voice analysis
      await startLoudnessMonitoring(stream);
      
      // Wait a bit for audio context to be fully ready before starting voice analysis
      setTimeout(() => {
        console.log('🎯 Starting voice quality analysis timer...');
        // Start real-time voice quality analysis every 5.5 seconds (same as PaceManagement.jsx)
        // Note: analyzeRealtimeVoice() has its own checks for isRecording/isPaused
        voiceAnalysisTimerRef.current = setInterval(() => {
          console.log('⏰ Voice analysis interval triggered');
          analyzeRealtimeVoice(); // This function checks current recording state
        }, 5500); // 5.5 seconds interval (same as PaceManagement.jsx)
      }, 1000); // Wait 1 second for audio context to be ready
    } catch (error) {
      console.error("❌ Error accessing camera/microphone:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      let errorMessage = "Unable to access camera/microphone. ";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += "Permission denied. Please allow camera and microphone access in your browser settings.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += "No camera or microphone found. Please connect a device and try again.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += "Camera/microphone is already in use by another application. Please close other apps using it.";
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += "Camera/microphone doesn't meet requirements. Try a different device.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }
      
      setCameraError(errorMessage);
      setIsCameraOn(false);
      setIsRecording(false);
      isRecordingRef.current = false;
      
      // Show detailed alert
      alert(`🎥 Camera/Microphone Access Error\n\n${errorMessage}\n\nTroubleshooting:\n1. Click the camera icon in your browser's address bar\n2. Allow camera and microphone permissions\n3. Refresh the page and try again\n4. Check if another app is using your camera/mic`);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false;
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
      isRecordingRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
      
      // Finalize emotion summary from frames
      if (framesRef.current.length > 0) {
        const sum = {};
        let n = 0;
        framesRef.current.forEach(({ probs }) => {
          EMOTIONS.forEach(e => { sum[e] = (sum[e] || 0) + (probs[e] || 0); });
          n++;
        });
        const avgPct = {};
        EMOTIONS.forEach(e => { avgPct[e] = n ? +(sum[e] / n).toFixed(1) : 0; });
        const sorted = Object.entries(avgPct).sort((a, b) => b[1] - a[1]);
        setEmotionSummary(sorted.slice(0, 3)); // Top 3 emotions
      }
      
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
      
      // Stop voice quality analysis
      if (voiceAnalysisTimerRef.current) {
        clearInterval(voiceAnalysisTimerRef.current);
        voiceAnalysisTimerRef.current = null;
      }
      
      // Reset voice metrics
      setRealtimeVoiceMetrics({
        jitter_local: 0,
        shimmer_local: 0,
        hnr_mean: 0,
        rhythm_consistency: 0,
        speech_continuity: 0,
        speaking_efficiency: 0
      });
    }
  };

  const analyzeAudioFile = async (audioFile) => {
    if (!audioFile) {
      console.error("No audio file provided");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Analyze filler words - EXACTLY like FillerWords.jsx uploadAudio function
        const fillerFormData = new FormData();
      fillerFormData.append("audio", audioFile);
      
        const token = localStorage.getItem("token");
        
      console.log("Uploading audio to:", "http://localhost:3001/api/recording/upload");
      console.log("Audio file:", audioFile);
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
      loudnessFormData.append('file', audioFile, 'recording.wav');
      const loudnessRes = await axios.post('http://localhost:8000/loudness/predict-loudness', loudnessFormData);
      setLoudnessResult(loudnessRes.data);

      // Analyze pace - like PaceManagement.jsx
      const paceFormData = new FormData();
      paceFormData.append("file", audioFile, "speech.wav");

      // Call rate analysis endpoint
      const rateResponse = await fetch("http://localhost:8000/rate-analysis/", {
        method: "POST",
        body: paceFormData,
      });

      const rateData = await rateResponse.json();
      console.log("Rate analysis response:", rateData);

      // Get backend label and frontend calculated label
      const backendLabel = rateData.modelPrediction || rateData.prediction;
      const frontendCalculatedLabel = getWpmLabel(rateData.wpm || 0);

      // Validate backend prediction
      const isValidBackendPrediction = (label, wpm) => {
        if (!label || !wpm) return false;
        if (label === "Slow" && wpm >= 100) return false;
        if (label === "Ideal" && (wpm < 100 || wpm > 150)) return false;
        if (label === "Fast" && wpm <= 150) return false;
        return true;
      };

      // Use backend prediction if valid, otherwise use frontend
      const finalLabel = (backendLabel && isValidBackendPrediction(backendLabel, rateData.wpm)) 
        ? backendLabel 
        : frontendCalculatedLabel;

      setPaceResult({
        wpm: rateData.wpm || 0,
        prediction: finalLabel,
        consistencyScore: rateData.consistencyScore || 0,
        wordCount: rateData.wordCount || 0,
        duration: rateData.duration || 0
      });

      console.log("Pace result:", {
        wpm: rateData.wpm,
        prediction: finalLabel,
        consistencyScore: rateData.consistencyScore
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
      // For pace, score can be the prediction label or consistency score
      if (typeof score === 'string') {
        return score === 'Ideal' ? 'text-green-400' : 'text-yellow-400';
      }
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
    if (type === 'engagement') {
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
      // For pace, score can be the prediction label or consistency score
      if (typeof score === 'string') {
        // If score is a label (Slow/Ideal/Fast)
        return score === 'Ideal' ? '✓' : '⚠';
      }
      // If score is consistency percentage
      if (score >= 80) return '✓';
      if (score >= 60) return '⚠';
      return '✗';
    }
    if (type === 'engagement') {
      // Engagement percentage
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
                {/* Info Badge */}
                {isRecording && !isAnalyzing && (
                  <div className="text-center">
                    <span className="text-xs text-green-300 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/50">
                      💡 Click Stop to auto-analyze
                    </span>
                </div>
              )}
                
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
                    disabled={!isRecording || isAnalyzing}
                    className="p-3 bg-red-600 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-all transform hover:scale-105"
                    title={isAnalyzing ? "Analyzing..." : "Stop Recording & Analyze"}
                  >
                    {isAnalyzing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FaClock className="text-black text-xl" />
                      </motion.div>
                    ) : (
                  <FaStop className="text-black text-xl" />
                    )}
                </button>
              </div>

                {/* Status Display */}
                <div className="text-center">
                  <p className="text-white/90 text-sm">
                    {isAnalyzing 
                      ? '⏳ Analyzing Speech...' 
                      : isRecording 
                      ? (isPaused ? '⏸️ Recording Paused' : '🎥 Recording in Progress') 
                      : (audioBlob ? '✅ Analysis Complete' : '⚪ Ready to Record')}
                </p>
              </div>

                {/* Camera Error */}
                {cameraError && (
                  <div className="p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaExclamationTriangle className="text-red-300 text-xl flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-300 text-sm font-semibold mb-2">{cameraError}</p>
                        <div className="text-red-200 text-xs space-y-1">
                          <p>✓ Click the camera/lock icon in your browser's address bar</p>
                          <p>✓ Select "Allow" for camera and microphone</p>
                          <p>✓ Refresh the page and try again</p>
                          <p>✓ Make sure no other app is using your camera/mic</p>
                        </div>
                      </div>
                    </div>
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

              {/* Analysis Status */}
              {isAnalyzing && (
                <div className="w-full mt-3 bg-blue-500/20 border border-blue-400/50 rounded-lg p-3 flex items-center justify-center gap-2 text-sm">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.div>
                  <span className="text-blue-200">Analyzing speech components...</span>
                </div>
              )}
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
                  liveLoudness === 'Acceptable' ? 'bg-green-500/50 border-2 border-green-400' : 'bg-green-500/10 border border-green-400/30'
                }`}>
                  <div className="text-xs text-white/80">Optimal</div>
                  <div className="text-lg">✓</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  liveLoudness === 'Low / Silent' ? 'bg-red-500/50 border-2 border-red-400' : 'bg-red-500/10 border border-red-400/30'
                }`}>
                  <div className="text-xs text-white/80">Too Quiet</div>
                  <div className="text-lg">↓</div>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  liveLoudness === 'Too Loud' ? 'bg-yellow-500/50 border-2 border-yellow-400' : 'bg-yellow-500/10 border border-yellow-400/30'
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

            {/* Real-time Voice Quality Section */}
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-4 shadow-xl flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#00ccff] text-base font-semibold flex items-center gap-2">
                  {isAnalyzingVoice ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FaCheckCircle className="text-[#00ccff]" />
                    </motion.div>
                  ) : (
                    <FaCheckCircle className="text-[#00ccff]" />
                  )}
                  Real-time Voice Quality
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isRecording && !isPaused ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  {isAnalyzingVoice && <span className="text-xs text-blue-300">Analyzing...</span>}
                </div>
              </div>

              {/* Voice Quality Metrics - Compact Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Voice Stability */}
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/70 mb-1">Stability</div>
                  <div className={`text-2xl font-bold ${
                    realtimeVoiceMetrics.jitter_local < 0.02 ? 'text-green-300' :
                    realtimeVoiceMetrics.jitter_local < 0.05 ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {realtimeVoiceMetrics.jitter_local < 0.02 ? '✓' :
                     realtimeVoiceMetrics.jitter_local < 0.05 ? '⚠' : '✗'}
                  </div>
                  <div className="text-xs text-white/50">{(realtimeVoiceMetrics.jitter_local * 100).toFixed(1)}</div>
                </div>

                {/* Voice Clarity */}
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/70 mb-1">Clarity</div>
                  <div className={`text-2xl font-bold ${
                    realtimeVoiceMetrics.shimmer_local < 0.1 ? 'text-green-300' :
                    realtimeVoiceMetrics.shimmer_local < 0.2 ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {realtimeVoiceMetrics.shimmer_local < 0.1 ? '✓' :
                     realtimeVoiceMetrics.shimmer_local < 0.2 ? '⚠' : '✗'}
                  </div>
                  <div className="text-xs text-white/50">{(realtimeVoiceMetrics.shimmer_local * 100).toFixed(1)}</div>
                </div>

                {/* Voice Quality (HNR) */}
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/70 mb-1">Quality</div>
                  <div className={`text-2xl font-bold ${
                    realtimeVoiceMetrics.hnr_mean > 20 ? 'text-green-300' :
                    realtimeVoiceMetrics.hnr_mean > 10 ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {realtimeVoiceMetrics.hnr_mean > 20 ? '✓' :
                     realtimeVoiceMetrics.hnr_mean > 10 ? '⚠' : '✗'}
                  </div>
                  <div className="text-xs text-white/50">{realtimeVoiceMetrics.hnr_mean.toFixed(1)}dB</div>
                </div>
              </div>

              {/* Rhythm & Flow Progress Bars */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80 w-20">Rhythm</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#0b4952] overflow-hidden border border-white/10">
                    <motion.div
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      key={`rhythm-${realtimeVoiceMetrics.rhythm_consistency}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max((realtimeVoiceMetrics.rhythm_consistency * 100), 2), 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-white font-semibold w-12 text-right">{(realtimeVoiceMetrics.rhythm_consistency * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80 w-20">Flow</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#0b4952] overflow-hidden border border-white/10">
                    <motion.div
                      className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                      key={`flow-${realtimeVoiceMetrics.speech_continuity}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max((realtimeVoiceMetrics.speech_continuity * 100), 2), 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-white font-semibold w-12 text-right">{(realtimeVoiceMetrics.speech_continuity * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80 w-20">Efficiency</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#0b4952] overflow-hidden border border-white/10">
                    <motion.div
                      className="h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                      key={`efficiency-${realtimeVoiceMetrics.speaking_efficiency}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max((realtimeVoiceMetrics.speaking_efficiency * 100), 2), 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-white font-semibold w-12 text-right">{(realtimeVoiceMetrics.speaking_efficiency * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Status Message */}
              <div className="mt-3 text-center">
                <p className="text-xs text-white/60">
                  {isAnalyzingVoice 
                    ? '⏳ Analyzing voice data (5s)...' 
                    : isRecording && !isPaused 
                    ? '🔄 Next analysis in 5.5s...' 
                    : 'Start recording to monitor voice quality'}
                </p>
                {isRecording && !isPaused && (
                  <p className="text-xs text-blue-300 mt-1">
                    Updates every 5.5 seconds • Check console for details
                  </p>
                )}
              </div>

              {/* Debug Panel - Remove after testing */}
              {(isRecording || realtimeVoiceMetrics.jitter_local > 0) && (
                <div className="mt-3 p-2 bg-black/40 rounded-lg border border-cyan-400/30">
                  <div className="text-xs text-cyan-300 font-semibold mb-1">🔍 Debug Values:</div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-white/70">
                    <div>Jitter: {realtimeVoiceMetrics.jitter_local.toFixed(4)}</div>
                    <div>Shimmer: {realtimeVoiceMetrics.shimmer_local.toFixed(4)}</div>
                    <div>HNR: {realtimeVoiceMetrics.hnr_mean.toFixed(2)}</div>
                    <div>Rhythm: {(realtimeVoiceMetrics.rhythm_consistency * 100).toFixed(1)}%</div>
                    <div>Flow: {(realtimeVoiceMetrics.speech_continuity * 100).toFixed(1)}%</div>
                    <div>Efficiency: {(realtimeVoiceMetrics.speaking_efficiency * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - All Components Display */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 shadow-xl">
              
              <div id="speech-insights-report">

                {/* Overall Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
                    <div className={`text-3xl font-bold mb-2 ${
                      paceResult ? getScoreColor(paceResult.prediction || getWpmLabel(paceResult.wpm), 'pace') : 'text-purple-300'
                    }`}>
                      {paceResult ? getScoreIcon(paceResult.prediction || getWpmLabel(paceResult.wpm), 'pace') : '?'}
                    </div>
                    <div className="text-white font-semibold">Pace</div>
                    <div className="text-white/70 text-sm">
                      {paceResult ? `${paceResult.prediction || getWpmLabel(paceResult.wpm)} - ${paceResult.wpm.toFixed(0)} WPM` : 'Not Analyzed'}
                    </div>
                  </div>

                  {/* Face Analysis - Combined Engagement & Top Emotion */}
                  <div className="bg-gradient-to-br from-pink-500/30 to-rose-500/30 rounded-xl p-4 border-2 border-pink-400/60 text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      (visibleSeconds > 0 || awaySeconds > 0)
                        ? getScoreColor(Math.round((visibleSeconds / (visibleSeconds + awaySeconds || 1)) * 100), 'engagement')
                        : emotionSummary[0]?.[0]
                        ? 'text-green-400'
                        : 'text-pink-300'
                    }`}>
                      {(visibleSeconds > 0 || awaySeconds > 0) 
                        ? getScoreIcon(Math.round((visibleSeconds / (visibleSeconds + awaySeconds || 1)) * 100), 'engagement')
                        : emotionSummary[0]?.[0] 
                        ? '✓' 
                        : '?'}
                    </div>
                    <div className="text-white font-semibold">Face Analysis</div>
                    <div className="text-white/70 text-sm">
                      {emotionSummary[0] 
                        ? `${emotionSummary[0][0]} ${emotionSummary[0][1]}%` 
                        : visibleSeconds > 0 || awaySeconds > 0
                        ? `${Math.round((visibleSeconds / (visibleSeconds + awaySeconds || 1)) * 100)}% Engaged`
                        : 'Not Detected'}
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

                  {/* Pace Management Component - Enhanced with Gauge */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-purple-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaMicrophone className="text-purple-400" />
                      Pace Management
                    </h3>
                    {paceResult ? (
                      <div className="space-y-4">
                        {/* Gauge and Rate Label in One Line */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* WPM Gauge */}
                          <div className="bg-black/30 rounded-xl p-3">
                            <h4 className="text-white text-xs font-semibold mb-1 text-center">Rate Meter</h4>
                            <GaugeChart
                              id="wpm-gauge-speech-insights"
                              nrOfLevels={30}
                              colors={["#ff0000", "#ff9900", "#00cc00"]}
                              arcWidth={0.3}
                              percent={Math.min(Math.max(paceResult.wpm, 0) / 200, 1)}
                              textColor="#fff"
                              needleColor="#fff"
                              needleBaseColor="#fff"
                              animate={false}
                              style={{
                                width: "100%",
                                height: "100px"
                              }}
                            />
                            <div className="text-center text-xs text-white/70">
                              {paceResult.wpm.toFixed(0)} WPM
                            </div>
                          </div>

                          {/* Rate Label Display */}
                          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 rounded-xl p-3 flex flex-col justify-center items-center">
                            <div className="text-xs text-white/70 mb-1">Category</div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-2xl">{getWpmEmoji(paceResult.prediction || getWpmLabel(paceResult.wpm))}</span>
                              <span className={`text-2xl font-bold ${
                                (paceResult.prediction || getWpmLabel(paceResult.wpm)) === 'Ideal' ? 'text-green-300' :
                                (paceResult.prediction || getWpmLabel(paceResult.wpm)) === 'Slow' ? 'text-yellow-300' :
                                'text-orange-300'
                              }`}>
                                {paceResult.prediction || getWpmLabel(paceResult.wpm)}
                          </span>
                        </div>
                            <div className="text-xs text-white/70">
                              {paceResult.wordCount > 0 && `${paceResult.wordCount} words`}
                            </div>
                            <div className="text-xs text-white/60">
                              {paceResult.duration > 0 && `${paceResult.duration.toFixed(1)}s`}
                            </div>
                          </div>
                        </div>

                        {/* Consistency Score */}
                        <div className="bg-black/30 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white/80 text-sm">Consistency:</span>
                          <span className={`font-semibold ${getScoreColor(paceResult.consistencyScore, 'pace')}`}>
                            {paceResult.consistencyScore.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                            <motion.div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              paceResult.consistencyScore >= 80 ? 'bg-green-400' : 
                              paceResult.consistencyScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(paceResult.consistencyScore, 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            ></motion.div>
                        </div>
                        </div>

                        {/* Guidelines */}
                        <div className="flex gap-2">
                          <div className={`flex-1 rounded-lg p-2 text-center ${
                            getWpmLabel(paceResult.wpm) === 'Slow' 
                              ? 'bg-yellow-500/30 border-2 border-yellow-400' 
                              : 'bg-yellow-500/10 border border-yellow-400/30'
                          }`}>
                            <div className="text-lg">🟡</div>
                            <div className="text-yellow-300 font-bold text-xs">Slow</div>
                            <div className="text-white/70 text-xs">&lt;100</div>
                          </div>
                          <div className={`flex-1 rounded-lg p-2 text-center ${
                            getWpmLabel(paceResult.wpm) === 'Ideal' 
                              ? 'bg-green-500/30 border-2 border-green-400' 
                              : 'bg-green-500/10 border border-green-400/30'
                          }`}>
                            <div className="text-lg">🟢</div>
                            <div className="text-green-300 font-bold text-xs">Ideal</div>
                            <div className="text-white/70 text-xs">100-150</div>
                          </div>
                          <div className={`flex-1 rounded-lg p-2 text-center ${
                            getWpmLabel(paceResult.wpm) === 'Fast' 
                              ? 'bg-orange-500/30 border-2 border-orange-400' 
                              : 'bg-orange-500/10 border border-orange-400/30'
                          }`}>
                            <div className="text-lg">🟠</div>
                            <div className="text-orange-300 font-bold text-xs">Fast</div>
                            <div className="text-white/70 text-xs">&gt;150</div>
                          </div>
                        </div>

                        {/* Feedback */}
                        <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                          <p className="text-xs text-blue-200">
                            💡 {getWpmFeedback(paceResult.wpm, paceResult.prediction || getWpmLabel(paceResult.wpm))}
                          </p>
                        </div>
                        
                        {/* Additional Info */}
                        {paceResult.wordCount > 0 && paceResult.duration > 0 && (
                          <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-white/60">Words</div>
                                <div className="text-white font-semibold">{paceResult.wordCount}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white/60">Duration</div>
                                <div className="text-white font-semibold">{paceResult.duration.toFixed(1)}s</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <FaMicrophone className="text-white text-2xl" />
                        </motion.div>
                        <p className="text-white/60 text-sm">No pace analysis yet</p>
                        <p className="text-white/40 text-xs mt-1">Record and analyze to see results</p>
                      </div>
                    )}
                  </div>

                  {/* Emotion & Engagement Analysis Component */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-pink-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaSmile className="text-pink-400" />
                      Emotion & Engagement Analysis
                    </h3>
                    
                    {(visibleSeconds > 0 || awaySeconds > 0 || emotionSummary.length > 0) ? (
                      <div className="space-y-4">
                        {/* Engagement Metrics */}
                        {(visibleSeconds > 0 || awaySeconds > 0) && (
                          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50 rounded-xl p-4 text-center">
                            <div className="text-sm text-white/70 mb-1">Engagement Score</div>
                            <div className="text-4xl font-bold text-emerald-300 mb-1">
                              {Math.round((visibleSeconds / (visibleSeconds + awaySeconds || 1)) * 100)}%
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div>
                                <div className="text-xs text-white/60">Visible</div>
                                <div className="text-lg font-semibold text-green-300">{visibleSeconds}s</div>
                              </div>
                              <div>
                                <div className="text-xs text-white/60">Away</div>
                                <div className="text-lg font-semibold text-red-300">{awaySeconds}s</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Top 3 Emotions */}
                        {emotionSummary.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white/90">Top 3 Emotions</h4>
                            {emotionSummary.map(([emotion, percentage], index) => (
                              <div key={emotion} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  index === 0 ? 'bg-yellow-500 text-black' :
                                  index === 1 ? 'bg-gray-400 text-black' :
                                  'bg-orange-600 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="flex-1 text-white text-sm">{emotion}</span>
                                <div className="flex-1 h-3 rounded-full bg-[#0b4952] overflow-hidden">
                                  <motion.div
                                    className="h-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                  />
                                </div>
                                <span className="w-12 text-right text-sm text-white font-semibold">{percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tips */}
                        <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                          <p className="text-xs text-blue-200">
                            💡 {visibleSeconds > 0 && awaySeconds > 0 
                              ? (visibleSeconds / (visibleSeconds + awaySeconds) >= 0.8 
                                ? 'Excellent eye contact! Keep maintaining face visibility.' 
                                : 'Try to keep your face visible to the camera for better engagement.')
                              : emotionSummary.length > 0
                              ? `Your dominant emotion was ${emotionSummary[0][0]}. Ensure it aligns with your message.`
                              : 'Face tracking provides engagement metrics during recording.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <FaSmile className="text-white text-2xl" />
                        </motion.div>
                        <p className="text-white/60 text-sm">No emotion analysis yet</p>
                        <p className="text-white/40 text-xs mt-1">Record with camera to track emotions and engagement</p>
                      </div>
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

                {/* Analyzing State */}
                {isAnalyzing && !loudnessResult && !fillerResult && !paceResult && (
                  <div className="text-center py-12">
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-2">Analyzing Your Speech</h3>
                    <p className="text-white/70">
                      Please wait while we analyze loudness, filler words, and pace...
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
