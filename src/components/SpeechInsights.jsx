import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FaMicrophone, FaStop, FaPlay, FaPause, FaClock, FaChartBar, 
  FaVolumeUp, FaComment, FaBrain, FaCheckCircle, FaExclamationTriangle,
  FaArrowRight, FaDownload, FaEye, FaVideo, FaVideoSlash
} from "react-icons/fa";
import axios from "axios";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

const SpeechInsights = () => {
  // Remove navigation state - no tabs needed
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  
  // Analysis results
  const [loudnessResult, setLoudnessResult] = useState(null);
  const [fillerResult, setFillerResult] = useState(null);
  const [paceResult, setPaceResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Camera states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      setCameraError(null);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setCameraError(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      });
      
      mediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      const audioChunks = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordTime(0);
    } catch (error) {
      console.error("Error accessing microphone:", error);
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
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const analyzeAllComponents = async () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    try {
      // Analyze loudness
      const loudnessFormData = new FormData();
      loudnessFormData.append('file', audioBlob, 'recording.wav');
      const loudnessRes = await axios.post('http://localhost:8000/loudness/predict-loudness', loudnessFormData);
      setLoudnessResult(loudnessRes.data);

      // Analyze filler words
      const fillerFormData = new FormData();
      fillerFormData.append('audio', audioBlob);
      const token = localStorage.getItem("token");
      const fillerRes = await axios.post('http://localhost:3001/api/recording/upload', fillerFormData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      setFillerResult(fillerRes.data);

      // Analyze pace (simplified)
      setPaceResult({
        wpm: Math.floor(Math.random() * 40) + 120, // Mock data
        prediction: "Good Pace",
        consistencyScore: Math.random() * 100
      });

    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score, type) => {
    if (type === 'loudness') {
      return score === 'Acceptable' ? 'text-green-400' : 'text-red-400';
    }
    if (type === 'filler') {
      if (score <= 2) return 'text-green-400';
      if (score <= 5) return 'text-yellow-400';
      return 'text-red-400';
    }
    if (type === 'pace') {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
    return 'text-gray-400';
  };

  const getScoreIcon = (score, type) => {
    if (type === 'loudness') {
      return score === 'Acceptable' ? '✓' : '⚠';
    }
    if (type === 'filler') {
      if (score <= 2) return '✓';
      if (score <= 5) return '⚠';
      return '✗';
    }
    if (type === 'pace') {
      if (score >= 80) return '✓';
      if (score >= 60) return '⚠';
      return '✗';
    }
    return '?';
  };

  const downloadPDFReport = async () => {
    const node = document.getElementById("speech-insights-report");
    if (!node) return;

    try {
      const dataUrl = await htmlToImage.toPng(node, {
        style: { color: "black", backgroundColor: "white" }
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Speech_Insights_Report.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-4rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center overflow-hidden">



        <div className="flex flex-col lg:flex-row w-full h-full gap-6">
          
          {/* Left Panel - Camera and Recording Controls */}
          <div className="w-full lg:w-2/3">
            {/* Camera Section */}
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 shadow-xl mb-6">
              <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
                <FaVideo className="text-blue-400" />
                Camera Feed
              </h2>
              
              {/* Camera Display */}
              <div className="relative w-full bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                {isCameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white/60">
                      <FaVideo className="text-4xl mb-2 mx-auto" />
                      <p className="text-sm">Camera is off</p>
                    </div>
                  </div>
                )}
                
                {/* Recording indicator overlay */}
                {isRecording && (
                  <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    REC
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={isCameraOn ? stopCamera : startCamera}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                    isCameraOn 
                      ? "bg-red-600 text-white hover:bg-red-700" 
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isCameraOn ? <FaVideoSlash /> : <FaVideo />}
                  {isCameraOn ? "Stop Camera" : "Start Camera"}
                </button>
              </div>

              {/* Camera Error */}
              {cameraError && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm text-center">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 text-center">
                🎙️ Recording Controls
              </h2>

              {/* Mic Animation */}
              <div className="relative flex items-center justify-center mb-6">
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
                  </>
                )}
                <FaMicrophone
                  className={`text-white text-4xl ${
                    isRecording && !isPaused ? "animate-pulse" : "opacity-50"
                  }`}
                />
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center space-x-3 mb-4">
                <button
                  onClick={pauseRecording}
                  disabled={!isRecording || isPaused}
                  className="p-3 bg-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  <FaPause className="text-black text-xl" />
                </button>
                <button
                  onClick={isRecording && isPaused ? resumeRecording : startRecording}
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
              <div className="text-center mb-4">
                <p className="text-white text-lg font-semibold">
                  <FaClock className="inline mr-2" />
                  {formatTime(recordTime)}
                </p>
              </div>

              {/* Analysis Button */}
              <button
                onClick={analyzeAllComponents}
                disabled={!audioBlob || isAnalyzing}
                className="w-full bg-[#00ccff] text-[#003b46] font-bold py-3 px-4 rounded-lg hover:bg-[#00a8cc] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze All Components"}
              </button>

              {/* Audio Playback */}
              {audioURL && (
                <div className="mt-4">
                  <audio controls className="w-full rounded-lg">
                    <source src={audioURL} type="audio/webm" />
                  </audio>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - All Components Display */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 shadow-xl h-full overflow-y-auto">
              
              <div id="speech-insights-report">

                {/* Overall Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-xl p-4 border-2 border-blue-400/60 text-center">
                    <div className="text-3xl font-bold text-blue-300 mb-2">
                      {loudnessResult ? getScoreIcon(loudnessResult.category, 'loudness') : '?'}
                    </div>
                    <div className="text-white font-semibold">Loudness</div>
                    <div className="text-white/70 text-sm">
                      {loudnessResult ? loudnessResult.category : 'Not Analyzed'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-4 border-2 border-green-400/60 text-center">
                    <div className="text-3xl font-bold text-green-300 mb-2">
                      {fillerResult ? getScoreIcon(fillerResult.fillerCount, 'filler') : '?'}
                    </div>
                    <div className="text-white font-semibold">Filler Words</div>
                    <div className="text-white/70 text-sm">
                      {fillerResult ? `${fillerResult.fillerCount} words` : 'Not Analyzed'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl p-4 border-2 border-purple-400/60 text-center">
                    <div className="text-3xl font-bold text-purple-300 mb-2">
                      {paceResult ? getScoreIcon(paceResult.consistencyScore, 'pace') : '?'}
                    </div>
                    <div className="text-white font-semibold">Pace</div>
                    <div className="text-white/70 text-sm">
                      {paceResult ? `${paceResult.wpm} WPM` : 'Not Analyzed'}
                    </div>
                  </div>
                </div>

                {/* Component Details Section */}
                <div className="space-y-6">
                  
                  {/* Loudness Component */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-blue-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaVolumeUp className="text-blue-400" />
                      Loudness Analysis
                    </h3>
                    {loudnessResult ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Volume Level:</span>
                          <span className={`font-semibold ${getScoreColor(loudnessResult.category, 'loudness')}`}>
                            {loudnessResult.category}
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              loudnessResult.category === 'Acceptable' ? 'bg-green-400' : 
                              loudnessResult.category === 'Low / Silent' ? 'bg-red-400' : 'bg-yellow-400'
                            }`}
                            style={{ 
                              width: loudnessResult.category === 'Acceptable' ? '100%' : 
                                    loudnessResult.category === 'Low / Silent' ? '30%' : '70%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/60 text-center py-4">No loudness analysis available</p>
                    )}
                  </div>

                  {/* Filler Words Component */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-green-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaComment className="text-green-400" />
                      Filler Words Detection
                    </h3>
                    {fillerResult ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Filler Count:</span>
                          <span className={`font-semibold ${getScoreColor(fillerResult.fillerCount, 'filler')}`}>
                            {fillerResult.fillerCount} words
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-green-500/20 rounded-lg p-2">
                            <div className="text-green-300 font-bold">0-2</div>
                            <div className="text-white/70 text-xs">Excellent</div>
                          </div>
                          <div className="bg-yellow-500/20 rounded-lg p-2">
                            <div className="text-yellow-300 font-bold">3-5</div>
                            <div className="text-white/70 text-xs">Good</div>
                          </div>
                          <div className="bg-red-500/20 rounded-lg p-2">
                            <div className="text-red-300 font-bold">6+</div>
                            <div className="text-white/70 text-xs">Needs Work</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/60 text-center py-4">No filler words analysis available</p>
                    )}
                  </div>

                  {/* Pace Management Component */}
                  <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-xl p-6 border-2 border-purple-400/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaBrain className="text-purple-400" />
                      Pace Management
                    </h3>
                    {paceResult ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Speaking Rate:</span>
                          <span className={`font-semibold ${getScoreColor(paceResult.consistencyScore, 'pace')}`}>
                            {paceResult.wpm} WPM
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Consistency:</span>
                          <span className={`font-semibold ${getScoreColor(paceResult.consistencyScore, 'pace')}`}>
                            {paceResult.consistencyScore.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              paceResult.consistencyScore >= 80 ? 'bg-green-400' : 
                              paceResult.consistencyScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(paceResult.consistencyScore, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/60 text-center py-4">No pace analysis available</p>
                    )}
                  </div>

                </div>

                {/* Action Buttons */}
                {(loudnessResult || fillerResult || paceResult) && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={downloadPDFReport}
                      className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload />
                      Download Complete Report
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!loudnessResult && !fillerResult && !paceResult && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎤</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                    <p className="text-white/70">
                      Record your speech and click "Analyze All Components" to get comprehensive insights.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechInsights;
