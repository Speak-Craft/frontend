import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", { name, email, password });
      alert("✅ Registered successfully! Please login.");
      navigate("/");
    } catch (err) {
      alert("❌ Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-[#003b46] to-[#07575b]">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-[480px]">
        {/* 📝 Title */}
        <h2 className="text-4xl font-extrabold mb-6 text-center text-[#003b46]">
          Create Account
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Fill in the details to register
        </p>

        {/* 👤 Name Input */}
        <label className="block text-left text-gray-700 font-semibold mb-2">
          Full Name
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          className="w-full mb-5 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0084a6]"
          onChange={(e) => setName(e.target.value)}
        />

        {/* 📧 Email Input */}
        <label className="block text-left text-gray-700 font-semibold mb-2">
          Email Address
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full mb-5 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0084a6]"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* 🔑 Password Input */}
        <label className="block text-left text-gray-700 font-semibold mb-2">
          Password
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full mb-6 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0084a6]"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ✅ Register Button */}
        <button
          onClick={handleRegister}
          className="w-full bg-[#0084a6] text-white text-lg font-semibold py-3 rounded-lg hover:bg-[#00a8cc] transition duration-300"
        >
          Register
        </button>

        {/* 🔗 Login Link */}
        <p className="mt-6 text-gray-600 text-center">
          Already have an account?{" "}
          <Link to="/" className="text-[#0084a6] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
