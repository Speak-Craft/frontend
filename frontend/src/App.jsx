import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import ChallengeGoal from "./pages/ChallengeGoal.jsx";
import ProgressDashboard from "./pages/ProgressDashboard.jsx";

function App() {
  const token = localStorage.getItem("token"); // ✅ Check if user is logged in

  return (
    <Router>
      {token ? (
        // ✅ LAYOUT FOR LOGGED-IN USERS
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-64 p-6">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
              <Route path="/goals" element={<ChallengeGoal />} />
              <Route path="/progess" element={<ProgressDashboard />} />
            </Routes>
          </div>
        </div>
      ) : (
        // ✅ LAYOUT FOR LOGIN/REGISTER (FULL SCREEN CENTERED)
        <div className="min-h-screen w-full">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;
