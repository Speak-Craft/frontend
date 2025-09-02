import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#003b46] to-[#07575b] p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-[#0084a6]">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] placeholder:text-gray-800 text-gray-800"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] placeholder:text-gray-800 text-gray-800"
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="bg-[#0084a6] hover:bg-[#00a8cc] text-white font-semibold py-3 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0084a6] hover:text-[#00a8cc] font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
