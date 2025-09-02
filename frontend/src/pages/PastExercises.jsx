import React, { useEffect, useState } from "react";

const PastExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/exercises/my-exercises", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch exercises");
        }
        const data = await res.json();
        setExercises(data.exercises);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  if (loading) return <p>Loading exercises...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (exercises.length === 0) return <p>No exercises found.</p>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-xl mt-6 text-black">
      <h2 className="text-2xl font-bold mb-4">Your Past Exercises</h2>
      {exercises.map((ex) => (
        <div key={ex._id} className="mb-6 p-4 border border-gray-300 rounded">
          <p>
            <strong>Date:</strong> {new Date(ex.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Duration:</strong> {ex.duration} seconds
          </p>
          <p>
            <strong>Average Volume (RMS):</strong> {ex.rms}
          </p>
          <p>
            <strong>Steadiness:</strong> {ex.steadiness}
          </p>
          <audio controls src={ex.audioURL} className="mt-2 w-full" />
        </div>
      ))}
    </div>
  );
};

export default PastExercises;
