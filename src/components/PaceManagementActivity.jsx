import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authenticatedFetch } from "../utils/auth";
import { 
  FaMicrophone, 
  FaStop, 
  FaPlay, 
  FaPause, 
  FaClock, 
  FaChartBar, 
  FaTrophy, 
  FaBullseye, 
  FaRocket, 
  FaStar,
  FaMedal,
  FaCrosshairs,
  FaMusic,
  FaBrain,
  FaCrown,
  FaFire,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaGamepad,
  FaAward,
  FaGem,
  FaBolt,
  FaHistory
} from "react-icons/fa";
import GaugeChart from "react-gauge-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

// Activity Types
const ACTIVITY_TYPES = {
  PACING_CURVE: 'pacing_curve',
  RATE_MATCH: 'rate_match',
  SPEED_SHIFT: 'speed_shift',
  CONSISTENCY_TRACKER: 'consistency_tracker',
  IDEAL_PACE_CHALLENGE: 'ideal_pace_challenge',
  PAUSE_TIMING: 'pause_timing',
  EXCESSIVE_PAUSE_ELIMINATION: 'excessive_pause_elimination',
  PAUSE_FOR_IMPACT: 'pause_for_impact',
  PAUSE_RHYTHM: 'pause_rhythm',
  CONFIDENCE_PAUSE: 'confidence_pause',
  GOLDEN_RATIO: 'golden_ratio',
  PAUSE_ENTROPY: 'pause_entropy',
  COGNITIVE_PAUSE: 'cognitive_pause',
  // Real-time pause activities
  PAUSE_MONITORING: 'pause_monitoring',
  PAUSE_IMPROVEMENT: 'pause_improvement',
  PAUSE_RHYTHM_TRAINING: 'pause_rhythm_training',
  CONFIDENCE_PAUSE_PRACTICE: 'confidence_pause_practice',
  IMPACT_PAUSE_TRAINING: 'impact_pause_training'
};

// Activity Categories
const ACTIVITY_CATEGORIES = {
  rate: {
    name: "Speech Rate",
    icon: FaChartBar,
    activities: [
      ACTIVITY_TYPES.PACING_CURVE,
      ACTIVITY_TYPES.RATE_MATCH,
      ACTIVITY_TYPES.SPEED_SHIFT,
      ACTIVITY_TYPES.CONSISTENCY_TRACKER,
      ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE
    ]
  },
  pause: {
    name: "Pause Management",
    icon: FaClock,
    activities: [
      ACTIVITY_TYPES.PAUSE_TIMING,
      ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION,
      ACTIVITY_TYPES.PAUSE_FOR_IMPACT,
      ACTIVITY_TYPES.PAUSE_RHYTHM,
      ACTIVITY_TYPES.CONFIDENCE_PAUSE
    ]
  },
  advanced: {
    name: "Advanced Techniques",
    icon: FaBrain,
    activities: [
      ACTIVITY_TYPES.GOLDEN_RATIO,
      ACTIVITY_TYPES.PAUSE_ENTROPY,
      ACTIVITY_TYPES.COGNITIVE_PAUSE
    ]
  },
  pause_realtime: {
    name: "Real-Time Pause",
    icon: FaMicrophone,
    activities: [
      ACTIVITY_TYPES.PAUSE_MONITORING,
      ACTIVITY_TYPES.PAUSE_IMPROVEMENT,
      ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING,
      ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE,
      ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING
    ]
  }
};

// Badge System
const BADGES = {
  STEADY_FLOW: { name: "Steady Flow", icon: FaEquals, color: "green", requirement: "WPM std < 20" },
  TEMPO_MASTER: { name: "Tempo Master", icon: FaMusic, color: "blue", requirement: "3 consecutive sessions" },
  DYNAMIC_SPEAKER: { name: "Dynamic Speaker", icon: FaRocket, color: "purple", requirement: "Controlled pace shifts" },
  CONSISTENCY_STREAK: { name: "Consistency Streak", icon: FaFire, color: "orange", requirement: "7 consecutive recordings" },
  PAUSE_PRECISION: { name: "Pause Precision", icon: FaCrosshairs, color: "cyan", requirement: "70% optimal pauses" },
  NO_DEAD_AIR: { name: "No Dead Air", icon: FaTimesCircle, color: "red", requirement: "Zero excessive pauses" },
  IMPACT_PAUSE: { name: "Impact Pause", icon: FaStar, color: "yellow", requirement: "Comprehension >80%" },
  RHYTHM_SPEAKER: { name: "Rhythm Speaker", icon: FaMusic, color: "pink", requirement: "Rhythm consistency >70%" },
  CONFIDENT_VOICE: { name: "Confident Voice", icon: FaCrown, color: "gold", requirement: "Fillers <2/min" },
  GOLDEN_RATIO_MASTER: { name: "Golden Ratio Master", icon: FaGem, color: "purple", requirement: "1.618x pauses" },
  ENTROPY_CONTROLLER: { name: "Entropy Controller", icon: FaBrain, color: "indigo", requirement: "Low pause randomness" },
  COGNITIVE_MASTER: { name: "Cognitive Master", icon: FaBolt, color: "teal", requirement: "Complex explanations" },
  // Real-time pause badges
  PAUSE_MASTER: { name: "Pause Master", icon: FaCrosshairs, color: "blue", requirement: "Optimal pause timing" },
  FLOW_GUARDIAN: { name: "Flow Guardian", icon: FaEquals, color: "green", requirement: "No excessive pauses" },
  RHYTHM_KEEPER: { name: "Rhythm Keeper", icon: FaMusic, color: "purple", requirement: "Consistent pause rhythm" },
  CONFIDENCE_BUILDER: { name: "Confidence Builder", icon: FaCrown, color: "yellow", requirement: "Perfect confidence pauses" },
  IMPACT_SPECIALIST: { name: "Impact Specialist", icon: FaStar, color: "orange", requirement: "Mastered impact timing" }
};

// Levels
const LEVELS = {
  BRONZE: { name: "Bronze", color: "#CD7F32", threshold: 0.3 },
  SILVER: { name: "Silver", color: "#C0C0C0", threshold: 0.2 },
  GOLD: { name: "Gold", color: "#FFD700", threshold: 0.1 },
  PLATINUM: { name: "Platinum", color: "#E5E4E2", threshold: 0.05 }
};

// Define pause real-time activities array as a constant
const PAUSE_REALTIME_ACTIVITIES = [
  'pause_monitoring',
  'pause_improvement', 
  'pause_rhythm_training',
  'confidence_pause_practice',
  'impact_pause_training'
];

const PaceManagementActivity = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);
  const [activityProgress, setActivityProgress] = useState({});
  const [userBadges, setUserBadges] = useState([]);
  const [userLevel, setUserLevel] = useState("Bronze");
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTime: 0,
    averageWPM: 0,
    consistencyScore: 0
  });
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);
  const [activityResults, setActivityResults] = useState(null);
  const [lastActivityType, setLastActivityType] = useState(null);
  const [activeTab, setActiveTab] = useState("rate");
  const [displayTime, setDisplayTime] = useState(0);
  
  // New real-time activity states
  const [realTimeTab, setRealTimeTab] = useState("challenge");
  const [realTimeSession, setRealTimeSession] = useState(null);
  const [currentWPM, setCurrentWPM] = useState(0);
  const [targetWPM, setTargetWPM] = useState(125);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [paceScore, setPaceScore] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalTime: 0,
    averageWPM: 0,
    consistency: 0,
    bestStreak: 0
  });
  const [previousScores, setPreviousScores] = useState([]);
  
  // Real-time pause monitoring states
  const [pauseMetrics, setPauseMetrics] = useState({
    pauseRatio: 0,
    excessivePauses: 0,
    longPauses: 0,
    currentPauseDuration: 0,
    flowScore: 0
  });
  const [pauseAlerts, setPauseAlerts] = useState([]);
  const [pauseSuggestions, setPauseSuggestions] = useState([]);
  const [isPauseMonitoring, setIsPauseMonitoring] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const recordTime = useRef(0);
  const startTime = useRef(null);
  const activeActivityRef = useRef(null);

  // Real-time analysis interval
  const analysisInterval = useRef(null);
  const realTimeInterval = useRef(null);
  const wpmUpdateInterval = useRef(null);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startRealTimeAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
    }
    
    // Check if this is an ideal pace challenge activity
    if (activeActivity === "ideal_pace_challenge") {
      startIdealPaceChallenge();
      return;
    }
    
    analysisInterval.current = setInterval(async () => {
      if (isRecording && !isPaused && activeActivity) {
        try {
          // Try to send actual audio chunk first, fallback to duration-based
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            await sendAudioChunkForAnalysis();
          } else {
            // Fallback to duration-based analysis
            await sendDurationBasedAnalysis();
          }
        } catch (error) {
          console.error("Real-time analysis error:", error);
        }
      }
    }, 3000); // Analyze every 3 seconds for better chunk processing
  };

  const sendDurationBasedAnalysis = async () => {
        try {
          const response = await fetch("http://localhost:8000/real-time-analysis/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activityType: activeActivity,
              duration: recordTime.current,
              timestamp: Date.now()
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setRealTimeFeedback(data);
            updateActivityProgress(data);
          }
        } catch (error) {
      console.error("Duration-based analysis error:", error);
    }
  };

  const sendAudioChunkForAnalysis = async () => {
    try {
      // Create a 3-second audio chunk from current recording
      const audioChunk = await captureAudioChunk();
      if (audioChunk) {
        const response = await fetch("http://localhost:8000/real-time-analysis/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioChunk: audioChunk,
            activityType: activeActivity,
            chunkIndex: Math.floor(recordTime.current / 3),
            sessionId: `session_${Date.now()}`,
            timestamp: Date.now()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setRealTimeFeedback(data);
          updateActivityProgress(data);
        }
      }
    } catch (error) {
      console.error("Audio chunk analysis error:", error);
      // Fallback to duration-based analysis
      await sendDurationBasedAnalysis();
    }
  };

  const captureAudioChunk = async () => {
    return new Promise((resolve) => {
      try {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
          resolve(null);
          return;
        }

        // Create a temporary recorder for chunk capture
        const chunkRecorder = new MediaRecorder(mediaStreamRef.current, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunkChunks = [];
        
        chunkRecorder.ondataavailable = (event) => {
          chunkChunks.push(event.data);
        };
        
        chunkRecorder.onstop = () => {
          const chunkBlob = new Blob(chunkChunks, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
            resolve(base64);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(chunkBlob);
        };
        
        chunkRecorder.onerror = () => resolve(null);
        
        // Record for 3 seconds
        chunkRecorder.start();
        setTimeout(() => {
          if (chunkRecorder.state === "recording") {
            chunkRecorder.stop();
          }
        }, 3000);
        
      } catch (error) {
        console.error("Chunk capture error:", error);
        resolve(null);
      }
    });
  };

  const startIdealPaceChallenge = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
    }
    
    analysisInterval.current = setInterval(async () => {
      if (isRecording && !isPaused && activeActivity === "ideal_pace_challenge") {
        try {
          // Try to send actual audio chunk first, fallback to duration-based
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            await sendAudioChunkForIdealPaceChallenge();
          } else {
            // Fallback to duration-based analysis
            await sendDurationBasedIdealPaceChallenge();
          }
        } catch (error) {
          console.error("Ideal pace challenge analysis error:", error);
        }
      }
    }, 3000); // Analyze every 3 seconds
  };

  // New real-time pace monitoring functions
  const startRealTimePaceMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Create audio context for real-time analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Float32Array(bufferLength);
      
      source.connect(analyserRef.current);
      
      setIsRealTimeActive(true);
      setRealTimeSession({
        id: `session_${Date.now()}`,
        startTime: Date.now(),
        targetWPM: targetWPM
      });
      
      // Start real-time WPM monitoring
      wpmUpdateInterval.current = setInterval(async () => {
        try {
          // Get audio data
          analyserRef.current.getFloatTimeDomainData(dataArray);
          
          // Calculate RMS for volume detection
          const rms = Math.sqrt(
            dataArray.reduce((sum, val) => sum + val * val, 0) / bufferLength
          );
          
          if (rms > 0.01) { // Only analyze when there's significant audio
            // Send audio chunk for WPM analysis
            const audioChunk = await captureAudioChunkForRealTime();
            if (audioChunk) {
              await analyzeRealTimeWPM(audioChunk);
            }
          }
        } catch (error) {
          console.error("Real-time WPM analysis error:", error);
        }
      }, 2000); // Update every 2 seconds
      
    } catch (error) {
      console.error("Error starting real-time pace monitoring:", error);
    }
  };

  const captureAudioChunkForRealTime = async () => {
    return new Promise((resolve) => {
      try {
        if (!mediaStreamRef.current) {
          resolve(null);
          return;
        }

        const chunkRecorder = new MediaRecorder(mediaStreamRef.current, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunkChunks = [];
        
        chunkRecorder.ondataavailable = (event) => {
          chunkChunks.push(event.data);
        };
        
        chunkRecorder.onstop = () => {
          const chunkBlob = new Blob(chunkChunks, { type: 'audio/webm' });
          
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(chunkBlob);
        };
        
        chunkRecorder.onerror = () => resolve(null);
        
        chunkRecorder.start();
        setTimeout(() => {
          if (chunkRecorder.state === "recording") {
            chunkRecorder.stop();
          }
        }, 2000);
        
      } catch (error) {
        console.error("Chunk capture error:", error);
        resolve(null);
      }
    });
  };

  const analyzeRealTimeWPM = async (audioChunk) => {
    try {
      const response = await fetch("http://localhost:8000/real-time-analysis/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioChunk: audioChunk,
          activityType: "ideal_pace_challenge",
          sessionId: realTimeSession?.id,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update WPM and history
        if (data.current_wpm) {
          setCurrentWPM(data.current_wpm);
          setWpmHistory(prev => [...prev.slice(-19), data.current_wpm]); // Keep last 20 readings
          
          // Calculate pace score based on target
          const wpmDiff = Math.abs(data.current_wpm - targetWPM);
          const score = Math.max(0, 100 - (wpmDiff * 2)); // 2 points penalty per WPM difference
          setPaceScore(score);
          
          // Update streak
          if (wpmDiff <= 15) { // Within 15 WPM of target
            setStreakCount(prev => prev + 1);
          } else {
            setStreakCount(0);
          }
          
          // Update real-time stats
          setRealTimeStats(prev => ({
            ...prev,
            totalTime: prev.totalTime + 2,
            averageWPM: prev.averageWPM === 0 ? data.current_wpm : (prev.averageWPM + data.current_wpm) / 2,
            consistency: calculateConsistency([...wpmHistory.slice(-19), data.current_wpm]),
            bestStreak: Math.max(prev.bestStreak, streakCount + (wpmDiff <= 15 ? 1 : 0))
          }));
        }
      }
    } catch (error) {
      console.error("Real-time WPM analysis error:", error);
    }
  };

  const calculateConsistency = (wpmArray) => {
    if (wpmArray.length < 2) return 100;
    const mean = wpmArray.reduce((a, b) => a + b, 0) / wpmArray.length;
    const variance = wpmArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / wpmArray.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 100 - (stdDev * 2)); // Penalty for high standard deviation
  };

  const stopRealTimePaceMonitoring = () => {
    setIsRealTimeActive(false);
    setRealTimeSession(null);
    
    if (wpmUpdateInterval.current) {
      clearInterval(wpmUpdateInterval.current);
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Save session data
    if (realTimeStats.totalTime > 0) {
      saveRealTimeSession();
    }
  };

  const saveRealTimeSession = async () => {
    try {
      const sessionData = {
        type: "real_time_pace",
        duration: realTimeStats.totalTime,
        averageWPM: realTimeStats.averageWPM,
        consistency: realTimeStats.consistency,
        bestStreak: realTimeStats.bestStreak,
        finalScore: paceScore
      };
      
      // Save to backend
      await authenticatedFetch("http://localhost:3001/api/pace/session", {
        method: "POST",
        body: JSON.stringify(sessionData)
      });
      
      // Update local state with proper timestamp
      const sessionWithTimestamp = {
        ...sessionData,
        createdAt: new Date().toISOString()
      };
      setPreviousScores(prev => [sessionWithTimestamp, ...prev]);
      
      // Refresh badges and stats to show updated data
      fetchUserBadges();
      fetchUserStats();
      
    } catch (error) {
      console.error("Error saving real-time session:", error);
    }
  };

  // Real-time pause monitoring functions
  const startPauseMonitoring = async (activityType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      setIsPauseMonitoring(true);
      setActiveActivity(activityType);
      
      // Start real-time pause analysis
      analysisInterval.current = setInterval(async () => {
        if (isPauseMonitoring && mediaStreamRef.current && !isPaused) {
          try {
            console.log("Starting pause analysis...");
            const audioChunk = await captureAudioChunkForPauseMonitoring();
            if (audioChunk) {
              console.log("Audio chunk captured, analyzing...");
              await analyzePauseRealTime(audioChunk, activityType);
            } else {
              console.log("No audio chunk captured");
              // Try fallback analysis with duration
              await analyzePauseRealTime(null, activityType);
            }
          } catch (error) {
            console.error("Pause monitoring error:", error);
          }
        }
      }, 3000); // Analyze every 3 seconds
      
    } catch (error) {
      console.error("Error starting pause monitoring:", error);
    }
  };

  const captureAudioChunkForPauseMonitoring = async () => {
    return new Promise((resolve) => {
      try {
        if (!mediaStreamRef.current) {
          resolve(null);
          return;
        }

        const chunkRecorder = new MediaRecorder(mediaStreamRef.current, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunkChunks = [];
        
        chunkRecorder.ondataavailable = (event) => {
          chunkChunks.push(event.data);
        };
        
        chunkRecorder.onstop = () => {
          const chunkBlob = new Blob(chunkChunks, { type: 'audio/webm' });
          
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(chunkBlob);
        };
        
        chunkRecorder.onerror = () => resolve(null);
        
        chunkRecorder.start();
        setTimeout(() => {
          if (chunkRecorder.state === "recording") {
            chunkRecorder.stop();
          }
        }, 3000);
        
      } catch (error) {
        console.error("Pause chunk capture error:", error);
        resolve(null);
      }
    });
  };

  const analyzePauseRealTime = async (audioChunk, activityType) => {
    try {
      const requestData = {
        activityType: activityType,
        sessionId: `pause_session_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      // Add audio chunk if available, otherwise use duration for mock analysis
      if (audioChunk) {
        requestData.audioChunk = audioChunk;
      } else {
        requestData.duration = recordTime.current || 3; // Use current recording time or default 3 seconds
      }

      console.log("Sending pause analysis request:", { ...requestData, audioChunk: audioChunk ? "present" : "null" });

      const response = await fetch("http://localhost:8000/pause-realtime-monitoring/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(requestData)
      });
      
      console.log("Pause analysis response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Pause analysis data received:", data);
        
        // Update pause metrics
        if (data.metrics) {
          const newMetrics = {
            pauseRatio: data.metrics.pause_ratio || 0,
            excessivePauses: data.metrics.excessive_pauses || 0,
            longPauses: data.metrics.long_pauses || 0,
            currentPauseDuration: data.metrics.current_pause_duration || 0,
            flowScore: data.scores?.flow_score || 0
          };
          console.log("Updating pause metrics:", newMetrics);
          setPauseMetrics(newMetrics);
        }
        
        // Update alerts and suggestions
        if (data.feedback) {
          console.log("Updating alerts:", data.feedback.alerts);
          console.log("Updating suggestions:", data.feedback.suggestions);
          setPauseAlerts(data.feedback.alerts || []);
          setPauseSuggestions(data.feedback.suggestions || []);
        }
        
        // Update real-time feedback
        const feedbackData = {
          ...data.feedback,
          pauseRatio: data.metrics?.pause_ratio,
          flowScore: data.scores?.flow_score,
          activityScore: data.scores?.activity_score
        };
        console.log("Updating real-time feedback:", feedbackData);
        setRealTimeFeedback(feedbackData);
      } else {
        console.error("Pause analysis failed:", response.status, await response.text());
        // Generate fallback mock data for testing
        await generateFallbackPauseData(activityType);
      }
    } catch (error) {
      console.error("Real-time pause analysis error:", error);
      // Generate fallback mock data for testing
      await generateFallbackPauseData(activityType);
    }
  };

  // Fallback function to generate mock pause data for testing
  const generateFallbackPauseData = async (activityType) => {
    console.log("Generating fallback pause data for activity:", activityType);
    
    // Generate realistic mock data based on activity type
    const mockMetrics = {
      pauseRatio: Math.random() * 0.15 + 0.05, // 5-20%
      excessivePauses: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
      longPauses: Math.floor(Math.random() * 5),
      currentPauseDuration: Math.random() * 3,
      flowScore: Math.random() * 40 + 60 // 60-100
    };
    
    // Generate mock alerts based on metrics
    const mockAlerts = [];
    const mockSuggestions = [];
    
    if (mockMetrics.excessivePauses > 0) {
      mockAlerts.push({
        type: 'warning',
        message: `🚨 EXCESSIVE PAUSE ALERT! ${mockMetrics.excessivePauses} pause(s) longer than 5 seconds`,
        action: 'Immediately shorten your pauses to maintain audience engagement!'
      });
    }
    
    if (mockMetrics.longPauses > 3) {
      mockAlerts.push({
        type: 'warning',
        message: `⚠️ Too many long pauses: ${mockMetrics.longPauses} pauses over 2.5 seconds`,
        action: 'Break up long pauses with shorter, strategic ones'
      });
    } else if (mockMetrics.longPauses > 1) {
      mockAlerts.push({
        type: 'caution',
        message: `⏱️ Moderate long pauses detected: ${mockMetrics.longPauses} pauses`,
        action: 'Consider using shorter pauses for better rhythm'
      });
    }
    
    if (mockMetrics.pauseRatio > 0.15) {
      mockAlerts.push({
        type: 'warning',
        message: `📊 High pause ratio: ${(mockMetrics.pauseRatio * 100).toFixed(1)}% of speech time`,
        action: 'Reduce pause frequency - speak more continuously'
      });
    } else if (mockMetrics.pauseRatio < 0.08) {
      mockAlerts.push({
        type: 'caution',
        message: `⚡ Low pause ratio: ${(mockMetrics.pauseRatio * 100).toFixed(1)}% - very fast speech`,
        action: 'Add strategic pauses for emphasis and clarity'
      });
    }
    
    // Generate strategic suggestions
    if (activityType === 'pause_monitoring') {
      mockSuggestions.push("💡 Try pausing after key points for emphasis");
      mockSuggestions.push("🎯 Use 1-2 second pauses between topics");
      mockSuggestions.push("⚡ Pause before important words: 'The key point is...'");
    } else if (activityType === 'confidence_pause_practice') {
      mockSuggestions.push("💪 Practice 1.5-2.0 second pauses to show confidence");
      mockSuggestions.push("👑 Hold pauses to demonstrate authority");
      mockSuggestions.push("🎭 Use pauses to create dramatic effect");
    } else if (activityType === 'impact_pause_training') {
      mockSuggestions.push("⚡ Use 1.0-1.5 second pauses for maximum impact");
      mockSuggestions.push("💥 Pause after powerful statements");
      mockSuggestions.push("🎪 Create anticipation with strategic pauses");
    }
    
    // Update state with mock data
    setPauseMetrics(mockMetrics);
    setPauseAlerts(mockAlerts);
    setPauseSuggestions(mockSuggestions);
    
    const feedbackData = {
      alerts: mockAlerts,
      suggestions: mockSuggestions,
      pauseRatio: mockMetrics.pauseRatio,
      flowScore: mockMetrics.flowScore,
      activityScore: mockMetrics.flowScore,
      feedback: `Mock data generated for ${activityType}. Flow score: ${mockMetrics.flowScore.toFixed(0)}%`
    };
    
    setRealTimeFeedback(feedbackData);
    console.log("Fallback pause data generated:", { mockMetrics, mockAlerts, mockSuggestions });
  };

  const stopPauseMonitoring = () => {
    setIsPauseMonitoring(false);
    
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Save pause session
    savePauseSession();
  };

  const savePauseSession = async () => {
    try {
      const sessionData = {
        type: "real_time_pause",
        activityType: activeActivity,
        duration: recordTime.current,
        pauseRatio: pauseMetrics.pauseRatio,
        excessivePauses: pauseMetrics.excessivePauses,
        longPauses: pauseMetrics.longPauses,
        flowScore: pauseMetrics.flowScore,
        finalScore: pauseMetrics.flowScore,
        alerts: pauseAlerts,
        suggestions: pauseSuggestions
      };
      
      // Save to backend
      await authenticatedFetch("http://localhost:3001/api/pace/session", {
        method: "POST",
        body: JSON.stringify(sessionData)
      });
      
      // Update local state
      const sessionWithTimestamp = {
        ...sessionData,
        createdAt: new Date().toISOString()
      };
      setPreviousScores(prev => [sessionWithTimestamp, ...prev]);
      
      // Refresh data
      fetchUserBadges();
      fetchUserStats();
      
    } catch (error) {
      console.error("Error saving pause session:", error);
    }
  };

  const saveActivitySession = async (data, activityType, duration) => {
    try {
      // Determine domain based on activity type
      const rateActivities = [
        ACTIVITY_TYPES.PACING_CURVE,
        ACTIVITY_TYPES.RATE_MATCH,
        ACTIVITY_TYPES.SPEED_SHIFT,
        ACTIVITY_TYPES.CONSISTENCY_TRACKER,
        ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE,
      ];
      const pauseActivities = [
        ACTIVITY_TYPES.PAUSE_TIMING,
        ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION,
        ACTIVITY_TYPES.PAUSE_FOR_IMPACT,
        ACTIVITY_TYPES.PAUSE_RHYTHM,
        ACTIVITY_TYPES.CONFIDENCE_PAUSE,
      ];
      const advancedActivities = [
        ACTIVITY_TYPES.GOLDEN_RATIO,
        ACTIVITY_TYPES.PAUSE_ENTROPY,
        ACTIVITY_TYPES.COGNITIVE_PAUSE,
      ];

      let domain = "rate";
      if (pauseActivities.includes(activityType)) {
        domain = "pause";
      } else if (advancedActivities.includes(activityType)) {
        domain = "advanced";
      }

      const sessionData = {
        type: "activity",
        activityType: activityType,
        domain: domain,
        duration: duration,
        finalScore: data.finalScore || 0,
        averageWPM: data.averageWPM || 0,
        consistencyScore: data.consistencyScore || 0,
        pauseRatio: data.pauseRatio || 0,
        wpmStd: data.wpmStd || 0,
        prediction: data.prediction || null,
        confidence: data.confidence || null,
        rhythmConsistency: data.rhythmConsistency || null,
        goldenRatioScore: data.goldenRatioScore || null,
        entropyScore: data.entropyScore || null,
        cognitiveScore: data.cognitiveScore || null,
        excessivePauses: data.excessivePauses || null,
        badges: data.newBadges ? data.newBadges.map(badge => badge.name) : [],
        metrics: {
          pacingCurve: data.pacingCurve || null,
          idealLines: data.idealLines || null,
          recommendations: data.recommendations || [],
          rawFeatures: data.rawFeatures || {}
        }
      };
      
      // Save to backend
      const response = await authenticatedFetch("http://localhost:3001/api/pace/session", {
        method: "POST",
        body: JSON.stringify(sessionData)
      });
      
      if (response.ok) {
        console.log("Activity session saved successfully");
        // Refresh scores, badges, and stats to show updated data
        fetchPreviousScores();
        fetchUserBadges();
        fetchUserStats();
      }
      
    } catch (error) {
      console.error("Error saving activity session:", error);
    }
  };

  const fetchPreviousScores = async () => {
    try {
      const response = await authenticatedFetch("http://localhost:3001/api/pace/sessions");
      
      if (response.ok) {
        const data = await response.json();
        setPreviousScores(data.sessions || []);
      } else {
        console.error("Failed to fetch previous scores:", response.status);
      }
    } catch (error) {
      console.error("Error fetching previous scores:", error);
      // If authentication fails, the authenticatedFetch will handle logout
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPreviousScores();
    fetchUserBadges();
    fetchUserStats();
  }, []);

  const sendDurationBasedIdealPaceChallenge = async () => {
    try {
      const response = await fetch("http://localhost:8000/ideal-pace-challenge/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: recordTime.current,
          sessionId: `ideal_challenge_${Date.now()}`,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealTimeFeedback(data);
        updateActivityProgress(data);
      }
    } catch (error) {
      console.error("Duration-based ideal pace challenge error:", error);
    }
  };

  const sendAudioChunkForIdealPaceChallenge = async () => {
    try {
      // Create a 3-second audio chunk from current recording
      const audioChunk = await captureAudioChunk();
      if (audioChunk) {
        const response = await fetch("http://localhost:8000/ideal-pace-challenge/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioChunk: audioChunk,
            sessionId: `ideal_challenge_${Date.now()}`,
            chunkIndex: Math.floor(recordTime.current / 3),
            timestamp: Date.now()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setRealTimeFeedback(data);
          updateActivityProgress(data);
        }
      }
    } catch (error) {
      console.error("Audio chunk ideal pace challenge error:", error);
      // Fallback to duration-based analysis
      await sendDurationBasedIdealPaceChallenge();
    }
  };

  const updateActivityProgress = (data) => {
    setActivityProgress(prev => ({
      ...prev,
      [activeActivity]: {
        ...prev[activeActivity],
        currentScore: data.score || 0,
        targetScore: data.targetScore || 100,
        progress: data.progress || 0,
        feedback: data.feedback || "",
        metrics: data.metrics || {}
      }
    }));
  };

  const startActivity = async (activityType) => {
    setActiveActivity(activityType);
    activeActivityRef.current = activityType;
    setActivityProgress(prev => ({
      ...prev,
      [activityType]: {
        startTime: Date.now(),
        currentScore: 0,
        targetScore: getActivityTarget(activityType),
        progress: 0,
        feedback: "Starting activity...",
        metrics: {}
      }
    }));
    
    // Check if this is a real-time pause activity
    if (PAUSE_REALTIME_ACTIVITIES.includes(activityType)) {
      // Start pause monitoring
      await startPauseMonitoring(activityType);
      setIsRecording(true);
      setIsPaused(false);
      recordTime.current = 0;
      setDisplayTime(0);
      startTime.current = Date.now();
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        analyzeActivity(audioBlob, activeActivityRef.current);
      };

      setIsRecording(true);
      setIsPaused(false);
      recordTime.current = 0;
      setDisplayTime(0);
      startTime.current = Date.now();
      
      mediaRecorderRef.current.start();
      startRealTimeAnalysis();
      
    } catch (error) {
      console.error("Error starting activity:", error);
    }
  };

  const handlePlay = async () => {
    if (!isRecording || isPaused) {
      try {
        if (!isRecording) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          mediaRecorderRef.current = new MediaRecorder(stream);

          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioUrl(audioUrl);
            analyzeActivity(audioBlob, activeActivityRef.current);
          };
        }

        setIsRecording(true);
        setIsPaused(false);

        if (mediaRecorderRef.current.state === "paused") {
          mediaRecorderRef.current.resume();
        } else if (mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current.start();
        }
        
        if (activeActivity) {
          startRealTimeAnalysis();
        }
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
    // Check if this is a pause monitoring activity
    if (PAUSE_REALTIME_ACTIVITIES.includes(activeActivity)) {
      // Stop pause monitoring
      stopPauseMonitoring();
      setIsRecording(false);
      setIsPaused(false);
      recordTime.current = 0;
      setDisplayTime(0);
      setActiveActivity(null);
      return;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      setIsPaused(false);
      recordTime.current = 0;
      setDisplayTime(0);
      mediaRecorderRef.current.stop();
      
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      audioChunksRef.current = [];
      setActiveActivity(null);
    }
  };


  const analyzeActivity = async (blob, activityType) => {
    const formData = new FormData();
    formData.append("file", blob, "speech.wav");
    // Some servers expect snake_case; include both keys to be safe
    formData.append("activityType", activityType);
    formData.append("activity_type", activityType);
    formData.append("activity", activityType);

    try {
      // Route to the correct backend service to avoid redirect/validation issues
      const rateActivities = [
        ACTIVITY_TYPES.PACING_CURVE,
        ACTIVITY_TYPES.RATE_MATCH,
        ACTIVITY_TYPES.SPEED_SHIFT,
        ACTIVITY_TYPES.CONSISTENCY_TRACKER,
        ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE,
      ];
      const isRate = rateActivities.includes(activityType);
      const endpoint = isRate
        ? "http://localhost:8000/rate/analyze-activity/"
        : "http://localhost:8000/pause/analyze-activity/";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setActivityResults(data);
        setLastActivityType(activityType);
        checkBadgeEligibility(data, activityType);
        updateSessionStats(data);
        
        // Save activity session to database
        await saveActivitySession(data, activityType, recordTime.current);
      }
    } catch (error) {
      console.error("Activity analysis error:", error);
    }
  };

  const checkBadgeEligibility = (data, activityType) => {
    const newBadges = [];
    
    // Check for specific badges based on activity type and performance
    if (activityType === ACTIVITY_TYPES.PACING_CURVE && data.wpmStd < 20) {
      newBadges.push(BADGES.STEADY_FLOW);
    }
    
    if (activityType === ACTIVITY_TYPES.RATE_MATCH && data.consecutiveSessions >= 3) {
      newBadges.push(BADGES.TEMPO_MASTER);
    }
    
    if (activityType === ACTIVITY_TYPES.SPEED_SHIFT && data.controlledShifts) {
      newBadges.push(BADGES.DYNAMIC_SPEAKER);
    }
    
    if (data.consistencyStreak >= 7) {
      newBadges.push(BADGES.CONSISTENCY_STREAK);
    }
    
    if (activityType === ACTIVITY_TYPES.PAUSE_TIMING && data.optimalPauseRatio >= 0.7) {
      newBadges.push(BADGES.PAUSE_PRECISION);
    }
    
    if (activityType === ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION && data.excessivePauses === 0) {
      newBadges.push(BADGES.NO_DEAD_AIR);
    }
    
    if (activityType === ACTIVITY_TYPES.PAUSE_FOR_IMPACT && data.comprehensionScore >= 80) {
      newBadges.push(BADGES.IMPACT_PAUSE);
    }
    
    if (activityType === ACTIVITY_TYPES.PAUSE_RHYTHM && data.rhythmConsistency >= 70) {
      newBadges.push(BADGES.RHYTHM_SPEAKER);
    }
    
    if (data.fillerCount < 2) {
      newBadges.push(BADGES.CONFIDENT_VOICE);
    }
    
    if (activityType === ACTIVITY_TYPES.GOLDEN_RATIO && data.goldenRatioScore >= 0.8) {
      newBadges.push(BADGES.GOLDEN_RATIO_MASTER);
    }
    
    if (activityType === ACTIVITY_TYPES.PAUSE_ENTROPY && data.entropyScore <= 0.3) {
      newBadges.push(BADGES.ENTROPY_CONTROLLER);
    }
    
    if (activityType === ACTIVITY_TYPES.COGNITIVE_PAUSE && data.cognitiveScore >= 85) {
      newBadges.push(BADGES.COGNITIVE_MASTER);
    }
    
    // Check for ideal pace challenge specific badges
    if (activityType === ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE) {
      if (data.finalScore >= 90) {
        newBadges.push(BADGES.TEMPO_MASTER);
      }
      if (data.consistencyScore >= 85) {
        newBadges.push(BADGES.STEADY_FLOW);
      }
    }
    
    // Add new badges to user's collection
    setUserBadges(prev => {
      const existingBadges = prev.map(b => b.name);
      const uniqueNewBadges = newBadges.filter(badge => !existingBadges.includes(badge.name));
      return [...prev, ...uniqueNewBadges];
    });
    
    // Store new badges in the data for database saving
    data.newBadges = newBadges;
  };

  const updateSessionStats = (data) => {
    setSessionStats(prev => ({
      totalSessions: prev.totalSessions + 1,
      currentStreak: data.consistencyStreak || prev.currentStreak,
      bestStreak: Math.max(prev.bestStreak, data.consistencyStreak || 0),
      totalTime: prev.totalTime + (recordTime.current || 0),
      averageWPM: data.averageWPM || prev.averageWPM,
      consistencyScore: data.consistencyScore || prev.consistencyScore
    }));
  };

  const fetchUserBadges = async () => {
    try {
      const response = await authenticatedFetch("http://localhost:3001/api/pace/sessions");
      
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        
        // Extract all badges from sessions
        const allBadges = [];
        sessions.forEach(session => {
          if (session.badges && session.badges.length > 0) {
            session.badges.forEach(badgeName => {
              const badge = Object.values(BADGES).find(b => b.name === badgeName);
              if (badge && !allBadges.some(b => b.name === badgeName)) {
                allBadges.push(badge);
              }
            });
          }
        });
        
        setUserBadges(allBadges);
      }
    } catch (error) {
      console.error("Error fetching user badges:", error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await authenticatedFetch("http://localhost:3001/api/pace/sessions");
      
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        
        // Calculate user stats from all sessions
        const totalSessions = sessions.length;
        const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const averageWPM = sessions.length > 0 
          ? sessions.reduce((sum, session) => sum + (session.averageWPM || 0), 0) / sessions.length 
          : 0;
        const consistencyScore = sessions.length > 0 
          ? sessions.reduce((sum, session) => sum + (session.consistencyScore || 0), 0) / sessions.length 
          : 0;
        
        // Calculate current streak (consecutive days with sessions)
        const currentStreak = calculateCurrentStreak(sessions);
        const bestStreak = calculateBestStreak(sessions);
        
        setSessionStats({
          totalSessions,
          currentStreak,
          bestStreak,
          totalTime,
          averageWPM,
          consistencyScore
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const calculateCurrentStreak = (sessions) => {
    if (sessions.length === 0) return 0;
    
    // Group sessions by date
    const sessionsByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toDateString();
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });
    
    const dates = Object.keys(sessionsByDate).sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const sessionDate = new Date(dates[i]);
      const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateBestStreak = (sessions) => {
    if (sessions.length === 0) return 0;
    
    // Group sessions by date
    const sessionsByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toDateString();
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });
    
    const dates = Object.keys(sessionsByDate).sort((a, b) => new Date(a) - new Date(b));
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = null;
    
    dates.forEach(date => {
      const currentDate = new Date(date);
      
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      lastDate = currentDate;
    });
    
    return Math.max(maxStreak, currentStreak);
  };

  const getActivityTarget = (activityType) => {
    const targets = {
      [ACTIVITY_TYPES.PACING_CURVE]: 100,
      [ACTIVITY_TYPES.RATE_MATCH]: 100,
      [ACTIVITY_TYPES.SPEED_SHIFT]: 100,
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: 100,
      [ACTIVITY_TYPES.PAUSE_TIMING]: 100,
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: 100,
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: 100,
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: 100,
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: 100,
      [ACTIVITY_TYPES.GOLDEN_RATIO]: 100,
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: 100,
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: 100
    };
    return targets[activityType] || 100;
  };

  const getActivityDescription = (activityType) => {
    const descriptions = {
      [ACTIVITY_TYPES.PACING_CURVE]: "Record a 2-3 minute speech and visualize your pacing stability. Earn the Steady Flow badge for consistent WPM!",
      [ACTIVITY_TYPES.RATE_MATCH]: "Practice with a metronome at target pace (100-150 WPM). Build rhythm and control your delivery speed.",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "Practice intentional pace variation - fast for storytelling, slow for emphasis. Master dynamic delivery!",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "Track your WPM consistency over time. Build long-term habits of steady pacing.",
      [ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE]: "🎯 REAL-TIME CHALLENGE: Talk until you achieve ideal 125 WPM! Get instant feedback and coaching to master perfect pace.",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "Practice inserting pauses at punctuation. Build natural rhythm with 0.5-2s emphasis pauses.",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "Eliminate awkward >5s pauses. Maintain audience engagement throughout your speech.",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "Insert deliberate 1.5-2s pauses after key messages. Increase memorability of your points.",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "Practice rhythmic reading patterns. Build consistent spacing between pauses.",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "Replace hesitation fillers with confident pauses. Boost your professional delivery.",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "Achieve natural 1.618x longer pauses at emphasis points. Create organic, memorable speech.",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "Reduce pause randomness with structured delivery. Make your speech easier to follow.",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "Master effective pauses in complex explanations. Enhance teaching and persuasive communication.",
      [ACTIVITY_TYPES.PAUSE_MONITORING]: "🎤 REAL-TIME MONITORING: Get live alerts when pauses are too long or too short. Perfect your timing as you speak!",
      [ACTIVITY_TYPES.PAUSE_IMPROVEMENT]: "🎯 IMPROVEMENT CHALLENGE: Interactive coaching to optimize your pause timing. Get instant feedback and scores!",
      [ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING]: "🎵 RHYTHM TRAINING: Practice consistent pause patterns. Build natural speech rhythm with real-time guidance.",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE]: "💪 CONFIDENCE PRACTICE: Master 1.5-2 second pauses to show confidence. Get alerts when timing is perfect!",
      [ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING]: "⚡ IMPACT TRAINING: Learn 1.0-1.5 second pauses for maximum impact. Real-time coaching for dramatic effect!"
    };
    return descriptions[activityType] || "Practice your speech pace management skills!";
  };

  const getActivityFeatures = (activityType) => {
    const features = {
      [ACTIVITY_TYPES.PACING_CURVE]: ["Real-time WPM", "Visual Graph", "Consistency Score"],
      [ACTIVITY_TYPES.RATE_MATCH]: ["Metronome Guide", "Target Pace", "Rhythm Training"],
      [ACTIVITY_TYPES.SPEED_SHIFT]: ["Dynamic Control", "Expressiveness", "Pace Variation"],
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: ["Long-term Progress", "Trend Analysis", "Habit Building"],
      [ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE]: ["3-Second Analysis", "Live Coaching", "Perfect Pace"],
      [ACTIVITY_TYPES.PAUSE_TIMING]: ["Strategic Pauses", "Punctuation Guide", "Natural Rhythm"],
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: ["Dead Air Detection", "Engagement Focus", "Flow Improvement"],
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: ["Dramatic Emphasis", "Memorability", "Key Points"],
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: ["Pattern Training", "Consistent Spacing", "Flow Control"],
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: ["Filler Reduction", "Professional Delivery", "Confidence Boost"],
      [ACTIVITY_TYPES.GOLDEN_RATIO]: ["Natural Timing", "Mathematical Precision", "Organic Flow"],
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: ["Structured Delivery", "Predictable Patterns", "Clarity Focus"],
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: ["Complex Explanations", "Teaching Skills", "Persuasion"],
      [ACTIVITY_TYPES.PAUSE_MONITORING]: ["Live Alerts", "Real-time Feedback", "Pause Detection"],
      [ACTIVITY_TYPES.PAUSE_IMPROVEMENT]: ["Interactive Coaching", "Instant Scores", "Progress Tracking"],
      [ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING]: ["Rhythm Patterns", "Consistent Timing", "Flow Control"],
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE]: ["Confidence Timing", "1.5-2s Pauses", "Professional Delivery"],
      [ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING]: ["Impact Timing", "1.0-1.5s Pauses", "Dramatic Effect"]
    };
    return features[activityType] || ["Practice", "Improvement", "Skills"];
  };

  const getActivityDuration = (activityType) => {
    const durations = {
      [ACTIVITY_TYPES.PACING_CURVE]: "2-3 min",
      [ACTIVITY_TYPES.RATE_MATCH]: "1-2 min",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "1-2 min",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "3-5 min",
      [ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE]: "3-5 min",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "1-2 min",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "1-2 min",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "1-2 min",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "1-2 min",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "1-2 min",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "2-3 min",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "2-3 min",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "2-3 min",
      [ACTIVITY_TYPES.PAUSE_MONITORING]: "3-5 min",
      [ACTIVITY_TYPES.PAUSE_IMPROVEMENT]: "3-5 min",
      [ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING]: "2-4 min",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE]: "2-3 min",
      [ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING]: "2-3 min"
    };
    return durations[activityType] || "1-2 min";
  };

  const getActivityDifficulty = (activityType) => {
    const difficulties = {
      [ACTIVITY_TYPES.PACING_CURVE]: "Beginner",
      [ACTIVITY_TYPES.RATE_MATCH]: "Beginner",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "Intermediate",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "Advanced",
      [ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE]: "Intermediate",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "Beginner",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "Beginner",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "Intermediate",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "Intermediate",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "Intermediate",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "Advanced",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "Advanced",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "Expert",
      [ACTIVITY_TYPES.PAUSE_MONITORING]: "Beginner",
      [ACTIVITY_TYPES.PAUSE_IMPROVEMENT]: "Intermediate",
      [ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING]: "Intermediate",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE]: "Beginner",
      [ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING]: "Intermediate"
    };
    return difficulties[activityType] || "Beginner";
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      [ACTIVITY_TYPES.PACING_CURVE]: FaChartBar,
      [ACTIVITY_TYPES.RATE_MATCH]: FaMusic,
      [ACTIVITY_TYPES.SPEED_SHIFT]: FaRocket,
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: FaFire,
      [ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE]: FaBullseye,
      [ACTIVITY_TYPES.PAUSE_TIMING]: FaCrosshairs,
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: FaTimesCircle,
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: FaStar,
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: FaMusic,
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: FaCrown,
      [ACTIVITY_TYPES.GOLDEN_RATIO]: FaGem,
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: FaBrain,
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: FaBolt,
      [ACTIVITY_TYPES.PAUSE_MONITORING]: FaMicrophone,
      [ACTIVITY_TYPES.PAUSE_IMPROVEMENT]: FaChartBar,
      [ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING]: FaMusic,
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE]: FaCrown,
      [ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING]: FaStar
    };
    return icons[activityType] || FaGamepad;
  };

  const getActivityColor = (activityType) => {
    const colors = {
      [ACTIVITY_TYPES.PACING_CURVE]: "from-blue-500 to-cyan-500",
      [ACTIVITY_TYPES.RATE_MATCH]: "from-green-500 to-emerald-500",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "from-purple-500 to-pink-500",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "from-orange-500 to-red-500",
      [ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE]: "from-yellow-500 to-orange-500",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "from-cyan-500 to-blue-500",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "from-red-500 to-pink-500",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "from-yellow-500 to-orange-500",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "from-pink-500 to-purple-500",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "from-yellow-500 to-amber-500",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "from-purple-500 to-indigo-500",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "from-indigo-500 to-blue-500",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "from-teal-500 to-cyan-500",
      [ACTIVITY_TYPES.PAUSE_MONITORING]: "from-blue-500 to-cyan-500",
      [ACTIVITY_TYPES.PAUSE_IMPROVEMENT]: "from-green-500 to-emerald-500",
      [ACTIVITY_TYPES.PAUSE_RHYTHM_TRAINING]: "from-purple-500 to-pink-500",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE_PRACTICE]: "from-yellow-500 to-amber-500",
      [ACTIVITY_TYPES.IMPACT_PAUSE_TRAINING]: "from-orange-500 to-red-500"
    };
    return colors[activityType] || "from-gray-500 to-gray-600";
  };

  const getActivityBackgroundStyle = (activityType) => {
    // Rate activities get #00ccff background
    const rateActivities = [
      ACTIVITY_TYPES.PACING_CURVE,
      ACTIVITY_TYPES.RATE_MATCH,
      ACTIVITY_TYPES.SPEED_SHIFT,
      ACTIVITY_TYPES.CONSISTENCY_TRACKER,
      ACTIVITY_TYPES.IDEAL_PACE_CHALLENGE
    ];
    
    // Pause activities get #ff6b6b background
    const pauseActivities = [
      ACTIVITY_TYPES.PAUSE_TIMING,
      ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION,
      ACTIVITY_TYPES.PAUSE_FOR_IMPACT,
      ACTIVITY_TYPES.PAUSE_RHYTHM,
      ACTIVITY_TYPES.CONFIDENCE_PAUSE
    ];
    
    // Advanced activities get #9b59b6 background
    const advancedActivities = [
      ACTIVITY_TYPES.GOLDEN_RATIO,
      ACTIVITY_TYPES.PAUSE_ENTROPY,
      ACTIVITY_TYPES.COGNITIVE_PAUSE
    ];
    
    // Real-time pause activities get #ff6b6b background
    if (rateActivities.includes(activityType)) {
      return {
        backgroundColor: 'rgba(0, 204, 255, 0.3)',
        borderColor: 'rgba(0, 204, 255, 0.5)',
        color: 'white'
      };
    }
    
    if (pauseActivities.includes(activityType)) {
      return {
        backgroundColor: 'rgba(255, 107, 107, 0.3)',
        borderColor: 'rgba(255, 107, 107, 0.5)',
        color: 'white'
      };
    }
    
    if (advancedActivities.includes(activityType)) {
      return {
        backgroundColor: 'rgba(155, 89, 182, 0.3)',
        borderColor: 'rgba(155, 89, 182, 0.5)',
        color: 'white'
      };
    }
    
    if (PAUSE_REALTIME_ACTIVITIES.includes(activityType)) {
      return {
        backgroundColor: 'rgba(255, 107, 107, 0.3)',
        borderColor: 'rgba(255, 107, 107, 0.5)',
        color: 'white'
      };
    }
    
    // Fallback
    return {
      backgroundColor: 'rgba(55, 65, 81, 0.8)',
      borderColor: 'rgba(75, 85, 99, 0.5)',
      color: 'white'
    };
  };

  // Map predicted pace label to rule-based label per backend test.py logic
  const getRuleBasedPaceLabel = (wpm, fallbackLabel) => {
    const value = typeof wpm === 'number' ? wpm : Number(wpm);
    if (!isNaN(value)) {
      if (value < 100) return 'Slow';
      if (value <= 150) return 'Ideal';
      return 'Fast';
    }
    return fallbackLabel || '';
  };

  // Update record time
  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        recordTime.current += 1;
        setDisplayTime(recordTime.current);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center">
        <div className="flex flex-col xl:flex-row w-full h-full gap-6">
          
          {/* Left Side - Activity Selection & Progress */}
          <div className="w-full xl:w-2/3 flex flex-col space-y-6">
            
            {/* User Stats & Badges */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 dark:border-[#00ccff]/80 shadow-2xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <FaTrophy className="text-[#00ccff] dark:text-[#00ccff] text-2xl" />
                <h3 className="text-[#00ccff] dark:text-[#00ccff] font-bold text-lg">Your Progress</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-white/10 dark:bg-white/20 rounded-lg">
                  <div className="text-white dark:text-white text-2xl font-bold">{sessionStats.totalSessions}</div>
                  <div className="text-white/70 dark:text-white/70 text-sm">Sessions</div>
                </div>
                <div className="text-center p-3 bg-white/10 dark:bg-white/20 rounded-lg">
                  <div className="text-white dark:text-white text-2xl font-bold">{sessionStats.currentStreak}</div>
                  <div className="text-white/70 dark:text-white/70 text-sm">Day Streak</div>
                </div>
                <div className="text-center p-3 bg-white/10 dark:bg-white/20 rounded-lg">
                  <div className="text-white dark:text-white text-2xl font-bold">{userBadges.length}</div>
                  <div className="text-white/70 dark:text-white/70 text-sm">Badges</div>
                </div>
                <div className="text-center p-3 bg-white/10 dark:bg-white/20 rounded-lg">
                  <div className="text-white dark:text-white text-2xl font-bold">{userLevel}</div>
                  <div className="text-white/70 dark:text-white/70 text-sm">Level</div>
                </div>
              </div>

              {/* Badge Collection */}
              <div className="mt-4">
                <h4 className="text-white dark:text-white font-semibold mb-3 text-center">🏆 Badge Collection</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {userBadges.map((badge, index) => {
                    const IconComponent = badge.icon;
                    return (
                      <motion.div
                        key={index}
                        className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 dark:bg-white/20 text-xs border border-white/20 dark:border-white/30"
                        whileHover={{ scale: 1.1 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <IconComponent className={`text-${badge.color}-400`} />
                        <span className="text-white dark:text-white font-medium">{badge.name}</span>
                      </motion.div>
                    );
                  })}
                  {userBadges.length === 0 && (
                    <div className="text-white/60 dark:text-white/60 text-sm text-center w-full py-4">
                      Complete activities to earn badges!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Real-Time Activity Section */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-white/20 dark:border-white/30 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              
              {/* Real-time Tabs */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6 overflow-x-auto">
                <button
                  className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                    realTimeTab === "challenge"
                      ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                      : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                  }`}
                  onClick={() => setRealTimeTab("challenge")}
                >
                  <FaBullseye />
                  Challenge
                </button>
                <button
                  className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                    realTimeTab === "scores"
                      ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                      : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                  }`}
                  onClick={() => setRealTimeTab("scores")}
                >
                  <FaTrophy />
                  Scores
                </button>
              </div>

              {/* Real-time Challenge Tab */}
              {realTimeTab === "challenge" && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-white mb-2">🎯 Real-Time Pace Challenge</h4>
                    <p className="text-gray-300 text-sm">Maintain ideal pace (125 WPM) for maximum score!</p>
                  </div>

                  {/* Real-time WPM Display */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-[#00ccff] mb-2">
                      {currentWPM.toFixed(0)} WPM
                    </div>
                    <div className="text-white/70 text-sm">Target: {targetWPM} WPM</div>
                  </div>

                  {/* Pace Score */}
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-green-400 mb-2">
                      {paceScore.toFixed(0)}%
                    </div>
                    <div className="text-white/70 text-sm">Pace Score</div>
                  </div>

                  {/* Streak Counter */}
                  <div className="text-center mb-6">
                    <div className="text-xl font-bold text-yellow-400 mb-2">
                      🔥 {streakCount}
                    </div>
                    <div className="text-white/70 text-sm">Perfect Streak</div>
                  </div>

                  {/* WPM History Chart */}
                  {wpmHistory.length > 0 && (
                    <div className="mb-6">
                      <div className="h-32 bg-white/10 rounded-lg p-4">
                        <div className="flex items-end justify-between h-full">
                          {wpmHistory.map((wpm, index) => {
                            const height = (wpm / 200) * 100; // Normalize to 200 WPM max
                            const isTarget = Math.abs(wpm - targetWPM) <= 15;
                            return (
                              <div
                                key={index}
                                className={`w-2 rounded-t ${
                                  isTarget ? 'bg-green-400' : 'bg-red-400'
                                }`}
                                style={{ height: `${height}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex justify-center gap-4">
                    {!isRealTimeActive ? (
                      <motion.button
                        onClick={startRealTimePaceMonitoring}
                        className="bg-green-400 hover:bg-green-500 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaPlay />
                        Start Challenge
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={stopRealTimePaceMonitoring}
                        className="bg-red-400 hover:bg-red-500 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaStop />
                        Stop Challenge
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}


              {/* Scores Tab */}
              {realTimeTab === "scores" && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-white mb-2">🏆 Your Scores</h4>
                    <p className="text-gray-300 text-sm">Track your real-time pace performance</p>
                  </div>

                  {previousScores.length === 0 ? (
                    <div className="text-center py-8">
                      <FaTrophy className="text-gray-500 text-4xl mx-auto mb-4" />
                      <p className="text-gray-400">No scores recorded yet.</p>
                      <p className="text-gray-500 text-sm">Complete challenges to see your scores here!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {previousScores.map((score, index) => {
                        // Performance level based on score
                        const getPerformanceLevel = (score) => {
                          if (score >= 90) return { level: 'Excellent', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50', icon: '🥇' };
                          if (score >= 80) return { level: 'Great', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/50', icon: '🥈' };
                          if (score >= 70) return { level: 'Good', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50', icon: '🥉' };
                          if (score >= 60) return { level: 'Fair', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/50', icon: '📈' };
                          return { level: 'Needs Practice', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50', icon: '💪' };
                        };

                        const performance = getPerformanceLevel(score.finalScore || 0);
                        const wpmStatus = (score.averageWPM || 0) >= 120 && (score.averageWPM || 0) <= 150 ? 'Ideal' : 
                                         (score.averageWPM || 0) < 120 ? 'Slow' : 'Fast';

                        return (
                          <motion.div
                            key={index}
                            className={`${performance.bgColor} p-4 rounded-lg border ${performance.borderColor} backdrop-blur-sm`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">{performance.icon}</span>
                                  <p className="text-white font-semibold text-lg">
                                    {(() => {
                                      try {
                                        const date = new Date(score.timestamp || score.createdAt);
                                        return isNaN(date.getTime()) ? 'Date not available' : date.toLocaleDateString();
                                      } catch (error) {
                                        return 'Date not available';
                                      }
                                    })()}
                                  </p>
                                </div>
                                <p className="text-gray-300 text-sm mb-1">
                                  {(() => {
                                    try {
                                      const date = new Date(score.timestamp || score.createdAt);
                                      return isNaN(date.getTime()) ? '' : date.toLocaleTimeString();
                                    } catch (error) {
                                      return '';
                                    }
                                  })()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${performance.color} text-white font-bold text-lg`}>
                                  <FaTrophy />
                                  {score.finalScore?.toFixed(0)}%
                                </div>
                                <p className="text-white/70 text-xs mt-1">{performance.level}</p>
                              </div>
                            </div>
                            
                            {/* Performance Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white/80 text-sm">WPM</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    wpmStatus === 'Ideal' ? 'bg-green-500/30 text-green-300' :
                                    wpmStatus === 'Slow' ? 'bg-yellow-500/30 text-yellow-300' :
                                    'bg-red-500/30 text-red-300'
                                  }`}>
                                    {wpmStatus}
                                  </span>
                                </div>
                                <p className="text-white font-bold text-xl">{score.averageWPM?.toFixed(0) || 0}</p>
                              </div>
                              
                              <div className="bg-white/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white/80 text-sm">Duration</span>
                                  <span className="text-white/60 text-xs">seconds</span>
                                </div>
                                <p className="text-white font-bold text-xl">{score.duration || 0}s</p>
                              </div>
                            </div>

                            {/* Consistency Score */}
                            {score.consistency && (
                              <div className="mt-3 bg-white/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white/80 text-sm">Consistency</span>
                                  <span className="text-white/60 text-xs">%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-white/20 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(score.consistency, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-white font-semibold">{score.consistency.toFixed(0)}%</span>
                                </div>
                              </div>
                            )}

                            {/* Best Streak */}
                            {score.bestStreak && (
                              <div className="mt-3 flex items-center justify-center gap-2 text-yellow-400">
                                <FaFire />
                                <span className="text-sm font-semibold">Best Streak: {score.bestStreak}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>

            {/* Activity Selection with Tabs */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-white/20 dark:border-white/30 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-white dark:text-white font-bold text-lg mb-6 text-center">🎯 Choose Your Activity</h3>
              
              {/* Tabs */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6 overflow-x-auto">
                {Object.entries(ACTIVITY_CATEGORIES).map(([tabKey, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={tabKey}
                      className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                        activeTab === tabKey
                          ? "bg-[#d0ebff] text-[#003b46] dark:bg-[#004b5b] dark:text-white"
                          : "bg-[#e0f7fa] text-[#919b9e] dark:bg-[#002b36] dark:text-white/60"
                      }`}
                      onClick={() => setActiveTab(tabKey)}
                    >
                      <IconComponent />
                      {category.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Activity Grid for Active Tab - Horizontal Row Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-x-auto">
                {ACTIVITY_CATEGORIES[activeTab].activities.map((activityType) => {
                  const key = Object.keys(ACTIVITY_TYPES).find(k => ACTIVITY_TYPES[k] === activityType);
                  const IconComponent = getActivityIcon(activityType);
                  const colorClass = getActivityColor(activityType);
                  const backgroundStyle = getActivityBackgroundStyle(activityType);
                  const isActive = activeActivity === activityType;
                  
                  return (
                    <motion.button
                      key={activityType}
                      onClick={() => startActivity(activityType)}
                      disabled={isRecording}
                      className={`group relative p-4 rounded-xl text-left transition-all duration-300 min-h-[180px] ${
                        isActive 
                          ? `bg-gradient-to-r ${colorClass} text-white shadow-lg border-2 border-white/30` 
                          : 'border-2'
                      } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}`}
                      style={!isActive ? backgroundStyle : {}}
                      whileHover={!isRecording ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!isRecording ? { scale: 0.98 } : {}}
                    >
                      {/* Activity Icon and Title */}
                      <div className="flex flex-col items-center text-center mb-3">
                        <div className={`p-3 rounded-lg mb-3 ${
                          isActive 
                            ? 'bg-white/30' 
                            : 'bg-gray-700/60 dark:bg-gray-600/60'
                        }`}>
                          <IconComponent className="text-3xl text-white drop-shadow-lg" />
                        </div>
                        <h4 className="font-bold text-sm text-white mb-2 leading-tight drop-shadow-lg">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <div className="text-xs text-white leading-relaxed drop-shadow-lg">
                          {getActivityDescription(activityType).substring(0, 60)}...
                        </div>
                      </div>

                      {/* Activity Features */}
                      <div className="flex flex-wrap gap-1 mb-3 justify-center">
                        {getActivityFeatures(activityType).slice(0, 2).map((feature, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isActive 
                                ? 'bg-white/30 text-white drop-shadow-lg' 
                                : 'bg-gray-600/70 dark:bg-gray-500/70 text-white drop-shadow-lg'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Difficulty and Duration */}
                      <div className="flex items-center justify-between text-xs text-white">
                        <div className="flex items-center gap-1">
                          <FaClock className="text-xs drop-shadow-lg" />
                          <span className="drop-shadow-lg">{getActivityDuration(activityType)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaStar className="text-xs drop-shadow-lg" />
                          <span className="drop-shadow-lg">{getActivityDifficulty(activityType)}</span>
                        </div>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          className="absolute top-2 right-2 p-1 bg-white/20 rounded-full"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <FaPlay className="text-sm" />
                        </motion.div>
                      )}

                      {/* Hover Effect Overlay */}
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

          </div>

          {/* Right Side - Activity Display & Results */}
          <div className="w-full xl:w-1/3 flex flex-col space-y-6">
            
            {/* Activity Progress */}
            {activeActivity && activityProgress[activeActivity] && (
              <motion.div
                className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-6 mb-4 border-2 border-white/20 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {React.createElement(getActivityIcon(activeActivity), { className: "text-2xl text-[#00ccff]" })}
                  <h3 className="text-white font-bold text-xl">
                    {activeActivity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Challenge
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00ccff]">
                      {activityProgress[activeActivity].currentScore.toFixed(1)}
                    </div>
                    <div className="text-white/70 text-sm">Current Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {activityProgress[activeActivity].targetScore}
                    </div>
                    <div className="text-white/70 text-sm">Target Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {activityProgress[activeActivity].progress.toFixed(1)}%
                    </div>
                    <div className="text-white/70 text-sm">Progress</div>
                  </div>
                </div>

                <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-[#00ccff] to-[#0099cc] transition-all duration-500"
                    style={{ width: `${activityProgress[activeActivity].progress}%` }}
                  ></div>
                </div>

                <div className="text-white/80 text-sm">
                  {activityProgress[activeActivity].feedback}
                </div>
              </motion.div>
            )}

            {/* Activity Results */}
            {activityResults && (
              <motion.div
                className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-white font-bold text-xl mb-4">
                  🎉 {lastActivityType && (
                    [ACTIVITY_TYPES.PACING_CURVE, ACTIVITY_TYPES.RATE_MATCH, ACTIVITY_TYPES.SPEED_SHIFT, ACTIVITY_TYPES.CONSISTENCY_TRACKER].includes(lastActivityType)
                    ? 'Rate Analysis Results'
                    : 'Pause Analysis Results'
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-white/10 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Performance Score</h4>
                    <div className="text-3xl font-bold text-[#00ccff] mb-2">
                      {activityResults.finalScore?.toFixed(1) || 0}%
                    </div>
                    <div className="text-white/70 text-sm">
                      {activityResults.finalScore >= 90 ? "Excellent!" : 
                       activityResults.finalScore >= 70 ? "Good!" : 
                       activityResults.finalScore >= 50 ? "Fair" : "Needs Practice"}
                    </div>
                  </div>
                  <div className="p-4 bg-white/10 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">Key Metrics</h4>
                    <div className="space-y-1 text-sm">
                      {lastActivityType && [
                        ACTIVITY_TYPES.PACING_CURVE,
                        ACTIVITY_TYPES.RATE_MATCH,
                        ACTIVITY_TYPES.SPEED_SHIFT,
                        ACTIVITY_TYPES.CONSISTENCY_TRACKER,
                      ].includes(lastActivityType) ? (
                        <>
                      <div className="flex justify-between text-white/80">
                        <span>WPM:</span>
                        <span>{activityResults.averageWPM?.toFixed(1) || 0}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Consistency:</span>
                        <span>{activityResults.consistencyScore?.toFixed(1) || 0}%</span>
                      </div>
                          {typeof activityResults.wpmStd !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>WPM Std Dev:</span>
                              <span>{Number(activityResults.wpmStd).toFixed(2)}</span>
                            </div>
                          )}
                          {(
                            <div className="flex justify-between text-white/80">
                              <span>Predicted Pace:</span>
                              <span>
                                {(() => {
                                  // Prefer backend label if WPM-based label matches; otherwise correct using WPM
                                  const backendLabel = activityResults.prediction;
                                  const ruleLabel = getRuleBasedPaceLabel(activityResults.averageWPM, backendLabel);
                                  const shown = ruleLabel || backendLabel || '';
                                  const conf = activityResults.confidence;
                                  // confidence may be 0..1 (rate) or 0..100 (pause mistakenly)
                                  const confPct = typeof conf === 'number' ? (conf <= 1 ? Math.round(conf * 100) : Math.round(conf)) : null;
                                  return `${shown}${confPct ? ` (${confPct}%)` : ''}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                      <div className="flex justify-between text-white/80">
                        <span>Pause Ratio:</span>
                        <span>{activityResults.pauseRatio?.toFixed(1) || 0}%</span>
                      </div>
                          {typeof activityResults.excessivePauses !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>Excessive Pauses:</span>
                              <span>{activityResults.excessivePauses}</span>
                    </div>
                          )}
                          {typeof activityResults.rhythmConsistency !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>Rhythm Consistency:</span>
                              <span>{Number(activityResults.rhythmConsistency).toFixed(1)}%</span>
                            </div>
                          )}
                          {typeof activityResults.optimalPauseRatio !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>Optimal Pause Ratio:</span>
                              <span>{Number(activityResults.optimalPauseRatio * 100).toFixed(1)}%</span>
                            </div>
                          )}
                          {typeof activityResults.cognitiveScore !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>Cognitive Score:</span>
                              <span>{Number(activityResults.cognitiveScore).toFixed(1)}%</span>
                            </div>
                          )}
                          {typeof activityResults.goldenRatioScore !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>Golden Ratio Pauses:</span>
                              <span>{Number(activityResults.goldenRatioScore * 100).toFixed(1)}%</span>
                            </div>
                          )}
                          {typeof activityResults.entropyScore !== 'undefined' && (
                            <div className="flex justify-between text-white/80">
                              <span>Pause Entropy (lower is better):</span>
                              <span>{Number(activityResults.entropyScore).toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {activityResults.recommendations && activityResults.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">💡 Recommendations</h4>
                    <div className="space-y-2">
                      {activityResults.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-white/10 rounded-lg text-white/80 text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Badges Earned */}
                {activityResults.newBadges && activityResults.newBadges.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">🏆 New Badges Earned!</h4>
                    <div className="flex flex-wrap gap-2">
                      {activityResults.newBadges.map((badge, index) => {
                        const IconComponent = badge.icon;
                        return (
                          <motion.div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.2 }}
                          >
                            <IconComponent />
                            {badge.name}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Activity Description */}
            {!activeActivity && (
              <motion.div
                className="bg-gradient-to-br from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-white/20 dark:border-white/30 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h3 className="text-white dark:text-white font-bold text-xl mb-4 text-center">🎯 Pace Management Activities</h3>
                <p className="text-white/80 dark:text-white/80 text-lg mb-6 text-center">
                  Master the art of perfect pacing through interactive, real-time activities designed to improve your speech delivery.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/10 dark:bg-white/20 rounded-lg border border-white/20 dark:border-white/30">
                    <h4 className="text-white dark:text-white font-semibold mb-2 flex items-center gap-2">
                      <FaMicrophone className="text-[#00ccff]" />
                      Real-time Feedback
                    </h4>
                    <p className="text-white/70 dark:text-white/70 text-sm">Get instant analysis and suggestions as you speak</p>
                  </div>
                  <div className="p-4 bg-white/10 dark:bg-white/20 rounded-lg border border-white/20 dark:border-white/30">
                    <h4 className="text-white dark:text-white font-semibold mb-2 flex items-center gap-2">
                      <FaTrophy className="text-yellow-400" />
                      Gamification
                    </h4>
                    <p className="text-white/70 dark:text-white/70 text-sm">Earn badges, unlock levels, and track your progress</p>
                  </div>
                  <div className="p-4 bg-white/10 dark:bg-white/20 rounded-lg border border-white/20 dark:border-white/30">
                    <h4 className="text-white dark:text-white font-semibold mb-2 flex items-center gap-2">
                      <FaChartBar className="text-green-400" />
                      Advanced Analytics
                    </h4>
                    <p className="text-white/70 dark:text-white/70 text-sm">Detailed metrics and performance insights</p>
                  </div>
                  <div className="p-4 bg-white/10 dark:bg-white/20 rounded-lg border border-white/20 dark:border-white/30">
                    <h4 className="text-white dark:text-white font-semibold mb-2 flex items-center gap-2">
                      <FaCrosshairs className="text-purple-400" />
                      Targeted Practice
                    </h4>
                    <p className="text-white/70 dark:text-white/70 text-sm">Focus on specific aspects of pace management</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Voice Recorder with Mic Animation */}
            {activeActivity && (
              <motion.div
                className="bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    color: "white",
                    fontWeight: "600",
                    marginBottom: "1.5rem",
                    textAlign: "center"
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
                  {/* Mic animation */}
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

                    {/* Alert indicators around microphone */}
                    {PAUSE_REALTIME_ACTIVITIES.includes(activeActivity) && pauseAlerts.length > 0 && (
                      <>
                        <motion.div
                          className="absolute w-40 h-40 border-4 border-red-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.8, 0.3]
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="absolute w-32 h-32 border-4 border-yellow-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.4, 0.9, 0.4]
                          }}
                          transition={{ 
                            duration: 1.2, 
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        />
                        <motion.div
                          className="absolute w-24 h-24 border-4 border-orange-500 rounded-full"
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.5, 1.0, 0.5]
                          }}
                          transition={{ 
                            duration: 0.9, 
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.6
                          }}
                        />
                      </>
                    )}

                    <FaMicrophone
                      className={`text-black text-4xl relative z-10 ${
                        isRecording && !isPaused ? "animate-pulse" : "opacity-50"
                      } ${
                        PAUSE_REALTIME_ACTIVITIES.includes(activeActivity) && pauseAlerts.length > 0 
                          ? "text-red-600" : ""
                      }`}
                    />
                  </div>

                  {/* Buttons */}
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
                      onClick={handlePause}
                      disabled={!isRecording || isPaused}
                      style={{
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: "9999px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        opacity: !isRecording || isPaused ? 0.5 : 1,
                        cursor:
                          !isRecording || isPaused ? "not-allowed" : "pointer",
                      }}
                    >
                      <FaPause style={{ fontSize: "1.5rem", color: "black" }} />
                    </button>
                    <button
                      onClick={handlePlay}
                      disabled={isRecording && !isPaused}
                      style={{
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: "9999px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        opacity: isRecording && !isPaused ? 0.5 : 1,
                        cursor:
                          isRecording && !isPaused ? "not-allowed" : "pointer",
                      }}
                    >
                      <FaPlay style={{ fontSize: "1.5rem", color: "black" }} />
                    </button>
                    <button
                      onClick={handleStop}
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

                {/* Timer */}
                <p
                  style={{
                    color: "white",
                    fontSize: "1.125rem",
                    marginTop: "1rem",
                    textAlign: "center"
                  }}
                >
                  Recording Time: {formatTime(displayTime)}
                </p>

                {/* Real-time Pause Monitoring Display */}
                {PAUSE_REALTIME_ACTIVITIES.includes(activeActivity) && (
                  <motion.div
                    className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                      <FaMicrophone className="text-blue-400" />
                      Real-time Pause Monitoring
                    </div>
                    
                    {/* Pause Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-3 bg-white/10 rounded-lg border border-white/20">
                        <div className="text-2xl font-bold text-blue-400">
                          {(pauseMetrics.pauseRatio * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-white/70">Pause Ratio</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                          pauseMetrics.pauseRatio >= 0.08 && pauseMetrics.pauseRatio <= 0.12 
                            ? 'bg-green-500/30 text-green-300' 
                            : pauseMetrics.pauseRatio > 0.15 
                            ? 'bg-red-500/30 text-red-300' 
                            : 'bg-yellow-500/30 text-yellow-300'
                        }`}>
                          {pauseMetrics.pauseRatio >= 0.08 && pauseMetrics.pauseRatio <= 0.12 ? 'Optimal' : 
                           pauseMetrics.pauseRatio > 0.15 ? 'Too High' : 'Too Low'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white/10 rounded-lg border border-white/20">
                        <div className="text-2xl font-bold text-green-400">
                          {pauseMetrics.flowScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-white/70">Flow Score</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                          pauseMetrics.flowScore >= 80 ? 'bg-green-500/30 text-green-300' : 
                          pauseMetrics.flowScore >= 60 ? 'bg-yellow-500/30 text-yellow-300' : 
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {pauseMetrics.flowScore >= 80 ? 'Excellent' : 
                           pauseMetrics.flowScore >= 60 ? 'Good' : 'Needs Work'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white/10 rounded-lg border border-white/20">
                        <div className="text-2xl font-bold text-red-400">
                          {pauseMetrics.excessivePauses}
                        </div>
                        <div className="text-xs text-white/70">Excessive Pauses</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                          pauseMetrics.excessivePauses === 0 ? 'bg-green-500/30 text-green-300' : 
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {pauseMetrics.excessivePauses === 0 ? 'Good' : 'Alert!'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white/10 rounded-lg border border-white/20">
                        <div className="text-2xl font-bold text-orange-400">
                          {pauseMetrics.longPauses}
                        </div>
                        <div className="text-xs text-white/70">Long Pauses</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                          pauseMetrics.longPauses <= 2 ? 'bg-green-500/30 text-green-300' : 
                          pauseMetrics.longPauses <= 4 ? 'bg-yellow-500/30 text-yellow-300' : 
                          'bg-red-500/30 text-red-300'
                        }`}>
                          {pauseMetrics.longPauses <= 2 ? 'Good' : 
                           pauseMetrics.longPauses <= 4 ? 'Moderate' : 'Too Many'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Current Pause Duration */}
                    {pauseMetrics.currentPauseDuration > 0 && (
                      <div className="mb-3 p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                        <div className="text-yellow-300 text-sm font-semibold">
                          Current Pause: {pauseMetrics.currentPauseDuration.toFixed(1)}s
                        </div>
                      </div>
                    )}
                    
                    {/* Alerts */}
                    {pauseAlerts.length > 0 && (
                      <div className="mb-3">
                        <div className="text-white font-semibold mb-2 flex items-center gap-2">
                          <FaExclamationTriangle className="text-orange-400" />
                          Live Alerts
                        </div>
                        {pauseAlerts.map((alert, index) => (
                          <motion.div 
                            key={index} 
                            className={`p-3 rounded-lg mb-2 text-sm border-2 ${
                              alert.type === 'warning' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                              alert.type === 'caution' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                              'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            }`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="font-bold mb-1">{alert.message}</div>
                            <div className="text-white/80">{alert.action}</div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Strategic Pause Suggestions */}
                    {activeActivity === 'pause_monitoring' && (
                      <div className="mb-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <div className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                          <FaBrain className="text-purple-400" />
                          Strategic Pause Tips
                        </div>
                        <div className="space-y-2 text-xs text-white/80">
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">•</span>
                            <span>Use 0.5-1.0s pauses after key points for emphasis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400">•</span>
                            <span>Take 1.5-2.0s pauses between major topics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">•</span>
                            <span>Pause before important words: "The key point is..."</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">•</span>
                            <span>Avoid pauses longer than 5 seconds</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {pauseSuggestions.length > 0 && (
                      <div className="mb-3">
                        {pauseSuggestions.map((suggestion, index) => (
                          <div key={index} className="p-2 bg-green-500/20 rounded mb-2 text-xs border border-green-500/30">
                            <div className="text-green-300 font-semibold">{suggestion}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Popup Alerts for Real-time Pause Activities */}
                {PAUSE_REALTIME_ACTIVITIES.includes(activeActivity) && pauseAlerts.length > 0 && (
                  <motion.div
                    className="fixed top-20 right-4 z-50 max-w-sm"
                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.8 }}
                    transition={{ duration: 0.3, type: "spring", damping: 0.6 }}
                  >
                    {pauseAlerts.map((alert, index) => (
                      <motion.div
                        key={index}
                        className={`mb-3 p-4 rounded-lg border-2 shadow-2xl backdrop-blur-sm ${
                          alert.type === 'warning' 
                            ? 'bg-red-500/90 border-red-400 text-white' 
                            : alert.type === 'caution' 
                            ? 'bg-yellow-500/90 border-yellow-400 text-white'
                            : 'bg-blue-500/90 border-blue-400 text-white'
                        }`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {alert.type === 'warning' ? '🚨' : alert.type === 'caution' ? '⚠️' : 'ℹ️'}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm mb-1">{alert.message}</div>
                            <div className="text-xs opacity-90">{alert.action}</div>
                          </div>
                          <button
                            onClick={() => {
                              setPauseAlerts(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-white/70 hover:text-white text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Real-time Feedback */}
                {realTimeFeedback && (
                  <motion.div
                    className="mt-4 p-3 bg-white/10 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-white text-sm font-semibold mb-1">Real-time Feedback:</div>
                    <div className="text-white/80 text-xs">{realTimeFeedback.feedback}</div>
                    
                    {/* Enhanced feedback for Ideal Pace Challenge */}
                    {activeActivity === "ideal_pace_challenge" && realTimeFeedback.current_wpm && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/70">Current WPM:</span>
                          <span className="text-white font-semibold">{realTimeFeedback.current_wpm}</span>
                        </div>
                        {realTimeFeedback.target_wpm && (
                          <div className="flex justify-between text-xs">
                            <span className="text-white/70">Target WPM:</span>
                            <span className="text-white font-semibold">{realTimeFeedback.target_wpm} (±{realTimeFeedback.wpm_tolerance || 12})</span>
                          </div>
                        )}
                        {realTimeFeedback.consistency_score && (
                          <div className="flex justify-between text-xs">
                            <span className="text-white/70">Consistency:</span>
                            <span className="text-white font-semibold">{realTimeFeedback.consistency_score}%</span>
                          </div>
                        )}
                        {realTimeFeedback.achievement && (
                          <div className="flex justify-between text-xs">
                            <span className="text-white/70">Achievement:</span>
                            <span className="text-white font-semibold">{realTimeFeedback.achievement}</span>
                          </div>
                        )}
                        {realTimeFeedback.suggestion && (
                          <div className="mt-2 text-xs text-white/80">
                            💡 {realTimeFeedback.suggestion}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {realTimeFeedback.score && (
                      <div className="mt-2">
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-[#00ccff] to-[#0099cc]"
                            style={{ width: `${realTimeFeedback.score}%` }}
                          ></div>
                        </div>
                        <div className="text-white/70 text-xs mt-1">
                          Score: {realTimeFeedback.score.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    
                    {/* Show analysis type */}
                    {realTimeFeedback.is_real_analysis ? (
                      <div className="mt-2 text-xs text-green-300/70">
                        🤖 Real ML Analysis - Processing audio through trained model
                      </div>
                    ) : realTimeFeedback.is_mock ? (
                      <div className="mt-2 text-xs text-yellow-300/70">
                        📡 Using simulated data - connect microphone for real-time analysis
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-blue-300/70">
                        🔄 Analyzing audio features...
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaceManagementActivity;
