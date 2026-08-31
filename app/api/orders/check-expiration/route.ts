import { NextResponse } from "next/server"; 
import { createAdminClient } from "@/lib/supabase/admin"; 

export async function GET() {   
  try {     
    const supabase = createAdminClient();          
    // Panggil fungsi RPC database untuk pembatalan masal order > 5 menit     
    const { error } = await supabase.rpc("expire_unpaid_orders");     
    if (error) throw error;     
    return NextResponse.json({ success: true, message: "Pengecekan kadaluwarsa selesai." });   
  } catch (err: any) {     
    return NextResponse.json({ error: err.message }, { status: 500 }); 
  }
}