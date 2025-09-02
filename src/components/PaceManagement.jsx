import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaClock, FaChartBar, FaUserCheck, FaBrain } from "react-icons/fa";
import GaugeChart from "react-gauge-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

import image01 from "../assets/images/pacebg.png";

const PaceManagement = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  let animationFrameId = useRef(null);
  const [activeTab, setActiveTab] = useState("rate");

  const [results, setResults] = useState({
    wordCount: 0,
    duration: 0,
    wpm: 0,
    prediction: "",
    consistencyScore: 0,
    feedback: "",
    pacingCurve: [],
    pauseTimeline: [],
    pauseDistribution: [],
    advancedMetrics: {},
    pauseAnalysis: {},
    voiceQuality: {},
    suggestions: [],
    structuredSuggestions: {},
  });

  const [recordTime, setRecordTime] = useState(0);

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

  useEffect(() => {
    if (isRecording && !isPaused) {
      startAnalyzing();
    }
  }, [isRecording, isPaused]);

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
            setAudioUrl(audioUrl);

            analyzeAudio(audioBlob, setResults);
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
      setRecordTime(0); // ⏱️ Reset the timer here!
      mediaRecorderRef.current.stop();
      cancelAnimationFrame(animationFrameId.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      audioChunksRef.current = [];
    }
  };

  const analyzeAudio = async (blob, setResults) => {
    const formData = new FormData();
    formData.append("file", blob, "speech.wav");

    try {
      const response = await fetch("http://localhost:8000/analyze/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const pacingCurve = data.pacingCurve || [];
      const idealLines = data.idealLines || [];
      const mergedCurve = pacingCurve.map((point, index) => ({
        ...point,
        upper: idealLines[index]?.upper || 150,
        lower: idealLines[index]?.lower || 100,
      }));

      if (data.error) {
        console.error("Backend error:", data.error);
      } else {
        setResults({
          wordCount: data.wordCount || 0,
          duration: data.duration || 0,
          wpm: data.wpm || 0,
          prediction: data.prediction || "Analyzing...",
          consistencyScore: data.consistencyScore || 0,
          feedback: data.feedback || "Analysis in progress...",
          pacingCurve: data.pacingCurve || [],
          pauseTimeline: data.pauseTimeline || [],
          pauseDistribution: data.pauseDistribution || [],
          advancedMetrics: data.advancedMetrics || {},
          pauseAnalysis: data.pauseAnalysis || {},
          voiceQuality: data.voiceQuality || {},
          suggestions: data.suggestions || [],
          structuredSuggestions: data.structuredSuggestions || {},
          enhancedFeedback: data.enhancedFeedback || {},
        });
      }
    } catch (err) {
      console.error("Error sending audio:", err);
    }
  };

  const getWpmLabel = (wpm) => {
    if (wpm < 100) return "Slow";
    if (wpm <= 150) return "Ideal";
    return "Fast";
  };

  const downloadPDFReport = () => {
    const node = document.getElementById("pdf-report");

    const fallbackColor = (style) => {
      const el = document.createElement("div");
      el.style.color = style;
      return getComputedStyle(el).color || "#000";
    };

    htmlToImage
      .toPng(node, {
        style: {
          // fallback for unsupported colors like oklab
          color: fallbackColor("black"),
          backgroundColor: fallbackColor("white"),
        },
      })
      .then((dataUrl) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("Pace_Feedback_Report.pdf");
      })
      .catch((error) => {
        console.error("❌ Failed to generate PDF", error);
      });
  };

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
              Voice Recorder
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
            {audioUrl && (
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
                  src={audioUrl}
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
                    onClick={downloadPDFReport}
                    style={{
                      backgroundColor: "#025838",
                      color: "white",
                      padding: "0.6rem 1.2rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    📝 Generate Report
                  </button>

                  <button
                    onClick={() => {
                      const suggestions = results.suggestions || [];
                      if (suggestions.length > 0) {
                        alert(`💡 Top Suggestions:\n\n${suggestions.slice(0, 3).join('\n\n')}`);
                      } else {
                        alert("💡 Record your speech first to get personalized suggestions!");
                      }
                    }}
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
                    💡 Suggestions
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Left Side Section - Quick Reference Only */}
            <div className="w-full mt-8 h-[500px] flex flex-col">
              {/* Speech Pace Management Tips & Guidelines */}
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
                      📋 Speech Pace Quick Reference
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
                        <div className="text-emerald-300 dark:text-emerald-200 font-bold text-base lg:text-lg drop-shadow-md">120-150</div>
                        <div className="text-white/90 text-xs font-semibold">WPM Range</div>
                        <div className="text-white/70 text-xs mt-1">Optimal Pace</div>
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
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">⏱️</span>
                      </motion.div>
                      <div className="text-blue-300 dark:text-blue-200 font-bold text-base lg:text-lg drop-shadow-md">0.5-2s</div>
                      <div className="text-white/90 text-xs font-semibold">Pause Length</div>
                      <div className="text-white/70 text-xs mt-1">Strategic Timing</div>
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
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">📊</span>
                      </motion.div>
                      <div className="text-amber-300 dark:text-amber-200 font-bold text-base lg:text-lg drop-shadow-md">8-12%</div>
                      <div className="text-white/90 text-xs font-semibold">Pause Ratio</div>
                      <div className="text-white/70 text-xs mt-1">Total Speech</div>
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
                        <span className="text-white text-lg lg:text-xl drop-shadow-md">⚠️</span>
                      </motion.div>
                      <div className="text-rose-300 dark:text-rose-200 font-bold text-base lg:text-lg drop-shadow-md">&lt;5s</div>
                      <div className="text-white/90 text-xs font-semibold">Max Pause</div>
                      <div className="text-white/70 text-xs mt-1">Avoid Longer</div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Right side */}
          <div className="w-full flex flex-col">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4 overflow-x-auto">
              {/* Speech Rate Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "rate"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("rate")}
              >
                <FaChartBar />
                Speech Rate
              </button>

              {/* Pause Analysis Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "pause"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("pause")}
              >
                <FaClock />
                Pause Analysis
              </button>

              {/* Advanced Metrics Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "advanced"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("advanced")}
              >
                <FaBrain />
                AI Insights
              </button>

              {/* Voice Quality Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "voice"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("voice")}
              >
                <FaUserCheck />
                Voice Quality
              </button>
            </div>
            {activeTab === "rate" && (
              <div
                style={{
                  left: "-9999px",
                  top: 0,
                 
                  pointerEvents: "none",
                }}
                id="pdf-report"
                className="flex flex-col w-full"
              >
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-7 mb-4">
                  Speech Rate Analysis
                </h2>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6 w-full">
                  {/* Word Count */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Word Count
                    </h3>
                    <div className="flex justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-white/10 text-white text-lg lg:text-xl xl:text-2xl font-semibold">
                      {results.wordCount}
                    </div>
                  </div>

                  {/* WPM Gauge */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Speech Rate
                    </h3>
                    <GaugeChart
                      id="wpm-gauge"
                      nrOfLevels={30}
                      colors={["#ff0000", "#ff9900", "#00cc00"]}
                      arcWidth={0.3}
                      percent={results.wpm / 200}
                      textColor="#fff"
                      style={{
                        width: "100%",
                        minWidth: "12rem",
                        height: "6rem",
                      }}
                    />
                    <p className="mt-1 text-white font-medium text-sm lg:text-base">
                      {getWpmLabel(results.wpm)}({results.wpm.toFixed(1)} WPM)
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Duration
                    </h3>
                    <div className="flex flex-col justify-center items-center rounded-full w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 bg-white/10 text-white text-lg lg:text-xl xl:text-2xl font-semibold">
                      <FaClock className="text-white text-xl lg:text-2xl mb-1" />
                      <span>{formatTime(results.duration)}</span>
                    </div>
                  </div>

                  {/* Confidence & Feedback */}
                  <div className="flex flex-col items-center w-full rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">
                      Pacing Consistency
                    </h3>
                    <div className="w-full bg-white/20 rounded-full h-3 lg:h-4 overflow-hidden mb-2">
                      <div
                        className={`h-3 lg:h-4 rounded-full transition-all duration-500 ${
                          results.consistencyScore >= 80
                            ? "bg-green-400"
                            : results.consistencyScore >= 60
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${results.consistencyScore}%` }}
                      ></div>
                    </div>
                    <p className="text-white text-sm lg:text-md font-semibold">
                      {results.consistencyScore?.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {/* Enhanced Feedback Section */}
                <div className="mt-6 space-y-4">
                  {/* Overall Assessment */}
                  <div className="w-full text-center px-4 py-4 rounded-xl font-semibold shadow-lg bg-gradient-to-r from-[#00171f] to-[#003b46] border-2 border-[#00ccff]/40">
                    <h3 className="text-[#00ccff] text-lg lg:text-xl mb-2">🎯 Overall Assessment</h3>
                    <p className="text-white text-base lg:text-lg">{results.feedback}</p>
                  </div>

                  {/* Enhanced Feedback Details */}
                  {results.enhancedFeedback && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Pace Analysis */}
                      <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-4 border-2 border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{results.enhancedFeedback.pace_analysis?.emoji}</span>
                          <h4 className="text-white font-semibold">Pace Analysis</h4>
                        </div>
                        <div className="text-white/90 text-sm mb-3">
                          {results.enhancedFeedback.pace_analysis?.feedback}
                        </div>
                        <div className="space-y-2">
                          {results.enhancedFeedback.pace_analysis?.suggestions?.slice(0, 2).map((suggestion, index) => (
                            <div key={index} className="text-white/70 text-xs bg-white/10 rounded-lg p-2">
                              💡 {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Consistency Analysis */}
                      <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-4 border-2 border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{results.enhancedFeedback.consistency_analysis?.emoji}</span>
                          <h4 className="text-white font-semibold">Consistency</h4>
                        </div>
                        <div className="text-white/90 text-sm mb-3">
                          {results.enhancedFeedback.consistency_analysis?.feedback}
                        </div>
                        {results.enhancedFeedback.consistency_analysis?.std_dev && (
                          <div className="text-white/70 text-xs mb-2">
                            Std Dev: {results.enhancedFeedback.consistency_analysis.std_dev.toFixed(1)} WPM
                          </div>
                        )}
                        <div className="space-y-2">
                          {results.enhancedFeedback.consistency_analysis?.suggestions?.slice(0, 2).map((suggestion, index) => (
                            <div key={index} className="text-white/70 text-xs bg-white/10 rounded-lg p-2">
                              💡 {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flow Analysis */}
                      <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-4 border-2 border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{results.enhancedFeedback.flow_analysis?.emoji}</span>
                          <h4 className="text-white font-semibold">Speech Flow</h4>
                        </div>
                        <div className="text-white/90 text-sm mb-3">
                          {results.enhancedFeedback.flow_analysis?.feedback}
                        </div>
                        {results.enhancedFeedback.flow_analysis?.words_per_second && (
                          <div className="text-white/70 text-xs mb-2">
                            Flow Rate: {results.enhancedFeedback.flow_analysis.words_per_second.toFixed(1)} words/sec
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Priority Recommendations */}
                  {results.enhancedFeedback?.priority_recommendations && (
                    <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-4 border-2 border-[#00ccff]/40">
                      <h3 className="text-[#00ccff] text-lg lg:text-xl mb-4 text-center">🚀 Priority Action Items</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.enhancedFeedback.priority_recommendations.map((rec, index) => (
                          <div key={index} className={`p-4 rounded-lg border-2 ${
                            rec.priority === "High" 
                              ? "bg-red-500/20 border-red-500/50" 
                              : rec.priority === "Medium"
                              ? "bg-yellow-500/20 border-yellow-500/50"
                              : "bg-green-500/20 border-green-500/50"
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                rec.priority === "High" 
                                  ? "bg-red-500 text-white" 
                                  : rec.priority === "Medium"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-500 text-white"
                              }`}>
                                {rec.priority}
                              </span>
                              <h4 className="text-white font-semibold">{rec.area}</h4>
                            </div>
                            <p className="text-white/90 text-sm mb-2">{rec.action}</p>
                            <p className="text-white/70 text-xs bg-white/10 rounded p-2">
                              🎯 {rec.exercise}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🧠 Pacing Curve Section */}
                <div className="mt-5 w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                  <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">
                    Speech Pacing Curve
                  </h3>

                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={results.pacingCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: "#fff" }}
                        label={{
                          value: "Time",
                          position: "insideBottom",
                          fill: "#fff",
                        }}
                      />
                      <YAxis
                        domain={[0, 250]}
                        tick={{ fill: "#fff" }}
                        label={{
                          value: "WPM",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#fff",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#002b36",
                          border: "none",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />

                      {/* 🔵 Actual WPM */}
                      <Line
                        type="monotone"
                        dataKey="wpm"
                        stroke="#00ccff"
                        strokeWidth={2}
                        dot={false}
                      />

                      {/* 🟢 Upper dashed */}
                      <Line
                        type="monotone"
                        dataKey="upper"
                        stroke="#00ff00"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="Upper Ideal Pace"
                      />

                      {/* 🟠 Lower dashed */}
                      <Line
                        type="monotone"
                        dataKey="lower"
                        stroke="#ff9900"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="Lower Ideal Pace"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "pause" && (
              <div className="flex flex-col w-full h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  Pause Analysis & Timing
                </h2>

                {/* Critical Pause Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6 mb-6">
                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">🚨 Excessive Pauses</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-red-500/30 text-red-300 text-xl font-semibold border-2 border-red-500/50">
                      {results.pauseAnalysis?.excessivePauses || 0}
                    </div>
                    <p className="text-white/70 text-xs mt-1">{'>'}5.0s (Critical)</p>
                  </div>

                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">⏱️ Max Pause</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-orange-500/20 text-orange-300 text-lg font-semibold">
                      {(results.pauseAnalysis?.pauseMax || 0).toFixed(1)}s
                    </div>
                    <p className="text-white/70 text-xs mt-1">Longest pause</p>
                  </div>

                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">📊 Pause Ratio</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-blue-500/20 text-blue-300 text-lg font-semibold">
                      {(results.pauseAnalysis?.pauseRatio || 0).toFixed(1)}%
                    </div>
                    <p className="text-white/70 text-xs mt-1">Target: 8-12%</p>
                  </div>

                  <div className="flex flex-col items-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-sm lg:text-lg font-semibold mb-2">🎯 Pause Efficiency</h3>
                    <div className="flex justify-center items-center rounded-full w-16 h-16 lg:w-20 lg:h-20 bg-green-500/20 text-green-300 text-lg font-semibold">
                      {(results.pauseAnalysis?.pauseEfficiency || 0).toFixed(1)}s
                    </div>
                    <p className="text-white/70 text-xs mt-1">Avg pause length</p>
                  </div>
                </div>

                {/* Advanced Pause Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">📈 Pause Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>P50 (Median):</span>
                        <span>{(results.pauseAnalysis?.averagePauseLength || 0).toFixed(2)}s</span>
                    </div>
                      <div className="flex justify-between text-white/80">
                        <span>P90:</span>
                        <span>{(results.pauseAnalysis?.pauseP90 || 0).toFixed(2)}s</span>
                  </div>
                      <div className="flex justify-between text-white/80">
                        <span>P95:</span>
                        <span>{(results.pauseAnalysis?.pauseP95 || 0).toFixed(2)}s</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Std Dev:</span>
                        <span>{(results.pauseAnalysis?.pauseStd || 0).toFixed(2)}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">🔄 Pattern Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Regularity:</span>
                        <span>{((results.pauseAnalysis?.pausePatternRegularity || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Spacing Consistency:</span>
                        <span>{((results.pauseAnalysis?.pauseSpacingConsistency || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Max Long Streak:</span>
                        <span>{results.pauseAnalysis?.maxLongStreak || 0}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Total Pause Time:</span>
                        <span>{(results.pauseAnalysis?.totalPauseTime || 0).toFixed(1)}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">🎭 Context Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Transition Pauses:</span>
                        <span>{results.advancedMetrics?.transition_pause_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Emphasis Pauses:</span>
                        <span>{results.advancedMetrics?.emphasis_pause_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Optimal Transitions:</span>
                        <span>{(results.advancedMetrics?.optimal_transition_ratio || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Optimal Emphasis:</span>
                        <span>{(results.advancedMetrics?.optimal_emphasis_ratio || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Pause Timeline */}
                  <div className="w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Pause Timeline</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <ScatterChart data={results.pauseTimeline || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="time" tick={{ fill: "#fff" }} label={{ value: "Time (s)", position: "insideBottom", fill: "#fff" }} />
                        <YAxis dataKey="duration" tick={{ fill: "#fff" }} label={{ value: "Duration (s)", angle: -90, position: "insideLeft", fill: "#fff" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#002b36", border: "none", borderRadius: "8px", color: "white" }}
                          formatter={(value, name) => [value, name === "duration" ? "Pause Duration" : name]}
                        />
                        <Scatter
                          dataKey="duration"
                          fill={(entry) => {
                            if (entry?.type === "short") return "#00ff00";
                            if (entry?.type === "medium") return "#ffaa00";
                            return "#ff0000";
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pause Distribution */}
                  <div className="w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Pause Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={results.pauseDistribution || []}
                          dataKey="percentage"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ type, percentage }) => `${type}: ${percentage}%`}
                        >
                          {(results.pauseDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#002b36", border: "none", borderRadius: "8px", color: "white" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                  <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Pause Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(results.suggestions || []).slice(0, 4).map((suggestion, index) => (
                      <div key={index} className="p-3 bg-white/10 rounded-lg">
                        <p className="text-white text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="flex flex-col w-full h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  AI-Powered Insights
                </h2>

                {/* Toastmasters Compliance & Advanced Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Toastmasters Score */}
                  <div className="p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">🏆 Toastmasters Compliance</h3>
                    <GaugeChart
                      id="toastmasters-gauge"
                      nrOfLevels={20}
                      colors={["#ff0000", "#ff9900", "#00cc00"]}
                      arcWidth={0.3}
                      percent={(results.advancedMetrics?.toastmasters_score || 0) / 100}
                      textColor="#fff"
                      style={{ width: "100%", height: "200px" }}
                    />
                    <p className="text-white text-center mt-2">
                      {(results.advancedMetrics?.toastmasters_score || 0).toFixed(1)}% Industry Standard
                    </p>
          </div>

                  {/* Advanced Metrics Radar */}
                  <div className="p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">📊 Performance Radar</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={[
                        { metric: "Rhythm Consistency", value: results.advancedMetrics?.rhythm_consistency || 0 },
                        { metric: "Confidence Score", value: results.advancedMetrics?.confidence_score || 0 },
                        { metric: "Speaking Efficiency", value: results.advancedMetrics?.speaking_efficiency || 0 },
                        { metric: "Contextual Pause Score", value: results.advancedMetrics?.contextual_score || 0 },
                        { metric: "Cognitive Load", value: results.advancedMetrics?.cognitive_load || 0 },
                        { metric: "Golden Ratio Pauses", value: results.advancedMetrics?.golden_ratio || 0 },
                        { metric: "Words Per Minute Consistency", value: results.advancedMetrics?.wpm_consistency || 0 },
                        { metric: "Words Per Minute Stability", value: results.advancedMetrics?.wpm_stability || 0 },
                        { metric: "Pause Pattern Regularity", value: results.advancedMetrics?.pause_pattern_regularity || 0 },
                        { metric: "Speech Flow Continuity", value: results.advancedMetrics?.speech_continuity || 0 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "#fff", fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#fff", fontSize: 8 }} />
                        <Radar dataKey="value" stroke="#00ccff" fill="#00ccff" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Comprehensive AI Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">🎵 Rhythm Consistency</h4>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                        style={{ width: `${results.advancedMetrics?.rhythm_consistency || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-white/70 text-sm">{(results.advancedMetrics?.rhythm_consistency || 0).toFixed(1)}%</p>
                    <p className="text-white/50 text-xs">Outliers: {results.advancedMetrics?.rhythm_outliers || 0}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">💪 Confidence Score</h4>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                        style={{ width: `${results.advancedMetrics?.confidence_score || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-white/70 text-sm">{(results.advancedMetrics?.confidence_score || 0).toFixed(1)}%</p>
                    <p className="text-white/50 text-xs">Memory Retrieval: {results.advancedMetrics?.memory_retrieval_pauses || 0}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">⚡ Speaking Efficiency</h4>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                        style={{ width: `${results.advancedMetrics?.speaking_efficiency || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-white/70 text-sm">{(results.advancedMetrics?.speaking_efficiency || 0).toFixed(1)}%</p>
                    <p className="text-white/50 text-xs">Pause Efficiency: {(results.advancedMetrics?.pause_efficiency || 0).toFixed(1)}s</p>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">🧠 Cognitive Load</h4>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
                        style={{ width: `${results.advancedMetrics?.cognitive_load || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-white/70 text-sm">{(results.advancedMetrics?.cognitive_load || 0).toFixed(1)}%</p>
                    <p className="text-white/50 text-xs">Optimal Ratio: {(results.advancedMetrics?.optimal_cognitive_ratio || 0).toFixed(1)}%</p>
                  </div>
                </div>

                {/* Advanced Statistical Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-3">📊 Advanced Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Pause Pattern Randomness:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/20 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                              style={{ width: `${results.advancedMetrics?.pause_entropy || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{(results.advancedMetrics?.pause_entropy || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Pause Pattern Repetition:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/20 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-600"
                              style={{ width: `${results.advancedMetrics?.pause_autocorrelation || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{(results.advancedMetrics?.pause_autocorrelation || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Pause Duration Trends:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/20 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                              style={{ width: `${results.advancedMetrics?.pause_trend_analysis || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{(results.advancedMetrics?.pause_trend_analysis || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>Pause Pattern Complexity:</span>
                        <span>{(results.advancedMetrics?.pause_fractal_dimension || 0).toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>Pause Duration Variation:</span>
                        <span>{(results.advancedMetrics?.pause_volatility || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-3">🎯 Pace Management</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Words Per Minute Consistency:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/20 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                              style={{ width: `${results.advancedMetrics?.wpm_consistency || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{(results.advancedMetrics?.wpm_consistency || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>Words Per Minute Stability:</span>
                        <span>{(results.advancedMetrics?.wpm_stability || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>Speaking Speed Changes:</span>
                        <span>{(results.advancedMetrics?.wpm_acceleration || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>Pause Spacing Patterns:</span>
                        <span>{(results.advancedMetrics?.gap_clustering || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm">
                        <span>Speech Flow Continuity:</span>
                        <span>{(results.advancedMetrics?.speech_continuity || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Structured Suggestions */}
                <div className="mt-6 p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                  <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">🎯 Priority Improvements</h3>
                  <div className="space-y-4">
                    {results.structuredSuggestions?.critical_issues?.map((issue, index) => (
                      <div key={index} className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <h4 className="text-red-300 font-semibold">🚨 Critical: {issue.issue}</h4>
                        <p className="text-white text-sm mt-1">{issue.action}</p>
                        <p className="text-white/70 text-xs mt-1">Current: {issue.current} → Target: {issue.target}</p>
                      </div>
                    ))}
                    
                    {results.structuredSuggestions?.major_improvements?.map((improvement, index) => (
                      <div key={index} className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <h4 className="text-yellow-300 font-semibold">⚠️ Important: {improvement.issue}</h4>
                        <p className="text-white text-sm mt-1">{improvement.action}</p>
                        <p className="text-white/70 text-xs mt-1">Current: {improvement.current} → Target: {improvement.target}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="flex flex-col w-full h-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  Voice Quality Analysis
                </h2>

                {/* Essential Voice Quality Metrics (Non-Loudness) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">🎤 Voice Clarity</h4>
                    <p className="text-xl text-green-300 font-bold">{(results.voiceQuality?.hnr || 0).toFixed(1)} dB</p>
                    <p className="text-white/70 text-sm">Harmonic-to-Noise Ratio</p>
                    <p className="text-white/70 text-sm">Higher = Better Voice Quality</p>
                    <p className="text-white/60 text-xs mt-2">Measures voice clarity and intelligibility</p>
                  </div>

                  <div className="p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h4 className="text-white font-semibold mb-2">🎼 Formant Analysis</h4>
                    <p className="text-xl text-blue-300 font-bold">{((results.voiceQuality?.formants?.f2 || 0) - (results.voiceQuality?.formants?.f1 || 0)).toFixed(1)} Hz</p>
                    <p className="text-white/70 text-sm">F2-F1 Distance</p>
                    <p className="text-white/70 text-sm">Speech Articulation</p>
                    <p className="text-white/60 text-xs mt-2">F1, F2, F3 vowel frequencies for clear speech</p>
                  </div>
                </div>



                {/* Voice Quality Chart */}
                <div className="w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg mb-6">
                  <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Voice Quality Metrics</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { 
                        metric: "Voice Clarity", 
                        value: Math.max(0, Math.min(100, (results.voiceQuality?.hnr || 0) * 5)),
                        color: "#10b981"
                      },
                      { 
                        metric: "Formant Balance", 
                        value: Math.max(0, 100 - Math.abs((results.voiceQuality?.formants?.f2 || 0) - (results.voiceQuality?.formants?.f1 || 0)) / 100),
                        color: "#3b82f6"
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="metric" tick={{ fill: "#fff", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#fff" }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#002b36", border: "none", borderRadius: "8px", color: "white" }}
                      />
                      <Bar dataKey="value" fill="#00ccff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Voice Quality Recommendations */}
                <div className="w-full p-4 lg:p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                  <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Voice Improvement Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">🎤 Voice Clarity</h4>
                      <p className="text-white/80 text-sm">Focus on breath support and relaxation techniques to improve voice clarity and reduce vocal tension.</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">🎯 Articulation</h4>
                      <p className="text-white/80 text-sm">Practice articulation exercises to improve speech clarity and formant balance for better intelligibility.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Animated Image - Fixed Position at End of Each Tab */}
            <motion.div
              className="mt-8 relative overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl"
              initial={{ opacity: 0, x: 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              style={{ position: 'sticky', bottom: '20px' }}
            >
              {/* Floating Particles Background */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-60"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Main Image */}
              <motion.img
                src={image01}
                alt="Speech Visualization"
                className="w-full h-70 object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
              />

              {/* Overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
              />

              {/* Bottom Info Panel */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <h3 className="text-white font-semibold text-lg mb-2">🎤 Speech Mastery</h3>
                <p className="text-white/80 text-sm">Interactive visualization of your speaking journey</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaceManagement;
