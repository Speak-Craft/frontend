import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaCalendarAlt, FaTrophy, FaChartLine, FaMicrophone, FaHistory, FaCog, FaComment, FaTachometerAlt, FaVolumeUp, FaHeart, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const user = getCurrentUser();
  const [fillerHistory, setFillerHistory] = useState([]);
  const [loudnessScores, setLoudnessScores] = useState([]);
  const [loudnessExercises, setLoudnessExercises] = useState([]);
  const [paceSessions, setPaceSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreChartView, setScoreChartView] = useState('bar'); // 'bar', 'line', 'area', 'pie'

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    fetchAllProgress();
  }, []);

  const fetchAllProgress = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch filler words progress
      const fillerRes = await axios.get("http://localhost:3001/api/challenge/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFillerHistory(fillerRes.data.history || []);

      // Fetch loudness scores
      const scoresRes = await axios.get("http://localhost:3001/api/scores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoudnessScores(scoresRes.data || []);

      // Fetch loudness exercises
      const exercisesRes = await axios.get("http://localhost:3001/api/exercises/my-exercises", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoudnessExercises(exercisesRes.data.exercises || []);

      // Fetch pace management sessions
      const paceRes = await axios.get("http://localhost:3001/api/pace/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaceSessions(paceRes.data.sessions || []);
      
      // Debug logging
      console.log("Filler History:", fillerRes.data.history);
      console.log("Loudness Scores:", scoresRes.data);
      console.log("Loudness Exercises:", exercisesRes.data.exercises);
      console.log("Pace Sessions:", paceRes.data.sessions);
    } catch (err) {
      console.error("Failed to fetch progress data", err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const fillerChartData = fillerHistory.map((h, index) => ({
    id: index,
    date: new Date(h.date).toLocaleDateString(),
    fillerCount: h.fillerCount,
    level: h.level,
    success: h.success,
  }));

  // Prepare loudness chart data
  const loudnessChartData = loudnessScores.map((score, index) => ({
    id: index,
    date: new Date(score.date).toLocaleDateString(),
    score: score.score,
    metadata: score.metadata,
  }));

  // Prepare loudness exercises chart data
  const loudnessExercisesData = loudnessExercises.map((exercise, index) => ({
    id: index,
    date: new Date(exercise.createdAt).toLocaleDateString(),
    rms: exercise.rms,
    steadiness: exercise.steadiness,
    level: exercise.level,
    duration: exercise.duration,
    completed: exercise.completed,
  }));

  // Prepare pace management chart data
  const rateSessions = paceSessions.filter(session => 
    session.domain === 'rate' || 
    ['pacing_curve', 'rate_match', 'speed_shift', 'consistency_tracker', 'ideal_pace_challenge'].includes(session.activityType)
  );
  
  const pauseSessions = paceSessions.filter(session => 
    session.domain === 'pause' || 
    ['pause_timing', 'excessive_pause_elimination', 'pause_for_impact', 'pause_rhythm', 'confidence_pause'].includes(session.activityType)
  );

  const rateChartData = rateSessions.map((session, index) => ({
    id: index,
    date: new Date(session.createdAt).toLocaleDateString(),
    wpm: session.averageWPM || 0,
    consistency: session.consistencyScore || 0,
    finalScore: session.finalScore || 0,
    duration: session.duration || 0,
  }));

  const pauseChartData = pauseSessions.map((session, index) => ({
    id: index,
    date: new Date(session.createdAt).toLocaleDateString(),
    pauseRatio: session.pauseRatio || 0,
    flowScore: session.flowScore || 0,
    excessivePauses: session.excessivePauses || 0,
    finalScore: session.finalScore || 0,
    duration: session.duration || 0,
  }));

  // Calculate overall performance metrics
  const overallPerformance = {
    totalSessions: paceSessions.length,
    averageScore: paceSessions.length > 0 ? paceSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0) / paceSessions.length : 0,
    bestScore: paceSessions.length > 0 ? Math.max(...paceSessions.map(s => s.finalScore || 0)) : 0,
    averageWPM: paceSessions.length > 0 ? paceSessions.reduce((sum, session) => sum + (session.averageWPM || 0), 0) / paceSessions.length : 0,
    totalDuration: paceSessions.reduce((sum, session) => sum + (session.duration || 0), 0),
    recentScores: paceSessions.slice(0, 3).map(session => ({
      score: session.finalScore || 0,
      date: new Date(session.createdAt).toLocaleDateString(),
      wpm: session.averageWPM || 0,
      type: session.domain || 'pace'
    }))
  };

  // Prepare score chart data for visual representation
  const scoreChartData = paceSessions.slice(0, 10).map((session, index) => ({
    id: index + 1,
    date: new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: session.finalScore || 0,
    wpm: session.averageWPM || 0,
    consistency: session.consistencyScore || 0,
    duration: session.duration || 0,
    type: session.domain || 'pace',
    level: session.finalScore >= 90 ? 'Excellent' : 
           session.finalScore >= 80 ? 'Great' : 
           session.finalScore >= 70 ? 'Good' : 
           session.finalScore >= 60 ? 'Fair' : 'Needs Practice',
    // Color coding based on activity type
    color: session.domain === 'rate' ? '#3b82f6' : 
           session.domain === 'pause' ? '#ff6b6b' : '#8b5cf6'
  }));

  // Performance distribution data for pie chart
  const performanceDistribution = [
    { name: 'Excellent (90%+)', value: scoreChartData.filter(s => s.score >= 90).length, color: '#10b981' },
    { name: 'Great (80-89%)', value: scoreChartData.filter(s => s.score >= 80 && s.score < 90).length, color: '#3b82f6' },
    { name: 'Good (70-79%)', value: scoreChartData.filter(s => s.score >= 70 && s.score < 80).length, color: '#f59e0b' },
    { name: 'Fair (60-69%)', value: scoreChartData.filter(s => s.score >= 60 && s.score < 70).length, color: '#f97316' },
    { name: 'Needs Practice (<60%)', value: scoreChartData.filter(s => s.score < 60).length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Debug logging for chart data
  console.log("User Object:", user);
  console.log("Rate Chart Data:", rateChartData);
  console.log("Pause Chart Data:", pauseChartData);
  console.log("Filler Chart Data:", fillerChartData);
  console.log("Loudness Chart Data:", loudnessChartData);
  console.log("Overall Performance:", overallPerformance);

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8">
          
          {/* Left Side - User Information & Practice Areas */}
          <div
            className="bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6]"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              margin: "0 auto",
              borderRadius: "1rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              padding: "1.5rem",
            }}
          >
            {/* Welcome Header */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Welcome back, <span className="text-[#00d4aa]">{user?.name || 'Student'}</span>!
              </h2>
              <p className="text-gray-300 text-sm lg:text-base">
                Ready to improve your presentation skills?
              </p>
            </motion.div>

            {/* User Information Card */}
            <motion.div
              className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20 shadow-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-lg" />
                </div>
                <h3 className="text-white font-semibold text-lg">Profile Information</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaUser className="text-[#00d4aa] text-sm" />
                  <div>
                    <span className="text-gray-300 text-sm">Name:</span>
                    <span className="ml-2 text-white font-medium">{user?.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-[#00d4aa] text-sm" />
                  <div>
                    <span className="text-gray-300 text-sm">Email:</span>
                    <span className="ml-2 text-white font-medium">{user?.email || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-[#00d4aa] text-sm" />
                  <div>
                    <span className="text-gray-300 text-sm">Member since:</span>
                    <span className="ml-2 text-white font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 
                       user?.created_at ? new Date(user.created_at).toLocaleDateString() :
                       user?.dateCreated ? new Date(user.dateCreated).toLocaleDateString() :
                       user?.registrationDate ? new Date(user.registrationDate).toLocaleDateString() :
                       'January 2024'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Performance Visualization */}
            {overallPerformance.totalSessions > 0 && (
              <motion.div
                className="w-full bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-xl p-4 border border-white/20 shadow-lg mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center">
                      <FaChartLine className="text-white text-sm" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">Pace Performance Analytics</h3>
                  </div>
                  
                  {/* Chart View Toggle */}
                  <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                    {[
                      { key: 'bar', icon: '📊', label: 'Bar' },
                      { key: 'line', icon: '📈', label: 'Line' },
                      { key: 'area', icon: '📉', label: 'Area' },
                      { key: 'pie', icon: '🥧', label: 'Pie' }
                    ].map((view) => (
                      <button
                        key={view.key}
                        onClick={() => setScoreChartView(view.key)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          scoreChartView === view.key
                            ? 'bg-[#00d4aa] text-white'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {view.icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="text-white text-lg font-bold">{overallPerformance.averageScore.toFixed(0)}%</div>
                    <div className="text-gray-300 text-xs">Avg Score</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="text-white text-lg font-bold">{overallPerformance.bestScore.toFixed(0)}%</div>
                    <div className="text-gray-300 text-xs">Best Score</div>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="text-white text-lg font-bold">{overallPerformance.totalSessions}</div>
                    <div className="text-gray-300 text-xs">Sessions</div>
                  </div>
                </div>

                {/* Visual Chart */}
                <div className="h-64 mb-4">
                  {scoreChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {scoreChartView === 'bar' && (
                        <BarChart data={scoreChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={10}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            fontSize={10}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => {
                              if (name === "score") return [value, "Score %"];
                              if (name === "wpm") return [value, "WPM"];
                              return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${label} (${data.type})`;
                              }
                              return label;
                            }}
                          />
                          <Bar 
                            dataKey="score" 
                            fill={(entry) => entry.color || '#00d4aa'}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      )}
                      
                      {scoreChartView === 'line' && (
                        <LineChart data={scoreChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={10}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            fontSize={10}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => {
                              if (name === "score") return [value, "Score %"];
                              if (name === "wpm") return [value, "WPM"];
                              return [value, name];
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${label} (${data.type})`;
                              }
                              return label;
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke={(entry) => entry.color || '#00d4aa'}
                            strokeWidth={3}
                            dot={{ r: 4, fill: (entry) => entry.color || '#00d4aa' }}
                            activeDot={{ r: 6, fill: (entry) => entry.color || '#00b894' }}
                          />
                        </LineChart>
                      )}
                      
                      {scoreChartView === 'area' && (
                        <AreaChart data={scoreChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={10}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            fontSize={10}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => {
                              if (name === "score") return [value, "Score %"];
                              if (name === "wpm") return [value, "WPM"];
                              return [value, name];
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#00d4aa"
                            fill="url(#colorGradient)"
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      )}
                      
                      {scoreChartView === 'pie' && (
                        <PieChart>
                          <Pie
                            data={performanceDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {performanceDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => [value, 'Sessions']}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            wrapperStyle={{ color: '#fff', fontSize: '12px' }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <FaChartLine className="text-4xl text-gray-400 mb-2 mx-auto" />
                        <p className="text-gray-300 text-sm">No performance data yet</p>
                        <p className="text-gray-400 text-xs">Complete sessions to see your progress!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Sessions List */}
                <div className="space-y-2">
                  <h4 className="text-white/80 text-sm font-medium">Recent Sessions</h4>
                  {overallPerformance.recentScores.map((session, index) => {
                    const getScoreColor = (score) => {
                      if (score >= 90) return 'text-green-400';
                      if (score >= 80) return 'text-blue-400';
                      if (score >= 70) return 'text-yellow-400';
                      return 'text-red-400';
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            session.type === 'rate' ? 'bg-blue-400' : 'bg-red-400'
                          }`}></div>
                          <span className="text-white/80 text-sm">{session.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-xs">{session.wpm.toFixed(0)} WPM</span>
                          <span className={`font-bold text-sm ${getScoreColor(session.score)}`}>
                            {session.score.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Practice Areas Grid */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center">
                  <FaMicrophone className="text-white text-lg" />
                </div>
                <h3 className="text-white font-semibold text-lg">Practice Areas</h3>
              </div> */}
              
              {/* 2x2 Grid Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Filler Words */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/filler-words-landing" 
                    className="block group relative overflow-hidden bg-gradient-to-br from-[#00d4aa] via-[#00b894] to-[#00a085] rounded-2xl p-6 shadow-2xl hover:shadow-[#00d4aa]/25 transition-all duration-500 border-2 border-transparent hover:border-[#00d4aa]/50"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white/30 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${30 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FaComment className="text-white text-xl" />
                      </motion.div>
                      
                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-white/90 transition-colors">
                        Filler Words
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Eliminate "um", "uh", "like" and sound more professional
                      </p>
                    </div>
                  </Link>
                </motion.div>

                {/* Pace Management */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                                  <Link 
                  to="/pace-management-home" 
                  className="block group relative overflow-hidden bg-gradient-to-br from-[#3b82f6] via-[#1d4ed8] to-[#1e40af] rounded-2xl p-6 shadow-2xl hover:shadow-[#3b82f6]/25 transition-all duration-500 border-2 border-transparent hover:border-[#3b82f6]/50"
                >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white/30 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${30 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FaTachometerAlt className="text-white text-xl" />
                      </motion.div>
                      
                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-white/90 transition-colors">
                        Pace Management
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Optimize your speaking speed and rhythm
                      </p>
                    </div>
                  </Link>
                </motion.div>

                {/* Loudness */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/loudness-variation-landing" 
                    className="block group relative overflow-hidden bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] rounded-2xl p-6 shadow-2xl hover:shadow-[#f59e0b]/25 transition-all duration-500 border-2 border-transparent hover:border-[#f59e0b]/50"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white/30 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${30 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FaVolumeUp className="text-white text-xl" />
                      </motion.div>
                      
                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-white/90 transition-colors">
                        Loudness
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Control volume and vocal projection
                      </p>
                    </div>
                  </Link>
                </motion.div>

                {/* Emotion Analysis */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/emotion-analysis-home" 
                    className="block group relative overflow-hidden bg-gradient-to-br from-[#ec4899] via-[#db2777] to-[#be185d] rounded-2xl p-6 shadow-2xl hover:shadow-[#ec4899]/25 transition-all duration-500 border-2 border-transparent hover:border-[#ec4899]/50"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white/30 rounded-full"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${30 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div
                        className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <FaHeart className="text-white text-xl" />
                      </motion.div>
                      
                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-white/90 transition-colors">
                        Emotion Analysis
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Track emotional content and delivery
                      </p>
                    </div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Performance Charts */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-[600px]">
            {/* Filler Words Progress Chart */}
            <div className="flex-1 flex flex-col">
            <motion.div
              className="w-full h-full bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Glowing Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ccff]/20 via-transparent to-[#00ccff]/20 rounded-2xl animate-pulse"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-6">
                <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                    <FaChartLine className="text-white text-2xl" />
                </motion.div>
                
                  <h3 className="text-[#00ccff] font-bold text-xl lg:text-2xl mb-2 drop-shadow-lg">
                    📈 Filler Words Progress
                </h3>
                
                  <p className="text-white/80 text-sm">
                    Track your improvement over time
                  </p>
                </div>

                {/* Chart Section */}
                <div className="flex-1 min-h-0 h-80">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4aa]"></div>
                    </div>
                  ) : fillerChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={fillerChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value, name) => {
                            if (name === "fillerCount") return [value, "Filler Count"];
                            if (name === "level") return [value, "Level"];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          wrapperStyle={{ color: '#fff' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="fillerCount"
                          name="Filler Count"
                          stroke="#00d4aa"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#00d4aa' }}
                          activeDot={{ r: 7, fill: '#00b894' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FaComment className="text-4xl text-gray-400 mb-4" />
                      <p className="text-gray-300 text-lg mb-2">No filler word sessions yet</p>
                      <p className="text-gray-400 text-sm">Start practicing to see your progress!</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
            </div>

            {/* Loudness Performance Chart */}
            <div className="flex-1 flex flex-col">
            <motion.div
              className="w-full h-full bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#f59e0b]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {/* Glowing Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b]/20 via-transparent to-[#f59e0b]/20 rounded-2xl animate-pulse"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-6">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <FaVolumeUp className="text-white text-2xl" />
                  </motion.div>
                  
                  <h3 className="text-[#f59e0b] font-bold text-xl lg:text-2xl mb-2 drop-shadow-lg">
                    🔊 Loudness Performance
                  </h3>
                  
                  <p className="text-white/80 text-sm">
                    Track your volume control and steadiness over time
                  </p>
                </div>

                {/* Chart Section */}
                <div className="flex-1 min-h-0 h-80">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f59e0b]"></div>
                    </div>
                  ) : loudnessChartData.length > 0 || loudnessExercisesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={loudnessChartData.length > 0 ? loudnessChartData : loudnessExercisesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value, name) => {
                            if (name === "score") return [value, "Score"];
                            if (name === "rms") return [value, "RMS"];
                            if (name === "steadiness") return [value, "Steadiness"];
                            if (name === "level") return [value, "Level"];
                            return [value, name];
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          wrapperStyle={{ color: '#fff' }}
                        />
                        {loudnessChartData.length > 0 ? (
                          <Line
                            type="monotone"
                            dataKey="score"
                            name="Loudness Score"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#f59e0b' }}
                            activeDot={{ r: 7, fill: '#d97706' }}
                          />
                        ) : (
                          <>
                            <Line
                              type="monotone"
                              dataKey="rms"
                              name="RMS Level"
                              stroke="#f59e0b"
                              strokeWidth={3}
                              dot={{ r: 5, fill: '#f59e0b' }}
                              activeDot={{ r: 7, fill: '#d97706' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="steadiness"
                              name="Steadiness"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ r: 5, fill: '#10b981' }}
                              activeDot={{ r: 7, fill: '#059669' }}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FaVolumeUp className="text-4xl text-gray-400 mb-4" />
                      <p className="text-gray-300 text-lg mb-2">No loudness data yet</p>
                      <p className="text-gray-400 text-sm">Start practicing to see your performance!</p>
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
            </div>

            {/* Rate Performance Chart */}
            <div className="flex-1 flex flex-col">
              <motion.div
                className="w-full h-full bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#3b82f6]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                {/* Glowing Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/20 via-transparent to-[#3b82f6]/20 rounded-2xl animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-center mb-6">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <FaTachometerAlt className="text-white text-2xl" />
                    </motion.div>
                    
                    <h3 className="text-[#3b82f6] font-bold text-xl lg:text-2xl mb-2 drop-shadow-lg">
                      🎯 Rate Performance
                    </h3>
                    
                    <p className="text-white/80 text-sm">
                      Track your speech speed and consistency
                    </p>
                  </div>

                  {/* Chart Section */}
                  <div className="flex-1 min-h-0 h-64">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
                      </div>
                    ) : rateChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={rateChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => {
                              if (name === "wpm") return [value, "WPM"];
                              if (name === "consistency") return [value, "Consistency %"];
                              if (name === "finalScore") return [value, "Score %"];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ color: '#fff' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="wpm"
                            name="WPM"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#3b82f6' }}
                            activeDot={{ r: 7, fill: '#1d4ed8' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="consistency"
                            name="Consistency %"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#8b5cf6' }}
                            activeDot={{ r: 7, fill: '#7c3aed' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <FaTachometerAlt className="text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-300 text-lg mb-2">No rate data yet</p>
                        <p className="text-gray-400 text-sm">Start practicing to see your performance!</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Pause Performance Chart */}
            <div className="flex-1 flex flex-col">
              <motion.div
                className="w-full h-full bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#ff6b6b]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                {/* Glowing Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b6b]/20 via-transparent to-[#ff6b6b]/20 rounded-2xl animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-center mb-6">
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-br from-[#ff6b6b] to-[#ff5252] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <FaClock className="text-white text-2xl" />
                    </motion.div>
                    
                    <h3 className="text-[#ff6b6b] font-bold text-xl lg:text-2xl mb-2 drop-shadow-lg">
                      ⏱️ Pause Performance
                    </h3>
                    
                    <p className="text-white/80 text-sm">
                      Track your pause timing and flow
                    </p>
                  </div>

                  {/* Chart Section */}
                  <div className="flex-1 min-h-0 h-64">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b6b]"></div>
                      </div>
                    ) : pauseChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={pauseChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            fontSize={12}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1f2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value, name) => {
                              if (name === "pauseRatio") return [value, "Pause Ratio %"];
                              if (name === "flowScore") return [value, "Flow Score"];
                              if (name === "excessivePauses") return [value, "Excessive Pauses"];
                              if (name === "finalScore") return [value, "Score %"];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ color: '#fff' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="pauseRatio"
                            name="Pause Ratio %"
                            stroke="#ff6b6b"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#ff6b6b' }}
                            activeDot={{ r: 7, fill: '#ff5252' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="flowScore"
                            name="Flow Score"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#10b981' }}
                            activeDot={{ r: 7, fill: '#059669' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <FaClock className="text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-300 text-lg mb-2">No pause data yet</p>
                        <p className="text-gray-400 text-sm">Start practicing to see your performance!</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
