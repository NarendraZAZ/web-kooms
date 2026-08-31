"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ChevronDown, Plus, Trash2, ArrowRightLeft } from "lucide-react";

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string>("");
  const [category, setCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [categoryMenus, setCategoryMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setCategoryId(id);

      const supabase = createClient();

      // Load category
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (catData) {
        setCategory(catData);
        setCategoryName(catData.name);

        // Load all menus in this category
        const { data: catMenusData } = await supabase
          .from("menus")
          .select("*")
          .eq("category_id", id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        setCategoryMenus(catMenusData || []);

        // Load all other menus (not in this category, includes uncategorized)
        // Use or() to include menus with null category_id or different category_id
        const { data: otherMenusData } = await supabase
          .from("menus")
          .select("*")
          .or(`category_id.is.null,category_id.neq.${id}`)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        setAllMenus(otherMenusData || []);
      }

      setLoading(false);
    })();
  }, [params]);

  const handleAddMenu = async (menuId: string) => {
    const supabase = createClient();
    const menu = allMenus.find((m) => m.id === menuId);

    const { error } = await supabase
      .from("menus")
      .update({ category_id: categoryId })
      .eq("id", menuId);

    if (error) {
      toast.error(`Gagal menambahkan menu: ${error.message}`);
    } else {
      toast.success(`Menu "${menu.name}" ditambahkan ke kategori.`);
      setCategoryMenus([menu, ...categoryMenus]);
      setAllMenus(allMenus.filter((m) => m.id !== menuId));
    }
  };

  const handleRemoveMenu = async (menuId: string) => {
    const supabase = createClient();
    const menu = categoryMenus.find((m) => m.id === menuId);

    const { error } = await supabase
      .from("menus")
      .update({ category_id: null })
      .eq("id", menuId);

    if (error) {
      toast.error(`Gagal menghapus menu: ${error.message}`);
    } else {
      toast.success(`Menu "${menu.name}" dihapus dari kategori.`);
      setCategoryMenus(categoryMenus.filter((m) => m.id !== menuId));
      setAllMenus([menu, ...allMenus]);
    }
  };

  const handleMoveMenu = async (menuId: string, targetCategoryId: string) => {
    const supabase = createClient();
    const menu = categoryMenus.find((m) => m.id === menuId);

    const { error } = await supabase
      .from("menus")
      .update({ category_id: targetCategoryId })
      .eq("id", menuId);

    if (error) {
      toast.error(`Gagal memindahkan menu: ${error.message}`);
    } else {
      toast.success(`Menu "${menu.name}" dipindahkan ke kategori lain.`);
      setCategoryMenus(categoryMenus.filter((m) => m.id !== menuId));
    }
  };

  const handleSaveCategoryName = async () => {
    if (!categoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("categories")
      .update({ name: categoryName })
      .eq("id", categoryId);

    setSaving(false);

    if (error) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } else {
      toast.success("Nama kategori berhasil diperbarui.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20 text-stone-500 font-bold">
        Memuat data kategori...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20 text-stone-500 font-bold">
        Kategori tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-black text-stone-900">Edit Kategori Menu</h1>
        <p className="text-xs text-stone-500">
          Ubah nama kategori, tambahkan, keluarkan, atau pindahkan menu antar kategori
        </p>
      </div>

      {/* Section 1: Edit Nama Kategori */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-stone-900">Nama Kategori</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="flex-1 border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Nama kategori"
          />
          <button
            onClick={handleSaveCategoryName}
            disabled={saving}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* Section 2: Menu di Kategori Ini */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">
            Menu dalam Kategori ({categoryMenus.length})
          </h2>
          {categoryMenus.length > 0 && (
            <span className="text-[11px] font-semibold text-stone-500">
              Hover untuk melihat aksi
            </span>
          )}
        </div>

        {categoryMenus.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs">
            Belum ada menu dalam kategori ini.
          </div>
        ) : (
          <div className="space-y-2">
            {categoryMenus.map((menu) => (
              <div
                key={menu.id}
                className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-lg hover:bg-stone-100 hover:border-stone-200 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-stone-900 truncate">
                    {menu.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Rp {Number(menu.price).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemoveMenu(menu.id)}
                    className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs transition-all"
                    title="Keluarkan dari kategori"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Menu Tersedia untuk Ditambahkan */}
      {allMenus.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900">
            Tambahkan Menu Lain ({allMenus.length})
          </h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allMenus.map((menu) => (
              <div
                key={menu.id}
                className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 hover:border-emerald-200 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-stone-900 truncate">
                    {menu.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {menu.categories?.name || "Tanpa kategori"} •{" "}
                    Rp {Number(menu.price).toLocaleString("id-ID")}
                  </p>
                </div>

                <button
                  onClick={() => handleAddMenu(menu.id)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs transition-all opacity-0 group-hover:opacity-100"
                  title="Tambahkan ke kategori ini"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/categories")}
        className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-all"
      >
        ← Kembali ke Daftar Kategori
      </button>
    </div>
  );
}