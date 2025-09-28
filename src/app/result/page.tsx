"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, DocumentData, Timestamp, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../navbar/page";
import { useNotificationContext } from "../contexts/NotificationContext";
import { useAuth } from "../AuthContext";

interface Result {
  id: string;
  date: Timestamp;
  maxmark: string;
  obtainedmark: string;
  rollno: string;
  status: string;
  subject: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { markAsRead } = useNotificationContext();
  const { user } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user details to get roll number
        const userQuery = query(
          collection(db, "details"),
          where("email", "==", user.email)
        );
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          setError("Student data not found");
          return;
        }

        const userData = userSnap.docs[0].data();
        setUserData(userData);

        // Fetch all results first, then filter client-side to avoid index requirement
        const resultsQuery = query(
          collection(db, "result"),
          orderBy("date", "desc")
        );
        const resultsSnap = await getDocs(resultsQuery);
        
        // Filter results by rollno on client side
        const resultsData = resultsSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Result))
          .filter(result => result.rollno === userData.rollno);

        setResults(resultsData);
        console.log("Results loaded:", resultsData.length);

        // Mark results as read when page is opened
        await markAsRead('results');

      } catch (err) {
        console.error("Results error:", err);
        
        // Handle index creation error specifically
        const firestoreError = err as { code?: string };
        if (firestoreError.code === 'failed-precondition') {
          setError("Database index is being created. Please try again in a moment.");
        } else if (firestoreError.code === 'unauthenticated') {
          setError("Please log in again.");
        } else {
          setError("Failed to load results. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user, router, markAsRead]);


  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return "Date not available";
    
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return "";
    
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(timestamp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-red-600">{error}</p>
            <div className="mt-4 space-y-2">
              <Link 
                href="/dashboard"
                className="block px-6 py-2 bg-purple-600 text-white rounded-lg"
              >
                Back to Dashboard
              </Link>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Waterdrop Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 -left-10 w-40 h-40 bg-green-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute top-40 -right-10 w-32 h-32 bg-green-200 rounded-full opacity-40 blur-lg"></div>
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-green-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-green-200 rounded-full opacity-40 blur-lg"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Header Section */}
      <div className="relative z-10 bg-gradient-to-r from-green-600 to-green-400 text-white mx-4 mt-20 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Results</h1>
            <p className="text-green-100">View your academic performance</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="relative z-10 mx-4 mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Total Results: <span className="text-green-600">{results.length}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Roll No: {userData?.rollno || "N/A"} | Batch: {userData?.batch || "N/A"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Student: {userData?.name || "N/A"}
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="relative z-10 mx-4 mt-4 mb-8">
        {results.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Found</h3>
            <p className="text-gray-500">No results found for your roll number.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div 
                key={result.id} 
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {/* Header with Date and Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      {formatDate(result.date)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {getTimeAgo(result.date)}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.status === "pass" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>

                {/* Subject */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">
                  {result.subject || "Subject"}
                </h3>

                {/* Marks */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Obtained Marks</p>
                    <p className="text-2xl font-bold text-green-600">{result.obtainedmark}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Maximum Marks</p>
                    <p className="text-2xl font-bold text-blue-600">{result.maxmark}</p>
                  </div>
                </div>

                {/* Percentage */}
                <div className="mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-blue-700">Percentage</span>
                      <span className="text-sm font-bold text-blue-700">
                        {((parseInt(result.obtainedmark) / parseInt(result.maxmark)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(parseInt(result.obtainedmark) / parseInt(result.maxmark)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Published on: {formatDate(result.date)}
                  </span>
                  <span className="text-xs text-gray-400">ID: {result.id.slice(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Dashboard Button */}
      <div className="relative z-10 mx-4 mb-8">
        <Link 
          href="/dashboard"
          className="block w-full bg-gradient-to-r from-green-600 to-green-400 text-white text-center py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}