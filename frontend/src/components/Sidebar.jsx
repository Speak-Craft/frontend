import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdDashboardCustomize, MdCoPresent } from "react-icons/md";
import { FaMicrophone, FaFileAlt } from "react-icons/fa";
import { BiSolidVideoRecording } from "react-icons/bi";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const menuItems = [
    { name: "Dashboard", icon: <MdDashboardCustomize className="text-xl" />, path: "/dashboard" },
    { name: "Recordings", icon: <BiSolidVideoRecording className="text-xl" />, path: "/history" },
    { name: "Filler Words", icon: <FaMicrophone className="text-xl" />, path: "/filler-words" },
    { name: "Report", icon: <FaFileAlt className="text-xl" />, path: "/report" },
    { name: "Challenge", icon: <FaFileAlt className="text-xl" />, path: "/goals" },
    { name: "Progress", icon: <FaFileAlt className="text-xl" />, path: "/progess" },
  ];

  const handleNavigation = (path) => {
    setActiveItem(path);
    navigate(path);
  };

  return (
    <aside className="fixed top-5 left-5 h-[96vh] w-60 bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 flex flex-col items-center transition-all duration-300">
      <div className="text-sm font-bold mb-6">
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
    </aside>
  );
};

export default Sidebar;
