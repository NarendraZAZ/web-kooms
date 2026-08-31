"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMenu(menuId: string, formData: any) {
  const supabase = await createClient();

  const { error } = await supabase
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
    .eq("id", menuId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/menus");
  revalidatePath("/menu");
  return { success: true };
}

export async function deleteMenu(menuId: string) {
  const supabase = await createClient();

  await supabase.from("cart_items").delete().eq("menu_id", menuId);

  const { error } = await supabase.from("menus").delete().eq("id", menuId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Menu ini tidak dapat dihapus karena sudah tercatat dalam riwayat transaksi pesanan. Nonaktifkan stok (set ke 0) sebagai gantinya.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/menus");
  revalidatePath("/menu");
  return { success: true };
}