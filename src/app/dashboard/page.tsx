"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, DocumentData, Timestamp, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../navbar/page";

interface Attendance {
  date: Timestamp;
  rollno: string;
  status: string;
  batch: string;
  reason?: string;
}

interface Notification {
  heading: string;
  date: Timestamp;
  content: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<string>("loading");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, totalDays: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
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

        // Fetch user details
        const q = query(
          collection(db, "details"),
          where("email", "==", user.email)
        );
        const querySnap = await getDocs(q);

        if (querySnap.empty) {
          setError("Student data not found");
          return;
        }

        const userData = querySnap.docs[0].data();
        setUserData(userData);

        // Fetch today's attendance from "attentence" collection with rollno, batch and today filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        try {
          const attendanceQuery = query(
            collection(db, "attentence"),
            where("rollno", "==", userData.rollno),
            where("batch", "==", userData.batch || "1"),
            where("date", ">=", Timestamp.fromDate(today)),
            where("date", "<", Timestamp.fromDate(tomorrow)),
            orderBy("date", "desc"),
            limit(1)
          );
          
          const attendanceSnap = await getDocs(attendanceQuery);
          console.log("Attendance query results:", {
            rollno: userData.rollno,
            batch: userData.batch || "1",
            today: today.toISOString(),
            tomorrow: tomorrow.toISOString(),
            found: attendanceSnap.size
          });
          
          if (!attendanceSnap.empty) {
            const attendanceData = attendanceSnap.docs[0].data() as Attendance;
            console.log("Attendance data found:", attendanceData);
            setTodayAttendance(attendanceData.status);
          } else {
            // If no record found for today, show as present (default behavior)
            console.log("No attendance record found for today, defaulting to present");
            setTodayAttendance("present");
          }
        } catch (attendanceError) {
          console.warn("Attendance query error, using default:", attendanceError);
          setTodayAttendance("present");
        }

        // Fetch last 3 notifications
        try {
          const notifQuery = query(
            collection(db, "notification"),
            orderBy("date", "desc"),
            limit(3)
          );
          const notifSnap = await getDocs(notifQuery);
          const notifs = notifSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          } as unknown as Notification));
          setNotifications(notifs);
        } catch (notifError) {
          console.warn("Notifications query error:", notifError);
          setNotifications([]);
        }

        // Calculate attendance stats for last 6 months with rollno and batch filter
        try {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          sixMonthsAgo.setHours(0, 0, 0, 0);
          
          const statsQuery = query(
            collection(db, "attentence"),
            where("rollno", "==", userData.rollno),
            where("batch", "==", userData.batch || "1"),
            where("date", ">=", Timestamp.fromDate(sixMonthsAgo)),
            orderBy("date", "desc")
          );
          
          const statsSnap = await getDocs(statsQuery);
          const absentRecords = statsSnap.docs.filter(doc => doc.data().status === 'absent');
          const absentCount = absentRecords.length;

          const uniqueDaysWithRecords = new Set(statsSnap.docs.map(doc => doc.data().date.toDate().toDateString()));
          const totalDays = uniqueDaysWithRecords.size;
          const presentCount = totalDays - absentCount;
          
          console.log("Final 6 months stats:", { 
            present: presentCount, 
            absent: absentCount, 
            totalDays: totalDays
          });
          
          setAttendanceStats({ 
            present: presentCount, 
            absent: absentCount, 
            totalDays: totalDays 
          });
        } catch (statsError) {
          console.warn("6 Months Stats calculation error:", statsError);
          setAttendanceStats({ present: 0, absent: 0, totalDays: 0 });
        }

      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentNotificationIndex(
          (prevIndex) => (prevIndex + 1) % notifications.length
        );
      }, 5000); // Change notification every 5 seconds

      return () => clearInterval(interval);
    }
  }, [notifications]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/919544565248`, '_blank');
  };

  const calculatePercentage = () => {
    const total = attendanceStats.present + attendanceStats.absent;
    return total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;
  };

  // Get today's date and day
  const getTodayInfo = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return {
      date: today.toLocaleDateString('en-US', options),
      day: today.toLocaleDateString('en-US', { weekday: 'long' }),
      formattedDate: today.toISOString().split('T')[0] // YYYY-MM-DD format
    };
  };

  const todayInfo = getTodayInfo();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">{error}</p>
          <button 
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-lg font-medium text-gray-600">No student data found</p>
      </div>
    );
  }

  const attendancePercentage = calculatePercentage();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden pt-20">
      {/* Background Waterdrop Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 -left-10 w-40 h-40 bg-purple-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute top-40 -right-10 w-32 h-32 bg-purple-200 rounded-full opacity-40 blur-lg"></div>
        <div className="absolute bottom-20 left-10 w-36 h-36 bg-purple-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-purple-200 rounded-full opacity-40 blur-lg"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Greeting Section with Date and Day */}
      <div className="relative z-10 bg-gradient-to-r from-purple-600 to-purple-400 text-white mx-4 mt-4 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2">
              <p className="text-sm opacity-90">{todayInfo.date}</p>
              <p className="text-lg font-bold">{todayInfo.day}</p>
            </div>
            <h1 className="text-3xl font-poppins font-bold mb-2">
              WELCOME BACK 🤝
            </h1>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{userData.name}</p>
              <div className="flex space-x-4 text-sm opacity-90">
                <span>Roll No: {userData.rollno}</span>
                <span>Place: {userData.place}</span>
                {userData.batch && <span>Batch: {userData.batch}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status with Updated Logic */}
      <div className="relative z-10 mx-4 mt-6 p-5 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{`Today's Status`}</h2>
            <p className="text-sm text-gray-500">As of {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            todayAttendance === "present" 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {todayAttendance === "present" ? "Present" : "Absent"}
          </span>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          {todayAttendance === "present" 
            ? "You are marked as present for today." 
            : "You are marked as absent for today."}
        </div>
        {/* Additional info about the logic */}
        <div className="mt-2 text-xs text-blue-600">
          {todayAttendance === "present" && " "}
          {todayAttendance === "absent" && " "}
        </div>
      </div>

      {/* Last 3 Notifications Section */}
      <div className="relative z-10 mx-4 mt-6 overflow-hidden">
        <Link href="/notification" className="block bg-white-50 p-3 rounded-xl border border-gray-50">
          <div className="animate-marquee whitespace-nowrap">
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <span key={index} className="inline-block mx-6 text-sm">
                  <span className="font-medium text-white-700">{notif.heading}</span>
                  <span className="text-gray-600 ml-2">
                    ({notif.date?.seconds ? new Date(notif.date.seconds * 1000).toLocaleDateString() : "N/A"})
                  </span>
                </span>
              ))
            ) : (
              <span className="inline-block text-gray-500 px-4">No new notifications</span>
            )}
          </div>
        </Link>
      </div>

      {/* Quick Actions Section */}
      <div className="relative z-10 mx-4 mt-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <QuickActionButton href="/attendence" icon="calendar" label="Absents" color="green" />
          <QuickActionButton href="/result" icon="chart" label="Result" color="blue" />
          <QuickActionButton href="/achivements" icon="trophy" label="Achievements" color="purple" />
          <QuickActionButton href="/negatives" icon="warning" label="Negatives" color="yellow" />
          <QuickActionButton href="/notification" icon="bell" label="Notifications" color="pink" />
          <QuickActionButton href="/project" icon="folder" label="Project" color="indigo" />
        </div>
      </div>

      {/* Contact Button */}
      <div className="relative z-10 mx-4 mt-6 mb-8">
        <button
          onClick={handleWhatsApp}
          className="w-full bg-green-500 text-white p-4 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:bg-green-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.446h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>Contact Us</span>
        </button>
      </div>

      {/* Add custom CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

type ColorKey = 'green' | 'blue' | 'purple' | 'yellow' | 'pink' | 'indigo';

const QuickActionButton = ({ href, icon, label, color }: { href: string, icon: string, label: string, color: ColorKey }) => {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    pink: 'bg-pink-100 text-pink-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  const icons: { [key: string]: JSX.Element } = {
    calendar: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    chart: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    trophy: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>,
    warning: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    bell: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    folder: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  };

  return (
    <Link href={href} className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-xl transition-shadow group">
      <div className={`w-12 h-12 ${colors[color]} rounded-full flex items-center justify-center mb-2`}>
        {icons[icon]}
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">{label}</span>
    </Link>
  );
};