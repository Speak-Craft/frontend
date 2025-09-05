import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { getCurrentUser, logout } from "../utils/auth";

const MenuHeader = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
  
    return (
      <header className="fixed top-5 left-64 w-[calc(100%-17rem)] sm:left-72 sm:w-[calc(100%-19rem)]  md:w-[calc(100%-21rem)]  bg-gradient-to-r from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] shadow-lg text-white px-6 py-3 flex items-center justify-between backdrop-blur-lg rounded-[10px] z-50">
        <div></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-[#00d4aa] to-[#00b894] flex items-center justify-center">
            <FaUser className="text-white text-lg" />
          </div>
          <span className="text-lg font-medium">{user?.name || 'User'}</span>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/70 transition-all duration-300 group"
            title="Logout"
          >
            <FaSignOutAlt className="text-red-300 group-hover:text-red-200 text-sm" />
          </button>
        </div>
      </header>
    );
  };
  
  export default MenuHeader;