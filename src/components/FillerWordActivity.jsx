import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaMicrophone, FaPause, FaPlay, FaStop } from "react-icons/fa";
import axios from "axios";

const FillerWordActivity = () => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [recordedAt, setRecordedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);

  const [challenges, setChallenges] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [history, setHistory] = useState([]);
  const [badges, setBadges] = useState([]);

  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const recordTime = useRef(0);

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3001/api/challenge/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let userChallenges = res.data.challenges || [];
      if (userChallenges.length === 0) {
        const initRes = await axios.post(
          "http://localhost:3001/api/challenge/init",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        userChallenges = initRes.data.challenges;
      }

      setChallenges(userChallenges);
      setHistory(res.data.history || []);
      setBadges(res.data.badges || []);

      const nextLevel = userChallenges.find((c) => !c.completed) || null;
      setCurrentLevel(nextLevel);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch challenge progress", err);
    }
  };

  const handleRecording = async (blob) => {
    setResult(null);
    setAudioDuration(null);
    setRecordedAt(new Date());

    const wavFile = new File([blob], "presentation.wav", { type: "audio/wav" });
    setAudioBlob(wavFile);
    setAudioURL(URL.createObjectURL(blob));

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();

    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      setAudioDuration(audioBuffer.duration);
    });
  };

  const onRecordingComplete = async (blob) => {
    setResult(null);
    setAudioDuration(null);
    setRecordedAt(new Date());

    const wavFile = new File([blob], "presentation.wav", { type: "audio/wav" });
    setAudioBlob(wavFile);
    setAudioURL(URL.createObjectURL(blob));

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      setAudioDuration(audioBuffer.duration);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await onRecordingComplete(blob);
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setResult(null);
      recordTime.current = 0;
      setDisplayTime(0);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Microphone access error", e);
      alert("Microphone access is required to record.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      recordTime.current = 0;
      setDisplayTime(0);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return alert("No audio recorded");

    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:3001/api/recording/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(res.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Upload failed", err);
      alert("Something went wrong during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecording = async () => {
    if (!result || !audioDuration) return alert("No analysis to save");
    if (!currentLevel) return alert("No active challenge level");

    const requiredDuration = (currentLevel.duration || 0) * 60;
    const success =
      audioDuration >= requiredDuration &&
      (result.fillerCount || 0) <= (currentLevel.maxFillers || 0);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3001/api/challenge/session",
        {
          fillerCount: result.fillerCount,
          duration: audioDuration,
          totalChunks: result.total_chunks || 0,
          levelId: currentLevel.level,
          success,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Session saved! Success: ${success ? "Yes" : "No"}`);
      if (res.data.badgeUnlocked) {
        alert(`🎉 New Badge Unlocked: ${res.data.badgeUnlocked}`);
      }

      fetchProgress();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error saving session", err);
      alert("Failed to save session.");
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getTileStyle = (challenge) => {
    if (challenge.completed) {
      return "bg-green-200 border-green-500";
    } else if (challenge.level === (currentLevel ? currentLevel.level : undefined)) {
      return "bg-yellow-200 border-yellow-500";
    } else {
      return "bg-gray-200 border-gray-400 opacity-60";
    }
  };

  const getAttemptsForLevel = (level) => {
    return history.filter((h) => h.level === level);
  };

  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        recordTime.current += 1;
        setDisplayTime(recordTime.current);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPaused]);

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-4rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Recorder (sticky on xl) */}
          <div className="xl:col-span-1">
            <div className="xl:sticky xl:top-24">
              <motion.div
                className="bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    color: "white",
                    fontWeight: 600,
                    marginBottom: "1.5rem",
                    textAlign: "center",
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
                      className={`text-black text-4xl ${isRecording && !isPaused ? "animate-pulse" : "opacity-50"}`}
                    />
                  </div>

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
                      onClick={pauseRecording}
                      disabled={!isRecording || isPaused}
                      style={{
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: "9999px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        opacity: !isRecording || isPaused ? 0.5 : 1,
                        cursor: !isRecording || isPaused ? "not-allowed" : "pointer",
                      }}
                    >
                      <FaPause style={{ fontSize: "1.5rem", color: "black" }} />
                    </button>
                    <button
                      onClick={isRecording ? (isPaused ? resumeRecording : undefined) : startRecording}
                      disabled={isRecording && !isPaused}
                      style={{
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: "9999px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        opacity: isRecording && !isPaused ? 0.5 : 1,
                        cursor: isRecording && !isPaused ? "not-allowed" : "pointer",
                      }}
                    >
                      <FaPlay style={{ fontSize: "1.5rem", color: "black" }} />
                    </button>
                    <button
                      onClick={stopRecording}
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

                <p
                  style={{
                    color: "white",
                    fontSize: "1.125rem",
                    marginTop: "1rem",
                    textAlign: "center",
                  }}
                >
                  Recording Time: {formatTime(displayTime)}
                </p>
              </motion.div>

              <button
                onClick={uploadAudio}
                disabled={!audioBlob || isLoading}
                className="mt-4 w-full font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 bg-[#003b46] hover:bg-[#07575b] dark:bg-[#0084a6] dark:hover:bg-[#00a8cc] text-black dark:text-white"
              >
                {isLoading ? "⏳ Analyzing..." : "⬆ Upload & Analyze"}
              </button>

              {/* Badges Section */}
              {badges.length > 0 && (
                <motion.div
                  className="mt-6 bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-4 border-2 border-[#00ccff]/60 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h3 className="text-[#00ccff] font-semibold text-base lg:text-lg mb-3 text-center">🏅 Earned Badges</h3>
                  <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                    {badges.map((badge, index) => (
                      <motion.div
                        key={badge.name}
                        className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg border-2 border-yellow-600 text-center transform transition duration-300 hover:scale-110"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <span className="text-lg sm:text-xl lg:text-2xl mb-0.5 sm:mb-1">🥇</span>
                        <span className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-gray-800 leading-tight text-center px-1 break-words">{badge.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Progress + Results */}
          <div className="xl:col-span-2">
            <div className={`bg-white/90 dark:bg-white/10 shadow-xl rounded-2xl p-6 w-full ${selectedChallenge ? "blur-sm" : ""}`}>
              <h2 className="text-2xl font-bold mb-6 text-[#003b46] dark:text-white text-center">
                🏆 Challenge Progress
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 mb-8">
                {challenges.map((challenge) => {
                  const isCurrent = challenge.level === (currentLevel ? currentLevel.level : undefined);
                  const baseStyle = getTileStyle(challenge);
                  const clickable = challenge.completed || isCurrent;

                  return (
                    <div
                      key={challenge.level}
                      onClick={() => (clickable ? setSelectedChallenge(challenge) : null)}
                      className={`relative p-4 md:p-5 rounded-2xl border text-center cursor-pointer transform transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl ${baseStyle}`}
                    >
                      <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl bg-gradient-to-r from-cyan-400 to-blue-600 pointer-events-none"></div>

                      <h3 className="relative font-extrabold text-base md:text-lg text-black z-10">
                        Level {challenge.level}
                      </h3>
                      <p className="relative text-xs md:text-sm text-black z-10">
                        ⏱ {challenge.duration} min | 🎤 Max {challenge.maxFillers}
                      </p>

                      {challenge.completed && (
                        <p className="relative text-[10px] md:text-xs text-green-800 font-semibold mt-3 z-10">
                          ✅ Completed
                        </p>
                      )}
                      {isCurrent && (
                        <p className="relative text-[10px] md:text-xs text-yellow-800 font-semibold mt-3 z-10 animate-pulse">
                          🟨 Current
                        </p>
                      )}
                      {!challenge.completed && !isCurrent && (
                        <p className="relative text-[10px] md:text-xs text-gray-700 font-semibold mt-3 z-10">
                          🔒 Locked
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {result && !isLoading && (
                <div className="mt-4 bg-gray-50 p-4 md:p-5 rounded-lg shadow-md border border-gray-200 text-gray-700">
                  <h3 className="font-bold text-lg mb-2">✅ Analysis Result</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="p-3 bg-white rounded-md border text-center">
                      <div className="text-xs text-gray-500">Filler Count</div>
                      <div className="text-xl font-bold">{result.fillerCount}</div>
                    </div>
                    <div className="p-3 bg-white rounded-md border text-center">
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="text-xl font-bold">{typeof audioDuration === "number" ? `${audioDuration.toFixed(2)}s` : "-"}</div>
                    </div>
                    <div className="p-3 bg-white rounded-md border text-center">
                      <div className="text-xs text-gray-500">Recorded</div>
                      <div className="text-sm font-semibold">{recordedAt ? formatDateTime(recordedAt) : "-"}</div>
                    </div>
                  </div>

                  {audioURL && (
                    <div className="mt-2">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">🔊 Playback</h4>
                      <audio controls className="w-full">
                        <source src={audioURL} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <button
                    onClick={saveRecording}
                    disabled={!currentLevel}
                    className="mt-4 w-full font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 bg-[#0b5d2b] hover:bg-[#0e7a37] dark:bg-green-600 dark:hover:bg-green-700 text-black dark:text-white"
                  >
                    💾 Save Analyze
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedChallenge && (
            <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-lg"
                onClick={() => setSelectedChallenge(null)}
                style={{
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              ></div>

              <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full z-10">
                <h2 className="text-xl font-bold mb-4 text-center">
                  📜 Level {selectedChallenge.level} Attempts
                </h2>

                {getAttemptsForLevel(selectedChallenge.level).length > 0 ? (
                  <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {getAttemptsForLevel(selectedChallenge.level).map((attempt, idx) => (
                      <li
                        key={attempt._id || idx}
                        className="border rounded-lg p-3 bg-gray-50 shadow-sm"
                      >
                        <p>
                          <strong>Attempt {idx + 1}:</strong>
                        </p>
                        <p>
                          ⏱ Duration: <span className="font-semibold">{Number(attempt.duration).toFixed(2)}s</span>
                        </p>
                        <p>
                          🗣 Filler Count: <span className="font-semibold">{attempt.fillerCount}</span>
                        </p>
                        <p>{attempt.success ? "✅ Success" : "❌ Failed"}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-600">No attempts yet.</p>
                )}

                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="mt-6 w-full bg-[#0084a6] text-black py-2 rounded-lg hover:bg-[#00a8cc] transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FillerWordActivity;


