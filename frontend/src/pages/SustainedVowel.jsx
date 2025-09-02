import React, { useState, useRef, useEffect } from "react";
import { ReactMediaRecorder } from "react-media-recorder";

const SustainedVowel = () => {
  const [audioURL, setAudioURL] = useState("");
  const [results, setResults] = useState(null);
  const [volumeChunks, setVolumeChunks] = useState([]);
  const [isLive, setIsLive] = useState(false);

  const audioRef = useRef();
  const staticCanvasRef = useRef();
  const liveCanvasRef = useRef();

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 🔴 Start real-time waveform
  const startLiveWaveform = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    setIsLive(true);
    drawLiveWaveform();
  };

  // 🛑 Stop live waveform
  const stopLiveWaveform = () => {
    setIsLive(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    audioContextRef.current?.close();
  };

  // 🎨 Draw live waveform
  const drawLiveWaveform = () => {
    if (!isLive) return;
    const canvas = liveCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    animationFrameRef.current = requestAnimationFrame(drawLiveWaveform);

    analyser.getByteTimeDomainData(dataArray);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#34d399"; // green
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  // 📊 Analyze recorded audio
  const analyzeAudio = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const rawData = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;

    let total = 0;
    for (let i = 0; i < rawData.length; i++) {
      total += rawData[i] * rawData[i];
    }
    const rms = Math.sqrt(total / rawData.length);

    const CHUNK = 2048;
    let chunks = [];
    for (let i = 0; i < rawData.length; i += CHUNK) {
      const chunk = rawData.slice(i, i + CHUNK);
      let sum = 0;
      for (let j = 0; j < chunk.length; j++) {
        sum += chunk[j] * chunk[j];
      }
      chunks.push(Math.sqrt(sum / chunk.length));
    }

    const mean = chunks.reduce((a, b) => a + b, 0) / chunks.length;
    const variance = chunks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / chunks.length;
    const steadiness = 1 - Math.sqrt(variance);

    setVolumeChunks(chunks);
    setResults({
      duration: duration.toFixed(2),
      rms: rms.toFixed(4),
      steadiness: steadiness.toFixed(4),
    });
  };

  // 📈 Static waveform (after recording)
  useEffect(() => {
    if (!volumeChunks.length) return;

    const canvas = staticCanvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const width = canvas.width;
    const height = canvas.height;
    const step = width / volumeChunks.length;

    for (let i = 0; i < volumeChunks.length; i++) {
      const x = i * step;
      const y = height - volumeChunks[i] * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }, [volumeChunks]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-xl text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Sustained Vowel Phonation</h2>
      <p className="mb-4 text-black">
        Say and hold a vowel sound like “ah” or “ee” steadily for as long as possible.
      </p>

      <ReactMediaRecorder
        audio
        onStart={startLiveWaveform}
        onStop={(blobUrl, blob) => {
          stopLiveWaveform();
          setAudioURL(blobUrl);
          analyzeAudio(blob);
        }}
        render={({ status, startRecording, stopRecording }) => (
          <div>
            <p className="mb-2 text-black">Status: {status}</p>
            <div className="space-x-4">
              <button
                onClick={startRecording}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Start
              </button>
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Stop
              </button>
            </div>

            {/* 🔴 Real-time waveform */}
            {isLive && (
              <div className="mt-4">
                <h4 className="font-semibold mb-1">Live Waveform:</h4>
                <canvas
                  ref={liveCanvasRef}
                  width={400}
                  height={100}
                  className="border border-green-300 rounded bg-white"
                />
              </div>
            )}

            {audioURL && (
              <div className="mt-4">
                <p className="mb-1 font-semibold text-black">Playback:</p>
                <audio ref={audioRef} controls src={audioURL} />
              </div>
            )}
          </div>
        )}
      />

      {/* 📊 Analysis results + static waveform */}
      {results && (
        <div className="mt-6 p-4 border border-gray-300 rounded text-black bg-gray-50">
          <h3 className="font-semibold mb-2 text-black">Analysis Results:</h3>
          <p><strong>Duration:</strong> {results.duration} seconds</p>
          <p><strong>Average Volume (RMS):</strong> {results.rms}</p>
          <p><strong>Steadiness Score:</strong> {results.steadiness}</p>
          <p className="mt-2">
            {results.steadiness > 0.95
              ? "Excellent! Your voice was steady."
              : "Try to hold your voice more steadily next time."}
          </p>
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Volume Waveform:</h4>
            <canvas
              ref={staticCanvasRef}
              width={400}
              height={100}
              className="border border-gray-300 rounded bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SustainedVowel;
