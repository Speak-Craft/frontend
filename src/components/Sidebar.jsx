import React from "react";
import { FaCamera, FaClock, FaMicrophone, FaChartLine, FaFileAlt  } from "react-icons/fa";
import { BiSolidVideoRecording } from "react-icons/bi";
import { MdDashboardCustomize } from "react-icons/md";

const Sidebar = () => {
  return (
    <aside className="h-screen w-64 bg-purple-950 text-white shadow-lg">
      <div className="p-6 text-center text-2xl font-bold border-b border-gray-700">
        SpeaKraft
      </div>
      <ul className="mt-4 flex flex-col gap-4 p-4 py-8">
      <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700">
          <MdDashboardCustomize className="text-xl" />
          <span>Dashboard</span>
        </li>
        <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 mt-4">
          <FaCamera className="text-xl" />
          <span>Face Detection</span>
        </li>
        <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 mt-4">
          <FaClock className="text-xl" />
          <span>Pace Management</span>
        </li>
        <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 mt-4">
          <FaMicrophone className="text-xl" />
          <span>Filler Words</span>
        </li>
        <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 mt-4">
          <FaChartLine className="text-xl" />
          <span>Pitch and Tone</span>
        </li>
        <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 mt-4">
          <BiSolidVideoRecording className="text-xl" />
          <span>Recordings</span>
        </li>
        <li className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 mt-4">
          <FaFileAlt className="text-xl" />
          <span>Report</span>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
