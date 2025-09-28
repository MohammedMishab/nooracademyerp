"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { useAuth } from "../AuthContext";
import { collection, query, where, getDocs, DocumentData, Timestamp, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../navbar/page";
import { useNotificationContext } from "../contexts/NotificationContext";

interface Attendance {
  id: string;
  batch: string;
  date: Timestamp;
  reason: string;
  rollno: string;
  status: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { markAsRead } = useNotificationContext();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAttendance = async () => {
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

        // Fetch all attendance records and filter for absent status
        const attendanceQuery = query(
          collection(db, "attentence"),
          orderBy("date", "desc")
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        
        // Filter for absent records only and current user's rollno
        const attendanceData = attendanceSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Attendance))
          .filter(record => record.status === "absent" && record.rollno === userData.rollno);

        setAttendance(attendanceData);
        console.log("Absent records loaded:", attendanceData.length);

        // Mark attendance as read when page is opened
        await markAsRead('attendance');

      } catch (err) {
        console.error("Attendance error:", err);
        setError("Failed to load attendance records");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
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

  // Calculate absence statistics
  const totalAbsences = attendance.length;
  const lastAbsence = attendance.length > 0 ? attendance[0] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Loading attendance records...</p>
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
        <div className="absolute top-10 -left-10 w-40 h-40 bg-orange-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute top-40 -right-10 w-32 h-32 bg-orange-200 rounded-full opacity-40 blur-lg"></div>
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-orange-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-orange-200 rounded-full opacity-40 blur-lg"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Header Section */}
      <div className="relative z-10 bg-gradient-to-r from-orange-600 to-orange-400 text-white mx-4 mt-20 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Absence Records</h1>
            <p className="text-orange-100">View your absence history</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Absence Statistics */}
      <div className="relative z-10 mx-4 mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Total Absences: <span className="text-orange-600">{totalAbsences}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Roll No: {userData?.rollno || "N/A"} | Batch: {userData?.batch || "N/A"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Student: {userData?.name || "N/A"}
          </p>
          {lastAbsence && (
            <p className="text-sm text-gray-600 mt-1">
              Last Absence: {formatDate(lastAbsence.date)}
            </p>
          )}
        </div>
      </div>

      {/* Absence Records List */}
      <div className="relative z-10 mx-4 mt-4 mb-8">
        {attendance.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Absence Records</h3>
            <p className="text-gray-500">Great! You have perfect attendance so far.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attendance.map((record) => (
              <div 
                key={record.id} 
                className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow"
              >
                {/* Header with Date and Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                      {formatDate(record.date)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {getTimeAgo(record.date)}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    ABSENT
                  </span>
                </div>

                {/* Batch Information */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                    Batch: {record.batch}
                  </span>
                </div>

                {/* Reason for Absence */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Reason for Absence:</h3>
                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                    <p className="text-gray-700 leading-relaxed">
                      {record.reason || "No reason provided"}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Recorded on: {formatDate(record.date)}
                  </span>
                  <span className="text-xs text-gray-400">Roll No: {record.rollno}</span>
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
          className="block w-full bg-gradient-to-r from-orange-600 to-orange-400 text-white text-center py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
