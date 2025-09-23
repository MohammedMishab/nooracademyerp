"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, DocumentData, Timestamp, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../navbar/page";

interface Notification {
  id: string;
  date: Timestamp;
  heading: string;
  content: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

        // Fetch all notifications from notification collection, ordered by date
        const notificationsQuery = query(
          collection(db, "notification"),
          orderBy("date", "desc")
        );
        const notificationsSnap = await getDocs(notificationsQuery);
        
        const notificationsData = notificationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));

        setNotifications(notificationsData);
        console.log("Notifications loaded:", notificationsData.length);

      } catch (err) {
        console.error("Notifications error:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return "Date not available";
    
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            <p className="text-lg font-medium text-gray-600">Loading notifications...</p>
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
        <div className="absolute top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute top-40 -right-10 w-32 h-32 bg-blue-200 rounded-full opacity-40 blur-lg"></div>
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-blue-200 rounded-full opacity-40 blur-lg"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Header Section */}
      <div className="relative z-10 bg-gradient-to-r from-blue-600 to-blue-400 text-white mx-4 mt-20 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-blue-100">Stay updated with latest announcements</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Notifications Count */}
      <div className="relative z-10 mx-4 mt-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Total Notifications: <span className="text-blue-600">{notifications.length}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Roll No: {userData?.rollno || "N/A"} | Batch: {userData?.batch || "N/A"}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="relative z-10 mx-4 mt-4 mb-8">
        {notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Notifications Yet</h3>
            <p className="text-gray-500">New announcements will appear here when they are posted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {/* Header with Date and Time */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {formatDate(notification.date)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {getTimeAgo(notification.date)}
                    </span>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>

                {/* Heading */}
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {notification.heading || "Notification"}
                </h3>

                {/* Content */}
                <div className="mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed">
                      {notification.content || "No content available"}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Posted on: {formatDate(notification.date)}
                  </span>
                  <span className="text-xs text-gray-400">ID: {notification.id.slice(0, 8)}...</span>
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
          className="block w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white text-center py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}