import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Exercises from "./pages/Exercises";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SustainedVowel from "./pages/SustainedVowel"; 
import LoudnessExercise from "./pages/LoudnessExercise";

const ProtectedLayout = () => {
  const token = localStorage.getItem('token');
  return token ? (
    <>
      <Sidebar />
      <div className="ml-64 p-8">
        <Outlet />
      </div>
    </>
  ) : (
    <Navigate to="/login" />
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<Exercises />} />
          <Route path="/report" element={<div>Report Page</div>} />
          <Route path="/exercise/sustained-vowel" element={<SustainedVowel />} /> 
          <Route path="/loudness-exercise" element={<LoudnessExercise />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
