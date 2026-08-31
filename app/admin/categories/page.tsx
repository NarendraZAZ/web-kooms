import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeleteCategoryButton from "@/components/category/DeleteCategoryButton";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*, menus(id, name)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Kelola Kategori Menu</h1>
          <p className="text-xs text-stone-500">
            Daftar Menu Kerang OISHII Berdasarkan Kelompok Menunya
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
        >
          + Kategori Menu Baru
        </Link>
      </div>

      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b text-xs uppercase text-stone-500 font-bold">
            <tr>
              <th className="p-4 text-center">No</th>
              <th className="p-4 text-center">Nama Kategori</th>
              <th className="p-4 text-center">Menu Terkait</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {!categories || categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-stone-400 text-xs">
                  Belum ada kategori menu yang tersedia.
                </td>
              </tr>
            ) : (
              categories.map((cat, index) => (
                <tr key={cat.id} className="hover:bg-stone-50/80 transition-all">
                  <td className="p-4 text-center font-bold text-stone-400">{index + 1}</td>
                  <td className="p-4 font-bold text-stone-800">{cat.name}</td>
                  <td className="p-4 text-xs text-stone-600">
                    {cat.menus && cat.menus.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cat.menus.map((m: any) => (
                          <span
                            key={m.id}
                            className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-semibold hover:bg-emerald-100 transition-all cursor-default"
                            title="Menu dalam kategori ini"
                          >
                            {m.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">
                        Belum ada menu di kategori ini.
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all"
                      >
                        Edit
                      </Link>
                      <DeleteCategoryButton categoryId={cat.id} categoryName={cat.name} />
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