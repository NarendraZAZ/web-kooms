import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/layouts/LogoutButton";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "customer";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role;
  }

  const logoUrl =
    "https://jwsirgeegxechuxotfus.supabase.co/storage/v1/object/public/images/Kerang_OISHII.jpeg";

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-emerald-500/30 bg-white shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-600">
            <img src={logoUrl} alt="Kerang OISHII Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-sans text-lg font-black tracking-tight text-emerald-800 leading-none group-hover:text-emerald-600 transition-colors">
                Kerang OISHII
              </span>
              {user && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    role === "admin"
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {role === "admin" ? "Admin" : "User"}
                </span>
              )}
            </div>
            <span className="mt-1 block text-[10px] font-bold tracking-wider text-stone-500 uppercase">
              {user ? `Logged in as ${role}` : "Order Ahead Station"}
            </span>
          </div>
        </Link>

        <div className="flex w-full items-center gap-3 overflow-x-auto pb-1 text-xs font-semibold text-stone-700 sm:w-auto sm:gap-6 sm:pb-0 sm:text-sm">
          <Link href="/" className="hover:text-emerald-600 transition-all">
            Beranda
          </Link>
          <Link href="/menu" className="hover:text-emerald-600 transition-all">
            Menu
          </Link>
          {role !== "admin" && (
            <Link href="/cart" className="hover:text-emerald-600 transition-all">
              Keranjang
            </Link>
          )}
          {user ? (
            <>
              {role === "admin" ? (
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Admin Panel
                </Link>
              ) : (
                <Link href="/orders" className="hover:text-emerald-600 transition-all">
                  Pesanan Saya
                </Link>
              )}
              {role !== "admin" && (
                <Link href="/contact" className="hover:text-emerald-600 transition-all">
                  Pusat Bantuan
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/contact" className="hover:text-emerald-600 transition-all">
                Pusat Bantuan
              </Link>
              <Link href="/login" className="hover:text-emerald-600 transition-all">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}