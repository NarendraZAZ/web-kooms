import Link from "next/link";
import { CalendarClock, CreditCard, MapPin, Shell, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // Fetch featured reviews
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("support_messages")
    .select("id, customer_name, message")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50/80 via-emerald-50/30 to-transparent py-16 px-6 border-b border-emerald-100/60">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-extrabold tracking-wide uppercase">
            <Shell className="size-4" aria-hidden="true" /> Spesialis Olahan Kerang Saus Padang & Tiram
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-stone-900 tracking-tight leading-tight">
            Pesan Pre-Order Direct, <br />
            <span className="text-emerald-600">Ambil Tanpa Antre di Outlet!</span>
          </h1>

          <p className="text-sm md:text-base text-stone-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Sistem resmi KOOMS Kerang OISHII. Dapatkan harga hemat direct tanpa biaya markup platform e-commerce dan jaminan stok siap saji saat kamu sampai di outlet.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/menu"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
            >
              Lihat Menu & Pre-Order
            </Link>
            <a
              href="https://maps.app.goo.gl/CqCqt6ttfYW4k9kk7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-2xl font-bold text-sm shadow-xs transition-all"
            >
              <><MapPin className="mr-1 inline size-4" aria-hidden="true" /> Lokasi Outlet</>
            </a>
          </div>
        </div>
      </section>

      {/* Keunggulan KOOMS */}
      <section className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            <CreditCard className="size-6" aria-hidden="true" />
          </div>
          <h3 className="font-extrabold text-stone-800 text-lg">Harga Offline Hemat</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Nikmati harga asli outlet tanpa potongan biaya komisi platform 20-30%. Lebih hemat untuk porsi berdua & keluarga!
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            <CalendarClock className="size-6" aria-hidden="true" />
          </div>
          <h3 className="font-extrabold text-stone-800 text-lg">Bebas Jam Antre</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Tentukan jadwal jam penjemputanmu sendiri. Tim dapur kami memasak tepat sesuai waktu pesanan agar tetap hangat segar.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            <CreditCard className="size-6" aria-hidden="true" />
          </div>
          <h3 className="font-extrabold text-stone-800 text-lg">QRIS Midtrans Instan</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Pembayaran praktis langsung dari GoPay, OVO, Dana, ShopeePay, atau Bank Transfer tanpa repot siapkan uang kembalian.
          </p>
        </div>
      </section>

      {/* Customer Reviews Section */}
      {reviews && reviews.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-stone-900 flex items-center justify-center gap-2">
              <Star className="size-8 text-amber-400 fill-amber-400" aria-hidden="true" />
              Kepuasan Pelanggan Kami
            </h2>
            <p className="text-sm text-stone-600">Testimoni dari pelanggan setia KOOMS Kerang OISHII</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 text-amber-400 fill-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-sm text-stone-700 line-clamp-3 italic leading-relaxed">
                  "{review.message}"
                </p>
                <div className="border-t border-stone-100 pt-3">
                  <p className="text-xs font-bold text-stone-900">— {review.customer_name}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}