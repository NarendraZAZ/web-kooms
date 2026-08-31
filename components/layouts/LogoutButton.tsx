"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/auth/signout", {
        method: "POST",
      });

      if (res.status === 403) {
        const data = await res.json();
        toast.error(
          data.error || "Logout ditolak. Anda masih memiliki pesanan yang belum diselesaikan."
        );
        setLoading(false);
        return;
      }

      if (res.ok || res.redirected) {
        toast.success("Berhasil keluar dari sesi.");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Gagal melakukan logout.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
    >
      {loading ? "Keluar..." : "Logout"}
    </button>
  );
}