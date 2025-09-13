import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Present from "./components/Present";
import PaceManagement from "./components/PaceManagement";
import PaceManagementHome from "./components/PaceManagementHome";
import PaceManagementActivity from "./components/PaceManagementActivity";
import FillerWords from "./components/FillerWords";
import Loudness from "./components/Loudness";
import EmotionAnalysis from "./components/EmotionAnalysis";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import FillerWordsDetectionHome from "./components/FillerWordsDetectionHome";
import LoudnessVariationLanding from "./components/LoudnessVariationLanding";
import LoudnessActivities from "./components/LoudnessActivities";
import TopicGenerator from "./components/TopicGenerator";
import TimeSegmentation from "./components/TimeSegmentation";
import FillerWordsActivity from "./components/FillerWordsActivity";
import QuestionGeneration from "./components/QuestionGeneration";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <div className="flex-1">
                  <Routes>
                    <Route path="present" element={<Present />} />
                    <Route path="pace-management-landing" element={<PaceManagementHome />} />
                    <Route path="pace-management" element={<PaceManagement />} />
                    <Route path="pace-management-activities" element={<PaceManagementActivity />} />
                    <Route path="filler-words-landing" element={<FillerWordsDetectionHome />} />
                    <Route path="filler-words-detection" element={<FillerWords />} />
                    <Route path="loudness-variation-landing" element={<LoudnessVariationLanding />} />
                    <Route path="loudness-practice" element={<Loudness />} />
                    <Route path="loudness-activities" element={<LoudnessActivities />} />
                    <Route path="emotion-analysis" element={<EmotionAnalysis />} />
                    <Route path="topic-generator" element={<TopicGenerator />} />
                    <Route path="time-segmentation" element={<TimeSegmentation />} />
                    <Route path="filler-words-activities" element={<FillerWordsActivity />} />
                    <Route path="question-generation" element={<QuestionGeneration />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
