import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaMicrophone, 
  FaBrain, 
  FaChartLine, 
  FaTrophy, 
  FaRocket, 
  FaUsers, 
  FaStar, 
  FaCheckCircle, 
  FaLightbulb, 
  FaEye, 
  FaCog, 
  FaChartBar, 
  FaVolumeUp, 
  FaCrosshairs, 
  FaAward,
  FaExclamationTriangle,
  FaBullseye,
  FaPlay,
  FaPause,
  FaClock,
  FaGamepad,
  FaMedal,
  FaFire,
  FaGem
} from 'react-icons/fa';
import filler1 from '../assets/images/filler1.png';
import filler2 from '../assets/images/filler2.jpeg';

const FillerWordsDetectionHome = () => {
  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8">
          
          {/* Left Side - Information & Overview */}
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
            {/* Header */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                <span className="text-[#ff6b6b]">Filler Words</span> Detection
              </h2>
              <p className="text-gray-300 text-sm lg:text-base">
                Eliminate "um", "ah", "like" and speak with confidence
              </p>
            </motion.div>

            {/* What is Filler Words Detection */}
            <motion.div
              className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20 shadow-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="text-white text-lg" />
                </div>
                <h3 className="text-white font-semibold text-lg">What are Filler Words?</h3>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Filler words like "um", "ah", "like", and "you know" disrupt speech flow and reduce 
                presentation impact. Our AI-powered system detects these disfluencies in Sri Lankan 
                English accents and provides targeted training to eliminate them.
              </p>
            </motion.div>

            {/* Training Areas with Visual Elements */}
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <FaBullseye className="text-white text-lg" />
                </motion.div>
                <h3 className="text-white font-semibold text-lg">Training Areas</h3>
              </div>
              
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaMicrophone className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Real-time Detection</span>
                    <p className="text-gray-400 text-xs">AI-powered filler word identification</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span className="text-red-400 text-xs">Sri Lankan Accent Optimized</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <FaBrain className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Smart Analysis</span>
                    <p className="text-gray-400 text-xs">Pattern recognition and frequency tracking</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-orange-400 text-xs">Personalized Insights</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FaPlay className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Practice Exercises</span>
                    <p className="text-gray-400 text-xs">Targeted drills to reduce fillers</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">Interactive Training</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Gamification Features with Enhanced Visuals */}
            <motion.div
              className="w-full mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FaTrophy className="text-white text-lg" />
                </motion.div>
                <h3 className="text-white font-semibold text-lg">Gamification</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaGem className="text-red-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Clean Speech</p>
                  <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <FaFire className="text-orange-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Streak Master</p>
                  <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <FaMedal className="text-green-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Fluency Pro</p>
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Enhanced Context & Navigation */}
          <div className="w-full flex flex-col space-y-6">
            {/* Filler Words Context */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#ff6b6b]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-4 right-4 w-16 h-16 bg-[#ff6b6b]/20 rounded-full blur-lg"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-4 left-4 w-12 h-12 bg-[#ee5a52]/30 rounded-full blur-md"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] rounded-xl flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <FaExclamationTriangle className="text-white text-lg" />
                  </motion.div>
                  <h3 className="text-[#ff6b6b] font-bold text-lg">Why Eliminate Filler Words?</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#ff6b6b] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Reduces nervousness perception and increases professional credibility</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#ff6b6b] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Improves speech clarity and audience comprehension</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#ff6b6b] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Enhances academic performance and future employability</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Core Features Section */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <h3 className="text-[#ff6b6b] font-bold text-lg mb-4">Core Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] rounded-lg flex items-center justify-center">
                    <FaMicrophone className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Live Detection</p>
                    <p className="text-gray-400 text-xs">Real-time analysis</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <FaBrain className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">AI Analysis</p>
                    <p className="text-gray-400 text-xs">Pattern recognition</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FaPlay className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Practice Drills</p>
                    <p className="text-gray-400 text-xs">Targeted exercises</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaChartBar className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Progress Tracking</p>
                    <p className="text-gray-400 text-xs">Improvement metrics</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Cards - Row Layout */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              {/* Main Practice Card */}
              <Link
                to="/filler-words-detection"
                className="group bg-gradient-to-br from-[#ff6b6b]/20 to-[#ee5a52]/20 hover:from-[#ff6b6b]/30 hover:to-[#ee5a52]/30 rounded-xl p-4 border-2 border-[#ff6b6b]/30 hover:border-[#ff6b6b]/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Practice Image - Top/Left Side */}
                  <motion.div
                    className="w-full sm:w-32 sm:h-32 lg:w-40 lg:h-40 h-48 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={filler1} 
                      alt="Practice Session" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Bottom/Right Side */}
                  <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-white font-bold text-sm mb-2">Practice Session</h4>
                    <p className="text-gray-300 text-xs mb-3">Record your speech and get real-time filler word detection with AI-powered analysis</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaMicrophone className="text-[#ff6b6b]" />
                        <span>Real-time Detection</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaBrain className="text-[#ff6b6b]" />
                        <span>AI Analysis</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaChartBar className="text-[#ff6b6b]" />
                        <span>Progress Tracking</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#ff6b6b] font-medium">
                      <span>Start Recording</span>
                      <FaPlay className="text-xs" />
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Activity Card */}
              <Link
                to="/filler-words-activities"
                className="group bg-gradient-to-br from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30 rounded-xl p-4 border-2 border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Activity Image - Top/Left Side */}
                  <motion.div
                    className="w-full sm:w-32 sm:h-32 lg:w-40 lg:h-40 h-48 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={filler2} 
                      alt="Training Activities" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Bottom/Right Side */}
                  <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-white font-bold text-sm mb-2">Training Activities</h4>
                    <p className="text-gray-300 text-xs mb-3">Engage in interactive exercises, drills, and challenges to master filler word elimination</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaGamepad className="text-orange-400" />
                        <span>Interactive Exercises</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaTrophy className="text-orange-400" />
                        <span>Daily Challenges</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaMedal className="text-orange-400" />
                        <span>Achievement Badges</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-orange-400 font-medium">
                      <span>Start Training</span>
                      <FaRocket className="text-xs" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Video and Benefits Section - Side by Side */}
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {/* Video Section */}
              <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-4 border border-white/20">
                <h3 className="text-[#ff6b6b] font-bold text-lg mb-3">How It Works</h3>
                <div className="bg-gray-800/50 rounded-xl p-6 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center min-h-[180px]">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] rounded-full flex items-center justify-center mb-3">
                    <FaPlay className="text-white text-lg ml-1" />
                  </div>
                  <p className="text-gray-400 text-sm text-center">Video demonstration coming soon</p>
                  <p className="text-gray-500 text-xs text-center mt-1">Learn how our AI detects filler words in real-time</p>
                </div>
              </div>

              {/* Compact Benefits Section */}
              <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-4 border border-white/20">
                <h3 className="text-[#ff6b6b] font-bold text-lg mb-3">Key Benefits</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Speak with confidence & eliminate nervous patterns</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Improve presentation quality & professional skills</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Enhanced academic performance & better scores</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillerWordsDetectionHome;
