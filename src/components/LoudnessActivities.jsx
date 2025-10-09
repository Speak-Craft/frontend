import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaClock, FaChartBar, FaTrophy, FaGamepad, FaMedal, FaRocket, FaBullseye, FaVolumeUp, FaCheckCircle, FaSave, FaHistory } from "react-icons/fa";
import axios from "axios";
import * as faceapi from "face-api.js";

const LoudnessActivities = () => {
  const [activeTab, setActiveTab] = useState("game");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  // Game states
  const [position, setPosition] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("Click Start and Speak Loud!");
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(0);
  const [previousScores, setPreviousScores] = useState([]);

  // Exercise states
  const [exercise, setExercise] = useState(null);
  const [rmsValues, setRmsValues] = useState([]);
  const [status, setStatus] = useState("Idle");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [liveDuration, setLiveDuration] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [distanceOK, setDistanceOK] = useState(false);

  // Past exercises states
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const timerRef = useRef(null);
  const micIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);

  const token = localStorage.getItem("token");

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

  // Fetch scores on component mount
  useEffect(() => {
    fetchScores();
  }, []);

  // Load face-api models (for distance detection)
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      } catch (err) {
        // silently fail if models not available
        // console.error("face-api model load error:", err);
      }
    };
    loadModels();
  }, []);

  // Camera helpers
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      videoStreamRef.current = stream;
    } catch (err) {
      // silently ignore
    }
  };

  const closeCamera = () => {
    try {
      const stream = videoStreamRef.current || (videoRef.current && videoRef.current.srcObject);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      videoStreamRef.current = null;
      setDistanceOK(false);
    } catch (_) {
      // ignore
    }
  };

  // Open camera only during exercise; also run distance checks then
  useEffect(() => {
    let checkDistance;
    if (exercise) {
      openCamera();
      checkDistance = setInterval(async () => {
        if (videoRef.current && faceapi.nets.tinyFaceDetector.params) {
          try {
            const detection = await faceapi.detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            );
            if (detection) {
              const faceWidth = detection.box.width;
              if (faceWidth > 150 && faceWidth < 250) {
                setDistanceOK(true);
              } else {
                setDistanceOK(false);
              }
            } else {
              setDistanceOK(false);
            }
          } catch {
            // ignore detection errors
          }
        }
      }, 1000);
    }
    return () => {
      if (checkDistance) clearInterval(checkDistance);
      if (!exercise) return; // avoid double-close on mount
      closeCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  // Start microphone listener for exercises
  useEffect(() => {
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);

        analyserRef.current = audioCtx.createAnalyser();
        analyserRef.current.fftSize = 2048;
        const bufferLength = analyserRef.current.fftSize;
        dataArrayRef.current = new Float32Array(bufferLength);

        source.connect(analyserRef.current);

        // Sample RMS every 300ms
        micIntervalRef.current = setInterval(() => {
          analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
          const rms = Math.sqrt(
            dataArrayRef.current.reduce((s, v) => s + v * v, 0) /
              dataArrayRef.current.length
          );
          setRmsValues((prev) => [...prev, rms]);

          // If an exercise is active, update live stats
          if (exercise && !exercise.completed && distanceOK) {
            const threshold = getThreshold(exercise.level);
            if (rms >= threshold) {
              setLiveDuration((d) => d + 0.3);
            }
          }
        }, 300);
      } catch (error) {
        console.error("Microphone access error:", error);
      }
    };

    startMic();
    return () => clearInterval(micIntervalRef.current);
  }, [exercise, distanceOK]);

  // Timer for exercises
  useEffect(() => {
    if (exercise && !exercise.completed) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [exercise]);

  // Auto-completion detection on frontend
  useEffect(() => {
    if (exercise && !exercise.completed && timeElapsed > 0) {
      const pct = (liveDuration / timeElapsed) * 100;
      setPercentage(pct);

      if (liveDuration >= 20 && pct >= 20 && distanceOK) {
        // Mark as completed locally
        setExercise((prev) => ({ ...prev, completed: true }));
        setStatus("✅ Completed!");
        clearInterval(timerRef.current);
      }
    }
  }, [liveDuration, timeElapsed, exercise, distanceOK]);

  // Fetch past exercises
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:3001/api/exercises/my-exercises", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch exercises");
        }
        const data = await res.json();
        setExercises(data.exercises);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const fetchScores = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/scores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreviousScores(res.data);
    } catch (err) {
      console.error("Error fetching scores", err);
    }
  };

  const saveScoreToDB = async (finalScore) => {
    try {
      await axios.post(
        "http://localhost:3001/api/scores",
        { score: finalScore },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchScores();
    } catch (err) {
      console.error("Failed to save score", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

        try {
          const res = await axios.post(
            "http://localhost:8000/loudness/predict-loudness",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          const loudnessLabel = res.data?.category;

          if (loudnessLabel === "Acceptable") {
            setPosition((prev) => {
              const next = Math.min(prev + 10, 100);
              if (next === 100) {
                setHasWon(true);
                setMessage("🎉 You Win! Great loudness!");
                stopGame();
                saveScoreToDB(score + 10);
              } else {
                setMessage("Good job! Keep going 🔊");
              }
              return next;
            });
            setScore((prevScore) => prevScore + 10);
          } else {
            setMessage("Too quiet! Speak louder 🗣️");
          }
        } catch {
          setMessage("Error detecting loudness.");
        }

        if (isRunning && !hasWon) {
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 1000);
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 1000);
    } catch {
      setMessage("Microphone access error");
    }
  };

  const startGame = () => {
    setIsRunning(true);
    setHasWon(false);
    setPosition(0);
    setScore(0);
    setMessage("Game Started! Climb by speaking loud!");

    intervalRef.current = setInterval(() => {
      startRecording();
    }, 2000);
  };

  const stopGame = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    if (score > 0 && !hasWon) {
      saveScoreToDB(score);
    }
  };

  // Helper for thresholds
  const getThreshold = (level) => {
    const thresholds = { 1: 0.05, 2: 0.1, 3: 0.15 };
    return thresholds[level] || 0.05;
  };

  const startExercise = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3001/api/exercises/loudness/start",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setExercise(res.data.exercise);
      setStatus(`Started Level ${res.data.exercise.level}`);
      setTimeElapsed(0);
      setLiveDuration(0);
      setRmsValues([]);
      setPercentage(0);
    } catch (err) {
      console.error("❌ startExercise error:", err.response?.data || err.message);
      setStatus("❌ Failed to start exercise");
    }
  };

  const stopExercise = () => {
    setExercise(null);
    setStatus("Stopped. Restart to continue.");
    setTimeElapsed(0);
    setLiveDuration(0);
    setRmsValues([]);
    setPercentage(0);
    clearInterval(timerRef.current);
    closeCamera();
  };

  const updateProgress = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3001/api/exercises/loudness/update",
        { rmsValues, duration: timeElapsed, completed: true, exerciseId: exercise?._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setExercise(res.data);

      if (res.data.completed) {
        setStatus("✅ Completed!");
        clearInterval(timerRef.current);
      } else {
        setStatus("In Progress");
      }
    } catch (err) {
      console.error("❌ updateProgress error:", err.response?.data || err.message);
      setStatus("❌ Failed to update progress");
    }
  };

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-5rem)] p-4 lg:p-8 flex justify-center items-center overflow-hidden">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8 overflow-hidden">
          
          {/* Left Side - Game Controls */}
          <div
            className="bg-gradient-to-b from-[#00171f] to-[#003b46] overflow-y-auto"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "500px",
              height: "100%",
              margin: "0 auto",
              borderRadius: "1rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              padding: "1.5rem",
            }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">
              <span className="text-[#f59e0b]">🎮 Loudness</span> Activities
            </h2>

            {/* Game Section */}
            {activeTab === "game" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Loudness Climb Game</h3>
                  <p className="text-gray-300 text-sm">Speak loud to climb the ladder!</p>
                </div>

                <div className="text-center mb-6">
                  <p className="text-lg font-semibold text-white">
                    Score: <span className="text-[#f59e0b]">{score}</span>
                  </p>
                </div>

                {/* Climbing Visual */}
                <div className="relative mb-6" style={{ height: "300px", width: "80px", margin: "0 auto" }}>
                  <div
                    className="absolute inset-0 bg-gray-700 rounded-full border-4 border-gray-500"
                    style={{ borderRadius: "40px" }}
                  />
                  <motion.div
                    className="absolute w-12 h-12 bg-red-500 rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: "50%",
                      transform: "translateX(-50%)",
                      bottom: `${position}%`,
                    }}
                    animate={{ scale: isRunning ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: isRunning ? Infinity : 0 }}
                  />
                </div>

                {/* Progress Bar */}
                <div className="w-full mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Progress</span>
                    <span className="text-white">{position}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <motion.div
                      className="h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${position}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-white text-lg">{message}</p>
                </div>

                <div className="flex justify-center gap-4">
                  <motion.button
                    onClick={startGame}
                    disabled={isRunning || hasWon}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlay />
                    Start
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      stopGame();
                      setMessage("Game stopped. Click Start to try again.");
                    }}
                    disabled={!isRunning}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaStop />
                    Stop
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Exercise Section */}
            {activeTab === "exercise" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Loudness Training</h3>
                  <p className="text-gray-300 text-sm">Complete exercises to improve your loudness control</p>
                </div>

                {!exercise && (
                  <motion.button
                    onClick={startExercise}
                    className="bg-yellow-400 hover:bg-yellow-500 text-[#003b46] px-6 py-3 rounded-2xl shadow-md font-semibold text-lg w-full flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaRocket />
                    Start Exercise
                  </motion.button>
                )}

                {exercise && (
                  <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                    {/* Exercise Info */}
                    <div className="mb-4 space-y-2">
                      <p className="text-white">
                        <span className="font-semibold">Level:</span> {exercise.level}
                      </p>
                      <p className="text-white">
                        <span className="font-semibold">Time Elapsed:</span> {timeElapsed}s
                      </p>
                      <p className="text-white">
                        <span className="font-semibold">Above Threshold:</span>{" "}
                        {liveDuration.toFixed(1)}s
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">Progress</span>
                        <span className="text-white">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-300 ${
                            percentage >= 100 ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      className={`text-lg font-semibold mb-4 ${
                        status.includes("✅") ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
                      {status}
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-4">
                      {!exercise.completed && (
                        <motion.button
                          onClick={stopExercise}
                          className="bg-red-500 hover:bg-red-600 text-white border border-white px-5 py-2 rounded-lg font-medium shadow-md flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaStop />
                          Stop
                        </motion.button>
                      )}

                      {exercise.completed && (
                        <motion.button
                          onClick={updateProgress}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium shadow-md flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaSave />
                          Save Progress
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Scores Section */}
            {activeTab === "scores" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Previous Scores</h3>
                  <p className="text-gray-300 text-sm">Your game performance history</p>
                </div>

                {previousScores.length === 0 ? (
                  <div className="text-center py-8">
                    <FaTrophy className="text-gray-500 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400">No scores recorded yet.</p>
                    <p className="text-gray-500 text-sm">Play the game to see your scores here!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {previousScores.map((score, index) => (
                      <motion.div
                        key={score._id}
                        className="bg-gray-800/50 p-4 rounded-lg border border-gray-600"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">
                              {new Date(score.date).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaTrophy className="text-yellow-400" />
                            <span className="text-white font-bold text-lg">{score.score}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Past Exercises Section */}
            {activeTab === "history" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Exercise History</h3>
                  <p className="text-gray-300 text-sm">Your completed training exercises</p>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading exercises...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-400">Error: {error}</p>
                  </div>
                ) : exercises.length === 0 ? (
                  <div className="text-center py-8">
                    <FaHistory className="text-gray-500 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400">No exercises found.</p>
                    <p className="text-gray-500 text-sm">Complete some exercises to see them here!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {exercises.map((ex, index) => (
                      <motion.div
                        key={ex._id}
                        className="bg-gray-800/50 p-4 rounded-lg border border-gray-600"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div className="space-y-2">
                          <p className="text-white">
                            <strong>Date:</strong> {new Date(ex.createdAt).toLocaleString()}
                          </p>
                          <p className="text-white">
                            <strong>Duration:</strong> {ex.duration} seconds
                          </p>
                          <p className="text-white">
                            <strong>Average Volume (RMS):</strong> {ex.rms}
                          </p>
                          <p className="text-white">
                            <strong>Steadiness:</strong> {ex.steadiness}
                          </p>
                          {ex.audioURL && (
                            <audio controls src={ex.audioURL} className="mt-2 w-full" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right Side - Tabs and Content */}
          <div className="w-full flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4 overflow-x-auto flex-shrink-0">
              {/* Game Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "game"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("game")}
              >
                <FaGamepad />
                Game
              </button>

              {/* Exercise Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "exercise"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("exercise")}
              >
                <FaVolumeUp />
                Training
              </button>

              {/* Scores Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "scores"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("scores")}
              >
                <FaTrophy />
                Scores
              </button>

              {/* History Tab */}
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "history"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("history")}
              >
                <FaHistory />
                History
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-lg p-6 overflow-y-auto">
              {activeTab === "game" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    🎮 Loudness Climb Game
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Speak loud and clear to climb the ladder! The AI will detect your volume level 
                    and help you reach the top. Each successful loudness detection moves you up 10%.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FaVolumeUp className="text-[#f59e0b]" />
                        How to Play
                      </h3>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Click "Start" to begin the game</li>
                        <li>• Speak loud and clear into your microphone</li>
                        <li>• AI will detect "Acceptable" loudness levels</li>
                        <li>• Each detection moves you up 10%</li>
                        <li>• Reach 100% to win!</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FaTrophy className="text-[#f59e0b]" />
                        Scoring
                      </h3>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• +10 points per successful detection</li>
                        <li>• Bonus points for winning</li>
                        <li>• Scores are saved automatically</li>
                        <li>• Check your progress in Scores tab</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "exercise" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    🎤 Loudness Training
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Complete structured exercises to improve your loudness control. 
                    The system will track your progress and help you develop better vocal dynamics.
                  </p>

                  {/* Webcam for distance check */}
                  <div className="mb-4 flex flex-col items-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      width="320"
                      height="240"
                      className="rounded-lg border mb-2"
                    />
                    <p className={distanceOK ? "text-green-400" : "text-red-400"}>
                      {distanceOK ? "✅ Correct distance (1m–2m)" : "⚠️ Move ahead"}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FaChartBar className="text-[#f59e0b]" />
                        Exercise Levels
                      </h3>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Level 1: Basic loudness control</li>
                        <li>• Level 2: Intermediate modulation</li>
                        <li>• Level 3: Advanced dynamics</li>
                        <li>• Complete 20+ seconds above threshold</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <FaCheckCircle className="text-[#f59e0b]" />
                        Progress Tracking
                      </h3>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Real-time RMS analysis</li>
                        <li>• Live duration tracking</li>
                        <li>• Completion percentage</li>
                        <li>• Automatic progress saving</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "scores" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    🏆 Your Scores
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Track your progress and see how you're improving over time. 
                    Higher scores indicate better loudness control and consistency.
                  </p>
                  
                  {previousScores.length > 0 && (
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-3">Performance Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-[#f59e0b]">
                            {previousScores.length}
                          </p>
                          <p className="text-gray-400 text-sm">Total Games</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">
                            {Math.max(...previousScores.map(s => s.score))}
                          </p>
                          <p className="text-gray-400 text-sm">Best Score</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-400">
                            {Math.round(previousScores.reduce((a, b) => a + b.score, 0) / previousScores.length)}
                          </p>
                          <p className="text-gray-400 text-sm">Average</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-400">
                            {previousScores.filter(s => s.score >= 50).length}
                          </p>
                          <p className="text-gray-400 text-sm">Good Games</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    📚 Exercise History
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Review your completed training exercises and track your improvement over time. 
                    Each exercise helps build better loudness control and vocal dynamics.
                  </p>
                  
                  {exercises.length > 0 && (
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-3">Training Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-[#f59e0b]">
                            {exercises.length}
                          </p>
                          <p className="text-gray-400 text-sm">Total Exercises</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">
                            {Math.round(exercises.reduce((a, b) => a + parseFloat(b.duration), 0) / exercises.length)}s
                          </p>
                          <p className="text-gray-400 text-sm">Avg Duration</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-400">
                            {Math.round(exercises.reduce((a, b) => a + parseFloat(b.rms), 0) / exercises.length * 100) / 100}
                          </p>
                          <p className="text-gray-400 text-sm">Avg RMS</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-400">
                            {Math.round(exercises.reduce((a, b) => a + parseFloat(b.steadiness), 0) / exercises.length * 100) / 100}
                          </p>
                          <p className="text-gray-400 text-sm">Avg Steadiness</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoudnessActivities;
