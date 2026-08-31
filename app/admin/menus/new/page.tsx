import { createClient } from "@/lib/supabase/server";
import MenuForm from "@/components/menu/MenuForm";
import { redirect } from "next/navigation";

export default async function NewMenuPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*");

  const handleCreate = async (formData: any) => {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.from("menus").insert(formData);
    redirect("/admin/menus");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Tambah Menu Baru</h1>
      <MenuForm categories={categories || []} onSubmit={handleCreate} />
    </div>
  );
}