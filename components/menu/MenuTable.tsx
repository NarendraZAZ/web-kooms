import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MenuTable() {
  const supabase = await createClient();

  const { data: menus, error } = await supabase
    .from("menus")
    .select(`
      *,
      categories (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-red-500 p-4 text-red-500">
        {error.message}
      </div>
    );
  }

  if (!menus?.length) {
    return (
      <div className="rounded-lg border p-6 text-center">
        Belum ada menu.
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="p-3 text-left">Gambar</th>
          <th className="p-3 text-left">Nama</th>
          <th className="p-3 text-left">Kategori</th>
          <th className="p-3 text-left">Online</th>
          <th className="p-3 text-left">Offline</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {menus.map((menu) => (
          <tr key={menu.id} className="border-b">
            <td className="p-3">
              {menu.image_url ? (
                <img
                  src={menu.image_url}
                  alt={menu.name}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                "-"
              )}
            </td>

            <td className="p-3">{menu.name}</td>

            <td className="p-3">
              {menu.categories?.name}
            </td>

            <td className="p-3">
              Rp {menu.price.toLocaleString("id-ID")}
            </td>

            <td className="p-3">
              Rp {menu.offline_price ? Number(menu.offline_price).toLocaleString("id-ID") : Number(menu.price).toLocaleString("id-ID")}
            </td>

            <td className="p-3">
              {menu.is_available ? "Tersedia" : "Habis"}
            </td>

            <td className="p-3">
              <Link
                href={`/admin/menus/${menu.id}`}
                className="rounded bg-blue-600 px-3 py-1 text-white"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}