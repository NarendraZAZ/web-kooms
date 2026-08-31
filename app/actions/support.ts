"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitSupportMessage(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const customerName = String(formData.get("customerName") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!customerName || !customerEmail || !message) {
      return { error: "Semua kolom wajib diisi." };
    }

    // Insert pesan ke database
    const { error } = await supabase.from("support_messages").insert({
      customer_id: user?.id || null,
      customer_name: customerName,
      customer_email: customerEmail,
      subject: "Pesan dari Pelanggan",
      message: message,
      status: "unread",
      is_review: false,
      is_featured: false,
    });

    if (error) {
      console.error("Error Detail Supabase Support Message:", error);
      return { error: `Gagal menyimpan pesan: ${error.message}` };
    }

    revalidatePath("/admin/support");
    return { success: true };
  } catch (err: any) {
    console.error("Exception Support Message:", err);
    return { error: err.message || "Pesan belum terkirim. Silakan coba lagi." };
  }
}

export async function resolveSupportMessage(messageId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("support_messages")
      .update({ 
        status: "resolved", 
        resolved_at: new Date().toISOString() 
      })
      .eq("id", messageId);

    if (error) {
      return { error: `Gagal menyelesaikan pesan: ${error.message}` };
    }

    revalidatePath("/admin/support");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem saat memproses permintaan." };
  }
}

export async function toggleMessageAsReview(messageId: string, isReview: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("support_messages")
      .update({ 
        is_review: isReview,
        is_featured: isReview // Menyinkronkan status is_featured dengan is_review
      })
      .eq("id", messageId);

    if (error) {
      return { error: `Gagal memperbarui status review: ${error.message}` };
    }

    revalidatePath("/admin/support");
    revalidatePath("/"); // Memperbarui cache halaman Beranda secara instan
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem saat memproses permintaan." };
  }
}