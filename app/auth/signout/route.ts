import { createClient } from "@/lib/supabase/server"; 
import { NextResponse } from "next/server"; 

export async function POST(request: Request) {   
  const supabase = await createClient();   
  // Cek user yang sedang login   
  const {     
    data: { user },   
  } = await supabase.auth.getUser();   

  if (user) {     
    // 1. Cek apakah user masih memiliki keranjang aktif (cart_items)     
    const { data: cartItems } = await supabase       
      .from("cart_items")       
      .select("id")       
      .eq("user_id", user.id)       
      .limit(1);     

    if (cartItems && cartItems.length > 0) {       
      return NextResponse.json(         
        {           
          error: "Anda tidak dapat logout karena masih memiliki keranjang belanja aktif. Selesaikan checkout atau kosongkan keranjang terlebih dahulu.",         
        },         
        { status: 403 }       
      );     
    }     

    // 2. Cek apakah ada pesanan yang belum selesai (unfinished orders)     
    const { data: unfinishedOrders } = await supabase       
      .from("orders")       
      .select("id, order_number, order_status, payment_status")       
      .eq("customer_id", user.id)       
      .not("order_status", "in", '("completed","cancelled","rejected")')       
      .limit(1);     

    if (unfinishedOrders && unfinishedOrders.length > 0) {       
      return NextResponse.json(         
        {           
          error: "Anda tidak dapat logout selama masih ada pesanan yang belum diselesaikan. Harap tunggu hingga pesanan selesai atau dibatalkan.",           
          unfinishedOrder: unfinishedOrders[0],         
        },         
        { status: 403 }       
      );     
    }   
  }

  // Hapus sesi di Supabase Auth jika aman   
  await supabase.auth.signOut();   
  const requestUrl = new URL(request.url);   
  return NextResponse.redirect(`${requestUrl.origin}/login`, {     
    status: 301,   
  }); 
}