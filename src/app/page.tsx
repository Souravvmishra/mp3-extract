"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider"; // Adjust the import based on your setup

const MainPage = () => {
  const { user, role, loading } = useAuth(); // Assuming your AuthProvider provides these
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && role) {
        // Redirect based on role
        if (role === "student") {
          router.push("/student/quadrat");
        } else if (role === "teacher") {
          router.push("/teacher");
        } else {
          router.push("/unauthorized"); // Optional: handle unexpected roles
        }
      } else {
        // User is not authenticated, redirect to login
        router.push("/login");
      }
    }
  }, [user, role, loading, router]);

  // Show a loading indicator while auth state is being resolved
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  // Optionally render nothing or a fallback while redirecting
  return null;
};

export default MainPage;
