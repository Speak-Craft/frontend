import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";
import titleIcon from "../assets/images/titleIcon.png";
import { register, fetchRoles } from "../utils/auth";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const rolesData = await fetchRoles();
      setRoles(rolesData);
      // Set default role to the first available role
      if (rolesData.length > 0) {
        setFormData(prev => ({ ...prev, role: rolesData[0].name }));
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
      setError("Failed to load available roles. Please refresh the page.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (!formData.role) {
      setError("Please select a role");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await register(formData.name, formData.email, formData.password, formData.role);
      
      setSuccess("Registration successful! Redirecting to dashboard...");
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setError("Google registration not implemented yet");
  };

  const handleTwitterRegister = () => {
    setError("Twitter registration not implemented yet");
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
              Start Your 
              <span className="block text-[#00d4aa] bg-gradient-to-r from-[#00d4aa] to-[#00b894] bg-clip-text text-transparent">
                Speaking Journey
              </span>
            </h2>
            <p className="text-2xl text-gray-200 leading-relaxed">
              Join thousands of professionals who have transformed their presentation skills with AI-powered training.
            </p>
          </div>
          
          {/* Animated Features with Icons - Horizontal Row Layout */}
          <div className={`grid grid-cols-3 gap-8 text-center max-w-4xl mb-16 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Feature 1 */}
            <div className="flex flex-col items-center space-y-4 group hover:bg-white/5 p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-white text-xl mb-3">Personalized Profile</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Create your unique speaking profile and track progress</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center space-y-4 group hover:bg-white/5 p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-white text-xl mb-3">Instant Access</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Start improving your skills immediately after registration</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center space-y-4 group hover:bg-white/5 p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-white text-xl mb-3">Community Access</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Join our community of confident speakers</p>
              </div>
            </div>
          </div>

          {/* Animated Stats - Wider Layout */}
          <div className={`grid grid-cols-3 gap-12 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="text-center group">
              <div className="text-4xl font-bold text-[#00d4aa] mb-3 group-hover:scale-110 transition-transform duration-300">15K+</div>
              <div className="text-gray-300 text-base">Active Users</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-[#00d4aa] mb-3 group-hover:scale-110 transition-transform duration-300">98%</div>
              <div className="text-gray-300 text-base">Satisfaction Rate</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-[#00d4aa] mb-3 group-hover:scale-110 transition-transform duration-300">Free</div>
              <div className="text-gray-300 text-base">To Get Started</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form - Adjusted Width */}
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

          {/* Enhanced Registration Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl hover:shadow-[#00d4aa]/20 transition-all duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-gray-300">Join SpeakCraft and start your speaking journey</p>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-white mb-2 group-focus-within:text-[#00d4aa] transition-colors duration-300">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

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
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-white mb-2 group-focus-within:text-[#00d4aa] transition-colors duration-300">
                  Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={isLoading || loadingRoles}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    {loadingRoles ? (
                      <option value="">Loading roles...</option>
                    ) : (
                      roles.map((role) => (
                        <option key={role._id} value={role.name} className="bg-gray-800 text-white">
                          {role.displayName}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {roles.length > 0 && formData.role && (
                  <p className="text-xs text-gray-300 mt-1">
                    {roles.find(r => r.name === formData.role)?.description}
                  </p>
                )}
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
                    placeholder="Create a password"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-white mb-2 group-focus-within:text-[#00d4aa] transition-colors duration-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] focus:border-transparent transition-all duration-300 group-hover:border-[#00d4aa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00d4aa]/0 to-[#00d4aa]/0 group-focus-within:from-[#00d4aa]/10 group-focus-within:to-[#00d4aa]/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 text-[#00d4aa] bg-white/10 border-white/20 rounded focus:ring-[#00d4aa] focus:ring-2 transition-all duration-300"
                  />
                  <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                    I agree to the{" "}
                    <a href="#" className="text-[#00d4aa] hover:text-[#00b894] transition-colors hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#00d4aa] hover:text-[#00b894] transition-colors hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00d4aa] to-[#00b894] text-white font-bold py-3 px-4 rounded-lg hover:from-[#00b894] hover:to-[#00a085] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#00d4aa]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-300">
                Already have an account?{" "}
                <Link to="/login" className="text-[#00d4aa] hover:text-[#00b894] font-semibold transition-colors hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Enhanced Social Registration */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-300">Or register with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-white/20 rounded-lg shadow-sm bg-gray-50 dark:bg-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 hover:border-[#00d4aa]/50 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button 
                  type="button"
                  onClick={handleTwitterRegister}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-white/20 rounded-lg shadow-sm bg-gray-50 dark:bg-white/10 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 hover:border-[#00d4aa]/50 focus:outline-none focus:ring-2 focus:ring-[#00d4aa] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
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

export default Register;
