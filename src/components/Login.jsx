import React from "react";

const Login = () => {
  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white flex">
      {/* Left Side Image */}
      <div className="w-1/2 hidden md:block">
        <img
          src="https://via.placeholder.com/600x800"
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side Form */}
      <div className="w-full md:w-1/2 shadow-xl rounded-none md:rounded-l-2xl p-6 flex flex-col justify-center items-center">
        <div className="w-full bg-white max-w-sm">
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                required
                className="w-full p-2 rounded bg-white text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                required
                className="w-full p-2 rounded bg-white text-black"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-[#003b46] font-semibold py-2 rounded hover:bg-gray-200 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
