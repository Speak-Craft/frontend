import React from "react";

const PaceManagement = () => {
  return (
    <div
      className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-3rem)] p-8 flex justify-center items-center"
      
    >
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] text-white shadow-xl rounded-2xl p-6 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold text-center mb-4">Pace Management</h2>
        <p className="text-gray-200 text-center">
          Manage your speech pace effectively to enhance communication.
        </p>
      </div>
    </div>
  );
};

export default PaceManagement;
