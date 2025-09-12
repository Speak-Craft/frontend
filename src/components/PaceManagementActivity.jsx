import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FaBolt
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
  PAUSE_TIMING: 'pause_timing',
  EXCESSIVE_PAUSE_ELIMINATION: 'excessive_pause_elimination',
  PAUSE_FOR_IMPACT: 'pause_for_impact',
  PAUSE_RHYTHM: 'pause_rhythm',
  CONFIDENCE_PAUSE: 'confidence_pause',
  GOLDEN_RATIO: 'golden_ratio',
  PAUSE_ENTROPY: 'pause_entropy',
  COGNITIVE_PAUSE: 'cognitive_pause'
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
      ACTIVITY_TYPES.CONSISTENCY_TRACKER
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
  COGNITIVE_MASTER: { name: "Cognitive Master", icon: FaBolt, color: "teal", requirement: "Complex explanations" }
};

// Levels
const LEVELS = {
  BRONZE: { name: "Bronze", color: "#CD7F32", threshold: 0.3 },
  SILVER: { name: "Silver", color: "#C0C0C0", threshold: 0.2 },
  GOLD: { name: "Gold", color: "#FFD700", threshold: 0.1 },
  PLATINUM: { name: "Platinum", color: "#E5E4E2", threshold: 0.05 }
};

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
  const [activeTab, setActiveTab] = useState("rate");
  const [displayTime, setDisplayTime] = useState(0);
  
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

  // Real-time analysis interval
  const analysisInterval = useRef(null);

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
    
    analysisInterval.current = setInterval(async () => {
      if (isRecording && !isPaused && activeActivity) {
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
          console.error("Real-time analysis error:", error);
        }
      }
    }, 2000); // Analyze every 2 seconds
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
        analyzeActivity(audioBlob, activityType);
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
            analyzeActivity(audioBlob, activeActivity);
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
    formData.append("activityType", activityType);

    try {
      const response = await fetch("http://localhost:8000/analyze-activity/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setActivityResults(data);
        checkBadgeEligibility(data, activityType);
        updateSessionStats(data);
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
    
    // Add new badges to user's collection
    setUserBadges(prev => {
      const existingBadges = prev.map(b => b.name);
      const uniqueNewBadges = newBadges.filter(badge => !existingBadges.includes(badge.name));
      return [...prev, ...uniqueNewBadges];
    });
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
      [ACTIVITY_TYPES.PAUSE_TIMING]: "Practice inserting pauses at punctuation. Build natural rhythm with 0.5-2s emphasis pauses.",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "Eliminate awkward >5s pauses. Maintain audience engagement throughout your speech.",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "Insert deliberate 1.5-2s pauses after key messages. Increase memorability of your points.",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "Practice rhythmic reading patterns. Build consistent spacing between pauses.",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "Replace hesitation fillers with confident pauses. Boost your professional delivery.",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "Achieve natural 1.618x longer pauses at emphasis points. Create organic, memorable speech.",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "Reduce pause randomness with structured delivery. Make your speech easier to follow.",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "Master effective pauses in complex explanations. Enhance teaching and persuasive communication."
    };
    return descriptions[activityType] || "Practice your speech pace management skills!";
  };

  const getActivityFeatures = (activityType) => {
    const features = {
      [ACTIVITY_TYPES.PACING_CURVE]: ["Real-time WPM", "Visual Graph", "Consistency Score"],
      [ACTIVITY_TYPES.RATE_MATCH]: ["Metronome Guide", "Target Pace", "Rhythm Training"],
      [ACTIVITY_TYPES.SPEED_SHIFT]: ["Dynamic Control", "Expressiveness", "Pace Variation"],
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: ["Long-term Progress", "Trend Analysis", "Habit Building"],
      [ACTIVITY_TYPES.PAUSE_TIMING]: ["Strategic Pauses", "Punctuation Guide", "Natural Rhythm"],
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: ["Dead Air Detection", "Engagement Focus", "Flow Improvement"],
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: ["Dramatic Emphasis", "Memorability", "Key Points"],
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: ["Pattern Training", "Consistent Spacing", "Flow Control"],
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: ["Filler Reduction", "Professional Delivery", "Confidence Boost"],
      [ACTIVITY_TYPES.GOLDEN_RATIO]: ["Natural Timing", "Mathematical Precision", "Organic Flow"],
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: ["Structured Delivery", "Predictable Patterns", "Clarity Focus"],
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: ["Complex Explanations", "Teaching Skills", "Persuasion"]
    };
    return features[activityType] || ["Practice", "Improvement", "Skills"];
  };

  const getActivityDuration = (activityType) => {
    const durations = {
      [ACTIVITY_TYPES.PACING_CURVE]: "2-3 min",
      [ACTIVITY_TYPES.RATE_MATCH]: "1-2 min",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "1-2 min",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "3-5 min",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "1-2 min",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "1-2 min",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "1-2 min",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "1-2 min",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "1-2 min",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "2-3 min",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "2-3 min",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "2-3 min"
    };
    return durations[activityType] || "1-2 min";
  };

  const getActivityDifficulty = (activityType) => {
    const difficulties = {
      [ACTIVITY_TYPES.PACING_CURVE]: "Beginner",
      [ACTIVITY_TYPES.RATE_MATCH]: "Beginner",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "Intermediate",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "Advanced",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "Beginner",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "Beginner",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "Intermediate",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "Intermediate",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "Intermediate",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "Advanced",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "Advanced",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "Expert"
    };
    return difficulties[activityType] || "Beginner";
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      [ACTIVITY_TYPES.PACING_CURVE]: FaChartBar,
      [ACTIVITY_TYPES.RATE_MATCH]: FaMusic,
      [ACTIVITY_TYPES.SPEED_SHIFT]: FaRocket,
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: FaFire,
      [ACTIVITY_TYPES.PAUSE_TIMING]: FaCrosshairs,
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: FaTimesCircle,
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: FaStar,
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: FaMusic,
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: FaCrown,
      [ACTIVITY_TYPES.GOLDEN_RATIO]: FaGem,
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: FaBrain,
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: FaBolt
    };
    return icons[activityType] || FaGamepad;
  };

  const getActivityColor = (activityType) => {
    const colors = {
      [ACTIVITY_TYPES.PACING_CURVE]: "from-blue-500 to-cyan-500",
      [ACTIVITY_TYPES.RATE_MATCH]: "from-green-500 to-emerald-500",
      [ACTIVITY_TYPES.SPEED_SHIFT]: "from-purple-500 to-pink-500",
      [ACTIVITY_TYPES.CONSISTENCY_TRACKER]: "from-orange-500 to-red-500",
      [ACTIVITY_TYPES.PAUSE_TIMING]: "from-cyan-500 to-blue-500",
      [ACTIVITY_TYPES.EXCESSIVE_PAUSE_ELIMINATION]: "from-red-500 to-pink-500",
      [ACTIVITY_TYPES.PAUSE_FOR_IMPACT]: "from-yellow-500 to-orange-500",
      [ACTIVITY_TYPES.PAUSE_RHYTHM]: "from-pink-500 to-purple-500",
      [ACTIVITY_TYPES.CONFIDENCE_PAUSE]: "from-yellow-500 to-amber-500",
      [ACTIVITY_TYPES.GOLDEN_RATIO]: "from-purple-500 to-indigo-500",
      [ACTIVITY_TYPES.PAUSE_ENTROPY]: "from-indigo-500 to-blue-500",
      [ACTIVITY_TYPES.COGNITIVE_PAUSE]: "from-teal-500 to-cyan-500"
    };
    return colors[activityType] || "from-gray-500 to-gray-600";
  };

  const getActivityBackgroundStyle = (activityType) => {
    // Rate activities get #00ccff background
    const rateActivities = [
      ACTIVITY_TYPES.PACING_CURVE,
      ACTIVITY_TYPES.RATE_MATCH,
      ACTIVITY_TYPES.SPEED_SHIFT,
      ACTIVITY_TYPES.CONSISTENCY_TRACKER
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
    
    // Fallback
    return {
      backgroundColor: 'rgba(55, 65, 81, 0.8)',
      borderColor: 'rgba(75, 85, 99, 0.5)',
      color: 'white'
    };
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
                <h3 className="text-white font-bold text-xl mb-4">🎉 Activity Results</h3>
                
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
                      <div className="flex justify-between text-white/80">
                        <span>WPM:</span>
                        <span>{activityResults.averageWPM?.toFixed(1) || 0}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Consistency:</span>
                        <span>{activityResults.consistencyScore?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Pause Ratio:</span>
                        <span>{activityResults.pauseRatio?.toFixed(1) || 0}%</span>
                      </div>
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

                    <FaMicrophone
                      className={`text-black text-4xl ${
                        isRecording && !isPaused ? "animate-pulse" : "opacity-50"
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

                {/* Real-time Feedback */}
                {realTimeFeedback && (
                  <motion.div
                    className="mt-4 p-3 bg-white/10 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-white text-sm font-semibold mb-1">Real-time Feedback:</div>
                    <div className="text-white/80 text-xs">{realTimeFeedback.feedback}</div>
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
