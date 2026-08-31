"use server"; 

import { createClient } from "@/lib/supabase/server"; 
import { revalidatePath } from "next/cache"; 

// Helper untuk mengubah objek options menjadi string yang rapi 
function parseOptionsToString(options: Record<string, string> | string | undefined): string | null {   
  if (!options) return null;   
  if (typeof options === "string") return options;   
  if (typeof options === "object") {     
    const values = Object.values(options).filter(Boolean);     
    return values.length > 0 ? values.join(" - ") : null;   
  }
  return null; 
}

// 1. Menambahkan menu ke keranjang dengan validasi Active Order, Stok, dan Opsi 
export async function addToCart(   
  menuId: string,   
  quantity: number = 1,   
  options?: Record<string, string> | string
) {   
  const supabase = await createClient();   
  const {     
    data: { user },   
  } = await supabase.auth.getUser();   

  if (!user) {     
    return { success: false, error: "Anda harus login terlebih dahulu." };   
  }

  // Cek Active Order pada Customer (waiting_payment, processing, ready_pickup)   
  const { data: activeOrder } = await supabase     
    .from("orders")     
    .select("id, order_number, order_status")     
    .eq("customer_id", user.id)     
    .in("order_status", ["waiting_payment", "processing", "ready_pickup"])     
    .maybeSingle();   

  if (activeOrder) {     
    return {       
      success: false,       
      error: `Anda masih memiliki pesanan aktif #${activeOrder.order_number}. Silakan selesaikan pesanan tersebut terlebih dahulu sebelum menambah menu baru.`,     
    };   
  }

  // Cek ketersediaan stok menu   
  const { data: menu } = await supabase     
    .from("menus")     
    .select("stock, is_available")     
    .eq("id", menuId)     
    .single();   

  if (!menu || !menu.is_available || menu.stock < quantity) {     
    return { success: false, error: "Stok menu tidak mencukupi atau tidak tersedia." };   
  }

  // Format opsi menjadi string untuk disimpan di kolom options   
  const formattedOptions = parseOptionsToString(options);   

  // Cek apakah item dengan menu_id DAN options yang sama sudah ada di keranjang   
  let query = supabase     
    .from("cart_items")     
    .select("id, quantity")     
    .eq("user_id", user.id)     
    .eq("menu_id", menuId);   

  if (formattedOptions) {     
    query = query.eq("options", formattedOptions);   
  } else {     
    query = query.is("options", null);   
  }

  const { data: existingItem } = await query.maybeSingle();   

  if (existingItem) {     
    const { error } = await supabase       
      .from("cart_items")       
      .update({ quantity: existingItem.quantity + quantity })       
      .eq("id", existingItem.id);     
    if (error) return { success: false, error: error.message };   
  } else {     
    const { error } = await supabase.from("cart_items").insert({       
      user_id: user.id,       
      menu_id: menuId,       
      quantity,       
      options: formattedOptions,     
    });     
    if (error) return { success: false, error: error.message };   
  }

  revalidatePath("/cart");   
  return { success: true }; 
}

// 2. Mengubah jumlah item di keranjang 
export async function updateCartQuantity(cartItemId: string, newQuantity: number) {   
  const supabase = await createClient();   
  if (newQuantity <= 0) {     
    return await removeCartItem(cartItemId);   
  }
  const { error } = await supabase     
    .from("cart_items")     
    .update({ quantity: newQuantity })     
    .eq("id", cartItemId);   
  if (error) {     
    throw new Error(error.message);   
  }
  revalidatePath("/cart"); 
}

// 3. Menghapus item dari keranjang 
export async function removeCartItem(cartItemId: string) {   
  const supabase = await createClient();   
  const { error } = await supabase     
    .from("cart_items")     
    .delete()     
    .eq("id", cartItemId);   
  if (error) {     
    throw new Error(error.message);   
  }
  revalidatePath("/cart"); 
}