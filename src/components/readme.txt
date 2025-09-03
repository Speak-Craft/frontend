FillerWordsimport { useState, useEffect } from "react";
import axios from "axios";
import { AudioRecorder } from "react-audio-voice-recorder";

export default function FillerWords() {
  const [activeTab, setActiveTab] = useState("record"); // record | saved
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [recordedAt, setRecordedAt] = useState(null);
  const [savedRecs, setSavedRecs] = useState([]);

  useEffect(() => {
    fetchSavedRecordings();
  }, []);

  const fetchSavedRecordings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/rec/save", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedRecs(res.data);
    } catch (err) {
      console.error("Failed to fetch saved recordings", err);
    }
  };

  const handleRecording = async (blob) => {
    setResult(null);
    setAudioDuration(null);
    setRecordedAt(new Date());

    const wavFile = new File([blob], "presentation.wav", { type: "audio/wav" });
    setAudioBlob(wavFile);
    setAudioURL(URL.createObjectURL(blob));

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();

    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      setAudioDuration(audioBuffer.duration);
    });
  };

  const uploadAudio = async () => {
    if (!audioBlob) return alert("No audio recorded");

    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.post("http://localhost:5000/api/recording/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(res.data);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Something went wrong during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecording = async () => {
    if (!result || !audioDuration) return alert("No analysis to save");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/rec/save",
        {
          fillerCount: result.fillerCount,
          duration: audioDuration,
          date: recordedAt,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Recording saved successfully!");
      fetchSavedRecordings();
    } catch (err) {
      console.error("Error saving recording", err);
      alert("Failed to save recording.");
    }
  };

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-GB", {
      hour12: true,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="ml-132 p-8">
      <div className="bg-white shadow-xl rounded-2xl p-6 max-w-4xl">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("record")}
            className={`px-6 py-2 font-semibold transition ${
              activeTab === "record"
                ? "border-b-4 border-[#0084a6] text-white"
                : "text-white hover:text-[#0084a6]"
            }`}
          >
            🎤 Record & Analyze
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`ml-4 px-6 py-2 font-semibold transition ${
              activeTab === "saved"
                ? "border-b-4 border-[#0084a6] text-white"
                : "text-white hover:text-[#0084a6]"
            }`}
          >
            📜 Saved Recordings
          </button>
        </div>

        {/* Record & Analyze Tab */}
        {activeTab === "record" && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-[#003b46]">
              🎤 Record Your Presentation
            </h2>

            <AudioRecorder
              onRecordingComplete={handleRecording}
              audioTrackConstraints={{ noiseSuppression: true, echoCancellation: true }}
              downloadOnSavePress={false}
              downloadFileExtension="wav"
            />

            <button
              onClick={uploadAudio}
              disabled={!audioBlob || isLoading}
              className="mt-4 w-full bg-[#0084a6] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#00a8cc] transition disabled:opacity-50"
            >
              {isLoading ? "⏳ Analyzing..." : "⬆ Upload & Analyze"}
            </button>

            {result && !isLoading && (
              <div className="mt-6 bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200 text-gray-700">
                <h3 className="font-bold text-lg mb-2">✅ Analysis Result</h3>
                <p>
                  🗣️ Filler Count: <strong>{result.fillerCount}</strong>
                </p>
                {audioDuration && (
                  <p>
                    ⏱️ Duration: <strong>{audioDuration.toFixed(2)} seconds</strong>
                  </p>
                )}
                {recordedAt && (
                  <p>
                    📅 Date & Time: <strong>{formatDateTime(recordedAt)}</strong>
                  </p>
                )}

                {audioURL && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">
                      🔊 Playback
                    </h4>
                    <audio controls className="w-full">
                      <source src={audioURL} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                <button
                  onClick={saveRecording}
                  className="mt-4 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition"
                >
                  💾 Save Analyze
                </button>
              </div>
            )}
          </div>
        )}

        {/* Saved Recordings Tab */}
        {activeTab === "saved" && (
          <div>
            <h3 className="text-lg font-bold text-[#003b46] mb-4">
              📜 Saved Recordings
            </h3>
            {savedRecs.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Filler Count</th>
                      <th className="px-4 py-2 border">Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedRecs.map((rec) => (
                      <tr key={rec._id} className="text-gray-800 hover:bg-gray-50">
                        <td className="border px-4 py-2">{formatDateTime(rec.date)}</td>
                        <td className="border px-4 py-2">{rec.fillerCount}</td>
                        <td className="border px-4 py-2">{rec.duration.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No saved recordings yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
