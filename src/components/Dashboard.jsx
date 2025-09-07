import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaCalendarAlt, FaTrophy, FaChartLine, FaMicrophone, FaHistory, FaCog, FaComment, FaTachometerAlt, FaVolumeUp, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';

const Dashboard = () => {
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center">
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-8">
          
          {/* Left Side - User Information & Welcome */}
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
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

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
                    to="/emotion-analysis" 
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

          {/* Right Side - Performance Overview (Placeholder for future content) */}
          <div className="w-full flex flex-col">
            <motion.div
              className="w-full h-full bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] dark:from-[#003b46] dark:via-[#07575b] dark:to-[#0084a6] rounded-2xl p-6 border-2 border-[#00ccff]/60 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-center items-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Glowing Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ccff]/20 via-transparent to-[#00ccff]/20 rounded-2xl animate-pulse"></div>
              
              <div className="text-center relative z-10">
                <motion.div
                  className="w-24 h-24 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <FaChartLine className="text-white text-3xl" />
                </motion.div>
                
                <h3 className="text-[#00ccff] font-bold text-2xl lg:text-3xl mb-4 drop-shadow-lg">
                  📊 Performance Dashboard
                </h3>
                
                <p className="text-white/90 text-lg mb-6 max-w-md">
                  Your comprehensive speaking performance analytics will be displayed here
                </p>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <FaTrophy className="text-[#00d4aa] text-2xl mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">Overall Score</p>
                    <p className="text-gray-300 text-xs">Coming Soon</p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <FaChartLine className="text-[#00d4aa] text-2xl mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">Progress</p>
                    <p className="text-gray-300 text-xs">Coming Soon</p>
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

export default Dashboard;
