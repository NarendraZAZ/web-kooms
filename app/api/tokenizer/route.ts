import { NextResponse } from "next/server";
import Midtrans from "midtrans-client";
import { createAdminClient } from "@/lib/supabase/admin";

const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID wajib diisi." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verification Status Order di DB KOOMS
    // Coba match dengan order_number lengkap atau yang diclean dari suffix
    let order = null;
    let error = null;

    // Coba match full order_id first
    const { data: fullMatch, error: fullError } = await supabase
      .from("orders")
      .select("*, order_items(*, menus(name))")
      .eq("order_number", orderId)
      .maybeSingle();

    if (fullMatch) {
      order = fullMatch;
    } else if (fullError) {
      error = fullError;
    }

    if (!order && !error) {
      // Jika tidak ketemu, coba clean nomor order (ambil KMS-XXXXXX tanpa suffix)
      const cleanId = orderId.split("-").slice(0, 2).join("-");
      const { data: cleanMatch, error: cleanError } = await supabase
        .from("orders")
        .select("*, order_items(*, menus(name))")
        .eq("order_number", cleanId)
        .maybeSingle();

      if (cleanMatch) {
        order = cleanMatch;
      } else if (cleanError) {
        error = cleanError;
      }
    }

    if (error || !order) {
      console.error("Order tidak ditemukan untuk ID:", orderId, "Error:", error?.message);
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // PENCEGAHAN DUPLICATE PAYMENT: Jika sudah LUNAS, tolak tokenization baru (409 Conflict)
    if (order.payment_status === "paid" || order.payment_status === "success") {
      return NextResponse.json(
        { success: false, message: "Pesanan ini sudah berhasil dibayar dan tidak dapat dibayar ulang." },
        { status: 409 }
      );
    }

    // PENCEGAHAN EXPIRED ORDER: Pembatalan jika waktu > 5 menit
    const createdAt = new Date(order.created_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 5 && order.order_status === "waiting_payment") {
      await supabase
        .from("orders")
        .update({ order_status: "cancelled", payment_status: "expired" })
        .eq("id", order.id);

      return NextResponse.json(
        { success: false, message: "Pesanan ini sudah kedaluwarsa (melebihi batas 5 menit)." },
        { status: 410 }
      );
    }

    // Gunakan CLEAN order number untuk Midtrans (tanpa suffix)
    const cleanOrderNumber = order.order_number.split("-").slice(0, 2).join("-");

    const parameter = {
      transaction_details: {
        order_id: cleanOrderNumber,
        gross_amount: Number(order.total),
      },
      customer_details: {
        first_name: order.customer_id,
      },
    };

    try {
      const token = await snap.createTransactionToken(parameter);
      return NextResponse.json({ token, orderId: order.id });
    } catch (snapErr: any) {
      console.error("Snap Create Token Error:", snapErr);
      
      // Jika error karena order_id sudah ada, cek apakah order sudah lunas
      if (snapErr.message?.includes("already been taken")) {
        // Kembalikan status sukses karena order sudah registered di Midtrans
        return NextResponse.json({
          token: null,
          message: "Order sudah registered di Midtrans. Mengarahkan ke verifikasi...",
          orderId: order.id,
          status: "already_registered"
        }, { status: 200 });
      }
      
      throw snapErr;
    }
  } catch (err: any) {
    console.error("Tokenizer Error:", err);
    return NextResponse.json({ error: err.message || "Gagal membuat token pembayaran." }, { status: 500 });
  }
}