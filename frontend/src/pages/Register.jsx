import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#003b46] to-[#07575b] p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-8 mx-auto">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-[#0084a6]">Create an Account</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] placeholder:text-gray-800 text-gray-800"
            onChange={handleChange}
            required
          />

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
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0084a6] hover:text-[#00a8cc] font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
