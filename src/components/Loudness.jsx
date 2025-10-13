import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaClock, FaChartBar, FaUserCheck, FaVolumeUp } from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

const Loudness = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [prediction, setPrediction] = useState("Listening...");
  const [waveform, setWaveform] = useState([]);
  const [waveColor, setWaveColor] = useState("#3498db");
  const [recordTime, setRecordTime] = useState(0);
  const [activeTab, setActiveTab] = useState("realtime");

  // Sustained Vowel States
  const [sustainedResults, setSustainedResults] = useState(null);
  const [volumeChunks, setVolumeChunks] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [isSustainedRecording, setIsSustainedRecording] = useState(false);
  const [sustainedAudioUrl, setSustainedAudioUrl] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const liveCanvasRef = useRef(null);
  const staticCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const floatDataArrayRef = useRef(null); // For getFloatTimeDomainData
  const byteDataArrayRef = useRef(null); // For getByteTimeDomainData
  const animationFrameRef = useRef(null);
  const isLiveRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const sustainedMediaRecorderRef = useRef(null);
  const sustainedChunksRef = useRef([]);
  const sustainedStreamRef = useRef(null);
  const processorRef = useRef(null);
  const pcmBufferRef = useRef(new Float32Array(0));
  const sampleRateRef = useRef(16000);
  const chunkTimerRef = useRef(null);
  const skipFirstChunkRef = useRef(false);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (sustainedStreamRef.current) {
        sustainedStreamRef.current.getTracks().forEach((track) => track.stop());
        sustainedStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Real-time waveform drawing
  useEffect(() => {
    if (waveform.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
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

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [waveform, waveColor]);

  // Convert recorded WebM/MP4 blob to WAV (mono, 16-bit PCM)
  const blobToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const length = audioBuffer.length;
    let channelData;
    if (audioBuffer.numberOfChannels > 1) {
      const tmp = new Float32Array(length);
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        const data = audioBuffer.getChannelData(c);
        for (let i = 0; i < length; i++) tmp[i] += data[i];
      }
      for (let i = 0; i < length; i++) tmp[i] /= audioBuffer.numberOfChannels;
      channelData = tmp;
    } else {
      channelData = audioBuffer.getChannelData(0);
    }

    const sampleRate = audioBuffer.sampleRate;

    function floatTo16BitPCM(input) {
      const buffer = new ArrayBuffer(input.length * 2);
      const view = new DataView(buffer);
      let offset = 0;
      for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      return buffer;
    }

    function writeWavHeader(view, sampleRate, numSamples) {
      function setUint32(offset, value) { view.setUint32(offset, value, true); }
      function setUint16(offset, value) { view.setUint16(offset, value, true); }
      const numChannels = 1;
      const bytesPerSample = 2;
      setUint32(0, 0x46464952); // "RIFF"
      setUint32(4, 36 + numSamples * bytesPerSample);
      setUint32(8, 0x45564157); // "WAVE"
      setUint32(12, 0x20746d66); // "fmt "
      setUint32(16, 16);
      setUint16(20, 1); // PCM
      setUint16(22, numChannels);
      setUint32(24, sampleRate);
      setUint32(28, sampleRate * numChannels * bytesPerSample);
      setUint16(32, numChannels * bytesPerSample);
      setUint16(34, 8 * bytesPerSample);
      setUint32(36, 0x61746164); // "data"
      setUint32(40, numSamples * bytesPerSample);
    }

    const pcmBuffer = floatTo16BitPCM(channelData);
    const wavBuffer = new ArrayBuffer(44 + pcmBuffer.byteLength);
    const view = new DataView(wavBuffer);
    writeWavHeader(view, sampleRate, channelData.length);
    new Uint8Array(wavBuffer, 44).set(new Uint8Array(pcmBuffer));
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  // Start real-time audio analysis
  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sampleRateRef.current = audioContextRef.current.sampleRate || 16000;

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.fftSize;
      floatDataArrayRef.current = new Float32Array(bufferLength);

      sourceRef.current.connect(analyserRef.current);

      // Repeatedly get waveform data and update state
      const drawInterval = setInterval(() => {
        analyserRef.current.getFloatTimeDomainData(floatDataArrayRef.current);

        // Convert to absolute average values for smooth waveform
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

      // MediaRecorder setup with proper MIME type handling
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = '';
          }
        }
      }
      
      console.log(`🎵 Using MIME type: ${options.mimeType || 'default'}`);
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      // Disable MediaRecorder-based uploads; we will stream PCM via ScriptProcessor
      mediaRecorderRef.current.ondataavailable = () => {};
      mediaRecorderRef.current.onstop = () => {};

      // PCM capture via ScriptProcessor for robust WAV chunks
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        const oldBuf = pcmBufferRef.current;
        const merged = new Float32Array(oldBuf.length + input.length);
        merged.set(oldBuf, 0);
        merged.set(input, oldBuf.length);
        pcmBufferRef.current = merged;
      };
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Helper to build WAV from Float32
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
          const numChannels = 1, bps = 2;
          set32(0, 0x46464952); // RIFF
          set32(4, 36 + numSamples * bps);
          set32(8, 0x45564157); // WAVE
          set32(12, 0x20746d66); // fmt 
          set32(16, 16);
          set16(20, 1);
          set16(22, numChannels);
          set32(24, sampleRate);
          set32(28, sampleRate * numChannels * bps);
          set16(32, numChannels * bps);
          set16(34, 8 * bps);
          set32(36, 0x61746164); // data
          set32(40, numSamples * bps);
        };
        const pcm = to16(float32);
        const wav = new ArrayBuffer(44 + pcm.byteLength);
        const view = new DataView(wav);
        writeHdr(view, sr, float32.length);
        new Uint8Array(wav, 44).set(new Uint8Array(pcm));
        return new Blob([wav], { type: 'audio/wav' });
      };

      // Skip first chunk to avoid startup spike
      skipFirstChunkRef.current = true;
      chunkTimerRef.current = setInterval(async () => {
        const needed = Math.floor(sampleRateRef.current * 3);
        if (pcmBufferRef.current.length < needed) return;
        const slice = pcmBufferRef.current.slice(pcmBufferRef.current.length - needed);
        if (skipFirstChunkRef.current) { skipFirstChunkRef.current = false; return; }
        const wavBlob = wavFromFloat32(slice, sampleRateRef.current);
        const formData = new FormData();
        formData.append('file', wavBlob, 'recording.wav');
        try {
          const res = await axios.post('http://localhost:8000/loudness/predict-loudness', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          const category = res.data.category;
          setPrediction(category);
          if (category === 'Acceptable') setWaveColor('green');
          else if (category === 'Low / Silent') setWaveColor('red');
          else setWaveColor('#3498db');
        } catch (err) {
          console.error('Prediction error:', err);
          setPrediction('Prediction error');
          setWaveColor('gray');
        }
      }, 3000);

      // Start microphone capture for UI (uploads are driven by PCM interval above)
      try {
        mediaRecorderRef.current.start();
      } catch (error) {
        console.error("Error starting MediaRecorder:", error);
        setPrediction("Recording error");
        setWaveColor("gray");
      }

      // Clean up
      return () => {
        clearInterval(drawInterval);
        audioContextRef.current?.close();
        if (chunkTimerRef.current) { clearInterval(chunkTimerRef.current); chunkTimerRef.current = null; }
        if (processorRef.current) {
          try { sourceRef.current && sourceRef.current.disconnect(processorRef.current); } catch {}
          try { processorRef.current.disconnect(); } catch {}
        }
        pcmBufferRef.current = new Float32Array(0);
      };
    } catch (err) {
      console.error("Microphone error:", err);
      setPrediction("Microphone access error");
    }
  };

  // Start/Stop recording
  const handlePlay = async () => {
    if (!isRecording || isPaused) {
      try {
        if (!isRecording) {
          await startAudio();
        }
        setIsRecording(true);
        setIsPaused(false);
      } catch (error) {
        console.error("Error accessing the microphone:", error);
      }
    }
  };

  const handlePause = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      setIsPaused(true);
      mediaRecorderRef.current.pause();
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      setIsPaused(false);
      setRecordTime(0);
      mediaRecorderRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      chunksRef.current = [];
    }
  };

  // Sustained Vowel Functions
  const startSustainedRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sustainedStreamRef.current = stream;
      
      // Start live waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      byteDataArrayRef.current = dataArray;
      isLiveRef.current = true;
      setIsLive(true);
      drawLiveWaveform();

      // Start recording
      sustainedMediaRecorderRef.current = new MediaRecorder(stream);
      sustainedChunksRef.current = [];

      sustainedMediaRecorderRef.current.ondataavailable = (event) => {
        sustainedChunksRef.current.push(event.data);
      };

      sustainedMediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(sustainedChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setSustainedAudioUrl(audioUrl);
        analyzeAudio(audioBlob);
      };

      sustainedMediaRecorderRef.current.start();
      setIsSustainedRecording(true);
    } catch (error) {
      console.error("Error starting sustained recording:", error);
    }
  };

  const stopSustainedRecording = () => {
    if (sustainedMediaRecorderRef.current && isSustainedRecording) {
      sustainedMediaRecorderRef.current.stop();
      setIsSustainedRecording(false);
      stopLiveWaveform();
      if (sustainedStreamRef.current) {
        sustainedStreamRef.current.getTracks().forEach((track) => track.stop());
        sustainedStreamRef.current = null;
      }
      sustainedMediaRecorderRef.current = null;
    }
  };

  const startLiveWaveform = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    sustainedStreamRef.current = stream;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    byteDataArrayRef.current = dataArray;
    isLiveRef.current = true;
    setIsLive(true);
    drawLiveWaveform();
  };

  const stopLiveWaveform = () => {
    isLiveRef.current = false;
    setIsLive(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    audioContextRef.current?.close();
  };

  const drawLiveWaveform = () => {
    if (!isLiveRef.current) return;
    const canvas = liveCanvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = byteDataArrayRef.current;

    // If not ready yet, try again next frame
    if (!canvas || !analyser || !dataArray) {
      animationFrameRef.current = requestAnimationFrame(drawLiveWaveform);
      return;
    }

    const ctx = canvas.getContext("2d");
    animationFrameRef.current = requestAnimationFrame(drawLiveWaveform);
    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#34d399";
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const analyzeAudio = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const rawData = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;

    let total = 0;
    for (let i = 0; i < rawData.length; i++) {
      total += rawData[i] * rawData[i];
    }
    const rms = Math.sqrt(total / rawData.length);

    const CHUNK = 2048;
    let chunks = [];
    for (let i = 0; i < rawData.length; i += CHUNK) {
      const chunk = rawData.slice(i, i + CHUNK);
      let sum = 0;
      for (let j = 0; j < chunk.length; j++) {
        sum += chunk[j] * chunk[j];
      }
      chunks.push(Math.sqrt(sum / chunk.length));
    }

    const mean = chunks.reduce((a, b) => a + b, 0) / chunks.length;
    const variance = chunks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / chunks.length;
    const steadiness = 1 - Math.sqrt(variance);

    setVolumeChunks(chunks);
    setSustainedResults({
      duration: duration.toFixed(2),
      rms: rms.toFixed(4),
      steadiness: steadiness.toFixed(4),
    });
  };

  // Static waveform for sustained vowel
  useEffect(() => {
    if (!volumeChunks.length) return;

    const canvas = staticCanvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const width = canvas.width;
    const height = canvas.height;
    const step = width / volumeChunks.length;

    for (let i = 0; i < volumeChunks.length; i++) {
      const x = i * step;
      const y = height - volumeChunks[i] * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }, [volumeChunks]);

  const downloadPDFReport = () => {
    const node = document.getElementById("pdf-report");
    htmlToImage
      .toPng(node, {
        style: {
          color: "black",
          backgroundColor: "white",
        },
      })
      .then((dataUrl) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("Loudness_Analysis_Report.pdf");
      })
      .catch((error) => {
        console.error("❌ Failed to generate PDF", error);
      });
  };

  const getLoudnessLabel = (prediction) => prediction || "Analyzing...";

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-4rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8">
          {/* Left Side - Controls (Similar to PaceManagement) */}
          <div
            className="bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              margin: "0 auto",
              borderRadius: "1rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                color: "white",
                fontWeight: "600",
                marginBottom: "1.5rem",
              }}
            >
              🔊 Loudness Monitor
            </h2>

            <div
              style={{
                width: "100%",
                background: "#ffffffa6",
                borderRadius: "0.75rem",
                padding: "1rem",
                height: "250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Mic animation */}
              <div className="relative flex items-center mt-20 justify-center">
                {isRecording && !isPaused && (
                  <>
                    <motion.div
                      className="absolute w-32 h-32 border-2 border-blue-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute w-24 h-24 border-2 border-purple-400 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute w-16 h-16 border-2 border-pink-400 rounded-full"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </>
                )}

                <FaMicrophone
                  className={`text-black text-4xl ${
                    isRecording && !isPaused ? "animate-pulse" : "opacity-50"
                  }`}
                />
              </div>

              {/* Buttons */}
              <div
                className="mt-10"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "4rem",
                  marginBottom: "1rem",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handlePause}
                  disabled={!isRecording || isPaused}
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    opacity: !isRecording || isPaused ? 0.5 : 1,
                    cursor:
                      !isRecording || isPaused ? "not-allowed" : "pointer",
                  }}
                >
                  <FaPause style={{ fontSize: "1.5rem", color: "black" }} />
                </button>
                <button
                  onClick={handlePlay}
                  disabled={isRecording && !isPaused}
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    opacity: isRecording && !isPaused ? 0.5 : 1,
                    cursor:
                      isRecording && !isPaused ? "not-allowed" : "pointer",
                  }}
                >
                  <FaPlay style={{ fontSize: "1.5rem", color: "black" }} />
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isRecording}
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    opacity: !isRecording ? 0.5 : 1,
                    cursor: !isRecording ? "not-allowed" : "pointer",
                  }}
                >
                  <FaStop style={{ fontSize: "1.5rem", color: "black" }} />
                </button>
              </div>



            </div>
            
            {/* Real-time Waveform Section */}
            <div className="w-full mt-8 mb-6">
              <h3 className="text-white dark:text-white text-lg font-semibold mb-4 text-center">Real-time Waveform</h3>
              <div className="w-full">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={120}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    background: "#fff",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Enhanced Left Side Section - Quick Reference Only */}
            <div className="w-full mt-8 h-[500px] flex flex-col">
              {/* Loudness Management Tips & Guidelines */}
              <motion.div
                className="space-y-4 flex flex-col justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {/* Enhanced Quick Reference */}
        <motion.div
                  className="bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden h-[500px] flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  {/* Glowing Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00ccff]/20 via-transparent to-[#00ccff]/20 rounded-2xl animate-pulse"></div>
                  
                  <div className="text-center mb-4 lg:mb-6 relative z-10">
                    <motion.h4 
                      className="text-[#00ccff] dark:text-[#00ccff] font-bold text-lg lg:text-xl mb-2 drop-shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      📋 Loudness Quick Reference
                    </motion.h4>
                    <p className="text-white/90 dark:text-white/90 text-xs lg:text-sm font-medium">Professional speaking volume standards & guidelines</p>
                  </div>

                  {/* Main Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div
                      className="bg-gradient-to-br from-emerald-500/30 to-green-500/30 dark:from-emerald-600/40 dark:to-green-600/40 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/60 dark:border-emerald-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-emerald-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">🎯</span>
                      </motion.div>
                      <div className="text-emerald-300 dark:text-emerald-200 font-bold text-base lg:text-lg drop-shadow-md">60-80 dB</div>
                      <div className="text-white/90 dark:text-white/90 text-xs font-semibold">Optimal Range</div>
                      <div className="text-white/70 dark:text-white/70 text-xs mt-1">Clear & Audible</div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 dark:from-blue-600/40 dark:to-cyan-600/40 rounded-xl p-3 lg:p-4 border-2 border-blue-400/60 dark:border-blue-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: -1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 4, delay: 1, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">📏</span>
                      </motion.div>
                      <div className="text-blue-300 dark:text-blue-200 font-bold text-base lg:text-lg drop-shadow-md">2-3m</div>
                      <div className="text-white/90 dark:text-white/90 text-xs font-semibold">Clear Distance</div>
                      <div className="text-white/70 dark:text-white/70 text-xs mt-1">Audience Reach</div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-amber-500/30 to-orange-500/30 dark:from-amber-600/40 dark:to-orange-600/40 rounded-xl p-3 lg:p-4 border-2 border-amber-400/60 dark:border-amber-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-amber-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, delay: 2, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">🔊</span>
                      </motion.div>
                      <div className="text-amber-300 dark:text-amber-200 font-bold text-base lg:text-lg drop-shadow-md">&gt;80 dB</div>
                      <div className="text-white/90 dark:text-white/90 text-xs font-semibold">Too Loud</div>
                      <div className="text-white/70 dark:text-white/70 text-xs mt-1">Reduce Volume</div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-rose-500/30 to-pink-500/30 dark:from-rose-600/40 dark:to-pink-600/40 rounded-xl p-3 lg:p-4 border-2 border-rose-400/60 dark:border-rose-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: -1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-400/10 via-transparent to-rose-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 4, delay: 3, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">🔇</span>
                      </motion.div>
                      <div className="text-rose-300 dark:text-rose-200 font-bold text-base lg:text-lg drop-shadow-md">&lt;60 dB</div>
                      <div className="text-white/90 dark:text-white/90 text-xs font-semibold">Too Quiet</div>
                      <div className="text-white/70 dark:text-white/70 text-xs mt-1">Increase Volume</div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          {/* Right side - Analysis Tabs */}
          <div className="w-full flex flex-col">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4 overflow-x-auto">
              {/* Real-time Analysis Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "realtime"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-black"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-black/30"
                }`}
                onClick={() => setActiveTab("realtime")}
              >
                <FaChartBar />
                Real-time Analysis
              </button>

              {/* Sustained Vowel Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "sustained"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-black"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-black/30"
                }`}
                onClick={() => setActiveTab("sustained")}
              >
                <FaUserCheck />
                Sustained Vowel
              </button>

            </div>

            {/* Real-time Analysis Tab */}
            {activeTab === "realtime" && (
              <div
                id="pdf-report"
                className="flex flex-col w-full"
                style={{
                  left: "-9999px",
                  top: 0,
                  pointerEvents: "none",
                }}
              >
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  Real-time Loudness Analysis
                </h2>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6 w-full mb-6">
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Current Level
                    </h3>
                    <div className={`flex justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 bg-white/10 text-2xl font-semibold ${
                      prediction === "Acceptable" ? "text-green-400" : 
                      prediction === "Low / Silent" ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {prediction === "Acceptable" ? "✓" : prediction === "Low / Silent" ? "↓" : "↑"}
                    </div>
                    <p className="text-white/70 text-xs mt-1">{getLoudnessLabel(prediction)}</p>
                  </div>

                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Recording Time
                    </h3>
                    <div className="flex justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 bg-white/10 text-white text-lg font-semibold">
                      <FaClock className="text-white text-xl mb-1" />
                      <span className="ml-1">{formatTime(recordTime)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Waveform Status
                    </h3>
                    <div className="flex justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 bg-white/10 text-white text-lg font-semibold">
                      {isRecording ? "🔴" : "⚪"}
                    </div>
                    <p className="text-white/70 text-xs mt-1">{isRecording ? "Live" : "Idle"}</p>
                  </div>

                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Audio Quality
                    </h3>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          prediction === "Acceptable"
                            ? "bg-green-400"
                            : prediction === "Low / Silent"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                        style={{ width: prediction === "Acceptable" ? "100%" : prediction === "Low / Silent" ? "30%" : "70%" }}
                      ></div>
                    </div>
                    <p className="text-white text-sm font-semibold">
                      {prediction === "Acceptable" ? "Excellent" : prediction === "Low / Silent" ? "Too Quiet" : "Too Loud"}
                    </p>
                  </div>
                </div>

                {/* Prediction Display */}
                <div className="w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-lg mb-6">
                  <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Volume Level Analysis</h3>
                  <div
                    className={`p-4 rounded-xl shadow-lg text-center ${
                      prediction === "Acceptable"
                        ? "bg-green-100 text-green-800"
                        : prediction === "Low / Silent"
                        ? "bg-red-100 text-red-800"
                        : "bg-white text-[#003b46]"
                    }`}
                  >
                    <p className="text-lg font-semibold">
                      Current Level: {getLoudnessLabel(prediction)}
                    </p>
                    <p className="text-sm mt-2 opacity-75">
                      {prediction === "Acceptable" 
                        ? "Your volume is optimal for clear communication"
                        : prediction === "Low / Silent"
                        ? "Consider increasing your speaking volume"
                        : "Volume level is being analyzed..."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center mb-6">
                  <button
                    onClick={downloadPDFReport}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    📝 Generate Report
                  </button>
                </div>
              </div>
            )}

            {/* Sustained Vowel Tab */}
            {activeTab === "sustained" && (
              <div className="flex flex-col w-full h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  Sustained Vowel Practice
                </h2>

                <div className="bg-white rounded-xl p-6 text-black">
                  <h3 className="text-2xl font-bold mb-4 text-black">Sustained Vowel Phonation</h3>
                  <p className="mb-4 text-black">
                    Say and hold a vowel sound like "ah" or "ee" steadily for as long as possible.
                  </p>

                  <div>
                    <p className="mb-2 text-black">
                      Status: {isSustainedRecording ? "Recording" : "Ready"}
                    </p>
                    <div className="space-x-4 mb-4">
                      <button
                        onClick={startSustainedRecording}
                        disabled={isSustainedRecording}
                        className="text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        style={{ color: 'white', backgroundColor: '#16a34a', border: '1px solid rgba(0,0,0,0.1)' }}
                      >
                        Start
                      </button>
                      <button
                        onClick={stopSustainedRecording}
                        disabled={!isSustainedRecording}
                        className="text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        style={{ color: 'white', backgroundColor: '#ef4444', border: '1px solid rgba(0,0,0,0.1)' }}
                      >
                        Stop
                      </button>
                    </div>

                    {/* Live Waveform */}
                    {isLive && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-1">Live Waveform:</h4>
                        <canvas
                          ref={liveCanvasRef}
                          width={400}
                          height={100}
                          className="border border-green-300 rounded bg-white"
                        />
                      </div>
                    )}

                    {sustainedAudioUrl && (
                      <div className="mt-4">
                        <p className="mb-1 font-semibold text-black">Playback:</p>
                        <audio controls src={sustainedAudioUrl} className="w-full" />
                      </div>
                    )}
                  </div>

                  {/* Analysis Results */}
                  {sustainedResults && (
                    <div className="mt-6 p-4 border border-gray-300 rounded text-black bg-gray-50">
                      <h3 className="font-semibold mb-2 text-black">Analysis Results:</h3>
                      <p><strong>Duration:</strong> {sustainedResults.duration} seconds</p>
                      <p><strong>Average Volume (RMS):</strong> {sustainedResults.rms}</p>
                      <p><strong>Steadiness Score:</strong> {sustainedResults.steadiness}</p>
                      <p className="mt-2">
                        {sustainedResults.steadiness > 0.95
                          ? "Excellent! Your voice was steady."
                          : "Try to hold your voice more steadily next time."}
                      </p>
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Volume Waveform:</h4>
                        <canvas
                          ref={staticCanvasRef}
                          width={400}
                          height={100}
                          className="border border-gray-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Loudness;