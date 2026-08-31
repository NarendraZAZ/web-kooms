"use server"; 

import { createClient } from "@/lib/supabase/server"; 
import { OrderService } from "@/lib/services/OrderService"; 
import { revalidatePath } from "next/cache"; 

export async function updateOrderStatus(   
  orderId: string,   
  newOrderStatus: string,   
  newPaymentStatus?: string
) {
  const supabase = await createClient();   
  // 1. Instansiasi Object dari Class OrderService (PBO)   
  const orderService = new OrderService(supabase);   
  // 2. Memanggil Public Method milik Object OrderService   
  const result = await orderService.updateOrderStatus(     
    orderId,     
    newOrderStatus,     
    newPaymentStatus   
  );   
  if (result.error) {     
    return { error: result.error };
  }
  // 3. Refresh cache halaman admin   
  revalidatePath("/admin/orders");   
  revalidatePath("/admin/payments");   
  revalidatePath("/admin/reports");   
  return { success: true };
}

export async function deleteCategory(categoryId: string) {   
  try {     
    const supabase = await createClient();     
    // 1. Pertama, uncategorize semua menu yang ada di kategori ini     
    const { error: updateError } = await supabase       
      .from("menus")       
      .update({ category_id: null })       
      .eq("category_id", categoryId);     
    if (updateError) {       
      return { error: `Gagal uncategorize menu: ${updateError.message}` };     
    }     
    // 2. Setelah itu, hapus kategorinya     
    const { error: deleteError } = await supabase       
      .from("categories")       
      .delete()       
      .eq("id", categoryId);     
    if (deleteError) {       
      return { error: `Gagal menghapus kategori: ${deleteError.message}` };     
    }     
    revalidatePath("/admin/categories");     
    return { success: true };   
  } catch (err: any) {     
    return { error: err.message || "Terjadi kesalahan saat menghapus kategori." };
  }
}