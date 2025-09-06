// src/pages/ProgressDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts";

export default function ProgressDashboard() {
    const [history, setHistory] = useState([]);
    const [badges, setBadges] = useState([]);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/challenge/progress", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHistory(res.data.history || []);
            setBadges(res.data.badges || []);
        } catch (err) {
            console.error("Failed to fetch progress", err);
        }
    };

    // Prepare chart data
    const chartData = history.map((h, index) => ({
        id: index,
        date: new Date(h.date).toLocaleDateString(),
        fillerCount: h.fillerCount,
        goal: h.goal,
    }));

    return (
        <div className="ml-90 p-6">
            <h2 className="text-xl font-bold mb-4 ml-55">📈 Filler Words Progress</h2>

            <LineChart
                width={700}
                height={350}
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                    formatter={(value, name) => {
                        if (name === "fillerCount") return [value, "Actual"];
                        if (name === "goal") return [value, "Challenge Goal"];
                        return [value, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />

                {/* Actual filler count line */}
                <Line
                    type="monotone"
                    dataKey="fillerCount"
                    name="Number of Fillers in Each Session"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                />
            </LineChart>

            <h3 className="mt-6 text-lg font-semibold ml-80">🏅 Badges</h3>
            {badges.length > 0 ? (
                <ul className="flex gap-6 mt-4 flex-wrap">
                    {badges.map((b) => (
                        <li
                            key={b.name}
                            className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg border-4 border-yellow-600 text-center transform transition duration-300 hover:scale-110"
                        >
                            <span className="text-3xl mb-1">🥇</span>
                            <span className="text-sm font-bold">{b.name}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2">No badges unlocked yet.</p>
            )}

        </div>
    );
}
