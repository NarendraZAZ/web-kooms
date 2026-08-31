"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteMenuButton({
  menuId,
  menuName,
  isForm = false,
}: {
  menuId: string;
  menuName: string;
  isForm?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Yakin ingin menghapus menu "${menuName}"?`)) return;

    setLoading(true);
    const supabase = createClient();

    // 1. Hapus dari keranjang pelanggan terlebih dahulu jika ada
    await supabase.from("cart_items").delete().eq("menu_id", menuId);

    // 2. Hapus menu dari tabel menus
    const { error } = await supabase.from("menus").delete().eq("id", menuId);

    if (error) {
      if (error.code === "23503") {
        toast.error(
          `Tidak dapat menghapus "${menuName}" karena menu ini sudah ada dalam riwayat transaksi pesanan!`
        );
      } else {
        toast.error("Gagal menghapus: " + error.message);
      }
      setLoading(false);
      return;
    }

    toast.success(`Menu "${menuName}" berhasil dihapus!`);
    router.push("/admin/menus");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={
        isForm
          ? "px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
          : "px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
      }
    >
      {loading ? "Menghapus..." : "Hapus Menu"}
    </button>
  );
}