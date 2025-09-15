import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaComment, FaChartBar, FaPlay, FaStop, FaPause, FaMicrophone, FaClock, FaBrain, FaCheckCircle } from "react-icons/fa";
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
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchSavedRecordings();
  }, []);

  // Timer effect for recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const fetchSavedRecordings = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching saved recordings from:", "http://localhost:3001/api/rec/save");
      
      const res = await axios.get("http://localhost:3001/api/rec/save", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Saved recordings response:", res.data);
      setSavedRecs(res.data);
    } catch (err) {
      console.error("Failed to fetch saved recordings", err);
      console.error("Error response:", err.response?.data);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        },
      });
      
      mediaStreamRef.current = stream;
      
      // Use WebM format which is most reliable for browser recordings
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
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Create file with proper name and type for backend compatibility
        const audioFile = new File([audioBlob], "recording.webm", { type: mimeType });
        setAudioBlob(audioFile);
        setAudioURL(URL.createObjectURL(audioBlob));
        
        // Calculate duration using AudioContext - exact same logic as filler.txt
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioBlob.arrayBuffer().then(arrayBuffer => {
          audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
            setAudioDuration(audioBuffer.duration);
          });
        });
        
        setRecordedAt(new Date());
        setResult(null);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordTime(0);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone. Please check permissions.");
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
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return alert("No audio recorded");

    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      console.log("Uploading audio to:", "http://localhost:3001/api/recording/upload");
      console.log("Audio blob:", audioBlob);
      console.log("Token:", token ? "Present" : "Missing");

      const res = await axios.post("http://localhost:3001/api/recording/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", res.data);
      setResult(res.data);
    } catch (err) {
      console.error("Upload failed", err);
      console.error("Error response:", err.response?.data);
      alert("Something went wrong during upload. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecording = async () => {
    if (!result || !audioDuration) return alert("No analysis to save");

    try {
      const token = localStorage.getItem("token");
      
      console.log("Saving recording to:", "http://localhost:3001/api/rec/save");
      console.log("Data to save:", {
        fillerCount: result.fillerCount,
        duration: audioDuration,
        date: recordedAt,
      });

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
      console.error("Error response:", err.response?.data);
      alert("Failed to save recording. Check console for details.");
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
              <div className="relative flex items-center mt-4 justify-center">
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

              {/* Recording Controls */}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={pauseRecording}
                  disabled={!isRecording || isPaused}
                  className="p-3 bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  <FaPause className="text-black text-xl" />
                </button>
                <button
                  onClick={startRecording}
                  disabled={isRecording && !isPaused}
                  className="p-3 bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  <FaPlay className="text-black text-xl" />
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="p-3 bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  <FaStop className="text-black text-xl" />
                </button>
              </div>

              {/* Timer */}
              <p className="text-black text-lg mt-4 font-semibold">
                Recording Time: {formatTime(recordTime)}
              </p>
            </div>

            <button
                onClick={uploadAudio}
                disabled={!audioBlob || isLoading}
                className="mt-4 w-full bg-[#0084a6] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#00a8cc] transition disabled:opacity-50"
                style={{ color: 'black' }}
              >
                {isLoading ? "⏳ Analyzing..." : "⬆ Upload & Analyze"}
              </button>
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
                <FaChartBar />
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
                <FaComment />
                Saved Recordings
              </button>
            </div>

            {/* Tab Content */}
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

                  {/* Filler Count - single row */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] text-white">
                      <span className="text-sm lg:text-lg font-semibold mr-2">Filler Count:</span>
                      <span className="text-lg lg:text-xl font-bold">{result.fillerCount}</span>
                    </div>
                  </div>

                  {audioDuration && (
                    <div className="mb-4">
                      <div className="flex items-center justify-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] text-white">
                        <span className="text-sm lg:text-lg font-semibold mr-2">⏱️ Duration:</span>
                        <span className="text-lg lg:text-xl font-bold">{audioDuration.toFixed(2)} s</span>
                      </div>
                    </div>
                  )}

                  {recordedAt && (
                    <div className="mb-4">
                      <div className="flex items-center justify-center rounded-lg p-3 lg:p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] text-white">
                        <span className="text-sm lg:text-lg font-semibold mr-2">📅 Date:</span>
                        <span className="text-lg lg:text-xl font-bold">{formatDateTime(recordedAt)}</span>
                      </div>
                    </div>
                  )}

                  {audioURL && (
                    <div className="mt-4 mb-4">
                      <h4 className="text-md font-semibold text-[#00ccff] mb-2">🔊 Playback</h4>
                      <audio controls className="w-full rounded-lg">
                        <source src={audioURL} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <button
                    onClick={saveRecording}
                    className="mt-4 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition"
                    style={{ color: 'black' }}
                  >
                    💾 Save Analysis
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

            {/* Saved Recordings Tab */}
            {activeTab === "saved" && (
              <div className="flex flex-col w-full">
                <h2 className="text-xl lg:text-2xl font-bold text-white mt-2 mb-4">
                  Saved Recordings
                </h2>
                {savedRecs.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-white/20 shadow-sm bg-white/10 backdrop-blur-sm">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-white/20 text-white">
                        <tr>
                          <th className="px-4 py-2 border border-white/30">Date</th>
                          <th className="px-4 py-2 border border-white/30">Filler Count</th>
                          <th className="px-4 py-2 border border-white/30">Duration (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedRecs.map((rec) => (
                          <tr key={rec._id} className="text-white hover:bg-white/20 transition-colors">
                            <td className="border border-white/30 px-4 py-2">{formatDateTime(rec.date)}</td>
                            <td className="border border-white/30 px-4 py-2">{rec.fillerCount}</td>
                            <td className="border border-white/30 px-4 py-2">{rec.duration.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-white/70">No saved recordings yet.</p>
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