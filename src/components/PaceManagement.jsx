import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaClock } from "react-icons/fa";
import GaugeChart from "react-gauge-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

import image01 from "/assets/images/image01.png";

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
          wordCount: data.wordCount,
          duration: data.duration,
          wpm: data.wpm,
          prediction: data.prediction,
          consistencyScore: data.consistencyScore,
          feedback: data.feedback,
          pacingCurve: mergedCurve,
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
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)]  p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-6 flex flex-col justify-center items-center">
        <div className="flex w-full h-full gap-8">
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
                  style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}
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
                    onClick={() => alert("💡 Showing suggestions...")}
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

            <img
              src={image01}
              alt="Speech Visualization"
              style={{
                marginTop: "2rem",
                width: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Right side */}

          <div className="w-full flex flex-col">
            <div className="flex space-x-4 mb-4">
              {/* Speech Rate Tab */}
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 ${
                  activeTab === "rate"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("rate")}
              >
                Speech Rate Analysis
              </button>

              {/* Pauses & Breathing Tab */}
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 ${
                  activeTab === "pause"
                    ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                    : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                }`}
                onClick={() => setActiveTab("pause")}
              >
                Pauses & Breathing Analysis
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
                <h2 className="text-2xl font-bold text-white mt-7 mb-4">
                  Speech Rate Analysis
                </h2>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                  {/* Word Count */}
                  <div className="flex flex-col items-center rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-lg font-semibold mb-2">
                      Word Count
                    </h3>
                    <div className="flex justify-center items-center rounded-full w-24 h-24 sm:w-32 sm:h-32 bg-white/10 text-white text-xl font-semibold">
                      {results.wordCount}
                    </div>
                  </div>

                  {/* WPM Gauge */}
                  <div className="flex flex-col items-center rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-lg font-semibold mb-2">
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
                        minWidth: "16rem",
                        height: "8rem",
                      }}
                    />
                    <p className="mt-1 text-white font-medium">
                      {getWpmLabel(results.wpm)}({results.wpm.toFixed(1)} WPM)
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col items-center rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-lg font-semibold mb-2">
                      Duration
                    </h3>
                    <div className="flex flex-col justify-center items-center rounded-full w-24 h-24 sm:w-32 sm:h-32 bg-white/10 text-white text-xl font-semibold">
                      <FaClock className="text-white text-2xl mb-1" />
                      <span>{formatTime(results.duration)}</span>
                    </div>
                  </div>

                  {/* Confidence & Feedback */}
                  <div className="flex flex-col items-center w-full rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
                    <h3 className="text-white text-lg font-semibold mb-2">
                      Pacing Consistency
                    </h3>
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden mb-2">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          results.consistencyScore >= 80
                            ? "bg-green-400"
                            : results.consistencyScore >= 60
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${results.consistencyScore}%` }}
                      ></div>
                    </div>
                    <p className="text-white text-md font-semibold">
                      {results.consistencyScore?.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div
                  className={`w-full text-md text-center mt-5 px-4 py-3 rounded-lg font-medium shadow-md ${
                    results.prediction === "Fast"
                      ? "bg-red-600/30 text-red-200 border border-red-500"
                      : results.prediction === "Slow"
                      ? "bg-yellow-600/30 text-yellow-100 border border-yellow-400"
                      : "bg-green-600/30 text-green-100 border border-green-400"
                  }`}
                >
                  {results.feedback}
                </div>

                {/* 🧠 Pacing Curve Section */}
                <div className="mt-5 w-full p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                  <h3 className="text-white text-xl font-semibold mb-4">
                    Speech Pacing Curve
                  </h3>

                  <ResponsiveContainer width="100%" height={300}>
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
              <div className="flex flex-col w-full h-full ">
                <h2 className="text-2xl font-bold text-white mt-2 mb-4">
                  Speech Pauses and Breathing Analysis
                </h2>

                {/* Top Row: Timeline & Distribution Charts */}
                <div className="flex gap-4 h-1/2 mb-4">
                  {/* Pause Timeline Chart */}

                  <div className=" w-full p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-xl font-semibold mb-4">
                      Pause Timeline
                    </h3>
                    <div className="w-full h-64 bg-white/10 rounded-md flex items-center justify-center text-white/50 text-sm">
                      [Timeline chart will go here – color-coded by pause
                      reason]
                    </div>
                  </div>

                  {/* Pause Distribution Chart */}

                  <div className="w-full p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-xl font-semibold mb-4">
                      Pause Type Distribution
                    </h3>
                    <div className="w-full h-64 bg-white/10 rounded-md flex items-center justify-center text-white/50 text-sm">
                      [Pie or bar chart of pause reasons]
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Scatter Plot & Coaching Tips */}
                <div className="flex gap-4 h-1/2">
                  <div className=" w-full p-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-lg">
                    <h3 className="text-white text-xl font-semibold mb-4">
                      Breathing Pattern Scatter
                    </h3>
                    <div className="w-full h-64 bg-white/10 rounded-md flex items-center justify-center text-white/50 text-sm">
                      [Scatter plot: pause duration vs breath value, colored by
                      breath type]
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaceManagement;
