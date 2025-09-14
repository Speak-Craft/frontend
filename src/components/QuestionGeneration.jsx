import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import demoVideo from "../assets/video/question-generator-video.mp4";

const QuestionGeneration = () => {
  const [file, setFile] = useState(null);
  const [audience, setAudience] = useState("general");
  const [numQuestions, setNumQuestions] = useState(10);
  const [session, setSession] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const clearCurrent = () => {
    setSession(null);
    setFile(null);
    setError("");
  };

  const uploadAndGenerate = async () => {
    setError("");
    if (!file) {
      setError("File is required.");
      return;
    }

    const formData = new FormData();
    formData.append("presentation", file);
    formData.append("audience", audience);
    formData.append("numQuestions", String(numQuestions));

    setLoadingUpload(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/questions/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSession(res.data.session || res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to generate questions");
    } finally {
      setLoadingUpload(false);
    }
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
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <motion.div
            className="w-full lg:w-[420px] xl:w-[480px] shrink-0 self-start sticky top-6 max-h-[calc(100vh-8rem)] overflow-auto bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-5 border-2 border-[#00ccff]/40"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold">🙋 Audience Question Generation</h2>
              <p className="text-white/70 text-sm mt-1">Upload your slides and get audience-style questions to anticipate during Q&A.</p>
            </div>

            <div className="mb-4">
              <div className="relative w-full rounded-xl overflow-hidden border-2 border-white/15 shadow-lg" style={{ aspectRatio: "16 / 9" }}>
                <video
                  src={demoVideo}
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

              <div className="flex items-start gap-3">
                <div className="w-2/3">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#00ccff] border border-white/20"
                    placeholder="e.g., executives, students, developers"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Number of Questions</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value || "0"))}
                    className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#00ccff] border border-white/20"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  disabled={loadingUpload}
                  onClick={uploadAndGenerate}
                  className={`px-6 py-3 rounded-xl font-bold shadow-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-4 ${
                    loadingUpload
                      ? "opacity-60 cursor-not-allowed bg-gradient-to-r from-[#00e5ff] to-[#00b8e6] text-[#003b46] border-[#00d5ff] focus:ring-[#00ccff]/30"
                      : "bg-gradient-to-r from-[#00e5ff] to-[#00b8e6] text-[#003b46] border-[#00d5ff] hover:from-[#27efff] hover:to-[#14c3e3] focus:ring-[#00ccff]/40"
                  }`}
                >
                  {loadingUpload ? "Uploading…" : "Upload & Generate"}
                </button>

                <button
                  onClick={clearCurrent}
                  className="px-6 py-3 rounded-xl font-bold shadow-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-4 bg-[#ff6b6b] hover:bg-[#ff5252] text-[#003b46] border-[#ff8787] focus:ring-red-300"
                  title="Clear current session"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] border-2 border-[#00ccff]/30">
                <h4 className="text-[#00ccff] font-semibold mb-2">💡 Tips</h4>
                <ul className="list-disc ml-5 text-white/80 text-sm space-y-1">
                  <li>Use clear section titles in your slides for targeted questions.</li>
                  <li>Set the audience so questions match their background.</li>
                  <li>Supported formats: PDF, PPT, PPTX.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="w-full flex-1 min-w-0 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 border-2 border-[#00ccff]/40 text-white shadow-md">
                <h3 className="text-xl font-semibold mb-2">Current Session</h3>
                {!session && !loadingUpload && (
                  <p className="text-white/70 text-sm">Upload a presentation to generate audience questions.</p>
                )}
                {loadingUpload && renderSkeleton()}
                {session && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="text-white/90 text-sm">
                        <span className="font-semibold">File:</span> {session.fileName || session.name || "Presentation"}
                      </div>
                      <div className="text-white/90 text-sm">
                        <span className="font-semibold">Slides:</span> {session.totalSlides ?? (session.slidesPreview?.length || "—")}
                      </div>
                    </div>

                    {Array.isArray(session.questions) && session.questions.length > 0 ? (
                      <ul className="space-y-3">
                        {session.questions.map((q, idx) => (
                          <li key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-white/95">
                                <div className="font-semibold">{q.question}</div>
                                <div className="text-white/70 text-xs mt-1">{q.type} • {q.difficulty}{typeof q.slideIndex === "number" ? ` • Slide ${q.slideIndex + 1}` : ""}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/70 text-sm">No questions generated yet.</p>
                    )}
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

export default QuestionGeneration;

