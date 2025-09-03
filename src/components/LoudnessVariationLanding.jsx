import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaVolumeUp, 
  FaMicrophone, 
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
  FaCrosshairs, 
  FaAward,
  FaBullseye,
  FaPlay,
  FaPause,
  FaClock,
  FaGamepad,
  FaMedal,
  FaFire,
  FaGem,
  FaBrain,
  FaGlobe,
  FaSlidersH
} from 'react-icons/fa';
import loudness1 from '../assets/images/loudness2.jpg';
import loudness2 from '../assets/images/loudness1.jpg';

const LoudnessVariationLanding = () => {
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
                <span className="text-[#f59e0b]">Loudness Variation</span> Training
              </h2>
              <p className="text-gray-300 text-sm lg:text-base">
                Master vocal dynamics for engaging presentations
              </p>
            </motion.div>

            {/* What is Loudness Variation */}
            <motion.div
              className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20 shadow-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-full flex items-center justify-center">
                  <FaVolumeUp className="text-white text-lg" />
                </div>
                <h3 className="text-white font-semibold text-lg">What is Loudness Variation?</h3>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Loudness variation is the art of controlling vocal volume and intensity to create engaging, 
                dynamic presentations. Our AI-powered system detects monotone delivery, excessive volume shifts, 
                and helps you develop optimal vocal modulation for Sri Lankan English speakers.
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
                  className="w-10 h-10 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <FaChartLine className="text-white text-lg" />
                </motion.div>
                <h3 className="text-white font-semibold text-lg">Training Areas</h3>
              </div>
              
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <FaSlidersH className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Volume Analysis</span>
                    <p className="text-gray-400 text-xs">RMS energy levels and intensity tracking</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-orange-400 text-xs">Real-time Monitoring</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <FaMicrophone className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Monotone Detection</span>
                    <p className="text-gray-400 text-xs">Identify flat delivery patterns</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 text-xs">AI-Powered Analysis</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FaSlidersH className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Dynamic Control</span>
                    <p className="text-gray-400 text-xs">Learn optimal volume modulation</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">Personalized Training</span>
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
                  className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaTrophy className="text-orange-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Volume Master</p>
                  <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <FaRocket className="text-yellow-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Dynamic Pro</p>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <FaBullseye className="text-green-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Engagement King</p>
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Enhanced Context & Navigation */}
          <div className="w-full flex flex-col space-y-6">
            {/* Loudness Variation Context */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#f59e0b]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-4 right-4 w-16 h-16 bg-[#f59e0b]/20 rounded-full blur-lg"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-4 left-4 w-12 h-12 bg-[#d97706]/30 rounded-full blur-md"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-xl flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <FaVolumeUp className="text-white text-lg" />
                  </motion.div>
                  <h3 className="text-[#f59e0b] font-bold text-lg">Why Loudness Variation Matters</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#f59e0b] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Prevents monotone delivery that reduces audience engagement and clarity</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#f59e0b] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Enhances presentation impact and professional credibility</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#f59e0b] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Tailored for Sri Lankan English speech patterns and cultural context</p>
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
              <h3 className="text-[#f59e0b] font-bold text-lg mb-4">Core Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-lg flex items-center justify-center">
                    <FaSlidersH className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">RMS Analysis</p>
                    <p className="text-gray-400 text-xs">Energy level tracking</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <FaMicrophone className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Monotone Detection</p>
                    <p className="text-gray-400 text-xs">Flat delivery alerts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <FaSlidersH className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Volume Control</p>
                    <p className="text-gray-400 text-xs">Dynamic modulation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
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
                to="/loudness"
                className="group bg-gradient-to-br from-[#f59e0b]/20 to-[#d97706]/20 hover:from-[#f59e0b]/30 hover:to-[#d97706]/30 rounded-xl p-4 border-2 border-[#f59e0b]/30 hover:border-[#f59e0b]/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  {/* Practice Image - Top/Left Side */}
                  <motion.div
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={loudness1} 
                      alt="Practice Session" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Bottom/Right Side */}
                  <div className="flex-1 text-center lg:text-left">
                    <h4 className="text-white font-bold text-sm mb-2">Practice Session</h4>
                    <p className="text-gray-300 text-xs mb-3">Record your speech and get real-time loudness analysis with volume variation feedback</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
                        <FaSlidersH className="text-[#f59e0b]" />
                        <span>RMS Energy Analysis</span>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
                        <FaMicrophone className="text-[#f59e0b]" />
                        <span>Monotone Detection</span>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
                        <FaSlidersH className="text-[#f59e0b]" />
                        <span>Volume Control</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-[#f59e0b] font-medium">
                      <span>Start Recording</span>
                      <FaPlay className="text-xs" />
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Training Activities Card */}
              <Link
                to="/loudness-training"
                className="group bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl p-4 border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  {/* Training Image - Top/Left Side */}
                  <motion.div
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={loudness2} 
                      alt="Training Activities" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Bottom/Right Side */}
                  <div className="flex-1 text-center lg:text-left">
                    <h4 className="text-white font-bold text-sm mb-2">Training Activities</h4>
                    <p className="text-gray-300 text-xs mb-3">Engage in structured exercises and challenges to master vocal dynamics and loudness control</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
                        <FaGamepad className="text-yellow-400" />
                        <span>Interactive Exercises</span>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
                        <FaTrophy className="text-yellow-400" />
                        <span>Daily Challenges</span>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-400">
                        <FaMedal className="text-yellow-400" />
                        <span>Achievement Badges</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-yellow-400 font-medium">
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
                <h3 className="text-[#f59e0b] font-bold text-lg mb-3">How It Works</h3>
                <div className="bg-gray-800/50 rounded-xl p-6 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center min-h-[180px]">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-full flex items-center justify-center mb-3">
                    <FaPlay className="text-white text-lg ml-1" />
                  </div>
                  <p className="text-gray-400 text-sm text-center">Video demonstration coming soon</p>
                  <p className="text-gray-500 text-xs text-center mt-1">Learn how our AI analyzes loudness variation in real-time</p>
                </div>
              </div>

              {/* Compact Benefits Section */}
              <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-4 border border-white/20">
                <h3 className="text-[#f59e0b] font-bold text-lg mb-3">Key Benefits</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Eliminate monotone delivery and boost audience engagement</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Improve presentation clarity and professional credibility</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Build confidence in vocal delivery and public speaking</p>
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

export default LoudnessVariationLanding;
