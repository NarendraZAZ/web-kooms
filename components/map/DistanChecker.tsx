"use client";

import { MapPin, Scooter } from "lucide-react";

export default function DistanChecker() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" /> Outlet Direct Pickup Kerang OISHII
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Jl. Mugas Dalam No. 8, Semarang Tengah (Area SMKN 8 Semarang)
          </p>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
          Jam Operasional: 10:00 - 21:00 WIB
        </span>
      </div>

      {/* Frame Google Maps Embed */}
      <div className="w-full h-52 rounded-xl overflow-hidden border border-stone-200 shadow-inner">
        <iframe
          title="Lokasi Outlet Kerang OISHII"
          src="https://maps.google.com/maps?q=Kerang%20OISHII%20Perumahan%20Puri%20Bukit%20Ngaliyan%20B.32%20Semarang&t=&z=16&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
        <Scooter className="size-5 shrink-0" aria-hidden="true" />
        <p className="leading-tight">
          <strong>Informasi Pickup:</strong> Patokan outlet adalah rumah B.32. GMaps kadang berhenti di B.16, jadi lanjutkan satu blok ke belakang di perumahan yang sama. Tunjukkan Nomor Pesanan kepada kasir saat tiba.
        </p>
      </div>
    </div>
  );
}