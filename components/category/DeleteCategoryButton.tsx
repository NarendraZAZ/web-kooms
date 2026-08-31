"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCategory } from "@/app/actions/admin";
import { Trash2 } from "lucide-react";

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirmDelete = () => {
    toast.warning(`Hapus kategori "${categoryName}"?`, {
      description:
        "Menu di dalam kategori ini akan menjadi Uncategorized (data menu tetap tersimpan).",
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setLoading(true);
          const res = await deleteCategory(categoryId);
          setLoading(false);
          if (res?.error) {
            toast.error(res.error);
          } else {
            toast.success(`Kategori "${categoryName}" berhasil dihapus.`);
            router.refresh();
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleConfirmDelete}
      className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
      title="Hapus Kategori"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      <span>{loading ? "Menghapus..." : "Hapus"}</span>
    </button>
  );
}