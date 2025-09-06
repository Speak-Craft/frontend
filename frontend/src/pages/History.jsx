import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function History() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/recording/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formatted = res.data.map((item) => ({
        date: new Date(item.createdAt).toLocaleDateString(),
        fillers: item.fillerCount,
      }));
      setData(formatted);
    }
    fetchHistory();
  }, []);

  return (
    <div className="ml-72 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-[700px]">
        <h2 className="text-2xl font-bold mb-4 text-[#003b46]">📈 Your Progress</h2>
        <LineChart width={650} height={300} data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <Tooltip />
          <Line type="monotone" dataKey="fillers" stroke="#0084a6" strokeWidth={3} />
        </LineChart>
      </div>
    </div>
  );
}
