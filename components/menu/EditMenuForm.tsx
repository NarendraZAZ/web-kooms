"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditMenuForm({ menu }: { menu: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: menu.name || "",
    price: menu.price || 0,
    offlinePrice: menu.offline_price || menu.price || 0,
    isAvailable: menu.is_available ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("menus")
      .update({
        name: formData.name,
        price: Number(formData.price),
        offline_price: Number(formData.offlinePrice),
        is_available: formData.isAvailable,
      })
      .eq("id", menu.id);

    if (error) {
      toast.error(`Gagal memperbarui menu: ${error.message}`);
    } else {
      toast.success("Menu berhasil diperbarui.");
      setIsOpen(false);
      // Memicu Next.js untuk mengambil ulang data terbaru dari database
      router.refresh();
      window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-stone-900 text-base">
                Edit Menu: {menu.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Harga Online (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Harga Offline (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.offlinePrice}
                    onChange={(e) => setFormData({ ...formData, offlinePrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={`isAvailable-${menu.id}`}
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor={`isAvailable-${menu.id}`} className="text-xs font-bold text-stone-700 cursor-pointer">
                  Stok Tersedia / Siap Jual
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}