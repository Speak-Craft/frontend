import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Present from "./components/Present";
import PaceManagement from "./components/PaceManagement";

const App = () => {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/present" element={<Present />} />
            <Route path="/pace-management" element={<PaceManagement />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
