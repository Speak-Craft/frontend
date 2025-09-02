import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaMicrophone, FaStop, FaPlay, FaPause } from 'react-icons/fa';
import Footer from './Footer';

const EmotionAnalysis = () => {
  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-6 flex flex-col justify-center items-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-[#ec4899] to-[#db2777] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <FaHeart className="text-white text-3xl" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Content-Aware Emotional Tracking
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 max-w-md">
            Analyze the emotional tone and content of your speech to ensure your message matches your intended emotional delivery.
          </p>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-xl font-semibold text-[#ec4899] mb-4">Coming Soon</h3>
            <p className="text-gray-300">
              This feature is under development. You'll be able to analyze the emotional content of your speech and get feedback on emotional delivery.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmotionAnalysis;
