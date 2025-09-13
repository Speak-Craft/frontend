import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import topicVideo from "../assets/video/topic-generation-video.mp4";

const TopicGenerator = () => {
  const [topicText, setTopicText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setError("");
    setResult(null);

    if (!topicText || topicText.trim().length < 3) {
      setError("Please enter a valid topic.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/presentation/generate",
        { topic: topicText, slideCount: 8 },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.parsed) {
        setResult(res.data.parsed);
      } else if (res.data.topic) {
        setResult({
          mainTopic: res.data.topic.mainTopic,
          slides: res.data.topic.suggestedSlides,
          folderStructure: res.data.topic.folderStructure,
        });
      } else if (res.data.rawText) {
        setResult({ rawText: res.data.rawText });
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("❌ generate error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to generate topics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-[4rem] left-64 w-[calc(100%-17rem)] p-4 lg:p-8 flex justify-center items-center">
      <div className="w-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white shadow-xl rounded-2xl p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Left: Input Panel */}
          <motion.div
            className="w-full lg:w-[420px] xl:w-[480px] shrink-0 self-start sticky top-6 max-h-[calc(100vh-8rem)] overflow-auto bg-gradient-to-b from-[#00171f] to-[#003b46] dark:from-[#003b46] dark:to-[#0084a6] rounded-2xl p-5 border-2 border-[#00ccff]/40"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold">✨ Presentation Topic Helper</h2>
              <p className="text-white/70 text-sm mt-1">Generate a clean outline, suggested slides, and a folder structure.</p>
            </div>

            {/* Landscape demo video */}
            <div className="mb-4">
              <div className="relative w-full rounded-xl overflow-hidden border-2 border-white/15 shadow-lg" style={{ aspectRatio: "16 / 9" }}>
                <video
                  src={topicVideo}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                placeholder="Enter your main topic (e.g., 'Introduction to Reinforcement Learning')"
                className="w-full p-3 rounded-md bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#00ccff] min-h-28"
                rows={4}
              />

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  disabled={loading}
                  onClick={generate}
                  className={`px-6 py-3 rounded-xl font-bold shadow-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-4 ${
                    loading
                      ? "opacity-60 cursor-not-allowed bg-gradient-to-r from-[#00e5ff] to-[#00b8e6] text-[#003b46] border-[#00d5ff] focus:ring-[#00ccff]/30"
                      : "bg-gradient-to-r from-[#00e5ff] to-[#00b8e6] text-[#003b46] border-[#00d5ff] hover:from-[#27efff] hover:to-[#14c3e3] focus:ring-[#00ccff]/40"
                  }`}
                >
                  {loading ? "Generating…" : "Generate Topics"}
                </button>
                <button
                  onClick={() => {
                    setTopicText("");
                    setResult(null);
                    setError("");
                  }}
                  className="px-6 py-3 rounded-xl font-bold shadow-lg border-2 transition-colors duration-200 bg-[#d0ebff] text-[#003b46] border-[#00ccff] hover:bg-[#bfe5ff] focus:outline-none focus:ring-4 focus:ring-[#00ccff]/30"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Tips card to match theme */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#00171f] via-[#003b46] to-[#07575b] border-2 border-[#00ccff]/30">
                <h4 className="text-[#00ccff] font-semibold mb-2">💡 Tips</h4>
                <ul className="list-disc ml-5 text-white/80 text-sm space-y-1">
                  <li>Be specific: “Neural networks for image classification.”</li>
                  <li>Include constraints: audience, time, or level (beginner/advanced).</li>
                  <li>Optionally add goals: outcomes, demos, or key references.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right: Results Panel */}
          <motion.div
            className="w-full flex-1 min-w-0 space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Placeholder / skeleton while loading or no result */}
            {!result && !loading && (
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#00171f] to-[#003b46] border-2 border-white/15 text-white/70">
                Start by entering a topic on the left and clicking "Generate Topics".
              </div>
            )}

            {loading && (
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#00171f] to-[#003b46] border-2 border-white/15">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-white/10 rounded w-2/3"></div>
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-4 bg-white/10 rounded w-4/6"></div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-6 border-2 border-[#00ccff]/40 text-white shadow-md">
                  <h3 className="text-xl font-semibold mb-2">
                    {result.mainTopic || "Generated Result"}
                  </h3>
                  {result.shortSummary && (
                    <p className="text-white/80 text-sm mb-2">{result.shortSummary}</p>
                  )}
                </div>

                {result.slides && Array.isArray(result.slides) && (
                  <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-5 border-2 border-white/15">
                    <h4 className="text-white font-semibold mb-3">📑 Suggested Slides</h4>
                    <ol className="list-decimal ml-6 space-y-3 text-white/90">
                      {result.slides.map((s, i) => (
                        <li key={i} className="bg-white/5 rounded-lg p-3">
                          <div className="font-semibold">{s.title}</div>
                          {s.bullets && (
                            <ul className="list-disc ml-6 mt-1 text-sm text-white/80 space-y-1">
                              {s.bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.folderStructure && (
                  <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-5 border-2 border-white/15">
                    <h4 className="text-white font-semibold">📁 Suggested Folder Structure</h4>
                    <pre className="bg-black/30 p-3 rounded mt-2 text-sm text-white/80 overflow-x-auto">
{`${JSON.stringify(result.folderStructure, null, 2)}`}
                    </pre>
                  </div>
                )}

                {result.rawText && (
                  <div className="bg-gradient-to-b from-[#00171f] to-[#003b46] rounded-2xl p-5 border-2 border-white/15">
                    <h4 className="text-white font-semibold">📝 Raw Response</h4>
                    <pre className="bg-black/30 p-3 rounded mt-2 text-sm text-white/80 whitespace-pre-wrap">
{`${result.rawText}`}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TopicGenerator;


