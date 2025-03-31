import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaClock, FaMicrophone, FaChartLine, FaFileAlt, FaPause } from "react-icons/fa";
import { BiSolidVideoRecording } from "react-icons/bi";
import { MdDashboardCustomize, MdCoPresent } from "react-icons/md";
import logo from "/assets/images/logo.png"; // Replace with actual path
import MenuHeader from "./MenuHeader";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="fixed top-5 left-5 h-[90vh] w-64 bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-4 flex flex-col items-center transition-all duration-300 dark:bg-[#00171f] dark:text-gray-300 z-50">
        <div className="w-60 h-20">
          <img src={logo} alt="SpeaKraft Logo" className="w-full object-contain" />
        </div>
        <ul className="flex flex-col gap-3 w-full">
          <li
            className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]"
            onClick={() => navigate("/")}
          >
            <MdDashboardCustomize className="text-xl" />
            <span>Dashboard</span>
          </li>
          <li
            className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]"
            onClick={() => navigate("/present")}
          >
            <MdCoPresent className="text-xl" />
            <span>Present</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]">
            <FaCamera className="text-xl" />
            <span>Face Detection</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]">
            <FaPause className="text-xl" />
            <span>Pace Management</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]">
            <FaMicrophone className="text-xl" />
            <span>Filler Words</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]">
            <FaChartLine className="text-xl" />
            <span>Pitch and Tone</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]">
            <BiSolidVideoRecording className="text-xl" />
            <span>Recordings</span>
          </li>
          <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-[#00a8cc] hover:text-white transition dark:hover:bg-[#005f6b] dark:hover:text-[#00a8cc]">
            <FaFileAlt className="text-xl" />
            <span>Report</span>
          </li>
        </ul>
      </aside>

      <div className="w-full">
        <MenuHeader />
      </div>
    </div>
  );
};

export default Sidebar;