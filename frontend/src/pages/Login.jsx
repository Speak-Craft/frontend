import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      console.log("✅ LOGIN RESPONSE:", res.data);  // <---- ADD THIS
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("❌ LOGIN ERROR:", err.response?.data || err.message);
      alert("❌ Login failed. Please check your credentials.");
    }
  };
  

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-[#003b46] to-[#07575b]">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-[480px]">
        <h2 className="text-4xl font-extrabold mb-6 text-center text-[#003b46]">
          Welcome Back
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Please login to continue
        </p>
        
        {/* Email Input */}
        <label className="block text-left text-gray-700 font-semibold mb-2">
          Email Address
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full mb-5 p-3 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0084a6]"
          onChange={(e) => setEmail(e.target.value)}
        />
  
        {/* Password Input */}
        <label className="block text-left text-gray-700 font-semibold mb-2">
          Password
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full mb-6 p-3 border text-gray-600 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0084a6]"
          onChange={(e) => setPassword(e.target.value)}
        />
  
        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-[#0084a6] text-white text-lg font-semibold py-3 rounded-lg hover:bg-[#00a8cc] transition duration-300"
        >
          Login
        </button>
  
        <p className="mt-6 text-gray-600 text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#0084a6] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );  
}
