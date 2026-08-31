import { Clock3, ExternalLink, Headphones, MapPin, MessageCircle, Navigation } from "lucide-react";
import SupportMessageForm from "@/components/contact/SupportMessageForm";

const mapsUrl = "https://maps.app.goo.gl/CqCqt6ttfYW4k9kk7";

// Menggunakan fallback nomor WhatsApp 085776048879 (6285776048879)
const defaultPhoneNumber = "6285776048879";
const defaultMessage = encodeURIComponent("Halo Admin Kerang OISHII, saya ingin bertanya terkait pesanan/lokasi pickup.");
const fallbackWhatsappUrl = `https://wa.me/${defaultPhoneNumber}?text=${defaultMessage}`;

const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || fallbackWhatsappUrl;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="max-w-2xl space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-800">
          <Headphones className="size-3.5" aria-hidden="true" /> Customer service
        </span>
        <h1 className="text-3xl font-black tracking-tight text-stone-900">Butuh bantuan?</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Hubungi kami untuk bantuan pesanan, pembayaran, atau menemukan titik pickup. Kami siap membantu sebelum kamu berangkat.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <MapPin className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-black text-stone-900">Titik pickup yang benar</h2>
              <p className="mt-1 text-sm text-stone-600">Perumahan Puri Bukit Ngaliyan, rumah B.32, Semarang.</p>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
            <p className="font-extrabold">Catatan untuk navigasi</p>
            <p>GMaps kadang berhenti di B.16. Jangan berhenti di sana: lanjutkan satu blok ke belakang, masih di perumahan yang sama, sampai rumah B.32.</p>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-emerald-700">
            <Navigation className="size-4" aria-hidden="true" /> Buka petunjuk GMaps <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </section>

        <section className="space-y-5 rounded-3xl border border-stone-200 bg-stone-900 p-6 text-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 text-orange-300">
              <MessageCircle className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-black">Chat dengan customer service</h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-300">Kirim nomor pesanan dan patokan lokasi jika kamu sudah di area perumahan.</p>
            </div>
          </div>
          
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-orange-600"
          >
            <MessageCircle className="size-4" aria-hidden="true" /> Chat WhatsApp (0857-7604-8879) <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>

          <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-stone-300">
            <Clock3 className="size-4 text-orange-300" aria-hidden="true" /> Jam layanan: 08.00-22.00 WIB
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-2xl bg-stone-100 p-3 text-stone-700">
            <MessageCircle className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-black text-stone-900">Kirim pertanyaan melalui email</h2>
            <p className="mt-1 text-sm text-stone-600">Pesan akan masuk ke pusat bantuan admin. Pastikan email aktif agar balasan kami tidak terlewat.</p>
          </div>
        </div>
        <SupportMessageForm />
      </section>
    </div>
  );
}