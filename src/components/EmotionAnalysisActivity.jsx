import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaPlay, FaStop, FaMedal, FaClock, FaChartLine, FaHistory, FaGamepad, FaBullseye } from 'react-icons/fa';
import Webcam from 'react-webcam';
import axios from 'axios';

const BACKEND_FRAME = 'http://localhost:8000/analyze_frame';
const BACKEND_API = 'http://localhost:3001/api';
const EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise'];
const TARGETS = ['Happy', 'Neutral', 'Confident', 'Calm', 'Empathetic', 'Serious'];

const ACTIVITY_TYPES = [
  { id: 'emotion_match', name: 'Emotion Match', desc: 'Match the target emotion', icon: '🎯' },
  { id: 'emotion_consistency', name: 'Stay Consistent', desc: 'Maintain emotion steadily', icon: '⚖️' },
  { id: 'text_face_alignment', name: 'Text-Face Sync', desc: 'Align face with text emotion', icon: '🔗' },
];

// Text emotion inference (same logic as EmotionAnalysis.jsx)
const KW = {
  Sad: ['sad','cry','tears','loss','lost','grief','grieving','passed away','funeral','lonely','alone','empty','hurt','heartbroken','pain','miss you','regret','mourn','sorrow','devastated'],
  Happy: ['happy','joy','smile','excited','delight','glad','cheer','proud','celebrate','win','won','great news','thanks','grateful','relieved','blessed','hurray'],
  Angry: ['angry','mad','furious','hate','rage','annoyed','irritated','upset','frustrated','unfair','betrayed','disgusting','disgrace']
};
const NEGATIONS = ['not','never','no','hardly','barely','scarcely','without',"isn't","wasn't","don't","didn't","can't","won't"];
const INTENSE = ['very','so','extremely','really','too','incredibly','super','utterly','deeply','truly'];

function scoreBag(text) {
  const t = text.toLowerCase();
  let sc = { Sad: 0, Happy: 0, Angry: 0 };
  const words = t.split(/\b/).map(w => w.trim()).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    Object.entries(KW).forEach(([emo, list]) => {
      if (list.some(k => t.includes(k))) {
        const winStart = Math.max(0, i - 3), winEnd = Math.min(words.length - 1, i + 3);
        const win = words.slice(winStart, winEnd + 1);
        const neg = win.some(x => NEGATIONS.includes(x));
        const amp = 1 + 0.3 * win.filter(x => INTENSE.includes(x)).length;
        sc[emo] += neg ? 0 : amp;
      }
    });
  }
  return sc;
}

function inferTextEmotion(text) {
  if (!text || !text.trim()) return { label: 'Neutral', confidence: 0.55 };
  const sc = scoreBag(text);
  const entries = Object.entries(sc).sort((a,b)=>b[1]-a[1]);
  const [top, val] = entries[0];
  if (val === 0) return { label: 'Neutral', confidence: 0.6 };
  const sum = entries.reduce((s, [,v]) => s+v, 0) || 1;
  const conf = Math.min(0.95, 0.6 + 0.4 * (val / sum));
  return { label: top, confidence: conf };
}

const EmotionAnalysisActivity = () => {
  const [activeTab, setActiveTab] = useState('challenge');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activityType, setActivityType] = useState('emotion_match');
  const [targetEmotion, setTargetEmotion] = useState('Confident');
  const [targetDuration, setTargetDuration] = useState(30);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [scriptText, setScriptText] = useState('');
  
  // Real-time tracking
  const [liveEmotion, setLiveEmotion] = useState(null);
  const [liveProbs, setLiveProbs] = useState({});
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  const [matchedSamples, setMatchedSamples] = useState(0);
  const [textFaceMismatches, setTextFaceMismatches] = useState(0);
  
  // Results
  const [activityResults, setActivityResults] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const webcamRef = useRef(null);
  const liveRef = useRef(null);
  const emotionHistoryRef = useRef([]);

  const token = localStorage.getItem('token');

  // Timer effect
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= targetDuration) {
            stopActivity();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, targetDuration]);

  // Fetch history on mount
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${BACKEND_API}/emotion/activity/history?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetActivity = () => {
    setRecordingTime(0);
    setLiveEmotion(null);
    setLiveProbs({});
    setAlignmentScore(0);
    setTotalSamples(0);
    setMatchedSamples(0);
    setTextFaceMismatches(0);
    setActivityResults(null);
    setBadges([]);
    emotionHistoryRef.current = [];
    setScriptText('');
    setActiveTab('challenge');
  };

  const startActivity = async () => {
    if (isRecording) return;
    
    // Validate text-face alignment requires script text
    if (activityType === 'text_face_alignment' && !scriptText.trim()) {
      alert('Please enter the text you will read for this challenge.');
      return;
    }
    
    try {
      setRecordingTime(0);
      setLiveEmotion(null);
      setLiveProbs({});
      setAlignmentScore(0);
      setTotalSamples(0);
      setMatchedSamples(0);
      setTextFaceMismatches(0);
      emotionHistoryRef.current = [];
      
      const res = await axios.post(
        `${BACKEND_API}/emotion/activity/start`,
        {
          activityType,
          targetEmotion: activityType === 'text_face_alignment' ? inferTextEmotion(scriptText).label : targetEmotion,
          level: 1,
          targetAlignment: 70,
          scriptText: scriptText || '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentActivity(res.data.activity);
      setIsRecording(true);
      setActiveTab('active'); // Switch to active tab when starting
      liveRef.current = setInterval(sendLiveFrame, 800);
    } catch (error) {
      console.error('Failed to start activity:', error);
      alert('Failed to start activity. Please try again.');
    }
  };

  const sendLiveFrame = async () => {
    try {
      if (!webcamRef.current) return;
      const dataUrl = webcamRef.current.getScreenshot();
      if (!dataUrl) return;

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const form = new FormData();
      form.append('frame', blob, 'frame.jpg');

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);

      const r = await fetch(BACKEND_FRAME, { method: 'POST', body: form, signal: ctrl.signal });
      clearTimeout(t);
      
      if (!r.ok) return;
      const j = await r.json();

      if (j.face_detected && j.top_emotion) {
        setLiveEmotion(j.top_emotion);
        setLiveProbs(j.probs || {});
        
        setTotalSamples(prev => prev + 1);
        
        emotionHistoryRef.current.push({
          time: recordingTime,
          emotion: j.top_emotion,
          prob: j.prob,
          probs: j.probs
        });

        let isMatch = false;
        
        // For text-face alignment mode, compare with text emotion
        if (activityType === 'text_face_alignment' && scriptText) {
          const expectedEmotion = inferTextEmotion(scriptText);
          const detectedEmotion = j.top_emotion;
          
          // Check if emotions match (direct or similar)
          isMatch = (expectedEmotion.label === detectedEmotion) || 
                    checkEmotionSimilarity(expectedEmotion.label, detectedEmotion);
          
          // Track mismatches
          if (!isMatch && j.prob >= 0.5) {
            setTextFaceMismatches(prev => prev + 1);
          }
        } else {
          // For other modes, match target emotion
          isMatch = checkEmotionMatch(j.top_emotion, targetEmotion);
        }
        
        if (isMatch && j.prob >= 0.5) {
          setMatchedSamples(prev => prev + 1);
        }

        const newAlignment = totalSamples > 0 
          ? Math.round((matchedSamples / totalSamples) * 100) 
          : 0;
        setAlignmentScore(newAlignment);
      }
    } catch (err) {
      console.error('Live frame error:', err);
    }
  };

  const checkEmotionMatch = (detected, target) => {
    const emotionMap = {
      'Confident': ['Happy', 'Neutral'],
      'Happy': ['Happy', 'Surprise'],
      'Neutral': ['Neutral'],
      'Calm': ['Neutral', 'Happy'],
      'Empathetic': ['Happy', 'Sad'],
      'Serious': ['Neutral', 'Angry'],
      'Sad': ['Sad'],
      'Angry': ['Angry']
    };
    
    return emotionMap[target]?.includes(detected) || false;
  };

  const checkEmotionSimilarity = (expected, detected) => {
    // Check if detected emotion is similar or acceptable for expected emotion
    const similarityMap = {
      'Happy': ['Happy', 'Surprise'],
      'Sad': ['Sad', 'Fear'],
      'Angry': ['Angry', 'Disgust'],
      'Neutral': ['Neutral'],
    };
    
    return similarityMap[expected]?.includes(detected) || expected === detected;
  };

  const stopActivity = async () => {
    if (!isRecording || !currentActivity) return;
    
    setIsRecording(false);
    clearInterval(liveRef.current);
    setLoading(true);

    try {
      const engagementScore = 100;
      const consistencyScore = calculateConsistency();
      const finalScore = Math.round(
        (alignmentScore * 0.5) + 
        (engagementScore * 0.3) + 
        (consistencyScore * 0.2)
      );

      const detectedEmotions = calculateEmotionDistribution();

      const res = await axios.post(
        `${BACKEND_API}/emotion/activity/complete`,
        {
          activityId: currentActivity._id,
          duration: recordingTime,
          alignmentScore,
          engagementScore,
          consistencyScore,
          finalScore,
          detectedEmotions,
          mismatchCount: activityType === 'text_face_alignment' ? textFaceMismatches : (totalSamples - matchedSamples),
          faceVisibleSeconds: recordingTime,
          faceAwaySeconds: 0,
          emotionSwitches: calculateEmotionSwitches(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setActivityResults(res.data.activity);
      setBadges(res.data.newBadges || []);
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to complete activity:', error);
      alert('Failed to save activity results.');
    } finally {
      setLoading(false);
    }
  };

  const calculateConsistency = () => {
    if (emotionHistoryRef.current.length < 2) return 100;
    
    let switches = 0;
    for (let i = 1; i < emotionHistoryRef.current.length; i++) {
      if (emotionHistoryRef.current[i].emotion !== emotionHistoryRef.current[i-1].emotion) {
        switches++;
      }
    }
    
    const switchRate = switches / emotionHistoryRef.current.length;
    return Math.round((1 - switchRate) * 100);
  };

  const calculateEmotionDistribution = () => {
    const dist = {};
    EMOTIONS.forEach(e => dist[e] = 0);
    
    emotionHistoryRef.current.forEach(({ emotion }) => {
      if (dist[emotion] !== undefined) {
        dist[emotion]++;
      }
    });
    
    const total = emotionHistoryRef.current.length || 1;
    Object.keys(dist).forEach(k => {
      dist[k] = Math.round((dist[k] / total) * 100);
    });
    
    return dist;
  };

  const calculateEmotionSwitches = () => {
    let switches = 0;
    for (let i = 1; i < emotionHistoryRef.current.length; i++) {
      if (emotionHistoryRef.current[i].emotion !== emotionHistoryRef.current[i-1].emotion) {
        switches++;
      }
    }
    return switches;
  };

  const progress = targetDuration > 0 ? (recordingTime / targetDuration) * 100 : 0;
  
  // Calculate isMatching based on activity type
  const isMatching = liveEmotion && (
    activityType === 'text_face_alignment' && scriptText
      ? (inferTextEmotion(scriptText).label === liveEmotion || checkEmotionSimilarity(inferTextEmotion(scriptText).label, liveEmotion))
      : checkEmotionMatch(liveEmotion, targetEmotion)
  );

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-5rem)] p-4 lg:p-8 flex justify-center items-center overflow-hidden">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8 overflow-hidden">
          
          {/* Left Side - Activity Controls */}
          <div
            className="bg-gradient-to-b from-[#00171f] to-[#003b46] overflow-y-auto"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "500px",
              height: "100%",
              margin: "0 auto",
              borderRadius: "1rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              padding: "1.5rem",
            }}
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">
              <span className="text-[#f59e0b]">🎭 Emotion</span> Challenge
            </h2>

            {/* Challenge Setup */}
            {activeTab === "challenge" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Setup Challenge</h3>
                  <p className="text-gray-300 text-sm">Choose your activity and start!</p>
                </div>

                <div className="space-y-4 mb-6">
                  {ACTIVITY_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setActivityType(type.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        activityType === type.id
                          ? 'border-[#00ccff] bg-[#00ccff]/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{type.icon}</div>
                        <div>
                          <div className="font-semibold text-white">{type.name}</div>
                          <div className="text-xs text-white/70">{type.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 mb-6">
                  {activityType !== 'text_face_alignment' && (
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Target Emotion</label>
                      <select
                        value={targetEmotion}
                        onChange={(e) => setTargetEmotion(e.target.value)}
                        className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 outline-none"
                      >
                        {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                  
                  {activityType === 'text_face_alignment' && (
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Your Script/Text</label>
                      <textarea
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        placeholder="Paste the text you will read... (e.g., 'I am so happy to be here today!')"
                        className="w-full h-24 bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 outline-none resize-none placeholder:text-white/50"
                      />
                      {scriptText && (
                        <div className="mt-2 p-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-400/50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-white/70">Expected from text:</span>
                              <span className="ml-2 font-bold text-emerald-300">{inferTextEmotion(scriptText).label}</span>
                            </div>
                            <div className="text-white/70">
                              {Math.round(inferTextEmotion(scriptText).confidence * 100)}% confidence
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Duration</label>
                    <select
                      value={targetDuration}
                      onChange={(e) => setTargetDuration(Number(e.target.value))}
                      className="w-full bg-white/10 text-white rounded-lg px-4 py-2 border border-white/20 outline-none"
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                      <option value={120}>2 minutes</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={startActivity}
                  disabled={isRecording}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <FaPlay />
                  Start Challenge
                </button>
              </motion.div>
            )}

            {/* Active Challenge */}
            {activeTab === "active" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">Active Challenge</h3>
                  <p className="text-gray-300 text-sm">Match {targetEmotion}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-white/70 mb-1">
                      <FaClock className="text-sm" />
                      <span className="text-xs">Time</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="text-xs text-white/50">/ {formatTime(targetDuration)}</div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-white/70 mb-1">
                      <FaBullseye className="text-sm" />
                      <span className="text-xs">Alignment</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-400">
                      {alignmentScore}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">Progress</span>
                    <span className="text-white">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {/* Live Detection */}
                {liveEmotion && (
                  <div className={`p-4 rounded-lg border-2 mb-4 ${
                    isMatching 
                      ? 'bg-green-500/20 border-green-400' 
                      : 'bg-red-500/20 border-red-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-white/70">Detected:</div>
                        <div className="text-lg font-bold text-white">{liveEmotion}</div>
                      </div>
                      <div className="text-3xl">
                        {isMatching ? '✅' : '❌'}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={stopActivity}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <FaStop />
                  Stop Challenge
                </button>
              </motion.div>
            )}

            {/* Results */}
            {activeTab === "results" && activityResults && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">
                    {activityResults.completed ? '🎉' : '💪'}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {activityResults.completed ? 'Completed!' : 'Keep Practicing!'}
                  </h3>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-emerald-400">
                    {activityResults.finalScore}
                    <span className="text-xl text-white/60">/100</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-white/80">Alignment</span>
                    <span className="font-bold text-white">{activityResults.alignmentScore}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-white/80">Engagement</span>
                    <span className="font-bold text-white">{activityResults.engagementScore}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-white/80">Consistency</span>
                    <span className="font-bold text-white">{activityResults.consistencyScore}%</span>
                  </div>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 mb-3">
                      <FaMedal />
                      <span className="font-semibold text-sm">New Badges!</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs text-yellow-200"
                        >
                          🏆 {badge.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={resetActivity}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* History */}
            {activeTab === "history" && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Activity History</h3>
                  <p className="text-gray-300 text-sm">Your past challenges</p>
                </div>

                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8">
                    <FaHistory className="text-gray-500 text-4xl mx-auto mb-4" />
                    <p className="text-gray-400">No activities yet.</p>
                    <p className="text-gray-500 text-sm">Complete a challenge to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {history.map((activity, index) => (
                      <motion.div
                        key={activity._id}
                        className="bg-gray-800/50 p-4 rounded-lg border border-gray-600"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-white font-medium text-sm">
                            {new Date(activity.createdAt).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {activity.completed && <span className="text-green-400">✓</span>}
                            <span className="text-white font-bold">{activity.finalScore}</span>
                          </div>
                        </div>
                        <div className="text-xs text-white/70">
                          {activity.targetEmotion} • {activity.activityType.replace(/_/g, ' ')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right Side - Tabs and Content */}
          <div className="w-full flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4 overflow-x-auto flex-shrink-0">
              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "challenge"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("challenge")}
              >
                <FaGamepad />
                Challenge
              </button>

              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "active"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("active")}
                disabled={!isRecording}
              >
                <FaBullseye />
                Active
              </button>

              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "results"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("results")}
              >
                <FaTrophy />
                Results
              </button>

              <button
                className={`px-3 lg:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "history"
                    ? "bg-[#d0ebff] text-[#003b46]"
                    : "bg-[#e0f7fa] text-[#003b46]/70"
                }`}
                onClick={() => setActiveTab("history")}
              >
                <FaHistory />
                History
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-lg p-6 overflow-y-auto">
              {/* Webcam View */}
              {(activeTab === "challenge" || activeTab === "active") && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    📹 Live Camera
                  </h2>
                  
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover scale-x-[-1]"
                      videoConstraints={{ facingMode: 'user' }}
                      mirrored={true}
                    />
                    
                    {isRecording && liveEmotion && (
                      <div className={`absolute top-4 left-4 right-4 px-4 py-3 rounded-lg border-2 ${
                        isMatching 
                          ? 'bg-green-500/90 border-green-300' 
                          : 'bg-red-500/90 border-red-300'
                      }`}>
                        <div className="flex items-center justify-between text-white">
                          <div>
                            {activityType === 'text_face_alignment' && scriptText ? (
                              <>
                                <div className="text-xs opacity-80">Expected: <b>{inferTextEmotion(scriptText).label}</b> → Detected:</div>
                                <div className="text-lg font-bold">{liveEmotion}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs opacity-80">Detected:</div>
                                <div className="text-lg font-bold">{liveEmotion}</div>
                              </>
                            )}
                          </div>
                          <div className="text-3xl">
                            {isMatching ? '✅' : '❌'}
                          </div>
                        </div>
                      </div>
                    )}

                    {isRecording && (
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/50">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Text-Face Alignment Info */}
                  {activityType === 'text_face_alignment' && scriptText && (
                    <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-400/50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-emerald-300 mb-3">📝 Text Emotion Analysis</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-3 bg-black/20 rounded-lg">
                          <div className="text-xs text-white/70 mb-1">Expected from text:</div>
                          <div className="text-lg font-bold text-emerald-300">{inferTextEmotion(scriptText).label}</div>
                          <div className="text-xs text-white/60 mt-1">
                            {Math.round(inferTextEmotion(scriptText).confidence * 100)}% conf
                          </div>
                        </div>
                        {liveEmotion && (
                          <div className={`p-3 rounded-lg ${
                            inferTextEmotion(scriptText).label === liveEmotion || checkEmotionSimilarity(inferTextEmotion(scriptText).label, liveEmotion)
                              ? 'bg-green-500/20 border border-green-400'
                              : 'bg-red-500/20 border border-red-400'
                          }`}>
                            <div className="text-xs text-white/70 mb-1">Detected on face:</div>
                            <div className="text-lg font-bold text-white">{liveEmotion}</div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-white/70 bg-black/20 rounded p-2 max-h-16 overflow-y-auto">
                        {scriptText.length > 100 ? scriptText.slice(0, 100) + '...' : scriptText}
                      </div>
                    </div>
                  )}

                  {/* Live Probabilities */}
                  {isRecording && Object.keys(liveProbs).length > 0 && (
                    <div className="bg-gradient-to-r from-[#00171f] to-[#003b46] border border-[#00ccff]/40 rounded-xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-base font-semibold text-[#00ccff]">📊 Live Probabilities</h4>
                        <span className="text-xs text-white/60">Top 5</span>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(liveProbs)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([emotion, prob]) => (
                            <div key={emotion} className="flex items-center gap-3">
                              <span className="w-24 text-sm font-medium text-white">{emotion}</span>
                              <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#00ccff] to-[#00a3cc] transition-all duration-300"
                                  style={{ width: `${Math.round(prob)}%` }}
                                />
                              </div>
                              <span className="w-14 text-sm text-right font-semibold text-white">{Math.round(prob)}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="text-emerald-300 font-semibold mb-2">💡 Tips</div>
                    <ul className="text-sm text-white/80 space-y-1">
                      {activityType === 'text_face_alignment' ? (
                        <>
                          <li>• Read your text naturally and expressively</li>
                          <li>• Match your facial expression to text emotion</li>
                          <li>• Keep your face clearly visible</li>
                          <li>• Aim for 70%+ alignment to pass</li>
                        </>
                      ) : (
                        <>
                          <li>• Keep your face clearly visible</li>
                          <li>• Match the target emotion naturally</li>
                          <li>• Maintain consistency throughout</li>
                          <li>• Aim for 70%+ alignment to pass</li>
                        </>
                      )}
                    </ul>
                  </div>
                </motion.div>
              )}

              {activeTab === "results" && activityResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    🎉 Challenge Results
                  </h2>
                  <p className="text-white/70 mb-6">
                    Great job completing the challenge! Here's your performance breakdown.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">📊 Performance Metrics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Duration:</span>
                          <span className="text-white">{activityResults.duration}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Target:</span>
                          <span className="text-white">{activityResults.targetEmotion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Mismatches:</span>
                          <span className="text-white">{activityResults.mismatchCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Switches:</span>
                          <span className="text-white">{activityResults.emotionSwitches}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">🎯 Achievement</h3>
                      <div className="text-center py-4">
                        <div className="text-4xl mb-2">
                          {activityResults.completed ? '🏆' : '📈'}
                        </div>
                        <div className="text-lg text-white">
                          {activityResults.completed ? 'Challenge Passed!' : 'Keep Practicing!'}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                    📚 Your Progress
                  </h2>
                  <p className="text-white/70 mb-6">
                    Track your emotion control journey and see how you improve over time.
                  </p>

                  {history.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#00ccff]">{history.length}</div>
                        <div className="text-xs text-white/70">Total Challenges</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                          {history.filter(h => h.completed).length}
                        </div>
                        <div className="text-xs text-white/70">Completed</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {history.length > 0 ? Math.max(...history.map(h => h.finalScore)) : 0}
                        </div>
                        <div className="text-xs text-white/70">Best Score</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {history.length > 0 
                            ? Math.round(history.reduce((a, b) => a + b.finalScore, 0) / history.length)
                            : 0}
                        </div>
                        <div className="text-xs text-white/70">Avg Score</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalysisActivity;
