import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCamera, FaClock, FaMicrophone, FaChartLine, FaFileAlt, FaPause } from "react-icons/fa";
import { BiSolidVideoRecording } from "react-icons/bi";
import { MdDashboardCustomize, MdCoPresent } from "react-icons/md";
import logo from "/assets/images/logo.png"; // Replace with actual path
import MenuHeader from "./MenuHeader";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboardCustomize className="text-xl" />, path: "/" },
    { name: "Present", icon: <MdCoPresent className="text-xl" />, path: "/present" },
    { name: "Face Detection", icon: <FaCamera className="text-xl" />, path: "/face-detection" },
    { name: "Pace Management", icon: <FaPause className="text-xl" />, path: "/pace-management" },
    { name: "Filler Words", icon: <FaMicrophone className="text-xl" />, path: "/filler-words" },
    { name: "Pitch and Tone", icon: <FaChartLine className="text-xl" />, path: "/pitch-tone" },
    { name: "Recordings", icon: <BiSolidVideoRecording className="text-xl" />, path: "/recordings" },
    { name: "Report", icon: <FaFileAlt className="text-xl" />, path: "/report" },
  ];

  const handleNavigation = (path) => {
    setActiveItem(path);
    navigate(path);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="fixed top-5 left-5 h-[96vh] w-64 bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 flex flex-col items-center transition-all duration-300 dark:bg-[#00171f] dark:text-gray-300 z-50">
        <div className="w-60 h-20">
          <img src={logo} alt="SpeaKraft Logo" className="w-full object-contain" />
        </div>
        <ul className="flex flex-col gap-3 w-full">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition ${
                activeItem === item.path
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
