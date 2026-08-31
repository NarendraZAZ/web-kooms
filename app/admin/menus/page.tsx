"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MenuService } from "@/lib/services/MenuService";
import { Shell, Archive, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  const supabase = createClient();
  const menuService = new MenuService(supabase);

  const loadMenus = async () => {
    setLoading(true);
    try {
      let data = await menuService.getMenus(search, sort);
      if (showArchived) {
        data = data.filter((menu: any) => menu.deleted_at !== null);
      } else {
        data = data.filter((menu: any) => menu.deleted_at === null);
      }
      setMenus(data);
    } catch (error: any) {
      console.error("Gagal memuat menu:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadMenus();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, sort, showArchived]);

  // Arsipkan Menu (Tanpa confirm browser)
  const handleArchive = (menuId: string) => {
    const menuName = menus.find((m: any) => m.id === menuId)?.name || "Menu";
    toast.warning(`Arsipkan menu "${menuName}"?`, {
      description: "Menu akan disembunyikan dari katalog pelanggan.",
      action: {
        label: "Arsipkan",
        onClick: async () => {
          const res = await menuService.deleteMenu(menuId);
          if (res.success) {
            toast.success(`Menu "${menuName}" berhasil diarsipkan.`);
            loadMenus();
          } else {
            toast.error(`Gagal mengarsipkan: ${res.error}`);
          }
        },
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  // Restore Menu (Tanpa confirm browser)
  const handleRestore = (menuId: string) => {
    const menuName = menus.find((m: any) => m.id === menuId)?.name || "Menu";
    toast.info(`Kembalikan menu "${menuName}" ke katalog aktif?`, {
      action: {
        label: "Kembalikan",
        onClick: async () => {
          const res = await menuService.restoreMenu(menuId);
          if (res.success) {
            toast.success(`Menu "${menuName}" kembali aktif.`);
            loadMenus();
          } else {
            toast.error(`Gagal mengembalikan: ${res.error}`);
          }
        },
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  // Hapus Permanen (Tanpa confirm browser)
  const handleForceDelete = (menuId: string) => {
    const menuName = menus.find((m: any) => m.id === menuId)?.name || "Menu";
    toast.error(`Hapus permanen "${menuName}"?`, {
      description: "Seluruh data menu dan riwayat item akan dihapus permanen!",
      action: {
        label: "Hapus Permanen",
        onClick: async () => {
          const res = await menuService.forceDeleteMenu(menuId);
          if (res.success) {
            toast.success(`Menu "${menuName}" berhasil dihapus permanen.`);
            loadMenus();
          } else {
            toast.error(`Gagal menghapus: ${res.error}`);
          }
        },
      },
      cancel: { label: "Batal", onClick: () => {} },
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-stone-900">
            <Shell className="size-6 text-emerald-700" aria-hidden="true" /> Daftar Menu Makanan
          </h1>
          <p className="text-xs text-stone-500">
            Kelola, cari, dan {showArchived ? "kelola arsipan" : "kelola"} menu makanan Kerang OISHII
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showArchived
                ? "bg-orange-100 text-orange-700 border border-orange-300"
                : "bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200"
            }`}
          >
            <Archive className="inline size-3.5 mr-2" aria-hidden="true" />
            {showArchived ? "Tampilkan Aktif" : "Lihat Arsipan"}
          </button>
          {!showArchived && (
            <Link
              href="/admin/menus/new"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              + Tambah Menu Baru
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama menu kuliner..."
            className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56 flex items-center gap-2">
          <label className="text-xs font-bold text-stone-400 whitespace-nowrap">Sortir:</label>
          <select
            className="w-full border rounded-xl p-2.5 text-xs outline-none bg-white cursor-pointer focus:ring-2 focus:ring-emerald-500 font-medium"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="latest">Terbaru Masuk</option>
            <option value="name_asc">Nama (A - Z)</option>
            <option value="price_low">Harga: Termurah</option>
            <option value="price_high">Harga: Termahal</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-500 font-bold">
            <tr>
              <th className="p-4">Gambar</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Online</th>
              <th className="p-4">Offline</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400 text-xs font-bold animate-pulse">
                  Memuat data menu...
                </td>
              </tr>
            ) : menus.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400 text-xs">
                  {showArchived ? "Tidak ada menu yang diarsipkan." : "Menu makanan tidak ditemukan."}
                </td>
              </tr>
            ) : (
              menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-emerald-50/50 transition-colors border-b border-stone-100">
                  <td className="p-4">
                    {menu.image_url ? (
                      <img
                        src={menu.image_url}
                        alt={menu.name}
                        className="w-12 h-12 object-cover rounded-xl border border-stone-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Shell className="size-8" aria-hidden="true" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-extrabold text-stone-900">{menu.name}</td>
                  <td className="p-4 text-xs font-semibold text-stone-600">
                    {menu.categories?.name || "Umum"}
                  </td>
                  <td className="p-4 font-bold text-stone-700">
                    Rp {Number(menu.price || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">
                    Rp {Number(menu.offline_price || menu.price || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        menu.is_available
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {menu.is_available ? "Tersedia" : "Habis"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {!showArchived ? (
                        <>
                          <Link
                            href={`/admin/menus/${menu.id}`}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleArchive(menu.id)}
                            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Archive className="size-3.5" aria-hidden="true" /> Arsipkan
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestore(menu.id)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" /> Kembalikan
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleForceDelete(menu.id)}
                        className="px-3 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}