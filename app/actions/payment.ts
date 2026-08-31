"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function markOrderAsPaid(orderIdentifier: string) {
  try {
    const supabase = createAdminClient();

    const cleanOrderNumber = orderIdentifier.split("-").slice(0, 2).join("-");
    console.log(`[markOrderAsPaid] Processing order: ${cleanOrderNumber} (original: ${orderIdentifier})`);

    const { data: existingOrder, error: findError } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, order_status")
      .or(`order_number.eq.${cleanOrderNumber},order_number.ilike.${cleanOrderNumber}-%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Gagal mencari order:", findError.message);
      return { success: false, error: `Database error: ${findError.message}` };
    }
    if (!existingOrder) {
      console.error("Pesanan tidak ditemukan untuk:", cleanOrderNumber);
      return { success: false, error: `Pesanan (${cleanOrderNumber}) tidak ditemukan.` };
    }

    if (existingOrder.payment_status === "paid" || existingOrder.payment_status === "success") {
      console.log(`[Idempotency] Order ${existingOrder.order_number} sudah dibayar`);
      return { success: true, message: "Order sudah ditandai sebagai dibayar sebelumnya" };
    }

    const terminalOrderStatuses = ["cancelled", "rejected", "completed"];
    if (terminalOrderStatuses.includes(existingOrder.order_status)) {
      console.warn(
        `[Blocked] Order ${existingOrder.order_number} berstatus "${existingOrder.order_status}", pembayaran ditolak.`
      );
      return {
        success: false,
        error: `Pesanan sudah berstatus "${existingOrder.order_status}" dan tidak dapat diproses sebagai pembayaran baru.`,
      };
    }

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from("orders")
      .update({
        payment_method: "midtrans",
        payment_status: "paid",
        order_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingOrder.id)
      .select()
      .single();

    if (updateOrderError) {
      console.error("Gagal update status pesanan:", updateOrderError.message);
      return { success: false, error: `Gagal update pesanan: ${updateOrderError.message}` };
    }
    console.log(
      `[Order Updated] ${existingOrder.order_number}: payment_status=paid, order_status=processing`
    );

    try {
      await supabase.from("payments").upsert(
        {
          order_id: existingOrder.id,
          payment_method: "midtrans",
          amount: existingOrder.total || 0,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        },
        { onConflict: "order_id" }
      );
      console.log(`[Payment Logged] Order ${existingOrder.order_number}`);
    } catch (payErr: any) {
      console.warn("Warning saat logging payment:", payErr.message);
    }

    revalidatePath("/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/reports");
    revalidatePath("/cart");
    return { success: true, orderId: existingOrder.id };
  } catch (err: any) {
    console.error("Server Action markOrderAsPaid Error:", err);
    return { success: false, error: err.message || "Terjadi kesalahan sistem." };
  }
}