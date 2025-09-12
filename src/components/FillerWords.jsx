import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaComment, FaStop, FaPlay, FaPause, FaClock, FaChartBar } from "react-icons/fa";
import axios from "axios";
import image01 from "../assets/images/fillerbg.png";

const FillerWords = () => {
  // Single view; no saved tab
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [recordedAt, setRecordedAt] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [detectedFillers, setDetectedFillers] = useState([]);
  const recognitionRef = useRef(null);
  
  
  // Audio recording states (matching PaceManagement)
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  let animationFrameId = useRef(null);

  useEffect(() => {}, []);

  // Timer effect for recording (matching PaceManagement)
  useEffect(() => {
    let timer;

    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  // Cleanup on unmount (matching PaceManagement)
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio analysis effect (matching PaceManagement)
  useEffect(() => {
    if (isRecording && !isPaused) {
      startAnalyzing();
    }
  }, [isRecording, isPaused]);

  

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Audio analysis functions (matching PaceManagement)
  const startAnalyzing = () => {
    if (mediaStreamRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(
        mediaStreamRef.current
      );
      source.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.gain.setValueAtTime(
        0,
        audioContextRef.current.currentTime
      );
      gainNodeRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 256;
      drawSineWave();
    }
  };

  // Simple filler-word extraction from transcript text
  const computeFillerCounts = (text) => {
    const fillers = [
      "um", "uh", "erm", "hmm",
      "like", "you know", "i mean",
      "sort of", "kind of", "basically",
      "actually", "literally", "so", "well", "okay", "right"
    ];

    const normalized = ` ${text.toLowerCase()} `
      .replace(/\s+/g, " ")
      .replace(/[.,!?;:()"']/g, " ");

    const details = fillers.map((fw) => {
      const pattern = new RegExp(` ${fw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")} `, "g");
      const matches = normalized.match(pattern);
      return { word: fw, count: matches ? matches.length : 0 };
    }).filter((d) => d.count > 0);

    const total = details.reduce((sum, d) => sum + d.count, 0);
    return { total, details };
  };

  const drawSineWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording || isPaused) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();

      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * canvas.width;
        const y = (dataArray[i] / 255) * canvas.height;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      animationFrameId.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(animationFrameId.current);
    draw();
  };

  // Analyze a Blob by posting directly to FastAPI (no DB save)
  const analyzeBlob = async (blob) => {
    const formData = new FormData();
    formData.append("audio", blob);
    if (liveTranscript) {
      formData.append("transcript", liveTranscript);
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        "http://localhost:8000/predict-filler-words",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = res.data || {};
      if (data.error) {
        console.error("Analysis error:", data.error);
        alert("Analysis failed: " + data.error);
        return;
      }

      setResult({
        fillerCount: Number.isFinite(data.filler_text_count) ? Number(data.filler_text_count) : (Number.isFinite(data.filler_prediction) ? Number(data.filler_prediction) : 0),
        detectedFillers: Array.isArray(data.detected_fillers) ? data.detected_fillers : [],
        message: data.message ?? "",
        modelLoaded: !!data.modelLoaded,
        probability: typeof data.filler_probability === "number" ? data.filler_probability : undefined,
      });
    } catch (err) {
      console.error("Analysis request failed", err);
      alert("Something went wrong during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  // Recording functions (matching PaceManagement exactly)
  const handlePlay = async () => {
    if (!isRecording || isPaused) {
      try {
        if (!isRecording) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          mediaStreamRef.current = stream;
          mediaRecorderRef.current = new MediaRecorder(stream);

          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/wav",
            });
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioURL(audioUrl);
            setAudioBlob(audioBlob);
            setAudioDuration(recordTime);
            setRecordedAt(new Date());
            setResult(null);

            // Auto-analyze without saving to DB
            analyzeBlob(audioBlob);
          };

          // Start browser speech recognition (fallback for listing fillers)
          try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
              const recognition = new SpeechRecognition();
              recognition.lang = "en-US";
              recognition.continuous = true;
              recognition.interimResults = true;
              recognition.onresult = (event) => {
                let transcript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  transcript += event.results[i][0].transcript + " ";
                }
                setLiveTranscript((prev) => (prev + " " + transcript).trim());
              };
              recognition.onerror = () => {};
              recognition.onend = () => {
                // Compute fillers from final transcript
                const { total, details } = computeFillerCounts(liveTranscript);
                setDetectedFillers(details);
                // If ML model not loaded, use fallback count
                setResult((prev) => {
                  if (!prev) return prev;
                  if (prev.modelLoaded) return prev;
                  return {
                    ...prev,
                    fillerCount: total,
                  };
                });
              };
              recognition.start();
              recognitionRef.current = recognition;
            }
          } catch (_) {}
        }

        setIsRecording(true);
        setIsPaused(false);

        if (mediaRecorderRef.current.state === "paused") {
          mediaRecorderRef.current.resume();
        } else if (mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current.start();
        }
        drawSineWave();
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
      cancelAnimationFrame(animationFrameId.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Stop speech recognition if running
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      audioChunksRef.current = [];
    }
  };

  // Upload/Analyze button removed; analysis runs automatically on stop

  // Save removed; no persistence required

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-GB", {
      hour12: true,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8">
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
              Filler Word Detection
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

                <FaComment
                  className={`text-black text-4xl ${
                    isRecording && !isPaused ? "animate-pulse" : "opacity-50"
                  }`}
                />
              </div>

              {/* Buttons */}
              <div
                className=" mt-10"
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

            {/* Timer */}
            <p
              style={{
                color: "white",
                fontSize: "1.125rem",
                marginTop: "1rem",
              }}
            >
              Recording Time: {formatTime(recordTime)}
            </p>

            {/* Audio Playback */}
            {audioURL && (
              <div
                style={{
                  marginTop: "1.5rem",
                  width: "100%",
                  padding: "1rem",
                  background: "#ffffffa6",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h4
                  className="font-semibold"
                  style={{
                    color: "black",
                    fontSize: "1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  Playback Preview
                </h4>

                <audio
                  controls
                  src={audioURL}
                  style={{
                    width: "100%",
                    borderRadius: "0.5rem",
                    outline: "none",
                  }}
                />

                {/* Analysis triggers automatically on stop; no action buttons */}
              </div>
            )}

            {/* Enhanced Left Side Section - Quick Reference Only */}
            <div className="w-full mt-8 h-[500px] flex flex-col">
              {/* Filler Word Guidelines */}
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
                      className="text-[#00ccff] font-bold text-lg lg:text-xl mb-2 drop-shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      📋 Filler Word Guidelines
                    </motion.h4>
                    <p className="text-white/90 text-xs lg:text-sm font-medium">Professional speaking standards & guidelines</p>
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
                      <div className="text-emerald-300 dark:text-emerald-200 font-bold text-base lg:text-lg drop-shadow-md">0-2</div>
                      <div className="text-white/90 text-xs font-semibold">Excellent</div>
                      <div className="text-white/70 text-xs mt-1">Filler Count</div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 dark:from-yellow-600/40 dark:to-orange-600/40 rounded-xl p-3 lg:p-4 border-2 border-yellow-400/60 dark:border-yellow-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: -1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 4, delay: 1, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">👍</span>
                      </motion.div>
                      <div className="text-yellow-300 dark:text-yellow-200 font-bold text-base lg:text-lg drop-shadow-md">3-5</div>
                      <div className="text-white/90 text-xs font-semibold">Good</div>
                      <div className="text-white/70 text-xs mt-1">Filler Count</div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-orange-500/30 to-red-500/30 dark:from-orange-600/40 dark:to-red-600/40 rounded-xl p-3 lg:p-4 border-2 border-orange-400/60 dark:border-orange-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 via-transparent to-orange-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, delay: 2, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">⚠️</span>
                      </motion.div>
                      <div className="text-orange-300 dark:text-orange-200 font-bold text-base lg:text-lg drop-shadow-md">6-10</div>
                      <div className="text-white/90 text-xs font-semibold">Needs Work</div>
                      <div className="text-white/70 text-xs mt-1">Filler Count</div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-red-500/30 to-pink-500/30 dark:from-red-600/40 dark:to-pink-600/40 rounded-xl p-3 lg:p-4 border-2 border-red-400/60 dark:border-red-300/60 text-center shadow-lg backdrop-blur-sm relative overflow-hidden"
                      whileHover={{ scale: 1.05, rotate: -1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Glowing Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 via-transparent to-red-400/10 rounded-xl"></div>
                      
                      <motion.div
                        className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg border-2 border-white/20"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 4, delay: 3, repeat: Infinity }}
                      >
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">🚨</span>
                      </motion.div>
                      <div className="text-red-300 dark:text-red-200 font-bold text-base lg:text-lg drop-shadow-md">10+</div>
                      <div className="text-white/90 text-xs font-semibold">Improve</div>
                      <div className="text-white/70 text-xs mt-1">Filler Count</div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          
          {/* Right side */}
          <div className="w-full flex flex-col">
            <div className="mb-4" />

              <div className="flex flex-col w-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-7 mb-4">
                  Filler Word Analysis
                </h2>

                {result && !isLoading && (
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-xl p-6 border-2 border-white/20 shadow-2xl">
                    <h3 className="text-[#00ccff] font-bold text-xl mb-4 flex items-center gap-2">
                      <FaChartBar />
                      Analysis Result
                    </h3>

                    {/* Filler Count - single row */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] text-white">
                        <span className="text-sm lg:text-lg font-semibold mr-2">Filler Count:</span>
                        <span className="text-lg lg:text-xl font-bold">{result.fillerCount}</span>
                      </div>
                    </div>

                    {/* Detected filler words from backend (or transcript fallback) */}
                    {(result?.detectedFillers?.length ? result.detectedFillers : detectedFillers)?.length > 0 && (
                      <div className="mt-4 bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">Detected Filler Words</h4>
                        <ul className="list-disc list-inside text-white/90 text-sm">
                          {(result?.detectedFillers?.length ? result.detectedFillers : detectedFillers).map((item) => (
                            <li key={item.word}>
                              <span className="font-semibold">{item.word}</span>: {item.count}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Debug notice removed */}

                    {/* Save removed */}
                  </div>
                )}

                {!result && !isLoading && (
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-xl p-8 border-2 border-white/20 shadow-2xl text-center">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <FaComment className="text-white text-2xl" />
                    </motion.div>
                    <h3 className="text-[#00ccff] text-xl font-bold mb-2">Ready to Analyze</h3>
                    <p className="text-white/80">
                      Record your speech using the recorder on the left to get detailed filler word analysis.
                    </p>
                  </div>
                )}
              </div>

            {/* Sticky Animated Square Image - Bottom Right Corner */}
            <motion.div
              className="fixed bottom-6 right-6 w-48 h-48 overflow-hidden rounded-2xl border-2 border-red-400/50 shadow-2xl backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 1.2, 
                delay: 0.5,
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              whileHover={{ 
                scale: 1.15, 
                rotate: [0, 5, -5, 0],
                boxShadow: "0 20px 40px rgba(255, 0, 0, 0.3)"
              }}
              style={{ 
                zIndex: 1000,
                position: 'fixed'
              }}
            >
              {/* Animated Border Glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255, 0, 0, 0.3)",
                    "0 0 30px rgba(255, 0, 0, 0.6)",
                    "0 0 20px rgba(255, 0, 0, 0.3)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Floating Particles Background */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-red-400 to-pink-500 rounded-full opacity-80"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, Math.random() * 10 - 5, 0],
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.5, 1],
                      rotate: [0, 360, 0]
                    }}
                    transition={{
                      duration: 4 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Main Image */}
              <motion.img
                src={image01}
                alt="Filler Word Detection"
                className="w-full h-full object-cover"
                initial={{ scale: 1.2, rotate: 10 }}
                animate={{ 
                  scale: 1,
                  rotate: 0
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, 2, -2, 0]
                }}
              />

              {/* Animated Overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  background: [
                    "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    "linear-gradient(to top, rgba(255,0,0,0.2), transparent)",
                    "linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
                  ]
                }}
                transition={{ 
                  duration: 1, 
                  delay: 0.7,
                  background: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />

              {/* Animated Bottom Info Panel */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  background: [
                    "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                    "linear-gradient(to top, rgba(255,0,0,0.3), transparent)",
                    "linear-gradient(to top, rgba(0,0,0,0.9), transparent)"
                  ]
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: 1,
                  background: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <motion.h3 
                  className="text-white font-bold text-sm mb-1"
                  animate={{
                    color: ["#ffffff", "#ff6b6b", "#ffffff"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🎤 Filler Words
                </motion.h3>
                <motion.p 
                  className="text-white/90 text-xs font-medium"
                  animate={{
                    opacity: [0.9, 1, 0.9]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Detection
                </motion.p>
              </motion.div>

              {/* Pulsing Ring Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-red-400/30"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillerWords;
