import React from "react";

const HistoryCard = ({ title, date }) => {
  return (
    <div className="bg-[#07575b] text-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm">{date}</p>
    </div>
  );
};

export default HistoryCard;
