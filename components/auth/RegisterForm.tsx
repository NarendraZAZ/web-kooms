"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, "");

    try {
      // 1. Pendaftaran ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanUsername,
          },
        },
      });

      if (authError) {
        toast.error(`Gagal mendaftar: ${authError.message}`);
        setLoading(false);
        return;
      }

      // 2. Simpan Profil ke public.profiles tanpa kolom Nama Lengkap
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            username: cleanUsername,
            full_name: cleanUsername,
            email: formData.email.trim(),
            role: "customer",
          },
          { onConflict: "id" }
        );

        if (profileError) {
          console.warn("Sync profil warning:", profileError.message);
        }
      }

      toast.success("Pendaftaran berhasil! Selamat datang di Kerang OISHII.");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      console.error("Register Error:", err);
      toast.error(`Terjadi kesalahan sistem: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white border border-stone-200 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-stone-900">Daftar Akun KOOMS</h1>
        <p className="text-xs text-stone-500">
          Buat akun untuk memesan menu Kerang OISHII dengan cepat
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
            Username
          </label>
          <input
            type="text"
            required
            minLength={3}
            pattern="[A-Za-z0-9_]+"
            title="Username hanya boleh berisi huruf, angka, dan underscore tanpa spasi."
            placeholder="Contoh: budi_oishii"
            className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="nama@email.com"
            className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
            Kata Sandi
          </label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Minimal 6 karakter"
            className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-2xl text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Memproses..." : "Daftar Sekarang"}
        </button>
      </form>

      <div className="text-center border-t pt-4">
        <p className="text-xs text-stone-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-orange-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}