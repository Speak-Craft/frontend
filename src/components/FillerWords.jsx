import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaComment, FaMicrophone, FaStop, FaPlay, FaPause, FaUpload, FaSave, FaClock, FaChartBar, FaHistory } from "react-icons/fa";
import axios from "axios";
import image01 from "../assets/images/fillerbg.png";

const FillerWords = () => {
  const [activeTab, setActiveTab] = useState("record"); // record | saved
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [recordedAt, setRecordedAt] = useState(null);
  const [savedRecs, setSavedRecs] = useState([]);
  
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

  useEffect(() => {
    fetchSavedRecordings();
  }, []);

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

  const fetchSavedRecordings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3001/api/rec/save", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedRecs(res.data);
    } catch (err) {
      console.error("Failed to fetch saved recordings", err);
    }
  };

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
          };
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
      audioChunksRef.current = [];
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return alert("No audio recorded");

    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post("http://localhost:3001/api/recording/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(res.data);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Something went wrong during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecording = async () => {
    if (!result || !audioDuration) return alert("No analysis to save");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3001/api/rec/save",
        {
          fillerCount: result.fillerCount,
          duration: audioDuration,
          date: recordedAt,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Recording saved successfully!");
      fetchSavedRecordings();
    } catch (err) {
      console.error("Error saving recording", err);
      alert("Failed to save recording.");
    }
  };

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

                {/* Action Buttons */}
                <div
                  style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}
                >
                  <button
                    onClick={uploadAudio}
                    disabled={!audioBlob || isLoading}
                    style={{
                      backgroundColor: "#025838",
                      color: "white",
                      padding: "0.6rem 1.2rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      opacity: (!audioBlob || isLoading) ? 0.5 : 1,
                    }}
                  >
                    {isLoading ? "⏳ Analyzing..." : "📝 Upload & Analyze"}
                  </button>

                  {result && (
                    <button
                      onClick={saveRecording}
                      style={{
                        backgroundColor: "#b79602",
                        color: "white",
                        padding: "0.6rem 1.2rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      💾 Save Analysis
                    </button>
                  )}
                </div>
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4 overflow-x-auto">
              {/* Record & Analyze Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "record"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("record")}
              >
                <FaMicrophone />
                Record & Analyze
              </button>

              {/* Saved Recordings Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "saved"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("saved")}
              >
                <FaHistory />
                Saved Recordings
              </button>
            </div>

            {activeTab === "record" && (
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

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                        <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                          Filler Count
                        </h3>
                        <div className="flex justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-white/10 text-white text-lg lg:text-xl xl:text-2xl font-semibold">
                          {result.fillerCount}
                        </div>
                      </div>

                      {audioDuration && (
                        <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                          <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                            Duration
                          </h3>
                          <div className="flex flex-col justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-white/10 text-white text-lg lg:text-xl xl:text-2xl font-semibold">
                            <FaClock className="text-white text-xl lg:text-2xl mb-1" />
                            <span>{audioDuration.toFixed(1)}s</span>
                          </div>
                        </div>
                      )}

                      {recordedAt && (
                        <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                          <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                            Recorded
                          </h3>
                          <div className="flex flex-col justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-white/10 text-white text-lg lg:text-xl xl:text-2xl font-semibold">
                            <span className="text-xs text-center">{formatDateTime(recordedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Audio Playback */}
                    {audioURL && (
                      <div className="mb-6">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <FaPlay />
                          Audio Playback
                        </h4>
                        <audio
                          controls
                          src={audioURL}
                          className="w-full rounded-lg"
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                          }}
                        />
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={saveRecording}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                    >
                      <FaSave />
                      Save Analysis
                    </button>
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
            )}

            {activeTab === "saved" && (
              <div className="flex flex-col w-full h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  Saved Recordings
                </h2>

                {savedRecs.length > 0 ? (
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-xl p-6 border-2 border-white/20 shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-3 px-4 text-[#00ccff] font-semibold">Date & Time</th>
                            <th className="text-left py-3 px-4 text-[#00ccff] font-semibold">Filler Count</th>
                            <th className="text-left py-3 px-4 text-[#00ccff] font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {savedRecs.map((rec, index) => (
                            <tr
                              key={rec._id}
                              className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                            >
                              <td className="py-3 px-4 text-white/90">{formatDateTime(rec.date)}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  rec.fillerCount <= 2 
                                    ? "bg-green-500/20 text-green-300" 
                                    : rec.fillerCount <= 5
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : rec.fillerCount <= 10
                                    ? "bg-orange-500/20 text-orange-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}>
                                  {rec.fillerCount}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white/90">{rec.duration.toFixed(2)}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-xl p-8 border-2 border-white/20 shadow-2xl text-center">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FaHistory className="text-white text-2xl" />
                    </motion.div>
                    <h3 className="text-[#00ccff] text-xl font-bold mb-2">No Saved Recordings</h3>
                    <p className="text-white/80">
                      Record and analyze your speech to see your saved recordings here.
                    </p>
                  </div>
                )}
              </div>
            )}

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
