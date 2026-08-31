"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markOrderAsPaid } from "@/app/actions/payment";
import { toast } from "sonner";
import { CreditCard, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    snap: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    pickupDate: new Date().toISOString().split("T")[0],
    pickupTime: "12:00",
    notes: "",
  });
  const supabase = createClient();

  useEffect(() => {
    const loadCartAndActiveOrder = async () => {
      setCartLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Validasi Active Order
        const { data: activeOrderData } = await supabase
          .from("orders")
          .select("id, order_number, order_status")
          .eq("customer_id", user.id)
          .in("order_status", ["waiting_payment", "processing", "ready_pickup"])
          .maybeSingle();

        if (activeOrderData) {
          setActiveOrder(activeOrderData);
        }

        const { data } = await supabase
          .from("cart_items")
          .select("*, menus(*)")
          .eq("user_id", user.id);

        setCartItems(data || []);
      }
      setCartLoading(false);
    };

    loadCartAndActiveOrder();

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setFormData((prev) => ({ ...prev, pickupTime: `${hours}:${minutes}` }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeOrder) {
      toast.error("Anda masih memiliki pesanan aktif.");
      return;
    }
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Silakan login terlebih dahulu.");
        setLoading(false);
        return;
      }

      // 1. Ambil item keranjang & hitung total
      const { data: items, error: cartError } = await supabase
        .from("cart_items")
        .select("*, menus(*)")
        .eq("user_id", user.id);

      if (cartError || !items || items.length === 0) {
        toast.error("Keranjang belanja Anda kosong.");
        setLoading(false);
        return;
      }

      const totalAmount = items.reduce((sum, item) => {
        const price = item.menus?.offline_price || item.menus?.price || 0;
        return sum + price * item.quantity;
      }, 0);

      // Unique Order Number dengan UUID untuk mencegah duplikasi
      const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderNumber = `KMS-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;

      // 2. Simpan Order ke DB
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          order_number: orderNumber,
          pickup_date: formData.pickupDate,
          pickup_time: formData.pickupTime,
          payment_method: "midtrans",
          total: totalAmount,
          notes: formData.notes || "",
          order_status: "waiting_payment",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // 3. Simpan Item Pesanan
      const orderItemsData = items.map((item) => {
        const unitPrice = item.menus?.offline_price || item.menus?.price || 0;
        return {
          order_id: newOrder.id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          price: unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData);
      if (itemsError) throw new Error(itemsError.message);

      // 4. Bersihkan Keranjang Belanja
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      // 5. Minta Snap Token dari Midtrans
      const response = await fetch("/api/tokenizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: newOrder.order_number }),
      });

      const tokenData = await response.json();
      
      // Handle case where order sudah registered di Midtrans
      if (tokenData.status === "already_registered") {
        console.log("[Token] Order already registered di Midtrans");
        toast.info("Pesanan Anda sudah terdaftar. Melanjutkan ke halaman pesanan...");
        setTimeout(() => {
          router.push("/orders");
        }, 2000);
        return;
      }
      
      if (!response.ok || tokenData.error || !tokenData.token) {
        throw new Error(tokenData.error || "Gagal mendapatkan Snap token.");
      }

      // 6. Tampilkan Pop-up Midtrans Snap
      if (window.snap) {
        window.snap.pay(tokenData.token, {
          onSuccess: async (result: any) => {
            console.log("[Payment Success] Midtrans result:", result);
            
            // Gunakan order_number yang disimpan, atau fallback ke result.order_id
            const targetId = newOrder.order_number;
            
            try {
              const res = await markOrderAsPaid(targetId);

              if (res.success) {
                toast.success("Pembayaran berhasil! Pesanan Anda sedang dimasak.");
                console.log(`[Success] Order ${targetId} marked as paid`);
              } else {
                console.error("[Error] markOrderAsPaid failed:", res.error);
                toast.error(`Pembayaran berhasil tapi gagal update status: ${res.error || "Silakan hubungi support."}`);
              }
            } catch (updateErr: any) {
              console.error("[Exception] markOrderAsPaid error:", updateErr);
              toast.error("Pembayaran berhasil tapi gagal update status. Silakan hubungi support.");
            } finally {
              // Tunggu 1 detik sebelum navigate untuk memastikan toast terlihat
              setTimeout(() => {
                router.push("/orders");
              }, 1000);
            }
          },
          onPending: () => {
            console.log("[Payment Pending] Waiting for customer action");
            toast.info("Menunggu pembayaran diselesaikan. Anda akan diarahkan ke halaman pesanan...");
            setTimeout(() => {
              router.push("/orders");
            }, 2000);
          },
          onError: (error: any) => {
            console.error("[Payment Error]", error);
            toast.error("Pembayaran gagal atau dibatalkan. Silakan coba lagi.");
            setTimeout(() => {
              router.push("/orders");
            }, 2000);
          },
          onClose: () => {
            console.log("[Snap Closed] User closed payment popup");
            toast.info("Anda ditarik keluar dari pembayaran. Pesanan Anda masih menunggu pembayaran.");
            setTimeout(() => {
              router.push("/orders");
            }, 2000);
          },
        });
      } else {
        console.error("Midtrans Snap not loaded");
        toast.error("Midtrans Snap belum ter-load. Silakan refresh halaman.");
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(`Gagal Checkout: ${err.message || "Terjadi kesalahan sistem."}`);
    } finally {
      setLoading(false);
    }
  };

  if (activeOrder) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4 text-center my-12">
        <div className="bg-amber-50 border-2 border-amber-400 p-6 rounded-3xl space-y-4 shadow-xs">
          <AlertTriangle className="size-10 text-amber-600 mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-black text-amber-900">Checkout Terkunci</h2>
          <p className="text-xs text-amber-800 font-semibold leading-relaxed">
            Anda masih memiliki pesanan aktif <strong>#{activeOrder.order_number}</strong>. Harap selesaikan pesanan tersebut terlebih dahulu.
          </p>
          <Link
            href="/orders"
            className="inline-block px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md transition-all"
          >
            Lihat Pesanan Saya
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cart" className="p-2 border rounded-xl hover:bg-slate-100 text-slate-600 transition-all">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Form Pre-Order Pickup</h1>
          <p className="text-xs text-slate-500">Isi waktu penjemputan pesanan di lokasi Kerang OISHII</p>
        </div>
      </div>

      {!cartLoading && cartItems.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-black uppercase text-emerald-900">Ringkasan Pesanan</p>
          <div className="space-y-2">
            {cartItems.map((item) => {
              const price = item.menus?.offline_price || item.menus?.price || 0;
              return (
                <div key={item.id} className="flex justify-between items-center text-xs text-emerald-950 font-semibold">
                  <span>{item.quantity}x {item.menus?.name}</span>
                  <span>Rp {Number(price * item.quantity).toLocaleString("id-ID")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 border rounded-2xl shadow-xs">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tanggal Penjemputan</label>
          <input
            type="date"
            required
            className="w-full border rounded-xl p-2.5 text-sm outline-none"
            value={formData.pickupDate}
            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Jam Penjemputan</label>
          <input
            type="time"
            required
            className="w-full border rounded-xl p-2.5 text-sm outline-none"
            value={formData.pickupTime}
            onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Metode Pembayaran</label>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
            <CreditCard className="size-5 text-orange-700" />
            <div>
              <p className="font-bold text-xs text-orange-950">Midtrans Payment Gateway</p>
              <p className="text-[10px] text-orange-800">QRIS / Transfer Bank / E-Wallet</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Catatan Pesanan</label>
          <textarea
            rows={2}
            className="w-full border rounded-xl p-2.5 text-sm outline-none"
            placeholder="Contoh: Sambal dipisah..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Memproses..." : "Bayar via Midtrans Snap"}
        </button>
      </form>
    </div>
  );
}