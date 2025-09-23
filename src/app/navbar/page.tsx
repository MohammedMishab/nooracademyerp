"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard", label: "Home" },
    { path: "/attendence", label: "Absents" },
    { path: "/notification", label: "Notifications" },
    { path: "/achivements", label: "Achievements" },
    { path: "/negatives", label: "Negatives" },
    { path: "/result", label: "Results" },
    { path: "/project", label: "Project" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 h-16 flex items-center px-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <div className="space-y-1">
            <div className="w-6 h-0.5 bg-gray-700"></div>
            <div className="w-6 h-0.5 bg-gray-700"></div>
            <div className="w-6 h-0.5 bg-gray-700"></div>
          </div>
        </button>

        {/* Page Title */}
        <h1 className="ml-4 text-xl font-semibold text-gray-800">
          Noor Academy
        </h1>
      </nav>

      {/* Sidebar Navigation */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-40 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Menu</h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col p-4 space-y-2 mt-4">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={idx}
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full text-left p-3 rounded-lg transition-all duration-200 font-medium
                  ${isActive 
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full text-left p-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      {/* This div is no longer needed as Navbar is not a layout */}
    </>
  );
}