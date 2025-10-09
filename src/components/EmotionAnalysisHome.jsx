import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaSmile, FaFrown, FaAngry, FaSurprise, FaMeh, FaSadTear, FaEye, FaBrain, FaChartLine, FaBullseye, FaTrophy, FaRocket, FaPlay, FaUsers, FaStar, FaArrowRight, FaCheckCircle, FaLightbulb, FaCog, FaChartBar, FaVideo, FaCrosshairs, FaAward, FaCamera, FaMicrophone, FaAlignLeft, FaHeart, FaShieldAlt } from 'react-icons/fa';
import emotion1 from '../assets/images/filler1.png';
import emotion2 from '../assets/images/filler2.jpeg';
import topicVideo from "../assets/video/emotion.mp4";

const EmotionAnalysisHome = () => {
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
                <span className="text-[#00d4aa]">Emotionally-Aware</span> Presentation Analyzer
              </h2>
              <p className="text-gray-300 text-sm lg:text-base">
                Master emotional delivery for impactful presentations
              </p>
            </motion.div>

            {/* What is Emotion Analysis */}
            <motion.div
              className="w-full bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-6 border border-white/20 shadow-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center">
                  <FaBrain className="text-white text-lg" />
                </div>
                <h3 className="text-white font-semibold text-lg">What is Emotion Analysis?</h3>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                Emotionally-Aware Presentation Analyzer evaluates whether your facial emotions are visible, 
                consistent, and aligned with your spoken content. It bridges the gap in emotional awareness 
                that traditional training often overlooks.
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
                <h3 className="text-white font-semibold text-lg">Core Features</h3>
              </div>
              
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaEye className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Face Visibility Tracking</span>
                    <p className="text-gray-400 text-xs">Continuous monitoring of facial presence</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">Real-time Detection</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FaSmile className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Emotion Recognition</span>
                    <p className="text-gray-400 text-xs">CNN-based facial expression analysis</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400 text-xs">6 Core Emotions</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaAlignLeft className="text-white text-sm" />
                  </div>
                  <div>
                    <span className="text-white font-medium text-sm">Content Alignment</span>
                    <p className="text-gray-400 text-xs">NLP-driven emotion-content matching</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-purple-400 text-xs">Semantic Analysis</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Emotion Types with Enhanced Visuals */}
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
                  <FaHeart className="text-white text-lg" />
                </motion.div>
                <h3 className="text-white font-semibold text-lg">Detected Emotions</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30 hover:border-green-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaSmile className="text-green-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Happiness</p>
                  <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <FaAngry className="text-red-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Anger</p>
                  <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <FaSurprise className="text-blue-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Surprise</p>
                  <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  >
                    <FaSadTear className="text-purple-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Sadness</p>
                  <div className="w-2 h-2 bg-purple-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                  >
                    <FaFrown className="text-orange-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Fear</p>
                  <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 bg-gradient-to-br from-gray-500/20 to-slate-500/20 rounded-lg border border-gray-500/30 hover:border-gray-400/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 2.5 }}
                  >
                    <FaMeh className="text-gray-400 text-lg mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white text-xs font-medium">Neutral</p>
                  <div className="w-2 h-2 bg-gray-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Enhanced Context & Navigation */}
          <div className="w-full flex flex-col space-y-6">
            {/* Emotion Analysis Context */}
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
                    <FaBrain className="text-white text-lg" />
                  </motion.div>
                  <h3 className="text-[#00ccff] font-bold text-lg">Why Emotion Analysis Matters</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#00d4aa] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Facial emotions are crucial for audience engagement and message interpretation</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#00d4aa] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Emotional alignment with content creates authentic and compelling presentations</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#00d4aa] rounded-full mt-2 flex-shrink-0"></div>
                    <p>Consistent facial visibility ensures uninterrupted emotional communication</p>
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
              <h3 className="text-[#00ccff] font-bold text-lg mb-4">Advanced Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-lg flex items-center justify-center">
                    <FaCamera className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Real-time Tracking</p>
                    <p className="text-gray-400 text-xs">Face visibility monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <FaBrain className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">CNN Analysis</p>
                    <p className="text-gray-400 text-xs">Deep learning models</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FaAlignLeft className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">NLP Integration</p>
                    <p className="text-gray-400 text-xs">Content-emotion matching</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <FaChartBar className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Analytics Dashboard</p>
                    <p className="text-gray-400 text-xs">Detailed reports</p>
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
              {/* Main Analysis Card */}
              <Link
                to="/emotion-analysis"
                className="group bg-gradient-to-br from-[#00d4aa]/20 to-[#00b894]/20 hover:from-[#00d4aa]/30 hover:to-[#00b894]/30 rounded-xl p-4 border-2 border-[#00d4aa]/30 hover:border-[#00d4aa]/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Analysis Image - Top/Left Side */}
                  <motion.div
                    className="w-full sm:w-32 sm:h-32 lg:w-40 lg:h-40 h-48 sm:h-32 lg:h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={emotion1} 
                      alt="Emotion Analysis" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Bottom/Right Side */}
                  <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-white font-bold text-sm mb-2">Emotion Analysis</h4>
                    <p className="text-gray-300 text-xs mb-3">Record your presentation and get real-time emotion analysis with facial expression tracking</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaEye className="text-[#00d4aa]" />
                        <span>Face Visibility</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaSmile className="text-[#00d4aa]" />
                        <span>Emotion Recognition</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaAlignLeft className="text-[#00d4aa]" />
                        <span>Content Alignment</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#00d4aa] font-medium">
                      <span>Start Analysis</span>
                      <FaPlay className="text-xs" />
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Activities Card */}
              <Link
                to="/emotion-analysis-activities"
                className="group bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl p-4 border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Activities Image - Top/Left Side */}
                  <motion.div
                    className="w-full sm:w-32 sm:h-32 lg:w-40 lg:h-40 h-48 sm:h-32 lg:h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={emotion2} 
                      alt="Emotion Activities" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Context - Bottom/Right Side */}
                  <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-white font-bold text-sm mb-2">Interactive Activities</h4>
                    <p className="text-gray-300 text-xs mb-3">Master emotional delivery through guided exercises and real-time feedback sessions</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaBullseye className="text-yellow-400" />
                        <span>Emotion Exercises</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaRocket className="text-yellow-400" />
                        <span>Real-time Feedback</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-400">
                        <FaTrophy className="text-yellow-400" />
                        <span>Progress Tracking</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-yellow-400 font-medium">
                      <span>Start Activities</span>
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
                <h3 className="text-[#00ccff] font-bold text-lg mb-3">How It Works</h3>
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <video 
                    className="w-full h-auto rounded-xl"
                    controls
                    autoPlay
                    muted
                    loop
                    preload="metadata"
                  >
                    <source src={topicVideo} type="video/mp4" />
                    <source src={topicVideo} type="video/quicktime" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center">
                      <FaPlay className="text-white text-xl ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Benefits Section */}
              <div className="bg-gradient-to-br from-[#00171f] to-[#003b46] rounded-2xl p-4 border border-white/20">
                <h3 className="text-[#00ccff] font-bold text-lg mb-3">Key Benefits</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Improve emotional authenticity in presentations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Align facial expressions with content tone</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Build confidence in emotional delivery</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                    <p className="text-white text-xs">Get detailed analytics and improvement tips</p>
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

export default EmotionAnalysisHome;
