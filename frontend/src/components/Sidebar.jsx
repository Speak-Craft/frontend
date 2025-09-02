import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdDashboardCustomize } from "react-icons/md";
import { FaFileAlt } from "react-icons/fa";
import { BiSolidVideoRecording } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboardCustomize className="text-xl" />, path: "/dashboard" },
    { name: "Recordings", icon: <BiSolidVideoRecording className="text-xl" />, path: "/history" },
    { name: "Report", icon: <FaFileAlt className="text-xl" />, path: "/report" },
    { name: "Loudness-Exercise", icon: <FaFileAlt className="text-xl" />, path: "/loudness-exercise" },
    { name: "Sustained Vowel", icon: <BiSolidVideoRecording className="text-xl" />, path: "/exercise/sustained-vowel" },

  ];

  const handleNavigation = (path) => {
    setActiveItem(path);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="fixed top-5 left-5 h-[96vh] w-60 bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 flex flex-col justify-between transition-all duration-300">
      <div>
        <div className="text-sm font-bold mb-6 text-center">
          <h1>Speakraft</h1>
        </div>
        <ul className="flex flex-col gap-3 w-full">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition ${
                activeItem === item.path
                  ? "bg-[#0084a6] text-white"
                  : "hover:bg-[#00a8cc] dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]"
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Logout button at bottom */}
      <div className="w-full">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg mt-4 text-white hover:bg-red-600 transition"
        >
          <FiLogOut className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
