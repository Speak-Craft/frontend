import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [prediction, setPrediction] = useState("Listening...");
  const [waveform, setWaveform] = useState([]);
  const [waveColor, setWaveColor] = useState("#3498db");

  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Draw waveform when waveform data changes
  useEffect(() => {
    if (waveform.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      waveform.forEach((point, i) => {
        const x = (i / waveform.length) * width;
        const y = height / 2 - point * height;
        ctx.lineTo(x, y);
      });

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [waveform, waveColor]);

  useEffect(() => {
    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        const bufferLength = analyserRef.current.fftSize;
        dataArrayRef.current = new Float32Array(bufferLength);

        sourceRef.current.connect(analyserRef.current);

        // Repeatedly get waveform data and update state
        const drawInterval = setInterval(() => {
          analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);

          // Convert to absolute average values for smooth waveform
          const samples = 200;
          const blockSize = Math.floor(dataArrayRef.current.length / samples);
          const filteredData = [];

          for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              const val = dataArrayRef.current[i * blockSize + j];
              sum += Math.abs(val);
            }
            filteredData.push(sum / blockSize);
          }

          setWaveform(filteredData);
        }, 100);

        // MediaRecorder setup
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];

          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          try {
            const res = await axios.post("http://localhost:5000/api/loudness/predict", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            const label = res.data.prediction;
            setPrediction(label);

            if (label === "Acceptable") setWaveColor("green");
            else if (label === "Low") setWaveColor("red");
            else setWaveColor("#3498db");
          } catch (err) {
            console.error("Prediction error:", err);
            setPrediction("Prediction error");
            setWaveColor("gray");
          }

          // Restart recording
          mediaRecorderRef.current.start();
          setTimeout(() => mediaRecorderRef.current.stop(), 300);
        };

        // Start first recording cycle
        mediaRecorderRef.current.start();
        setTimeout(() => mediaRecorderRef.current.stop(), 300);

        // Clean up
        return () => {
          clearInterval(drawInterval);
          audioContextRef.current?.close();
        };
      } catch (err) {
        console.error("Microphone error:", err);
        setPrediction("Microphone access error");
      }
    };

    startAudio();
  }, []);

  return (
    <div className="text-white px-120 py-68">
      <h2 className="text-2xl font-bold mb-6 px-22">🔊 Real-Time Loudness Detector</h2>

      <div className="mb-6 w-full max-w-xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#fff",
          }}
        />
      </div>

      <div className="px-38">
      <div
        className={`p-6 rounded-xl shadow-lg w-[262px] ${
          prediction === "Acceptable"
            ? "bg-green-100 text-green-800"
            : prediction === "Low / Silent"
            ? "bg-red-100 text-red-800"
            : "bg-white text-[#003b46]"
        }`}
      >
        <p className="text-lg font-semibold">Prediction: {prediction}</p>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;
