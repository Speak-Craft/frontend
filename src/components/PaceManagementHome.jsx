import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaTachometerAlt, FaClock, FaPause, FaMicrophone, FaChartLine, FaBrain, FaBullseye, FaTrophy, FaRocket, FaPlay, FaUsers, FaStar, FaArrowRight, FaCheckCircle, FaLightbulb, FaEye, FaCog, FaChartBar, FaVolumeUp, FaCrosshairs, FaAward } from 'react-icons/fa';
import pace1 from '../assets/images/pace1.png';
import pace2 from '../assets/images/pace2.png';

const PaceManagementHome = () => {
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
                <span className="text-[#00d4aa]">Speech Pace</span> Management
              </h2>
              <p className="text-gray-300 text-sm lg:text-base">
                Master the art of perfect pacing for impactful presentations
              </p>
            </motion.div>

            {/* What is Speech Pace Management */}
            <motion.div
              className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20 shadow-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center">
                  <FaMicrophone className="text-white text-lg" />
                </div>
                <h3 className="text-white font-semibold text-lg">What is Speech Pace Management?</h3>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Speech pace management is the art of controlling your speaking speed, rhythm, and pauses to deliver clear, 
                engaging, and impactful presentations. It's about finding the perfect balance between speed and clarity.
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
                  className="w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center"
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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaTachometerAlt className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Speech Rate Analysis</span>
                    <p className="text-gray-400 text-xs">Monitor WPM and get real-time feedback</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">120-150 WPM Target</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FaPause className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Pause Management</span>
                    <p className="text-gray-400 text-xs">Strategic pausing for emphasis and clarity</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 text-xs">0.5-2s Optimal Pauses</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaClock className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Rhythm Control</span>
                    <p className="text-gray-400 text-xs">Develop consistent speaking rhythm</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-purple-400 text-xs">Natural Flow Patterns</span>
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
                  className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaBullseye className="text-blue-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Rate Mastery</p>
                  <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <FaBrain className="text-green-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Pause Pro</p>
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <FaRocket className="text-purple-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Flow Champion</p>
                  <div className="w-2 h-2 bg-purple-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Enhanced Context & Navigation */}
          <div className="w-full flex flex-col space-y-6">
            {/* Speech Pace Management Context */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-4 right-4 w-16 h-16 bg-[#00d4aa]/20 rounded-full blur-lg"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-4 left-4 w-12 h-12 bg-[#00b894]/30 rounded-full blur-md"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-xl flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <FaChartLine className="text-white text-lg" />
                  </motion.div>
                  <h3 className="text-[#00ccff] font-bold text-lg">Why Speech Pace Matters</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#00d4aa] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Optimal pace (120-150 WPM) keeps audiences engaged and improves comprehension</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#00d4aa] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Strategic pauses create emphasis and allow listeners to process information</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#00d4aa] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Consistent rhythm builds confidence and professional credibility</p>
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
              <h3 className="text-[#00ccff] font-bold text-lg mb-4">Core Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-lg flex items-center justify-center">
                    <FaTachometerAlt className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Real-time Tracking</p>
                    <p className="text-gray-400 text-xs">WPM monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <FaVolumeUp className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Smart Alerts</p>
                    <p className="text-gray-400 text-xs">Fast/slow warnings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaBrain className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">AI Recommendations</p>
                    <p className="text-gray-400 text-xs">Personalized tips</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaChartBar className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Visualizations</p>
                    <p className="text-gray-400 text-xs">Speed graphs</p>
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
                to="/pace-management"
                className="group bg-gradient-to-br from-[#00d4aa]/20 to-[#00b894]/20 hover:from-[#00d4aa]/30 hover:to-[#00b894]/30 rounded-xl p-4 border-2 border-[#00d4aa]/30 hover:border-[#00d4aa]/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  {/* Practice Image - Left Side */}
                  <motion.div
                    className="w-40 h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={pace1} 
                      alt="Practice Session" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Right Side */}
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm mb-1">Practice Session</h4>
                    <p className="text-gray-300 text-xs mb-2">Record & analyze speech</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaTachometerAlt className="text-[#00d4aa]" />
                        WPM
                      </span>
                      <span className="flex items-center gap-1">
                        <FaPause className="text-[#00d4aa]" />
                        Pauses
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Gamification Card */}
              <Link
                to="/pace-gamification"
                className="group bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl p-4 border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  {/* Gamification Image - Left Side */}
                  <motion.div
                    className="w-40 h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={pace2} 
                      alt="Gamification Hub" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Right Side */}
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm mb-1">Gamification</h4>
                    <p className="text-gray-300 text-xs mb-2">Earn badges & compete</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaBullseye className="text-yellow-400" />
                        Badges
                      </span>
                      <span className="flex items-center gap-1">
                        <FaRocket className="text-yellow-400" />
                        Leaderboard
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <h3 className="text-[#00ccff] font-bold text-lg mb-4">Key Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-400 text-sm mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white text-xs font-medium">Deliver smoother presentations</p>
                    <p className="text-gray-400 text-xs">Consistent pace and flow</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-400 text-sm mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white text-xs font-medium">Keep audience engaged</p>
                    <p className="text-gray-400 text-xs">Optimal pacing for focus</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-green-400 text-sm mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white text-xs font-medium">Build speaking confidence</p>
                    <p className="text-gray-400 text-xs">Master pace control</p>
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

export default PaceManagementHome;