"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, DocumentData, Timestamp, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../navbar/page";

interface Achievement {
  id: string;
  date: Timestamp;
  heading: string;
  imageurl: string;
  rollno: string;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
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

        // Fetch all achievements and filter client-side to avoid index requirements
        const achievementsQuery = query(
          collection(db, "achivement")
          // Removed where clause and orderBy to avoid composite index requirement
        );

        const achievementsSnap = await getDocs(achievementsQuery);
        
        // Filter by rollno and sort by date on client side
        const achievementsData = achievementsSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Achievement))
          .filter(achievement => achievement.rollno === userData.rollno)
          .sort((a, b) => {
            // Sort by date descending (newest first)
            const dateA = a.date?.seconds || 0;
            const dateB = b.date?.seconds || 0;
            return dateB - dateA;
          });

        setAchievements(achievementsData);
        console.log("Achievements loaded:", achievementsData.length);

      } catch (err) {
        console.error("Achievements error:", err);
        setError("Failed to load achievements");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return "Date not available";
    
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadImage = (imageUrl: string, heading: string) => {
    if (!imageUrl) {
      alert("No image available for download");
      return;
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `achievement-${heading.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Loading achievements...</p>
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
            <Link 
              href="/dashboard"
              className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Waterdrop Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 -left-10 w-40 h-40 bg-purple-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute top-40 -right-10 w-32 h-32 bg-purple-200 rounded-full opacity-40 blur-lg"></div>
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-purple-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-purple-200 rounded-full opacity-40 blur-lg"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Header Section */}
      <div className="relative z-10 bg-gradient-to-r from-purple-600 to-purple-400 text-white mx-4 mt-20 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Achievements</h1>
            
          </div>
        </div>
      </div>

      {/* Achievements Count */}
      <div className="relative z-10 mx-4 mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Total Achievements: <span className="text-purple-600">{achievements.length}</span>
          </p>
          
        </div>
      </div>

      {/* Achievements List */}
      <div className="relative z-10 mx-4 mt-4 mb-8">
        {achievements.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Achievements Yet</h3>
            <p className="text-gray-500">Your achievements will appear here once they are added.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {/* Date */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {formatDate(achievement.date)}
                  </span>
                </div>

                {/* Heading */}
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {achievement.heading || "Achievement"}
                </h3>

                {/* Image URL Section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Image URL:</span>
                    {achievement.imageurl && (
                      <button
                        onClick={() => handleDownloadImage(achievement.imageurl, achievement.heading)}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                      >
                        Download Image
                      </button>
                    )}
                  </div>
                  
                  {achievement.imageurl ? (
                    <div className="space-y-2">
                      {/* URL Text */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 break-all font-mono">
                          {achievement.imageurl}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">No image available</p>
                    </div>
                  )}
                </div>

                {/* Roll Number */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Roll No: {achievement.rollno}</span>
                  <span className="text-xs text-gray-400">ID: {achievement.id.slice(0, 8)}...</span>
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
          className="block w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white text-center py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}