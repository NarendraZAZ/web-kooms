"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setRecovery(Boolean(data.session)));
  }, [supabase.auth]);

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Tautan reset belum dapat dikirim. Periksa alamat email Anda.");
      return;
    }
    toast.success("Tautan reset dikirim. Periksa inbox email Anda.");
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Kata sandi gagal diperbarui. Silakan minta tautan baru.");
      return;
    }
    toast.success("Kata sandi berhasil diperbarui.");
    setRecovery(false);
    setPassword("");
  };

  return (
    <main className="mx-auto my-12 max-w-md p-6">
      <div className="space-y-5 rounded-3xl border border-stone-200 bg-white p-7 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-black text-stone-900">Reset Kata Sandi</h1>
          <p className="mt-1 text-xs text-stone-500">
            Gunakan email yang bisa Anda buka untuk menerima tautan pemulihan.
          </p>
        </div>
        {recovery ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <input type="password" required minLength={6} placeholder="Kata sandi baru" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            <button disabled={loading} className="w-full rounded-2xl bg-orange-600 p-3.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Kata Sandi"}</button>
          </form>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4">
            <input type="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            <button disabled={loading} className="w-full rounded-2xl bg-orange-600 p-3.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Mengirim..." : "Kirim Tautan Reset"}</button>
            <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
              Email testing palsu tidak dapat menerima tautan. Untuk simulasi, gunakan email nyata atau jalankan Supabase local dengan Inbox UI/Inbucket.
            </p>
          </form>
        )}
        <Link href="/login" className="block text-center text-xs font-bold text-orange-600 hover:underline">Kembali ke Login</Link>
      </div>
    </main>
  );
}