// src/pages/ChallengeGoal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { AudioRecorder } from "react-audio-voice-recorder";

export default function ChallengeGoal() {
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [audioDuration, setAudioDuration] = useState(null);
    const [recordedAt, setRecordedAt] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [challenges, setChallenges] = useState([]);
    const [currentLevel, setCurrentLevel] = useState(null);
    const [history, setHistory] = useState([]);

    // 🆕 for modal
    const [selectedChallenge, setSelectedChallenge] = useState(null);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/challenge/progress", {
                headers: { Authorization: `Bearer ${token}` },
            });

            let userChallenges = res.data.challenges || [];
            if (userChallenges.length === 0) {
                const initRes = await axios.post(
                    "http://localhost:5000/api/challenge/init",
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                userChallenges = initRes.data.challenges;
            }

            setChallenges(userChallenges);
            setHistory(res.data.history || []);

            const nextLevel = userChallenges.find((c) => !c.completed) || null;
            setCurrentLevel(nextLevel);
        } catch (err) {
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

    const uploadAudio = async () => {
        if (!audioBlob) return alert("No audio recorded");

        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
            setIsLoading(true);
            const token = localStorage.getItem("token");

            const res = await axios.post(
                "http://localhost:5000/api/recording/upload",
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
            console.error("Upload failed", err);
            alert("Something went wrong during upload.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveRecording = async () => {
        if (!result || !audioDuration) return alert("No analysis to save");
        if (!currentLevel) return alert("No active challenge level");

        const requiredDuration = currentLevel.duration * 60;
        const success =
            audioDuration >= requiredDuration &&
            result.fillerCount <= currentLevel.maxFillers;

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:5000/api/challenge/session",
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

    const getTileStyle = (challenge) => {
        if (challenge.completed) {
            return "bg-green-200 border-green-500"; 
        } else if (challenge.level === currentLevel?.level) {
            return "bg-yellow-200 border-yellow-500"; 
        } else {
            return "bg-gray-200 border-gray-400 opacity-60"; 
        }
    };

    // 🆕 get attempts for a challenge
    const getAttemptsForLevel = (level) => {
        return history.filter((h) => h.level === level);
    };

    return (
        <div className="ml-65 p-8 relative">
            <div className={`bg-white shadow-xl rounded-2xl p-6 max-w-6xl ${selectedChallenge ? "blur-sm" : ""}`}>
                <h2 className="text-2xl font-bold mb-6 text-[#003b46] text-center">
                    🏆 Challenge Progress
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-12">
                    {challenges.map((challenge) => {
                        const isCurrent = challenge.level === currentLevel?.level;
                        const baseStyle = getTileStyle(challenge);
                        const clickable = challenge.completed || isCurrent;

                        return (
                            <div
                                key={challenge.level}
                                onClick={() =>
                                    clickable ? setSelectedChallenge(challenge) : null
                                }
                                className={`
                                    relative p-6 rounded-2xl border text-center cursor-pointer
                                    transform transition duration-300 ease-in-out
                                    hover:scale-105 hover:shadow-2xl
                                    ${baseStyle}
                                `}
                            >
                                <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl bg-gradient-to-r from-cyan-400 to-blue-600 pointer-events-none"></div>

                                <h3 className="relative font-extrabold text-lg text-black z-10">
                                    Level {challenge.level}
                                </h3>
                                <p className="relative text-sm text-black z-10">
                                    ⏱ {challenge.duration} min | 🎤 Max {challenge.maxFillers}
                                </p>

                                {challenge.completed && (
                                    <p className="relative text-xs text-green-800 font-semibold mt-3 z-10">
                                        ✅ Completed
                                    </p>
                                )}
                                {isCurrent && (
                                    <p className="relative text-xs text-yellow-800 font-semibold mt-3 z-10 animate-pulse">
                                        🟨 Current
                                    </p>
                                )}
                                {!challenge.completed && !isCurrent && (
                                    <p className="relative text-xs text-gray-700 font-semibold mt-3 z-10">
                                        🔒 Locked
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Record & Analyze Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-[#003b46]">
                        🎤 Record Your Presentation
                    </h2>

                    <AudioRecorder
                        onRecordingComplete={handleRecording}
                        audioTrackConstraints={{ noiseSuppression: true, echoCancellation: true }}
                        downloadOnSavePress={false}
                        downloadFileExtension="wav"
                    />

                    <button
                        onClick={uploadAudio}
                        disabled={!audioBlob || isLoading}
                        className="mt-4 w-full bg-[#0084a6] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#00a8cc] transition disabled:opacity-50"
                    >
                        {isLoading ? "⏳ Analyzing..." : "⬆ Upload & Analyze"}
                    </button>

                    {result && !isLoading && (
                        <div className="mt-6 bg-gray-50 p-5 rounded-lg shadow-md border border-gray-200 text-gray-700">
                            <h3 className="font-bold text-lg mb-2">✅ Analysis Result</h3>
                            <p>🗣️ Filler Count: <strong>{result.fillerCount}</strong></p>
                            {audioDuration && (
                                <p>⏱️ Duration: <strong>{audioDuration.toFixed(2)} seconds</strong></p>
                            )}
                            {recordedAt && (
                                <p>📅 Date & Time: <strong>{formatDateTime(recordedAt)}</strong></p>
                            )}

                            {audioURL && (
                                <div className="mt-4">
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
                                className="mt-4 w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                💾 Save Analyze
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 🆕 Modal Popup */}
            {selectedChallenge && (
                <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                        onClick={() => setSelectedChallenge(null)}
                    ></div>

                    {/* Modal Box */}
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
                                            ⏱ Duration:{" "}
                                            <span className="font-semibold">
                                                {attempt.duration.toFixed(2)}s
                                            </span>
                                        </p>
                                        <p>
                                            🗣 Filler Count:{" "}
                                            <span className="font-semibold">{attempt.fillerCount}</span>
                                        </p>
                                        <p>
                                            {attempt.success ? "✅ Success" : "❌ Failed"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-600">No attempts yet.</p>
                        )}

                        <button
                            onClick={() => setSelectedChallenge(null)}
                            className="mt-6 w-full bg-[#0084a6] text-white py-2 rounded-lg hover:bg-[#00a8cc] transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
