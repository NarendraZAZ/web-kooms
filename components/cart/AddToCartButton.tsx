"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, ShoppingBasket, X } from "lucide-react";

export default function AddToCartButton({
  menuId,
  menuName,
  isLoggedIn,
  userRole,
}: {
  menuId: string;
  menuName?: string;
  isLoggedIn: boolean;
  userRole?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const router = useRouter();

  // Deteksi kata kunci nama menu secara luas (Kerang, Cumi, Udang, Mix, Indomie, Telur)
  const getMenuOptions = () => {
    if (!menuName) return [];

    const nameLower = menuName.toLowerCase();

    // 1. Menu Seafood & Mix (Pilihan Saus Wajib)
    if (
      nameLower.includes("kerang") ||
      nameLower.includes("cumi") ||
      nameLower.includes("udang") ||
      nameLower.includes("mix") ||
      nameLower.includes("seafood")
    ) {
      return [
        {
          name: "Saus",
          type: "sauce",
          values: ["Saus Padang", "Saus Asam Manis", "Saus Mentega", "Saus Tiram"],
        },
      ];
    }

    // 2. Menu Indomie
    if (nameLower.includes("indomie")) {
      return [
        {
          name: "Jenis",
          type: "variant",
          values: ["Original Tidak Pedas", "Pedas"],
        },
      ];
    }

    // 3. Menu Telur
    if (nameLower.includes("telur")) {
      return [
        {
          name: "Jenis",
          type: "variant",
          values: ["Ceplok", "Dadar"],
        },
      ];
    }

    return [];
  };

  const menuOptions = getMenuOptions();
  const hasRequiredOptions = menuOptions.length > 0;

  if (userRole === "admin") return null;

  const handleAdd = () => {
    if (!isLoggedIn) {
      toast.error("Silakan login terlebih dahulu untuk menambah menu ke keranjang!");
      router.push("/login");
      return;
    }

    if (hasRequiredOptions) {
      setShowOptions(true);
      return;
    }

    addToCartWithOptions({});
  };

  const addToCartWithOptions = (options: Record<string, string>) => {
    startTransition(async () => {
      const res = await addToCart(menuId, 1, options);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Menu berhasil masuk keranjang!");
        setShowOptions(false);
        setSelectedOptions({});
      }
    });
  };

  const handleConfirmOptions = () => {
    // Validasi semua opsi wajib dipilih
    const allSelected = menuOptions.every((opt) => selectedOptions[opt.name]);
    if (!allSelected) {
      toast.error("Silakan pilih semua opsi yang tersedia");
      return;
    }
    addToCartWithOptions(selectedOptions);
  };

  return (
    <>
      <button
        onClick={handleAdd}
        disabled={isPending}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <LoaderCircle className="mr-1.5 inline size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingBasket className="mr-1.5 inline size-3.5" aria-hidden="true" />
        )}
        {isPending ? "Menambahkan..." : "Keranjang"}
      </button>

      {/* Options Modal */}
      {showOptions && hasRequiredOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-sm font-black text-stone-900">Pilih Opsi {menuName}</h2>
                <p className="text-[10px] text-stone-500">Pilih opsi yang diinginkan sebelum dimasukkan ke keranjang</p>
              </div>
              <button
                onClick={() => {
                  setShowOptions(false);
                  setSelectedOptions({});
                }}
                className="p-1 hover:bg-stone-100 rounded-lg transition-all text-stone-400 hover:text-stone-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {menuOptions.map((option) => (
                <div key={option.name} className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {option.name} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedOptions[option.name] || ""}
                    onChange={(e) =>
                      setSelectedOptions((prev) => ({ ...prev, [option.name]: e.target.value }))
                    }
                    className="w-full border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50/50"
                  >
                    <option value="">-- Pilih {option.name} --</option>
                    {option.values.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => {
                  setShowOptions(false);
                  setSelectedOptions({});
                }}
                className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOptions}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                {isPending ? "Menambahkan..." : "Tambah ke Keranjang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}