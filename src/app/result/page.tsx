"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
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
  term: string;
  batch: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [terms, setTerms] = useState<string[]>([]);
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
        
        // Extract unique terms from results
        const uniqueTerms = Array.from(new Set(
          resultsData
            .map(result => result.term)
            .filter(term => term && term.trim() !== "")
        ));
        setTerms(uniqueTerms);
        
        console.log("Results loaded:", resultsData.length);
        console.log("Terms found:", uniqueTerms);

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

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    const termResults = results.filter(result => result.term === selectedTerm);
    const fileName = `${userData?.name || 'Student'}_${userData?.rollno || 'N-A'}_${userData?.batch || 'N-A'}_${selectedTerm || 'Term'}_Result.pdf`;
    
    // Page border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    
    // Header with border
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('NOOR ACADEMY EXAM RESULT', 105, 30, { align: 'center' });
    doc.rect(15, 15, 180, 25);
    
    // Student details section
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${String(userData?.name || 'N/A')}`, 20, 55);
    doc.text(`Roll No: ${String(userData?.rollno || 'N/A')}`, 20, 65);
    doc.text(`Batch: ${String(userData?.batch || 'N/A')}`, 110, 55);
    doc.text(`Term: ${String(selectedTerm || 'N/A')}`, 110, 65);
    doc.rect(15, 45, 180, 30);
    
    // Table
    const tableStartY = 85;
    const rowHeight = 12;
    const colWidths = [50, 30, 30, 35, 30];
    const colPositions = [15, 65, 95, 125, 160];
    
    // Table header
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    const headers = ['Subject', 'Obtained', 'Total', 'Percentage', 'Status'];
    
    // Draw header row
    headers.forEach((header, i) => {
      doc.rect(colPositions[i], tableStartY, colWidths[i], rowHeight);
      doc.text(String(header), colPositions[i] + 2, tableStartY + 8);
    });
    
    // Table data
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    termResults.forEach((result, index) => {
      const y = tableStartY + rowHeight + (index * rowHeight);
      const data = [
        result.subject || 'Subject',
        result.obtainedmark,
        result.maxmark,
        `${((parseInt(result.obtainedmark) / parseInt(result.maxmark)) * 100).toFixed(1)}%`,
        result.status.toUpperCase()
      ];
      
      data.forEach((text, i) => {
        doc.rect(colPositions[i], y, colWidths[i], rowHeight);
        if (i === 4) { // Status column
          if (result.status === "pass") {
            doc.setTextColor(0, 128, 0); // Green
          } else {
            doc.setTextColor(255, 0, 0); // Red
          }
        } else {
          doc.setTextColor(0, 0, 0); // Black
        }
        doc.text(String(text), colPositions[i] + 2, y + 8);
      });
    });
    
    // Footer
    const footerY = 260;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, footerY);
    doc.text('Official Result Document', 105, footerY, { align: 'center' });
    
    doc.save(fileName);
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
            Total Terms: <span className="text-green-600">{terms.length}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Roll No: {userData?.rollno || "N/A"} | Batch: {userData?.batch || "N/A"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Student: {userData?.name || "N/A"}
          </p>
        </div>
      </div>

      {/* Terms List or Results List */}
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
        ) : !selectedTerm ? (
          // Show Terms List
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Term</h2>
              <p className="text-gray-600 mb-4">Choose a term to view your results:</p>
              <div className="space-y-3">
                {terms.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTerm(term)}
                    className="w-full bg-white text-gray-800 p-4 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02] text-left border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{term}</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {results.filter(r => r.term === term).length} subject(s)
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Show Results for Selected Term
          <div className="space-y-4">
            {/* Back to Terms Button */}
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Terms
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 border border-black"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mt-4">{selectedTerm}</h2>
            </div>

            {/* Results for Selected Term */}
            {results.filter(result => result.term === selectedTerm).length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Found</h3>
                <p className="text-gray-500">No results found for this term.</p>
              </div>
            ) : (
              <div className="bg-white border border-black overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="border-r border-black p-2 md:p-3 text-left font-bold text-black whitespace-nowrap">Subject</th>
                      <th className="border-r border-black p-2 md:p-3 text-center font-bold text-black whitespace-nowrap">Obtained</th>
                      <th className="border-r border-black p-2 md:p-3 text-center font-bold text-black whitespace-nowrap">Total</th>
                      <th className="border-r border-black p-2 md:p-3 text-center font-bold text-black whitespace-nowrap">Percentage</th>
                      <th className="border-r border-black p-2 md:p-3 text-center font-bold text-black whitespace-nowrap">Status</th>
                      <th className="p-2 md:p-3 text-center font-bold text-black whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .filter(result => result.term === selectedTerm)
                      .map((result) => (
                        <tr key={result.id} className="border-b border-black">
                          <td className="border-r border-black p-2 md:p-3 text-black capitalize whitespace-nowrap">
                            {result.subject || "Subject"}
                          </td>
                          <td className="border-r border-black p-2 md:p-3 text-center text-black whitespace-nowrap">
                            {result.obtainedmark}
                          </td>
                          <td className="border-r border-black p-2 md:p-3 text-center text-black whitespace-nowrap">
                            {result.maxmark}
                          </td>
                          <td className="border-r border-black p-2 md:p-3 text-center text-black whitespace-nowrap">
                            {((parseInt(result.obtainedmark) / parseInt(result.maxmark)) * 100).toFixed(1)}%
                          </td>
                          <td className={`border-r border-black p-2 md:p-3 text-center uppercase whitespace-nowrap ${
                            result.status === "pass" ? "text-green-600" : "text-red-600"
                          }`}>
                            {result.status}
                          </td>
                          <td className="p-2 md:p-3 text-center text-black text-sm whitespace-nowrap">
                            {formatDate(result.date)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
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