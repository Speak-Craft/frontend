import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaStop, FaPlay, FaPause } from "react-icons/fa";
import GaugeChart from "react-gauge-chart";

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

  const [results, setResults] = useState({
    wordCount: 0,
    duration: 0,
    wpm: 0,
    prediction: "",
    confidence: 0,
    feedback: "",
  });

  // Simulated data for UI design (to be replaced by real prediction call)
  useEffect(() => {
    setResults({
      wordCount: 134,
      duration: 85.32,
      wpm: 94.3,
      prediction: "Slow",
      confidence: 88.67,
      feedback: "🟡 Try to increase your pace slightly to maintain engagement.",
    });
  }, []);

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
      mediaRecorderRef.current.stop();
      cancelAnimationFrame(animationFrameId.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      audioChunksRef.current = [];
    }
  };

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-3rem)] p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-6 flex flex-col justify-center items-center">
        <div className="flex w-full h-full gap-8">
          <div className="flex flex-col items-center w-full sm:w-1/2 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-15">Voice Recorder</h2>

            <div className="relative flex items-center justify-center">
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

              {isRecording && !isPaused && (
                <FaMicrophone className="text-white text-4xl animate-pulse" />
              )}
              {(isPaused || !isRecording) && (
                <FaMicrophone
                  className={`text-white text-4xl ${
                    !isRecording || isPaused ? "opacity-50" : ""
                  }`}
                />
              )}
            </div>

            {/* Sine Wave Canvas */}
            {/* {isRecording && !isPaused && (
              <canvas ref={canvasRef} width="500" height="10" className="mt-4"></canvas>
            )} */}

            <div className="flex items-center gap-4 mt-15">
              <button
                style={{ backgroundColor: "white" }}
                onClick={handlePause}
                className={`p-4 rounded-full shadow-md ${
                  isRecording && !isPaused
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
                disabled={!isRecording || isPaused}
              >
                <FaPause
                  className={`text-black text-2xl ${
                    !isRecording || isPaused
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                />
              </button>
              <button
                style={{ backgroundColor: "white" }}
                onClick={handlePlay}
                className={`p-4 rounded-full shadow-md ${
                  isRecording && !isPaused
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
                disabled={isRecording && !isPaused}
              >
                <FaPlay
                  className={`text-black text-2xl ${
                    isRecording && !isPaused
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                />
              </button>
              <button
                style={{ backgroundColor: "white" }}
                onClick={handleStop}
                className={`p-4 rounded-full shadow-md ${
                  isRecording
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
                disabled={!isRecording}
              >
                <FaStop
                  className={`text-black text-2xl ${
                    !isRecording ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </button>
            </div>

            <p className="mt-4 text-lg">Recording Time: 00:00</p>

            {audioUrl && (
              <div className="mt-4" hidden>
                <audio controls src={audioUrl}></audio>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="w-full flex flex-col sm:flex-row justify-start items-start gap-6">
            {/* Word Count Section */}
            <div className="flex flex-col items-center rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
              <h3 className="text-white text-lg font-semibold mb-2">
                Word Count
              </h3>
              <div className="flex justify-center items-center rounded-full w-24 h-24 sm:w-32 sm:h-32 bg-white/10 dark:bg-white/20 text-white text-xl font-semibold">
                100
              </div>
            </div>

            <div className="flex flex-col items-center rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
              <h3 className="text-white text-lg font-semibold mb-2">
                Duration
              </h3>
              <div className="flex justify-center items-center rounded-full w-24 h-24 sm:w-32 sm:h-32 bg-white/10 text-white text-xl font-semibold">
                {results.duration.toFixed(2)}s
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
                style={{ width: "16rem", height: "8rem" }}
              />
              <p className="mt-2 text-white font-medium">
                {results.prediction} ({results.wpm.toFixed(1)} WPM)
              </p>
            </div>

            {/* Confidence & Feedback */}
            <div className="flex flex-col items-center w-full sm:w-72 rounded-lg p-4 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]">
              <h3 className="text-white text-lg font-semibold mb-2">
                Confidence
              </h3>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden mb-2">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    results.confidence >= 80
                      ? "bg-green-400"
                      : results.confidence >= 50
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  }`}
                  style={{ width: `${results.confidence}%` }}
                ></div>
              </div>

              {/* Percentage Text */}
              <p className="text-white text-md font-semibold mb-3">
                {results.confidence.toFixed(1)}%
              </p>

              {/* Feedback Highlighted Box */}
              <div
                className={`w-full text-md text-center px-4 py-3 rounded-lg font-medium shadow-md ${
                  results.prediction === "Fast"
                    ? "bg-red-600/30 text-red-200 border border-red-500"
                    : results.prediction === "Slow"
                    ? "bg-yellow-600/30 text-yellow-100 border border-yellow-400"
                    : "bg-green-600/30 text-green-100 border border-green-400"
                }`}
              >
                {results.feedback}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaceManagement;
