import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const LoudnessExercise = () => {
  const [exercise, setExercise] = useState(null);
  const [rmsValues, setRmsValues] = useState([]);
  const [status, setStatus] = useState("Idle");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [liveDuration, setLiveDuration] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const timerRef = useRef(null);
  const micIntervalRef = useRef(null);

  // Start microphone listener
  useEffect(() => {
    const startMic = async () => {
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
        if (exercise && !exercise.completed) {
          const threshold = getThreshold(exercise.level);
          if (rms >= threshold) {
            setLiveDuration((d) => d + 0.3);
          }
        }
      }, 300);
    };

    startMic();
    return () => clearInterval(micIntervalRef.current);
  }, [exercise]);

  // Timer
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

      if (liveDuration >= 20 && pct >= 20) {
        // Mark as completed locally
        setExercise((prev) => ({ ...prev, completed: true }));
        setStatus("✅ Completed!");
        clearInterval(timerRef.current);
      }
    }
  }, [liveDuration, timeElapsed, exercise]);

  // Helper for thresholds
  const getThreshold = (level) => {
    const thresholds = { 1: 0.05, 2: 0.1, 3: 0.15 };
    return thresholds[level] || 0.05;
  };

  const startExercise = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/exercises/loudness/start",
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
    // Reset current exercise (user has to restart)
    setExercise(null);
    setStatus("Stopped. Restart to continue.");
    setTimeElapsed(0);
    setLiveDuration(0);
    setRmsValues([]);
    setPercentage(0);
    clearInterval(timerRef.current);
  };

  const updateProgress = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/exercises/loudness/update",
        { rmsValues },
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
    <div className="p-6 text-white">
      <h2 className="text-3xl font-bold mb-4">🎤 Loudness Training</h2>
  
      {!exercise && (
        <button
          onClick={startExercise}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-2xl shadow-md font-semibold text-lg"
        >
          🚀 Start Exercise
        </button>
      )}
  
      {exercise && (
        <div className="mt-6 bg-gray-900 p-6 rounded-2xl shadow-lg">
          {/* Exercise Info */}
          <div className="mb-4">
            <p className="text-lg">
              <span className="font-semibold">Level:</span> {exercise.level}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Time Elapsed:</span> {timeElapsed}s
            </p>
            <p className="text-lg">
              <span className="font-semibold">Above Threshold:</span>{" "}
              {liveDuration.toFixed(1)}s
            </p>
          </div>
  
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{percentage.toFixed(1)}%</span>
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
              <button
                onClick={stopExercise}
                className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-medium shadow-md"
              >
                🛑 Stop
              </button>
            )}
  
            {exercise.completed && (
              <button
                onClick={updateProgress}
                className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg font-medium shadow-md"
              >
                💾 Save Progress
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
};

export default LoudnessExercise;
