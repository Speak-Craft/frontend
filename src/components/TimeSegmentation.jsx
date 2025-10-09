import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import timeSegVideo from "../assets/video/time-segmentation-video.mp4";

const TimeSegmentation = () => {
  const [file, setFile] = useState(null);
  const [totalTime, setTotalTime] = useState("");
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const uploadPresentation = async () => {
    setError("");
    if (!file || !totalTime) {
      setError("File & total time are required.");
      return;
    }

    const formData = new FormData();
    formData.append("presentation", file);
    formData.append("totalTime", totalTime);

    setLoadingUpload(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/presentation/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSession(res.data.session || res.data);
      await fetchSessions();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create session");
    } finally {
      setLoadingUpload(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:3001/api/presentation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.sessions || res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMsToMinSec = (secondsTotal) => {
    if (!secondsTotal && secondsTotal !== 0) return "-";
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = Math.floor(secondsTotal % 60);
    return `${minutes}m ${seconds}s`;
  };

  const renderSkeleton = () => (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-[#00171f] to-[#003b46] border-2 border-white/15">
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-white/10 rounded w-2/3"></div>
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
        <div className="h-4 bg-white/10 rounded w-4/6"></div>
      </div>
    </div>
  );

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] h-[calc(100vh-5rem)] p-4 lg:p-8 flex justify-center items-center overflow-hidden">
      <div className="w-full h-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 w-full h-full overflow-hidden">
          {/* Left: Controls */}
          <motion.div
            className="w-full lg:w-[420px] xl:w-[480px] shrink-0 self-start sticky top-6 max-h-[calc(100vh-8rem)] overflow-auto bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-5 border-2 border-[#00ccff]/40"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold">📑 Presentation Time Segmentation</h2>
              <p className="text-white/70 text-sm mt-1">Upload your slides and get an AI-assisted time allocation per topic.</p>
            </div>

            {/* Landscape demo video */}
            <div className="mb-4">
              <div className="relative w-full rounded-xl overflow-hidden border-2 border-white/15 shadow-lg" style={{ aspectRatio: "16 / 9" }}>
                <video
                  src={timeSegVideo}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* File input */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Upload Presentation (.pdf or .pptx)</label>
                <label className="flex items-center justify-between gap-3 w-full bg-white/10 hover:bg-white/15 border-2 border-white/20 rounded-xl px-4 py-3 cursor-pointer">
                  <span className="truncate text-white/80 text-sm">
                    {file ? file.name : "Choose a file"}
                  </span>
                  <span className="px-3 py-2 text-xs font-bold rounded-lg bg-[#d0ebff] text-[#003b46] border border-[#00ccff]">Browse</span>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Total time input */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Total Time (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#00ccff] border border-white/20"
                  placeholder="e.g., 10"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  disabled={loadingUpload}
                  onClick={uploadPresentation}
                  className={`px-6 py-3 rounded-xl font-bold shadow-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-4 ${
                    loadingUpload
                      ? "opacity-60 cursor-not-allowed bg-gradient-to-r from-[#00e5ff] to-[#00b8e6] text-[#003b46] border-[#00d5ff] focus:ring-[#00ccff]/30"
                      : "bg-gradient-to-r from-[#00e5ff] to-[#00b8e6] text-[#003b46] border-[#00d5ff] hover:from-[#27efff] hover:to-[#14c3e3] focus:ring-[#00ccff]/40"
                  }`}
                >
                  {loadingUpload ? "Uploading…" : "Upload & Create"}
                </button>

                <button
                  disabled={loadingSessions}
                  onClick={fetchSessions}
                  className={`px-6 py-3 rounded-xl font-bold shadow-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-4 ${
                    loadingSessions
                      ? "opacity-60 cursor-not-allowed bg-[#d0ebff] text-[#003b46] border-[#00ccff] focus:ring-[#00ccff]/30"
                      : "bg-[#d0ebff] text-[#003b46] border-[#00ccff] hover:bg-[#bfe5ff] focus:ring-[#00ccff]/30"
                  }`}
                >
                  {loadingSessions ? "Refreshing…" : "Refresh Sessions"}
                </button>
              </div>

              {error && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Tips */}
              <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] border-2 border-[#00ccff]/30">
                <h4 className="text-[#00ccff] font-semibold mb-2">💡 Tips</h4>
                <ul className="list-disc ml-5 text-white/80 text-sm space-y-1">
                  <li>Use clear section titles in your slides for best segmentation.</li>
                  <li>Provide realistic total time to get balanced allocations.</li>
                  <li>Supported formats: PDF, PPT, PPTX.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right: Results */}
          <motion.div
            className="w-full flex-1 min-w-0 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Current Session */}
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 border-2 border-[#00ccff]/40 text-white shadow-md">
                <h3 className="text-xl font-semibold mb-2">Current Session</h3>
                {!session && !loadingUpload && (
                  <p className="text-white/70 text-sm">Upload a presentation to generate a time breakdown.</p>
                )}
                {loadingUpload && renderSkeleton()}
                {session && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="text-white/90 text-sm">
                        <span className="font-semibold">File:</span> {session.fileName || session.name || "Presentation"}
                      </div>
                      <div className="text-white/90 text-sm">
                        <span className="font-semibold">Total:</span> {session.totalTime ? `${session.totalTime} min` : "—"}
                      </div>
                    </div>

                    {Array.isArray(session.topics) && session.topics.length > 0 ? (
                      <ul className="space-y-3">
                        {session.topics.map((topic, idx) => (
                          <li key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold text-white/95 truncate">{topic.title || `Topic ${idx + 1}`}</div>
                              <div className="text-white/80 text-sm whitespace-nowrap">{formatMsToMinSec(topic.allocatedTime)}</div>
                            </div>
                            {topic.summary && (
                              <div className="text-white/70 text-xs mt-1">{topic.summary}</div>
                            )}
                            {typeof topic.percentage === "number" && (
                              <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-[#00ccff] to-[#00a3cc]"
                                  style={{ width: `${Math.max(0, Math.min(100, topic.percentage))}%` }}
                                ></div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/70 text-sm">No topics detected yet.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Sessions */}
              <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 border-2 border-white/15 text-white shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">Saved Sessions</h3>
                  {loadingSessions && <span className="text-white/60 text-sm">Loading…</span>}
                </div>
                {loadingSessions && renderSkeleton()}
                {!loadingSessions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {(sessions || []).map((s) => (
                      <div key={s._id || s.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="font-semibold text-white/95 truncate mb-1">{s.fileName || s.name || "Presentation"}</div>
                        <div className="text-white/80 text-xs mb-2">
                          {s.totalTime ? `${s.totalTime} min` : "—"} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
                        </div>
                        {Array.isArray(s.topics) && s.topics.length > 0 && (
                          <div className="text-white/70 text-xs line-clamp-2">
                            {s.topics.slice(0, 3).map((t) => t.title).filter(Boolean).join(" • ")}
                            {s.topics.length > 3 ? " • …" : ""}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TimeSegmentation;


