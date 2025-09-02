import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const Exercises = () => {
  const [position, setPosition] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("Click Start and Speak Loud!");
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(0);
  const [previousScores, setPreviousScores] = useState([]);
  const [activeTab, setActiveTab] = useState("game");

  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/scores", {
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
        "http://localhost:5000/api/scores",
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
        formData.append("audio", blob, "audio.webm");

        try {
          const res = await axios.post(
            "http://localhost:5000/api/loudness/predict",
            formData
          );
          const loudnessLabel = res.data.prediction;

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

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>🎮 Loudness Climb</h2>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("game")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            borderBottom: activeTab === "game" ? "2px solid black" : "none",
            background: "none",
            border: "none",
            fontWeight: activeTab === "game" ? "bold" : "normal",
          }}
        >
          Game
        </button>
        <button
          onClick={() => setActiveTab("scores")}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            borderBottom: activeTab === "scores" ? "2px solid black" : "none",
            background: "none",
            border: "none",
            fontWeight: activeTab === "scores" ? "bold" : "normal",
          }}
        >
          Scores
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "game" ? (
        <>
          <p style={{ fontSize: 18, textAlign: "center", marginBottom: 20 }}>
            Score: <strong>{score}</strong>
          </p>

          <div
            style={{
              position: "relative",
              height: 400,
              width: 60,
              margin: "auto",
              backgroundColor: "#ddd",
              borderRadius: 30,
              border: "3px solid #999",
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: `${position}%`,
                left: "50%",
                transform: "translateX(-50%)",
                width: 40,
                height: 40,
                backgroundColor: "#e53e3e",
                borderRadius: "50%",
                transition: "bottom 0.5s ease",
              }}
            />
          </div>

          <div
            style={{
              height: 20,
              width: "100%",
              backgroundColor: "#ccc",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${position}%`,
                backgroundColor: "#48bb78",
                transition: "width 0.5s ease",
              }}
            />
          </div>

          <p style={{ textAlign: "center", marginBottom: 20 }}>{message}</p>

          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button
              onClick={startGame}
              disabled={isRunning || hasWon}
              style={{
                padding: "10px 20px",
                backgroundColor: isRunning || hasWon ? "#aaa" : "#48bb78",
                border: "none",
                borderRadius: 5,
                cursor: isRunning || hasWon ? "not-allowed" : "pointer",
                color: "white",
              }}
            >
              Start
            </button>
            <button
              onClick={() => {
                stopGame();
                setMessage("Game stopped. Click Start to try again.");
              }}
              disabled={!isRunning}
              style={{
                padding: "10px 20px",
                backgroundColor: !isRunning ? "#aaa" : "#f56565",
                border: "none",
                borderRadius: 5,
                cursor: !isRunning ? "not-allowed" : "pointer",
                color: "white",
              }}
            >
              Stop
            </button>
          </div>
        </>
      ) : (
        <div>
          <h3 style={{ textAlign: "center", marginBottom: 15 }}>Previous Scores</h3>
          {previousScores.length === 0 ? (
            <p style={{ textAlign: "center" }}>No scores recorded yet.</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Date</th>
                  <th style={{ borderBottom: "1px solid #ccc", padding: 8 }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {previousScores.map((s) => (
                  <tr key={s._id}>
                    <td style={{ padding: 8 }}>
                      {new Date(s.date).toLocaleString()}
                    </td>
                    <td style={{ padding: 8 }}>{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Exercises;
