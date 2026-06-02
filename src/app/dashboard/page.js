"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { logoutUser } from "@/services/authService";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    getSession();
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        Checking Session...
      </div>
    );
  }

  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold">Dashboard 🚀</h1>

      <p className="mt-4">Welcome: {user?.email}</p>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-5 py-2 rounded mt-5"
      >
        Logout
      </button>
    </div>
  );
}
