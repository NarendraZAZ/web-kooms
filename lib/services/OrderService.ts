import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export class OrderService {
  private supabase: SupabaseClient;

  constructor(_supabaseClient: SupabaseClient) {
    // PENTING: operasi admin (ubah status, hapus order) WAJIB pakai
    // service-role client agar tidak diblokir RLS ketika admin
    // memodifikasi order milik customer lain.
    this.supabase = createAdminClient();
  }

  public async getAllOrders() {
    const { data, error } = await this.supabase
      .from("orders")
      .select(
        "*, profiles (full_name, phone, email), order_items ( id, quantity, price, subtotal, menus (name) )"
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  public async updateOrderStatus(
    orderId: string,
    newOrderStatus: string,
    newPaymentStatus?: string
  ) {
    const { data: currentOrder, error: fetchError } = await this.supabase
      .from("orders")
      .select("order_status, payment_status, payment_method, total")
      .eq("id", orderId)
      .single();

    if (fetchError || !currentOrder) {
      return { error: fetchError?.message || "Order tidak ditemukan." };
    }

    const terminalStatuses = ["completed", "cancelled", "rejected"];
    if (terminalStatuses.includes(currentOrder.order_status)) {
      return {
        error: `Pesanan sudah berstatus "${currentOrder.order_status}" dan tidak dapat diubah lagi.`,
      };
    }

    const updateData: { order_status: string; payment_status?: string } = {
      order_status: newOrderStatus,
    };

    if (newPaymentStatus) {
      updateData.payment_status = newPaymentStatus;
    }

    const { data: order, error } = await this.supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) return { error: error.message };

    const wasAlreadyPaid = ["paid", "success"].includes(currentOrder.payment_status);
    const isNowPaid = newOrderStatus === "completed" || newPaymentStatus === "paid";

    if (isNowPaid && !wasAlreadyPaid) {
      await this.recordPayment(orderId, order.payment_method, order.total);
    }

    return { success: true, order };
  }

  public async deleteOrder(orderId: string) {
    await this.supabase.from("order_items").delete().eq("order_id", orderId);
    const { error } = await this.supabase.from("orders").delete().eq("id", orderId);

    if (error) return { error: error.message };
    return { success: true };
  }

  private async recordPayment(orderId: string, paymentMethod: string, amount: number) {
    await this.supabase.from("payments").upsert(
      {
        order_id: orderId,
        payment_method: paymentMethod,
        amount: amount,
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      },
      { onConflict: "order_id" }
    );
  }
}