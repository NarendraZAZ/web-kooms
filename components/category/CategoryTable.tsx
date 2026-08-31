import { createClient } from "@/lib/supabase/server";
import DeleteCategoryButton from "./DeleteCategoryButton";
import Link from "next/link";

export default async function CategoryTable() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4 text-red-600">
        {error.message}
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="p-3 text-left">No</th>
          <th className="p-3 text-left">Aksi</th>
          <th className="p-3 text-left">Dibuat</th>
        </tr>
      </thead>

      <tbody>
        {categories?.map((item, index) => (
          <tr key={item.id} className="border-b">
            <td className="p-3">{index + 1}</td>
            <td className="p-3">
            <div className="flex gap-2">
                <Link
                href={`/admin/categories/${item.id}`}
                className="rounded bg-blue-600 px-3 py-1 text-white"
                >
                Edit
                </Link>

                <DeleteCategoryButton id={item.id} />
            </div>
            </td>
            <td className="p-3">{item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}