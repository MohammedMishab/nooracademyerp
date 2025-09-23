"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, DocumentData, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../navbar/page";

interface Negative {
  id: string;
  date: Timestamp;
  discription: string;
  rollno: string;
}

export default function NegativesPage() {
  const [negatives, setNegatives] = useState<Negative[]>([]);
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

        // Fetch all negatives from negatives collection
        const negativesQuery = query(collection(db, "negatives"));
        const negativesSnap = await getDocs(negativesQuery);
        
        // Filter by rollno and sort by date on client side
        const negativesData = negativesSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Negative))
          .filter(negative => negative.rollno === userData.rollno)
          .sort((a, b) => {
            // Sort by date descending (newest first)
            const dateA = a.date?.seconds || 0;
            const dateB = b.date?.seconds || 0;
            return dateB - dateA;
          });

        setNegatives(negativesData);
        console.log("Negatives loaded:", negativesData.length);

      } catch (err) {
        console.error("Negatives error:", err);
        setError("Failed to load negative records");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Loading negative records...</p>
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
        <div className="absolute top-10 -left-10 w-40 h-40 bg-red-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute top-40 -right-10 w-32 h-32 bg-red-200 rounded-full opacity-40 blur-lg"></div>
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-red-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-red-200 rounded-full opacity-40 blur-lg"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Header Section */}
      <div className="relative z-10 bg-gradient-to-r from-red-600 to-red-400 text-white mx-4 mt-20 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Negative Records</h1>
            <p className="text-red-100">View all your negative remarks</p>
          </div>
        </div>
      </div>

      {/* Negatives Count */}
      <div className="relative z-10 mx-4 mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Total Negative Records: <span className="text-red-600">{negatives.length}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Roll No: {userData?.rollno || "N/A"} | Batch: {userData?.batch || "N/A"}
          </p>
        </div>
      </div>

      {/* Negatives List */}
      <div className="relative z-10 mx-4 mt-4 mb-8">
        {negatives.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Clean Record!</h3>
            <p className="text-gray-500">No negative records found. Keep up the good work!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {negatives.map((negative) => (
              <div 
                key={negative.id} 
                className="bg-white p-4 rounded-2xl shadow-lg border border-red-100 hover:shadow-xl transition-shadow"
              >
                {/* Date */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    {formatDate(negative.date)}
                  </span>
                  <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                    Negative Remark
                  </span>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600 block mb-2">Description:</span>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-gray-800">
                      {negative.discription || "No description provided"}
                    </p>
                  </div>
                </div>

                {/* Roll Number and ID */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Roll No: {negative.rollno}</span>
                  <span className="text-xs text-gray-400">ID: {negative.id.slice(0, 8)}...</span>
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
          className="block w-full bg-gradient-to-r from-red-600 to-red-400 text-white text-center py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}