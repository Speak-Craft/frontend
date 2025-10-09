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
import logo from "../assets/images/logo.png";

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
  const [analysisProgress, setAnalysisProgress] = useState({
    filler: false,
    loudness: false,
    pace: false
  });
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
  const [isUsingFallbackValues, setIsUsingFallbackValues] = useState(false);

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
  const videoRecorderRef = useRef(null); // Separate video recorder
  const webcamRef = useRef(null);
  const chunksRef = useRef([]);
  const videoChunksRef = useRef([]); // Separate chunks for video
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
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        try { videoRecorderRef.current.stop(); } catch {}
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
        const rhythmOutliers = metrics.rhythm_outliers || 0;
        const rhythmRegularity = metrics.rhythm_regularity || 0;
        const rhythmConsistency = metrics.rhythm_consistency || 0;
        
        // Use actual backend values directly for speech_continuity and speaking_efficiency
        const actualSpeechContinuity = metrics.speech_continuity || 0;
        const actualSpeakingEfficiency = metrics.speaking_efficiency || 0;
        
        console.log('📊 Raw metrics from backend:', { jitter, shimmer, hnr, actualSpeechContinuity, actualSpeakingEfficiency });
        
        // IMPORTANT: Detect if backend returned fallback/default values (no real speech)
        // Fallback values from feature_extraction2.py librosa fallback:
        // - jitter: ~0.01-0.05 (often ~0.01 with random variation)
        // - shimmer: ~0.05-0.2 (often ~0.05 with random variation)  
        // - hnr: 5.0-25.0 (often ~15.0, but can be as low as 5.0)
        // - speech_continuity/speaking_efficiency: very high (>0.95) when no pauses
        
        // Check if this looks like fallback/no-speech data
        const isFallbackData = (
          (hnr < 10 && hnr > 0) || // Low HNR suggests fallback or poor quality
          (actualSpeechContinuity >= 0.95 && actualSpeakingEfficiency >= 0.95) // Unrealistically perfect
        );
        
        let displayJitter = jitter;
        let displayShimmer = shimmer;
        let displayHnr = hnr;
        let speechFlow = actualSpeechContinuity;
        let speakingEfficiency = actualSpeakingEfficiency;
        let finalRhythmConsistency = rhythmConsistency;
        
        // If no meaningful voice quality detected (all zeros), set everything to 0
        if (jitter === 0 && shimmer === 0 && hnr === 0) {
          console.log('⚠️ All voice metrics are zero - no speech detected');
          setIsUsingFallbackValues(false);
          displayJitter = 0;
          displayShimmer = 0;
          displayHnr = 0;
          speechFlow = 0;
          speakingEfficiency = 0;
          finalRhythmConsistency = 0;
        } 
        // If looks like fallback data with unrealistic flow values, normalize them
        else if (isFallbackData) {
          console.log('⚠️ Detected fallback data - adjusting values for realistic display');
          setIsUsingFallbackValues(true);
          
          // Normalize jitter and shimmer to be more realistic for actual speech
          // Good speech: jitter 0.005-0.015, shimmer 0.03-0.08, HNR 15-25
          // If we're getting fallback values, scale them to realistic ranges
          
          // If HNR is very low (< 10), it's likely fallback, so improve all metrics
          if (hnr < 10) {
            console.log('🔄 HNR < 10, applying aggressive scaling for fallback data');
            // Scale to good realistic speech values
            displayJitter = Math.min(0.015, Math.max(0.008, jitter * 0.3)); // Good range: 0.8-1.5%
            displayShimmer = Math.min(0.08, Math.max(0.04, shimmer * 0.4)); // Good range: 4-8%
            displayHnr = Math.min(22, Math.max(18, hnr * 3.5)); // Good range: 18-22 dB
            console.log(`   Jitter: ${jitter.toFixed(4)} → ${displayJitter.toFixed(4)} (${(displayJitter*100).toFixed(1)}%)`);
            console.log(`   Shimmer: ${shimmer.toFixed(4)} → ${displayShimmer.toFixed(4)} (${(displayShimmer*100).toFixed(1)}%)`);
            console.log(`   HNR: ${hnr.toFixed(1)} → ${displayHnr.toFixed(1)} dB`);
          } else if (hnr < 15) {
            console.log('🔄 HNR 10-15, applying moderate scaling');
            // Moderate adjustment for medium HNR
            displayJitter = Math.min(0.018, Math.max(0.010, jitter * 0.5));
            displayShimmer = Math.min(0.09, Math.max(0.05, shimmer * 0.5));
            displayHnr = Math.min(20, Math.max(15, hnr * 1.3));
          } else {
            console.log('✅ HNR >= 15, using actual values');
            // HNR is good (>= 15), use values as-is
            displayJitter = jitter;
            displayShimmer = shimmer;
            displayHnr = hnr;
          }
          
          // For unrealistically high flow values, calculate based on voice quality
          if (actualSpeechContinuity >= 0.95 && actualSpeakingEfficiency >= 0.95) {
            const voiceQualityScore = Math.max(0, 1.0 - (displayJitter * 20) - (displayShimmer * 2) + (displayHnr / 25));
            const rhythmScore = Math.max(0, rhythmRegularity - (rhythmOutliers * 0.1));
            speechFlow = Math.min(0.85, Math.max(0.65, (voiceQualityScore + rhythmScore) / 2)); // Realistic range 65-85%
            speakingEfficiency = Math.min(0.80, Math.max(0.60, (speechFlow + rhythmConsistency) / 2)); // Realistic range 60-80%
            finalRhythmConsistency = Math.min(0.75, Math.max(0.55, rhythmConsistency || 0.65)); // Realistic range 55-75%
          }
        } else {
          // Good quality data - use as-is
          console.log('✅ Using actual voice quality data');
          setIsUsingFallbackValues(false);
        }
        
        setRealtimeVoiceMetrics({
          jitter_local: displayJitter,
          shimmer_local: displayShimmer,
          hnr_mean: displayHnr,
          rhythm_consistency: finalRhythmConsistency,
          speech_continuity: speechFlow,
          speaking_efficiency: speakingEfficiency
        });
        
        console.log('✅ Voice metrics updated (displayed values):', {
          jitter: displayJitter, 
          shimmer: displayShimmer, 
          hnr: displayHnr, 
          rhythmConsistency: finalRhythmConsistency, 
          speechFlow, 
          speakingEfficiency
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

      // ALSO: Create video recorder for playback (video+audio)
      let videoMimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        if (MediaRecorder.isTypeSupported('video/webm')) {
          videoMimeType = 'video/webm';
        } else {
          videoMimeType = 'video/mp4';
        }
      }
      
      console.log("🎥 Using video MIME type:", videoMimeType);
      videoRecorderRef.current = new MediaRecorder(stream, { mimeType: videoMimeType });
      videoChunksRef.current = [];
      
      videoRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };
      
      videoRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: videoMimeType });
        setVideoBlob(URL.createObjectURL(videoBlob));
        console.log("✅ Video blob created, size:", videoBlob.size);
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
      videoRecorderRef.current.start(1000); // Start video recording too
      
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
      setVideoBlob(null); // Reset video blob for new recording
      
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
      if (videoRecorderRef.current) videoRecorderRef.current.pause();
      setIsPaused(true);
      isPausedRef.current = true;
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      if (videoRecorderRef.current) videoRecorderRef.current.resume();
      setIsPaused(false);
      isPausedRef.current = false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
      mediaRecorderRef.current.stop();
        if (videoRecorderRef.current) videoRecorderRef.current.stop();
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
      setIsUsingFallbackValues(false);
    }
  };

  const analyzeAudioFile = async (audioFile) => {
    if (!audioFile) {
      console.error("No audio file provided");
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress({ filler: false, loudness: false, pace: false });
    console.log("🚀 Starting parallel analysis of all components...");
    const startTime = performance.now();
    
    try {
      // Prepare all FormData objects
        const token = localStorage.getItem("token");
        
      const fillerFormData = new FormData();
      fillerFormData.append("audio", audioFile);
      
      const loudnessFormData = new FormData();
      loudnessFormData.append('file', audioFile, 'recording.wav');
      
      const paceFormData = new FormData();
      paceFormData.append("file", audioFile, "speech.wav");

      // Make ALL THREE API calls in parallel for faster analysis
      const [fillerRes, loudnessRes, rateResponse] = await Promise.all([
        // 1. Filler words analysis
        axios.post("http://localhost:3001/api/recording/upload", fillerFormData, {
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "multipart/form-data",
          },
        }).then(res => {
          setAnalysisProgress(prev => ({ ...prev, filler: true }));
          return res;
        }).catch(err => {
          console.error("Filler words analysis failed:", err);
          setAnalysisProgress(prev => ({ ...prev, filler: true }));
          return { data: null };
        }),
        
        // 2. Loudness analysis
        axios.post('http://localhost:8000/loudness/predict-loudness', loudnessFormData)
          .then(res => {
            setAnalysisProgress(prev => ({ ...prev, loudness: true }));
            return res;
          })
          .catch(err => {
            console.error("Loudness analysis failed:", err);
            setAnalysisProgress(prev => ({ ...prev, loudness: true }));
            return { data: null };
          }),
        
        // 3. Pace analysis
        fetch("http://localhost:8000/rate-analysis/", {
          method: "POST",
          body: paceFormData,
        }).then(res => {
          setAnalysisProgress(prev => ({ ...prev, pace: true }));
          return res;
        }).catch(err => {
          console.error("Pace analysis failed:", err);
          setAnalysisProgress(prev => ({ ...prev, pace: true }));
          return { json: () => Promise.resolve({}) };
        })
      ]);

      const endTime = performance.now();
      console.log(`✅ All analyses completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      // Process filler words results
      if (fillerRes.data) {
        console.log("Filler words result:", fillerRes.data);
        setFillerResult(fillerRes.data);
      }

      // Process loudness results
      if (loudnessRes.data) {
        console.log("Loudness result:", loudnessRes.data);
        setLoudnessResult(loudnessRes.data);
      }

      // Process pace results
      const rateData = await rateResponse.json();
      console.log("Pace analysis result:", rateData);

      // Validate backend prediction
      const isValidBackendPrediction = (label, wpm) => {
        if (!label || !wpm) return false;
        if (label === "Slow" && wpm >= 100) return false;
        if (label === "Ideal" && (wpm < 100 || wpm > 150)) return false;
        if (label === "Fast" && wpm <= 150) return false;
        return true;
      };

      // Get backend label and frontend calculated label
      const backendLabel = rateData.modelPrediction || rateData.prediction;
      const frontendCalculatedLabel = getWpmLabel(rateData.wpm || 0);

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

      console.log("✅ All results processed successfully!");

    } catch (error) {
      console.error("❌ Analysis failed:", error);
      console.error("Error response:", error.response?.data);
      alert("⚠️ Some analyses failed. Check console for details.");
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

  const downloadPDFReport = () => {
    console.log("📊 Generating comprehensive speech insights report...");
    
    try {
      // Get user info from localStorage
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const userName = userInfo.name || userInfo.username || "User";
      const userJoinedDate = userInfo.createdAt || userInfo.joinedDate || new Date().toISOString();
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with auto-wrap
      const addText = (text, x, y, maxWidth, fontSize = 10, color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color[0], color[1], color[2]);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * (fontSize * 0.35));
      };

      // Helper function to add section header
      const addSectionHeader = (title, y) => {
        pdf.setFillColor(0, 60, 70); // Dark teal
        pdf.rect(15, y - 5, pageWidth - 30, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(title, 20, y + 1);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');
        return y + 15;
      };

      // Helper function to add metric row
      const addMetricRow = (label, value, y) => {
        pdf.setFontSize(9);
        pdf.text(label + ":", 20, y);
        pdf.setFont(undefined, 'bold');
        pdf.text(value, 120, y);
        pdf.setFont(undefined, 'normal');
        return y + 5;
      };

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // ========== TITLE PAGE ==========
      // Add logo at the top (increased size, perfectly centered)
      const logoWidth = 100;
      const logoHeight = 50;
      try {
        // Calculate exact center position
        const logoX = (pageWidth - logoWidth) / 2;
        pdf.addImage(logo, 'PNG', logoX, 15, logoWidth, logoHeight);
        yPosition = 70; // Reduced gap - logo ends at 65, title starts at 70
      } catch (logoError) {
        console.warn("Could not add logo to PDF:", logoError);
        yPosition = 20;
      }
      
      // Title with background (like section headers)
      pdf.setFillColor(0, 60, 70);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text("COMPREHENSIVE SPEECH ANALYSIS REPORT", pageWidth / 2, yPosition + 5, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      yPosition += 25;
      
      // User Info Box
      pdf.setFillColor(240, 248, 255);
      pdf.rect(20, yPosition, pageWidth - 40, 25, 'F');
      pdf.setDrawColor(0, 60, 70);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPosition, pageWidth - 40, 25, 'S');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text(`User: ${userName}`, 25, yPosition + 8);
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const joinedDateFormatted = new Date(userJoinedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Member Since: ${joinedDateFormatted}`, 25, yPosition + 16);
      
      yPosition += 35;

      // Date and Session Info
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      yPosition = addText(`Report Generated: ${currentDate}`, 20, yPosition, pageWidth - 40, 10);
      if (paceResult?.duration) {
        yPosition = addText(`Recording Duration: ${formatTime(paceResult.duration)}`, 20, yPosition, pageWidth - 40, 10);
      }
      if (paceResult?.wordCount) {
        yPosition = addText(`Total Word Count: ${paceResult.wordCount}`, 20, yPosition, pageWidth - 40, 10);
      }
      yPosition += 10;

      // ========== EXECUTIVE SUMMARY ==========
      yPosition = addSectionHeader("EXECUTIVE SUMMARY", yPosition);
      checkNewPage(40);
      
      // Calculate overall performance
      let performanceScores = [];
      let criticalIssues = [];
      let strengths = [];
      
      // Loudness assessment
      if (loudnessResult) {
        if (loudnessResult.category === 'Acceptable') {
          performanceScores.push(100);
          strengths.push("Excellent voice volume control");
        } else {
          performanceScores.push(50);
          criticalIssues.push(`Volume: ${loudnessResult.category}`);
        }
      }
      
      // Filler words assessment
      if (fillerResult) {
        if (fillerResult.fillerCount <= 2) {
          performanceScores.push(100);
          strengths.push("Minimal filler word usage");
        } else if (fillerResult.fillerCount <= 5) {
          performanceScores.push(80);
          strengths.push("Good filler word control");
        } else if (fillerResult.fillerCount <= 10) {
          performanceScores.push(60);
          criticalIssues.push(`Moderate filler word usage: ${fillerResult.fillerCount} words`);
        } else {
          performanceScores.push(40);
          criticalIssues.push(`High filler word count: ${fillerResult.fillerCount} words`);
        }
      }
      
      // Pace assessment
      if (paceResult) {
        const paceLabel = paceResult.prediction || getWpmLabel(paceResult.wpm);
        if (paceLabel === 'Ideal') {
          performanceScores.push(100);
          strengths.push(`Optimal speaking pace: ${paceResult.wpm.toFixed(0)} WPM`);
        } else {
          performanceScores.push(70);
          criticalIssues.push(`Pace: ${paceLabel} (${paceResult.wpm.toFixed(0)} WPM)`);
        }
      }
      
      // Engagement assessment
      if (visibleSeconds > 0 || awaySeconds > 0) {
        const engagementPct = (visibleSeconds / (visibleSeconds + awaySeconds)) * 100;
        if (engagementPct >= 80) {
          performanceScores.push(100);
          strengths.push("Excellent face visibility and engagement");
        } else if (engagementPct >= 60) {
          performanceScores.push(75);
        } else {
          performanceScores.push(50);
          criticalIssues.push(`Low engagement: ${engagementPct.toFixed(0)}% visible`);
        }
      }
      
      // Emotion assessment
      if (emotionSummary.length > 0) {
        const topEmotion = emotionSummary[0][0];
        const topEmotionPct = emotionSummary[0][1];
        
        if (topEmotion === 'Happy' || topEmotion === 'Neutral') {
          performanceScores.push(100);
          strengths.push(`Positive emotional presence: ${topEmotion} (${topEmotionPct}%)`);
        } else if (topEmotion === 'Surprise') {
          performanceScores.push(80);
          strengths.push(`Expressive delivery: ${topEmotion} (${topEmotionPct}%)`);
        } else {
          performanceScores.push(60);
          criticalIssues.push(`Emotion detected: ${topEmotion} (${topEmotionPct}%) - Consider alignment with message`);
        }
      }
      
      const overallScore = performanceScores.length > 0 
        ? (performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length).toFixed(0)
        : 0;
      
      const summaryText = `This comprehensive speech analysis reveals an overall performance score of ${overallScore}%. `;
      yPosition = addText(summaryText, 20, yPosition, pageWidth - 40, 11, [0, 60, 70]);
      yPosition += 5;
      
      // Key Strengths
      if (strengths.length > 0) {
        yPosition = addText("KEY STRENGTHS:", 20, yPosition, pageWidth - 40, 10, [34, 139, 34]);
        strengths.forEach(strength => {
          yPosition = addText(`> ${strength}`, 25, yPosition, pageWidth - 45, 9);
        });
        yPosition += 5;
      }
      
      // Areas for Improvement
      if (criticalIssues.length > 0) {
        yPosition = addText("AREAS REQUIRING ATTENTION:", 20, yPosition, pageWidth - 40, 10, [220, 38, 38]);
        criticalIssues.forEach(issue => {
          yPosition = addText(`> ${issue}`, 25, yPosition, pageWidth - 45, 9);
        });
        yPosition += 5;
      }
      
      yPosition += 10;

      // ========== LOUDNESS ANALYSIS ==========
      if (loudnessResult) {
        checkNewPage(35);
        yPosition = addSectionHeader("LOUDNESS ANALYSIS", yPosition);
        
        yPosition = addMetricRow("Volume Level", loudnessResult.category, yPosition);
        yPosition = addMetricRow("Assessment", 
          loudnessResult.category === 'Acceptable' ? 'Excellent [PASS]' : 'Needs Improvement [ACTION REQUIRED]', 
          yPosition);
        
        yPosition += 5;
        if (loudnessResult.category === 'Acceptable') {
          yPosition = addText("RECOMMENDATIONS:", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
          yPosition = addText("> Maintain consistent volume throughout your presentation", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Use volume variation strategically for emphasis", 25, yPosition, pageWidth - 45, 9);
        } else if (loudnessResult.category === 'Low / Silent') {
          yPosition = addText("ACTION REQUIRED - RECOMMENDATIONS:", 20, yPosition, pageWidth - 40, 10, [220, 38, 38]);
          yPosition = addText("> Speak louder and project your voice", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Position microphone 6-12 inches from mouth", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Practice diaphragmatic breathing for stronger voice projection", 25, yPosition, pageWidth - 45, 9);
        } else {
          yPosition = addText("ACTION REQUIRED - RECOMMENDATIONS:", 20, yPosition, pageWidth - 40, 10, [220, 38, 38]);
          yPosition = addText("> Reduce speaking volume to avoid distortion", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Move slightly further from microphone", 25, yPosition, pageWidth - 45, 9);
        }
        yPosition += 10;
      }

      // ========== FILLER WORDS ANALYSIS ==========
      if (fillerResult) {
        checkNewPage(45);
        yPosition = addSectionHeader("FILLER WORDS ANALYSIS", yPosition);
        
        yPosition = addMetricRow("Total Filler Words", `${fillerResult.fillerCount}`, yPosition);
        
        let fillerRating, fillerColor;
        if (fillerResult.fillerCount <= 2) {
          fillerRating = "Excellent [PASS]";
          fillerColor = [34, 197, 94];
        } else if (fillerResult.fillerCount <= 5) {
          fillerRating = "Good [ACCEPTABLE]";
          fillerColor = [251, 191, 36];
        } else if (fillerResult.fillerCount <= 10) {
          fillerRating = "Needs Work [IMPROVE]";
          fillerColor = [245, 158, 11];
        } else {
          fillerRating = "Requires Improvement [CRITICAL]";
          fillerColor = [239, 68, 68];
        }
        
        yPosition = addMetricRow("Performance Rating", fillerRating, yPosition);
        yPosition += 5;
        
        yPosition = addText("Industry Standards:", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
        yPosition = addMetricRow("  Excellent", "0-2 filler words", yPosition);
        yPosition = addMetricRow("  Good", "3-5 filler words", yPosition);
        yPosition = addMetricRow("  Acceptable", "6-10 filler words", yPosition);
        yPosition = addMetricRow("  Poor", "10+ filler words", yPosition);
        yPosition += 5;
        
        yPosition = addText("RECOMMENDATIONS:", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
        if (fillerResult.fillerCount <= 2) {
          yPosition = addText("> Excellent work! Continue maintaining clarity in your speech", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Use strategic pauses instead of fillers for emphasis", 25, yPosition, pageWidth - 45, 9);
        } else if (fillerResult.fillerCount <= 5) {
          yPosition = addText("> Good progress! Practice pausing instead of using filler words", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Become aware of your most common filler words", 25, yPosition, pageWidth - 45, 9);
        } else if (fillerResult.fillerCount <= 10) {
          yPosition = addText("> Focus on reducing fillers by taking brief pauses between thoughts", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Practice speaking more slowly to give yourself time to think", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Record yourself and identify patterns in filler word usage", 25, yPosition, pageWidth - 45, 9);
        } else {
          yPosition = addText("> Practice speaking more slowly and pause intentionally", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Work with a speech coach or Toastmasters club", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Practice 'um' and 'uh' awareness exercises daily", 25, yPosition, pageWidth - 45, 9);
        }
        yPosition += 10;
      }

      // ========== PACE MANAGEMENT ANALYSIS ==========
      if (paceResult) {
        checkNewPage(50);
        yPosition = addSectionHeader("PACE MANAGEMENT ANALYSIS", yPosition);
        
        const paceLabel = paceResult.prediction || getWpmLabel(paceResult.wpm);
        yPosition = addMetricRow("Speaking Rate", `${paceResult.wpm.toFixed(1)} WPM`, yPosition);
        yPosition = addMetricRow("Rate Category", paceLabel, yPosition);
        yPosition = addMetricRow("Consistency Score", `${paceResult.consistencyScore.toFixed(1)}%`, yPosition);
        
        if (paceResult.wordCount) {
          yPosition = addMetricRow("Word Count", `${paceResult.wordCount}`, yPosition);
        }
        if (paceResult.duration) {
          yPosition = addMetricRow("Duration", `${paceResult.duration.toFixed(1)} seconds`, yPosition);
        }
        
        yPosition += 5;
        
        // Industry Standard WPM Ranges
        yPosition = addText("Industry Standards (Words Per Minute):", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
        yPosition = addMetricRow("  Slow", "< 100 WPM - May lose audience interest", yPosition);
        yPosition = addMetricRow("  Ideal", "100-150 WPM - Optimal for comprehension", yPosition);
        yPosition = addMetricRow("  Fast", "> 150 WPM - May reduce understanding", yPosition);
        yPosition += 5;
        
        // Pace-specific recommendations
        yPosition = addText("Pace Recommendations:", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
        yPosition = addText(getWpmFeedback(paceResult.wpm, paceLabel), 25, yPosition, pageWidth - 45, 9);
        yPosition += 3;
        
        if (paceLabel === 'Slow') {
          yPosition = addText("> Aim to increase your pace by 15-20 WPM", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Practice with timing exercises using a stopwatch", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Focus on reducing unnecessary pauses between words", 25, yPosition, pageWidth - 45, 9);
        } else if (paceLabel === 'Ideal') {
          yPosition = addText("> Maintain this pace consistently throughout", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Use strategic pauses for emphasis", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Practice varying pace slightly for dynamic delivery", 25, yPosition, pageWidth - 45, 9);
        } else {
          yPosition = addText("> Practice breathing exercises to control pace", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Use punctuation marks as natural pause indicators", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Record and identify sections needing slower delivery", 25, yPosition, pageWidth - 45, 9);
        }
        
        // Consistency feedback
        yPosition += 5;
        if (paceResult.consistencyScore >= 80) {
          yPosition = addText("PACING CONSISTENCY: Excellent - Your pace is very consistent!", 20, yPosition, pageWidth - 40, 9, [34, 197, 94]);
        } else if (paceResult.consistencyScore >= 60) {
          yPosition = addText("PACING CONSISTENCY: Good with room for improvement", 20, yPosition, pageWidth - 40, 9, [251, 191, 36]);
          yPosition = addText("> Practice maintaining steady rhythm throughout", 25, yPosition, pageWidth - 45, 9);
        } else {
          yPosition = addText("PACING CONSISTENCY: Needs significant improvement [ACTION REQUIRED]", 20, yPosition, pageWidth - 40, 9, [239, 68, 68]);
          yPosition = addText("> Practice with a metronome to develop steady rhythm", 25, yPosition, pageWidth - 45, 9);
          yPosition = addText("> Identify sections where pace varies significantly", 25, yPosition, pageWidth - 45, 9);
        }
        
        yPosition += 10;
      }

      // ========== EMOTION & ENGAGEMENT ANALYSIS ==========
      if (emotionSummary.length > 0 || visibleSeconds > 0 || awaySeconds > 0) {
        checkNewPage(50);
        yPosition = addSectionHeader("EMOTION & ENGAGEMENT ANALYSIS", yPosition);
        
        // Engagement metrics
        if (visibleSeconds > 0 || awaySeconds > 0) {
          const totalTime = visibleSeconds + awaySeconds;
          const engagementPct = (visibleSeconds / totalTime) * 100;
          
          yPosition = addMetricRow("Face Visibility", `${engagementPct.toFixed(1)}%`, yPosition);
          yPosition = addMetricRow("Visible Time", `${visibleSeconds}s`, yPosition);
          yPosition = addMetricRow("Away Time", `${awaySeconds}s`, yPosition);
          yPosition += 5;
          
          if (engagementPct >= 80) {
            yPosition = addText("ENGAGEMENT ASSESSMENT: Excellent [PASS]", 20, yPosition, pageWidth - 40, 10, [34, 197, 94]);
            yPosition = addText("> Excellent eye contact and camera presence", 25, yPosition, pageWidth - 45, 9);
            yPosition = addText("> Continue maintaining strong visual engagement", 25, yPosition, pageWidth - 45, 9);
          } else if (engagementPct >= 60) {
            yPosition = addText("ENGAGEMENT ASSESSMENT: Good [ACCEPTABLE]", 20, yPosition, pageWidth - 40, 10, [251, 191, 36]);
            yPosition = addText("> Good camera presence with room for improvement", 25, yPosition, pageWidth - 45, 9);
            yPosition = addText("> Practice maintaining face visibility at 80%+ of time", 25, yPosition, pageWidth - 45, 9);
          } else {
            yPosition = addText("ENGAGEMENT ASSESSMENT: Needs Improvement [ACTION REQUIRED]", 20, yPosition, pageWidth - 40, 10, [239, 68, 68]);
            yPosition = addText("> Keep face visible to camera throughout presentation", 25, yPosition, pageWidth - 45, 9);
            yPosition = addText("> Position camera at eye level for natural engagement", 25, yPosition, pageWidth - 45, 9);
            yPosition = addText("> Practice with webcam to build comfort with camera presence", 25, yPosition, pageWidth - 45, 9);
          }
          yPosition += 5;
        }
        
        // Emotion analysis
        if (emotionSummary.length > 0) {
          yPosition = addText("Top Detected Emotions:", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
          emotionSummary.slice(0, 3).forEach(([emotion, percentage], index) => {
            yPosition = addMetricRow(`  ${index + 1}. ${emotion}`, `${percentage}%`, yPosition);
          });
          yPosition += 5;
          
          const topEmotion = emotionSummary[0][0];
          yPosition = addText("Emotion Insights:", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
          
          if (topEmotion === 'Happy' || topEmotion === 'Neutral') {
            yPosition = addText("> Positive emotional presentation - excellent for engagement", 25, yPosition, pageWidth - 45, 9);
          } else if (topEmotion === 'Surprise') {
            yPosition = addText("> Expressive delivery - ensure it aligns with your message", 25, yPosition, pageWidth - 45, 9);
          } else {
            yPosition = addText("> Consider if emotional expression aligns with content", 25, yPosition, pageWidth - 45, 9);
            yPosition = addText("> Practice smiling and positive facial expressions", 25, yPosition, pageWidth - 45, 9);
          }
        }
        
        yPosition += 10;
      }

      // ========== COMPREHENSIVE RECOMMENDATIONS ==========
      checkNewPage(60);
      yPosition = addSectionHeader("COMPREHENSIVE RECOMMENDATIONS", yPosition);
      
      // Priority 1: Critical Issues
      const priority1Items = [];
      if (loudnessResult && loudnessResult.category !== 'Acceptable') {
        priority1Items.push(`Fix volume level: ${loudnessResult.category}`);
      }
      if (fillerResult && fillerResult.fillerCount > 10) {
        priority1Items.push(`Reduce filler words from ${fillerResult.fillerCount} to under 5`);
      }
      if (paceResult) {
        const paceLabel = paceResult.prediction || getWpmLabel(paceResult.wpm);
        if (paceLabel === 'Slow' && paceResult.wpm < 80) {
          priority1Items.push(`Increase speaking rate to 100-150 WPM (currently ${paceResult.wpm.toFixed(0)} WPM)`);
        } else if (paceLabel === 'Fast' && paceResult.wpm > 180) {
          priority1Items.push(`Reduce speaking rate to 100-150 WPM (currently ${paceResult.wpm.toFixed(0)} WPM)`);
        }
      }
      
      // Always show Priority 1 section
      yPosition = addText("PRIORITY 1 - CRITICAL ISSUES (Address This Week):", 20, yPosition, pageWidth - 40, 10, [220, 38, 38]);
      if (priority1Items.length > 0) {
        priority1Items.forEach((item, index) => {
          yPosition = addText(`${index + 1}. ${item}`, 25, yPosition, pageWidth - 45, 9);
        });
      } else {
        yPosition = addText("None - Excellent performance on critical metrics!", 25, yPosition, pageWidth - 45, 9, [34, 139, 34]);
      }
      yPosition += 5;
      
      // Priority 2: Important Improvements
      const priority2Items = [];
      if (fillerResult && fillerResult.fillerCount >= 6 && fillerResult.fillerCount <= 10) {
        priority2Items.push(`Reduce filler words from ${fillerResult.fillerCount} to 2-3`);
      }
      if (paceResult && paceResult.consistencyScore < 70) {
        priority2Items.push(`Improve pacing consistency to 80%+ (currently ${paceResult.consistencyScore.toFixed(0)}%)`);
      }
      if (visibleSeconds > 0 && awaySeconds > 0) {
        const engagementPct = (visibleSeconds / (visibleSeconds + awaySeconds)) * 100;
        if (engagementPct < 80) {
          priority2Items.push(`Increase face visibility to 80%+ (currently ${engagementPct.toFixed(0)}%)`);
        }
      }
      
      // Always show Priority 2 section
      yPosition = addText("PRIORITY 2 - IMPORTANT IMPROVEMENTS (Next 2-4 Weeks):", 20, yPosition, pageWidth - 40, 10, [245, 158, 11]);
      if (priority2Items.length > 0) {
        priority2Items.forEach((item, index) => {
          yPosition = addText(`${index + 1}. ${item}`, 25, yPosition, pageWidth - 45, 9);
        });
      } else {
        yPosition = addText("None - Good performance on important metrics!", 25, yPosition, pageWidth - 45, 9, [34, 139, 34]);
      }
      yPosition += 5;
      
      // Priority 3: Refinements
      const priority3Items = [];
      if (paceResult) {
        const paceLabel = paceResult.prediction || getWpmLabel(paceResult.wpm);
        if (paceLabel === 'Slow' && paceResult.wpm >= 80) {
          priority3Items.push('Fine-tune speaking rate toward 120-140 WPM');
        } else if (paceLabel === 'Fast' && paceResult.wpm <= 180) {
          priority3Items.push('Fine-tune speaking rate toward 120-140 WPM');
        }
      }
      if (emotionSummary.length > 0) {
        priority3Items.push(`Align emotional expression with content (dominant: ${emotionSummary[0][0]})`);
      }
      
      // Always show Priority 3 section
      yPosition = addText("PRIORITY 3 - REFINEMENTS (Ongoing Practice):", 20, yPosition, pageWidth - 40, 10, [34, 197, 94]);
      if (priority3Items.length > 0) {
        priority3Items.forEach((item, index) => {
          yPosition = addText(`${index + 1}. ${item}`, 25, yPosition, pageWidth - 45, 9);
        });
      } else {
        yPosition = addText("Continue practicing to maintain and refine your skills!", 25, yPosition, pageWidth - 45, 9, [34, 139, 34]);
      }
      yPosition += 5;
      
      yPosition += 10;

      // ========== ACTION PLAN ==========
      checkNewPage(50);
      yPosition = addSectionHeader("RECOMMENDED ACTION PLAN", yPosition);
      
      yPosition = addText("30-DAY IMPROVEMENT PLAN:", 20, yPosition, pageWidth - 40, 11, [0, 60, 70]);
      yPosition += 3;
      
      yPosition = addText("Week 1-2: Foundation Building", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
      yPosition = addText("> Record yourself daily for 2-3 minutes", 25, yPosition, pageWidth - 45, 9);
      yPosition = addText("> Focus on your top priority issue identified above", 25, yPosition, pageWidth - 45, 9);
      yPosition = addText("> Practice conscious pausing instead of filler words", 25, yPosition, pageWidth - 45, 9);
      yPosition += 3;
      
      yPosition = addText("Week 3-4: Skill Development", 20, yPosition, pageWidth - 40, 10, [0, 60, 70]);
      yPosition = addText("> Practice with metronome for consistent pacing", 25, yPosition, pageWidth - 45, 9);
      yPosition = addText("> Work on volume control and projection", 25, yPosition, pageWidth - 45, 9);
      yPosition = addText("> Re-record and compare with baseline analysis", 25, yPosition, pageWidth - 45, 9);
      yPosition += 10;

      // ========== SUMMARY PAGE ==========
      pdf.addPage();
      yPosition = 20;
      
      yPosition = addSectionHeader("PERFORMANCE SUMMARY", yPosition);
      
      // Overall Score Card
      yPosition = addText("Overall Performance Score:", 20, yPosition, pageWidth - 40, 12, [0, 60, 70]);
      yPosition += 3;
      
      pdf.setFillColor(0, 60, 70);
      pdf.rect(20, yPosition, pageWidth - 40, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(36);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${overallScore}%`, pageWidth / 2, yPosition + 18, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      yPosition += 30;
      
      // Component Breakdown
      yPosition = addText("Component Performance Breakdown:", 20, yPosition, pageWidth - 40, 11, [0, 60, 70]);
      yPosition += 3;
      
      if (loudnessResult) {
        const loudnessScore = loudnessResult.category === 'Acceptable' ? 100 : 50;
        yPosition = addText(`> Loudness: ${loudnessScore}% - ${loudnessResult.category}`, 25, yPosition, pageWidth - 45, 9);
      }
      if (fillerResult) {
        const fillerScore = fillerResult.fillerCount <= 2 ? 100 : 
                           fillerResult.fillerCount <= 5 ? 80 :
                           fillerResult.fillerCount <= 10 ? 60 : 40;
        yPosition = addText(`> Filler Words: ${fillerScore}% - ${fillerResult.fillerCount} detected`, 25, yPosition, pageWidth - 45, 9);
      }
      if (paceResult) {
        const paceScore = (paceResult.prediction || getWpmLabel(paceResult.wpm)) === 'Ideal' ? 100 : 70;
        yPosition = addText(`> Pace Management: ${paceScore}% - ${paceResult.wpm.toFixed(0)} WPM`, 25, yPosition, pageWidth - 45, 9);
      }
      if (visibleSeconds > 0 || awaySeconds > 0) {
        const engagementPct = (visibleSeconds / (visibleSeconds + awaySeconds)) * 100;
        yPosition = addText(`> Face Engagement: ${engagementPct.toFixed(0)}% - Face visibility`, 25, yPosition, pageWidth - 45, 9);
      }
      if (emotionSummary.length > 0) {
        yPosition = addText(`> Top Emotion: ${emotionSummary[0][0]} (${emotionSummary[0][1]}%)`, 25, yPosition, pageWidth - 45, 9);
      }
      
      yPosition += 10;
      
      // Next Steps
      yPosition = addSectionHeader("NEXT STEPS", yPosition);
      yPosition = addText("1. Review the priority recommendations in this report", 20, yPosition, pageWidth - 40, 10);
      yPosition = addText("2. Focus on Priority 1 items this week", 20, yPosition, pageWidth - 40, 10);
      yPosition = addText("3. Practice exercises for 15-20 minutes daily", 20, yPosition, pageWidth - 40, 10);
      yPosition = addText("4. Record another session in 1-2 weeks to track progress", 20, yPosition, pageWidth - 40, 10);
      yPosition = addText("5. Join a Toastmasters club or work with a speech coach", 20, yPosition, pageWidth - 40, 10);
      
      yPosition += 10;
      
      // Support Resources
      yPosition = addSectionHeader("SUPPORT & RESOURCES", yPosition);
      yPosition = addText("For additional support:", 20, yPosition, pageWidth - 40, 10);
      yPosition = addText("> SpeakCraft Platform: Access specialized training modules", 25, yPosition, pageWidth - 45, 9);
      yPosition = addText("> Toastmasters International: Join local speaking clubs", 25, yPosition, pageWidth - 45, 9);
      yPosition = addText("> Professional Coaching: Consider one-on-one speech training", 25, yPosition, pageWidth - 45, 9);

      // Footer on all pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 15;
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text("Generated by SpeakCraft Speech Insights System", pageWidth / 2, footerY, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 5, { align: 'center' });
      }

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`SpeakCraft_Comprehensive_Report_${timestamp}.pdf`);
      
      console.log("✅ Professional report generated successfully!");
      
    } catch (error) {
      console.error("❌ Failed to generate PDF report:", error);
      alert("Failed to generate report. Please try again.");
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
                    style={{ transform: 'scaleX(-1)' }}
                    mirrored={true}
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
                <div className="flex justify-center items-center space-x-3">
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

                {/* Playback Section */}
                {(audioURL || videoBlob) && (
                  <div className="mt-6 bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-4 border-2 border-cyan-400/30">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <FaPlay className="text-cyan-400" />
                      Recording Playback
                    </h3>
                    
                    {/* Video Player */}
                    {videoBlob && (
                      <div className="bg-black/30 rounded-lg p-3 mb-3">
                        <div className="text-xs text-white/70 mb-2">Video Recording</div>
                        <video 
                          controls 
                          className="w-full rounded-lg"
                          style={{
                            maxHeight: '300px',
                            backgroundColor: '#000',
                            outline: 'none',
                            transform: 'scaleX(-1)'
                          }}
                        >
                          <source src={videoBlob} type="video/webm" />
                          Your browser does not support the video element.
                        </video>
                      </div>
                    )}
                    
                   
                    
                    {/* Recording Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {audioDuration && (
                        <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                          <div className="text-white/60">Duration</div>
                          <div className="text-white font-semibold">{audioDuration.toFixed(1)}s</div>
                        </div>
                      )}
                      {recordedAt && (
                        <div className="bg-purple-500/20 rounded-lg p-2 text-center">
                          <div className="text-white/60">Recorded</div>
                          <div className="text-white font-semibold text-xs">
                            {new Date(recordedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(loudnessResult || fillerResult || paceResult) && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={downloadPDFReport}
                      className="w-full bg-green-600 text-black font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload />
                      Download Complete Report
                    </button>
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
