"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const q = query(collection(db, "details"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        router.push(
          `/dashboard?email=${encodeURIComponent(
            userData.email
          )}&name=${encodeURIComponent(
            userData.name
          )}&place=${encodeURIComponent(
            userData.place
          )}&rollno=${encodeURIComponent(
            userData.rollno
          )}&batch=${encodeURIComponent(userData.batch)}`
        );
      } else {
        setError("User details not found in Firestore.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Water Drop Background Component
  const WaterDropBackground = () => (
    <div className="absolute inset-0 overflow-hidden">
      {/* Large Purple Drops */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-purple-300 rounded-full opacity-40 blur-xl"></div>
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-400 rounded-full opacity-40 blur-xl"></div>
      <div className="absolute top-1/4 right-10 w-40 h-40 bg-purple-300 rounded-full opacity-30 blur-lg"></div>
      <div className="absolute bottom-1/3 left-5 w-32 h-32 bg-purple-400 rounded-full opacity-30 blur-lg"></div>
      
      {/* Medium Drops */}
      <div className="absolute top-10 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-50 blur-md"></div>
      <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-purple-300 rounded-full opacity-40 blur-md"></div>
      
      {/* Small Drops */}
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-purple-200 rounded-full opacity-60 blur-sm"></div>
      <div className="absolute top-3/4 right-20 w-12 h-12 bg-purple-300 rounded-full opacity-50 blur-sm"></div>
    </div>
  );

  // Welcome Screen
  if (!showLogin) {
    return (
      <div className="min-h-screen bg-white relative flex items-center justify-center px-6">
        <WaterDropBackground />
        
        <div className="relative z-10 text-center max-w-sm">
          {/* App Icon/Logo - Same size as your 512x512 icon */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto flex items-center justify-center bg-white rounded-3xl shadow-lg border-4 border-purple-100">
              <Image 
                src="/icon-512x512.png" 
                alt="Noor Academy Logo"
                width={512}
                height={512}
                className="w-28 h-28 object-contain rounded-2xl"
                priority
              />
            </div>
          </div>
          
          {/* Welcome Text */}
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to
          </h1>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-6">
            Noor Academy
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Your gateway to seamless learning and academic excellence
          </p>
          
          {/* Arrow Button */}
          <button
            onClick={() => setShowLogin(true)}
            className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 mx-auto"
          >
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 8l4 4m0 0l-4 4m4-4H3" 
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center px-6">
      <WaterDropBackground />
      
      <div className="relative z-10 w-full max-w-sm">
        {/* Back Button */}
        <button
          onClick={() => setShowLogin(false)}
          className="absolute -top-16 left-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
          {/* Logo with same icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-white rounded-2xl shadow-md border-2 border-purple-100">
              <Image 
                src="/icon-512x512.png" 
                alt="Noor Academy Logo"
                width={512}
                height={512}
                className="w-16 h-16 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Noor Academy ERP</h1>
            <p className="text-gray-600 text-sm mt-2">Student Portal Login</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}