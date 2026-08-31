"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      let targetEmail = identifier.trim();

      // Jika input bukan format email (tidak ada @), cari email berdasarkan username di profiles
      if (!targetEmail.includes("@")) {
        const cleanUsername = targetEmail.toLowerCase().replace(/\s+/g, "");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .ilike("username", cleanUsername)
          .maybeSingle();

        if (profileError || !profile?.email) {
          toast.error(`Username "${targetEmail}" tidak ditemukan.`);
          setLoading(false);
          return;
        }

        targetEmail = profile.email;
      }

      // Lakukan Login Supabase Auth menggunakan email yang ditemukan
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (authError) {
        toast.error("Gagal login: " + authError.message);
        setLoading(false);
        return;
      }

      // Cek Role Pengguna untuk Redirect
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      toast.success("Login berhasil. Selamat datang di KOOMS.");

      if (userProfile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/menu");
      }

      router.refresh();
    } catch (err: any) {
      console.error("Login Error:", err);
      toast.error(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white border border-stone-200 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-extrabold text-orange-600 text-center mb-2">Kerang OISHII</h1>
      <p className="text-xs text-slate-500 text-center mb-6">Order Ahead & Pickup Station</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Email / Username
          </label>
          <input
            type="text"
            required
            className="w-full border border-stone-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="Masukkan email atau username (misal: useroishii)..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full border border-stone-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 cursor-pointer shadow-md"
        >
          {loading ? "Memproses..." : "Masuk Sekarang"}
        </button>

        <div className="flex justify-between items-center border-t pt-4 text-xs">
          <Link href="/reset-password" className="font-bold text-orange-600 hover:underline">
            Lupa kata sandi?
          </Link>
          <p className="text-stone-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-orange-600 hover:underline">
              Daftar
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}