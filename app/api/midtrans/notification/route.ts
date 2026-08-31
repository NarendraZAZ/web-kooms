import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Menggunakan Service Role Client agar bisa update data tanpa terhalang RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { order_id, transaction_status, fraud_status, transaction_id } = body;

    if (!order_id) {
      console.warn("Webhook received dengan order_id kosong");
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    console.log(`[Midtrans Webhook] Processing order: ${order_id}, status: ${transaction_status}`);

    // Ambil order_number murni (misal: KMS-921928) dari order_id Midtrans
    // Midtrans mengirim format: KMS-XXXXXX (tanpa suffix yang kami tambahkan)
    const cleanOrderNumber = order_id.split("-").slice(0, 2).join("-");

    let paymentStatus = "pending";
    let orderStatus = "waiting_payment";

    // 1. Tentukan status berdasarkan response Midtrans
    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "challenge") {
        paymentStatus = "challenge";
        orderStatus = "waiting_payment"; // Menunggu resolusi fraud
      } else {
        paymentStatus = "paid";
        orderStatus = "processing"; // LANGSUNG KE SEDANG DIMASAK SAAT PEMBAYARAN SUKSES
      }
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      paymentStatus = "failed";
      orderStatus = "cancelled";
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
      orderStatus = "waiting_payment";
    }

    // 2. Cari order terlebih dahulu untuk validasi
    const { data: existingOrder, error: findError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, payment_status, order_status")
      .or(`order_number.eq.${cleanOrderNumber},order_number.ilike.${cleanOrderNumber}-%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Gagal mencari order:", findError.message);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!existingOrder) {
      console.error(`Order tidak ditemukan untuk: ${cleanOrderNumber}`);
      return NextResponse.json({ error: `Order ${cleanOrderNumber} tidak ditemukan` }, { status: 404 });
    }

    // 3. IDEMPOTENCY CHECK: Jika sudah diupdate ke "processing" atau lebih lanjut, jangan update lagi
    if (
      paymentStatus === "paid" &&
      (existingOrder.payment_status === "paid" || existingOrder.payment_status === "success")
    ) {
      console.log(`[Idempotency] Order ${existingOrder.order_number} sudah dibayar, skip update`);
      return NextResponse.json({ message: "Order sudah diproses sebelumnya" }, { status: 200 });
    }

    // 4. VALIDASI: Hanya update jika status berubah ke "paid" atau status lainnya
    if (paymentStatus !== "pending" || orderStatus !== "waiting_payment") {
      console.log(
        `[Update Order] ${existingOrder.order_number}: ${existingOrder.payment_status} -> ${paymentStatus}, status: ${existingOrder.order_status} -> ${orderStatus}`
      );

      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: paymentStatus,
          order_status: orderStatus,
          midtrans_transaction_id: transaction_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingOrder.id)
        .select()
        .single();

      if (updateError) {
        console.error("Gagal update status order:", updateError.message);
        return NextResponse.json(
          { error: `Gagal update order: ${updateError.message}` },
          { status: 500 }
        );
      }

      // 5. Log payment record
      if (paymentStatus === "paid" || paymentStatus === "challenge") {
        try {
          await supabaseAdmin.from("payments").insert({
            order_id: existingOrder.id,
            payment_method: "midtrans",
            amount: updatedOrder.total || 0,
            payment_status: paymentStatus,
            midtrans_transaction_id: transaction_id,
            paid_at: new Date().toISOString(),
          });
          console.log(`[Payment Recorded] Order ${existingOrder.order_number}`);
        } catch (payErr) {
          console.warn("Warning saat logging payment:", payErr);
        }
      }

      return NextResponse.json(
        {
          message: "Notification handled successfully",
          orderNumber: existingOrder.order_number,
          newStatus: orderStatus,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Notification handled successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}