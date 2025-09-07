import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaGithub, FaLinkedin, FaTwitter, FaEnvelope, FaMicrophone } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="fixed bottom-0 left-0 lg:left-64 w-full lg:w-[calc(100%-17rem)] bg-gradient-to-r from-[#00171f] via-[#003b46] to-[#07575b] border-t border-white/10 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#00d4aa]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-24 h-24 bg-[#00b894]/15 rounded-full blur-lg animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-[#00d4aa]/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          
          {/* Left Side - Brand */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-lg flex items-center justify-center">
              <FaMicrophone className="text-white text-sm" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                <span className="text-white">SPEAK</span>
                <span className="text-[#00d4aa]">CRAFT</span>
              </h3>
              <p className="text-gray-300 text-xs">AI-Powered Speech Training</p>
            </div>
          </motion.div>

          {/* Center - Quick Links */}
          <motion.div
            className="flex items-center space-x-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <a href="#" className="text-gray-300 hover:text-[#00d4aa] transition-colors duration-300 text-sm font-medium">
              About
            </a>
            <a href="#" className="text-gray-300 hover:text-[#00d4aa] transition-colors duration-300 text-sm font-medium">
              Features
            </a>
            <a href="#" className="text-gray-300 hover:text-[#00d4aa] transition-colors duration-300 text-sm font-medium">
              Support
            </a>
            <a href="#" className="text-gray-300 hover:text-[#00d4aa] transition-colors duration-300 text-sm font-medium">
              Privacy
            </a>
          </motion.div>

          {/* Right Side - Social Links & Copyright */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Social Links */}
            <div className="flex items-center space-x-3">
              <motion.a
                href="#"
                className="w-8 h-8 bg-white/10 hover:bg-[#00d4aa]/20 rounded-lg flex items-center justify-center transition-all duration-300 group"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaGithub className="text-gray-300 group-hover:text-[#00d4aa] text-sm transition-colors duration-300" />
              </motion.a>
              
              <motion.a
                href="#"
                className="w-8 h-8 bg-white/10 hover:bg-[#00d4aa]/20 rounded-lg flex items-center justify-center transition-all duration-300 group"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaLinkedin className="text-gray-300 group-hover:text-[#00d4aa] text-sm transition-colors duration-300" />
              </motion.a>
              
              <motion.a
                href="#"
                className="w-8 h-8 bg-white/10 hover:bg-[#00d4aa]/20 rounded-lg flex items-center justify-center transition-all duration-300 group"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTwitter className="text-gray-300 group-hover:text-[#00d4aa] text-sm transition-colors duration-300" />
              </motion.a>
              
              <motion.a
                href="#"
                className="w-8 h-8 bg-white/10 hover:bg-[#00d4aa]/20 rounded-lg flex items-center justify-center transition-all duration-300 group"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaEnvelope className="text-gray-300 group-hover:text-[#00d4aa] text-sm transition-colors duration-300" />
              </motion.a>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-white/20"></div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-xs">
                © {currentYear} SpeakCraft. Made with{' '}
                <motion.span
                  className="inline-block text-red-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <FaHeart className="inline text-xs" />
                </motion.span>
              </p>
              <p className="text-gray-500 text-xs mt-1">All rights reserved</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Border with Gradient */}
        <motion.div
          className="mt-4 pt-4 border-t border-white/10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Built with React & Node.js</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by AI</span>
              <motion.div
                className="w-2 h-2 bg-[#00d4aa] rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
