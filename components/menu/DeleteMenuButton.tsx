"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteMenuButton({ menuId }: { menuId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("menus").delete().eq("id", menuId);

    if (error) {
      toast.error(`Gagal menghapus menu: ${error.message}`);
    } else {
      toast.success("Menu berhasil dihapus.");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer shadow-xs"
    >
      {loading ? "Menghapus..." : "Hapus"}
    </button>
  );
}