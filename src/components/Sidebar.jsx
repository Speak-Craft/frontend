import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCamera, FaClock, FaMicrophone, FaChartLine, FaPause, FaQuestion, FaList } from "react-icons/fa";
import { BiSolidVideoRecording } from "react-icons/bi";
import { MdDashboardCustomize, MdCoPresent } from "react-icons/md";
import logo from "../assets/images/logo.png"; // Replace with actual path
import MenuHeader from "./MenuHeader";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboardCustomize className="text-xl" />, path: "/dashboard" },
    { name: "Face Detection", icon: <FaCamera className="text-xl" />, path: "/face-detection" },
    { name: "Pace Management", icon: <FaPause className="text-xl" />, path: "/pace-management-landing" },
    { name: "Filler Words", icon: <FaMicrophone className="text-xl" />, path: "/filler-words-landing" },
    { name: "Loudness Variation", icon: <FaChartLine className="text-xl" />, path: "/loudness-variation-landing" },
    { name: "Topic generator", icon: <FaList className="text-xl" />, path: "/topic-generator" },
    { name: "Time Segmentation", icon: <FaClock className="text-xl" />, path: "/time-segmentation" },
    { name: "Question Generator", icon: <FaQuestion className="text-xl" />, path: "/question-generation" }


  ];

  const isActive = (itemPath) => {
    const current = location.pathname;
    if (itemPath === "/pace-management-landing") {
      const activePaths = [
        "/pace-management-landing",
        "/pace-management",
        "/pace-management-activities",
      ];
      return activePaths.some((p) => current.startsWith(p));
    }
    if (itemPath === "/filler-words-landing") {
      const activePaths = [
        "/filler-words-landing",
        "/filler-words-detection",
        "/filler-words-activities",
      ];
      return activePaths.some((p) => current.startsWith(p));
    }
    if (itemPath === "/loudness-variation-landing") {
      const activePaths = [
        "/loudness-variation-landing",
        "/loudness-practice",
        "/loudness-activities",
      ];
      return activePaths.some((p) => current.startsWith(p));
    }
    return current === itemPath;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="fixed top-5 left-5 h-[96vh] w-64 bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 flex flex-col items-center transition-all duration-300 dark:bg-[#00171f] dark:from-[#00171f] dark:to-[#003b46] dark:text-gray-300 z-50">
        <div className="w-60 h-20">
          <img src={logo} alt="SpeaKraft Logo" className="w-full object-contain" />
        </div>
        <ul className="flex flex-col gap-3 w-full">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition ${
                isActive(item.path)
                  ? "bg-[#0084a6] text-white" // Active state
                  : "hover:bg-[#00a8cc] dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]"
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="w-full">
        <MenuHeader />
      </div>
    </div>
  );
};

export default Sidebar;
