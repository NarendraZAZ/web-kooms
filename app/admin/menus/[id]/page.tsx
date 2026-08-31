import { createClient } from "@/lib/supabase/server";
import MenuForm from "@/components/menu/MenuForm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: categories } = await supabase.from("categories").select("*").order("name");
  const { data: menu } = await supabase.from("menus").select("*").eq("id", id).single();

  if (!menu) notFound();

  async function handleSubmit(formData: any) {
    "use server";
    const supabaseServer = await createClient();

    await supabaseServer
      .from("menus")
      .update({
        name: formData.name,
        category_id: formData.category_id,
        price: Number(formData.price),
        offline_price: Number(formData.offline_price),
        stock: Number(formData.stock),
        description: formData.description,
        image_url: formData.image_url,
        is_available: Number(formData.stock) > 0,
      })
      .eq("id", id);

    revalidatePath("/admin/menus");
    revalidatePath("/menu");
    redirect("/admin/menus");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">Edit Menu Makanan</h1>
        <p className="text-xs text-stone-500">Perbarui informasi hidangan Kerang OISHII</p>
      </div>

      <MenuForm
        categories={categories || []}
        initialData={menu}
        onSubmit={handleSubmit}
      />
    </div>
  );
}