import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo.png";
import titleIcon from "../assets/images/titleIcon.png";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", formData);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-[#003b46] to-[#07575b] dark:from-[#00171f] dark:to-[#003b46] text-white flex overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-[#00d4aa]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-32 h-32 bg-[#00b894]/30 rounded-full blur-lg animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-[#00d4aa]/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 212, 170, 0.3) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Left Side - Enhanced Branding & Visual */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#003b46]/95 via-[#07575b]/90 to-[#00171f]/95"></div>
        
        {/* Content Container with Animations - Much Wider */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-20 w-full">
          {/* Animated Logo Container - Much Larger */}
          <div className={`mb-1 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative group">
              {/* Glowing Background */}
              <div className="absolute inset-0 bg-[#00d4aa]/20 rounded-full blur-3xl group-hover:bg-[#00d4aa]/30 transition-all duration-500"></div>
              
              {/* Logo with Hover Effect - Much Larger */}
              <img
                src={logo}
                alt="SpeakCraft Logo"
                className="w-120 h-40 mb-1 relative z-10 transform group-hover:scale-110 transition-all duration-500 drop-shadow-2xl"
              />
            </div>
           
          </div>
          
          {/* Animated Tagline - Wider and Better Spaced */}
          <div className={`max-w-2xl mb-10 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-5xl font-bold mb-8 text-white leading-tight">
              Master Your 
              <span className="block text-[#00d4aa] bg-gradient-to-r from-[#00d4aa] to-[#00b894] bg-clip-text text-transparent">
                Presentation Skills
              </span>
            </h2>
            <p className="text-2xl text-gray-200 leading-relaxed">
              AI-powered training to transform your public speaking abilities and boost your confidence on stage.
            </p>
          </div>
          
          {/* Animated Features with Icons - Horizontal Row Layout */}
          <div className={`grid grid-cols-3 gap-8 text-center max-w-4xl mb-16 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Feature 1 */}
            <div className="flex flex-col items-center space-y-4 group hover:bg-white/5 p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-white text-xl mb-3">AI-Powered Analysis</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Advanced speech recognition and real-time feedback</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center space-y-4 group hover:bg-white/5 p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-white text-xl mb-3">Real-Time Coaching</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Instant feedback and personalized improvement tips</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center space-y-4 group hover:bg-white/5 p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-white text-xl mb-3">Personalized Training</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Custom training plans tailored to your skill level</p>
              </div>
            </div>
          </div>

          {/* Animated Stats - Wider Layout */}
          <div className={`grid grid-cols-3 gap-12 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center group">
              <div className="text-4xl font-bold text-[#00d4aa] mb-3 group-hover:scale-110 transition-transform duration-300">10K+</div>
              <div className="text-gray-300 text-base">Students Trained</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-[#00d4aa] mb-3 group-hover:scale-110 transition-transform duration-300">95%</div>
              <div className="text-gray-300 text-base">Success Rate</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-[#00d4aa] mb-3 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-gray-300 text-base">AI Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form - Adjusted Width */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src={titleIcon}
              alt="SpeakCraft Icon"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold">
              <span className="text-white">SPEAK</span>
              <span className="text-[#00d4aa]">CRAFT</span>
            </h1>
          </div>

          {/* Enhanced Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl hover:shadow-[#00d4aa]/20 transition-all duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-300">Sign in to continue your presentation journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-white mb-2 group-focus-within:text-[#00d4aa] transition-colors duration-300">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-white mb-2 group-focus-within:text-[#00d4aa] transition-colors duration-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#00d4aa] bg-white/10 border-white/20 rounded focus:ring-[#00d4aa] focus:ring-2 transition-all duration-300"
                  />
                  <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm text-[#00d4aa] hover:text-[#00b894] transition-colors hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-white font-bold py-3 px-4 rounded-lg hover:from-[#00b894] hover:to-[#00a085] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#00d4aa]/25"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-300">
                Don't have an account?{" "}
                <a href="#" className="text-[#00d4aa] hover:text-[#00b894] font-semibold transition-colors hover:underline">
                  Sign up
                </a>
              </p>
            </div>

            {/* Enhanced Social Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-white/20 rounded-lg shadow-sm bg-gray-50 dark:bg-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 hover:border-[#00d4aa]/50 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] transition-all duration-300 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-white/20 rounded-lg shadow-sm bg-gray-50 dark:bg-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 hover:border-[#00d4aa]/50 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] transition-all duration-300 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                  <span className="ml-2">Twitter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
