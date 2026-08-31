"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function MenuForm({
  categories,
  initialData,
  onSubmit,
}: {
  categories: any[];
  initialData?: any;
  onSubmit: (formData: any) => Promise<void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [offlinePrice, setOfflinePrice] = useState(initialData?.offline_price || 0);
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name,
      category_id: categoryId,
      price: Number(price),
      offline_price: Number(offlinePrice),
      stock: Number(stock),
      description,
      image_url: imageUrl,
      is_available: Number(stock) > 0,
    });
    setLoading(false);
  };

  const executeDelete = async () => {
    if (!initialData?.id) return;
    setDeleteLoading(true);
    const supabase = createClient();
    await supabase.from("cart_items").delete().eq("menu_id", initialData.id);
    const { error } = await supabase.from("menus").delete().eq("id", initialData.id);

    if (error) {
      if (error.code === "23503") {
        toast.error(`Tidak dapat menghapus "${name}" karena menu ini sudah ada dalam riwayat pesanan!`);
      } else {
        toast.error("Gagal menghapus menu: " + error.message);
      }
      setDeleteLoading(false);
    } else {
      toast.success(`Menu "${name}" berhasil dihapus!`);
      router.push("/admin/menus");
      router.refresh();
    }
  };

  const handleDeletePrompt = () => {
    toast.error(`Hapus menu "${name}"?`, {
      description: "Tindakan ini akan menghapus menu dari database.",
      action: {
        label: "Ya, Hapus",
        onClick: executeDelete,
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 border rounded-2xl shadow-xs">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
          Nama Menu
        </label>
        <input
          type="text"
          required
          className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
            Kategori
          </label>
          <select
            className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
            Stok Awal
          </label>
          <input
            type="number"
            required
            className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
            Harga Online / Pickup (Rp)
          </label>
          <input
            type="number"
            required
            className="w-full border rounded-xl p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-emerald-500"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
            Harga Offline / Dine-in (Rp)
          </label>
          <input
            type="number"
            required
            className="w-full border rounded-xl p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-emerald-500"
            value={offlinePrice}
            onChange={(e) => setOfflinePrice(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
          URL Gambar
        </label>
        <input
          type="text"
          placeholder="https://..."
          className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
          Deskripsi Menu
        </label>
        <textarea
          rows={3}
          className="w-full border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || deleteLoading}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
        >
          {loading ? "Menyimpan..." : "Simpan Menu"}
        </button>
        {initialData?.id && (
          <button
            type="button"
            onClick={handleDeletePrompt}
            disabled={loading || deleteLoading}
            className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            {deleteLoading ? "Menghapus..." : "Hapus Menu"}
          </button>
        )}
      </div>
    </form>
  );
}