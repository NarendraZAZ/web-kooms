"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, CreditCard, Package, Truck, Check, AlertCircle } from "lucide-react";
import { markOrderAsPaid } from "../actions/payment";

declare global {
  interface Window {
    snap: any;
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [nowTime, setNowTime] = useState(Date.now());
  const supabase = createClient();

  const fetchOrders = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, menus(*))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const checkExpiration = async () => {
      try {
        await fetch("/api/orders/check-expiration", { method: "GET" });
        fetchOrders();
      } catch (error) {
        console.error("Gagal sinkronisasi API kadaluwarsa:", error);
      }
    };

    checkExpiration();

    const expirationInterval = setInterval(checkExpiration, 30000);
    const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);

    const channel = supabase
      .channel("customer-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => {
      clearInterval(expirationInterval);
      clearInterval(timerInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePay = async (order: any) => {
    setPayLoading(true);
    try {
      const response = await fetch("/api/tokenizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.order_number }),
      });

      const tokenData = await response.json();
      if (!response.ok || !tokenData.token) {
        toast.error(tokenData.message || tokenData.error || "Gagal mendapatkan token pembayaran.");
        setPayLoading(false);
        return;
      }

      if (window.snap) {
        window.snap.pay(tokenData.token, {
          onSuccess: async () => {
            const res = await markOrderAsPaid(order.order_number);
            if (res.success) {
              toast.success("Pembayaran berhasil! Pesanan Anda sedang dimasak.");
              fetchOrders();
              router.refresh();
            } else {
              toast.error(res.error || "Gagal mengupdate status ke database.");
            }
          },
          onPending: () => {
            toast.info("Menunggu pembayaran diselesaikan.");
          },
          onError: () => {
            toast.error("Pembayaran gagal atau dibatalkan.");
          },
        });
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const getTimerRemaining = (createdAt: string) => {
    const expireTime = new Date(createdAt).getTime() + 5 * 60 * 1000;
    const diff = expireTime - nowTime;
    if (diff <= 0) return null;
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getOrderStatusInfo = () => [
    { key: "waiting_payment", label: "Menunggu Pembayaran", icon: CreditCard },
    { key: "processing", label: "Diproses / Dimasak", icon: Package },
    { key: "ready_pickup", label: "Siap Diambil", icon: Truck },
    { key: "completed", label: "Selesai", icon: Check },
  ];

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-center py-20 text-stone-500 font-bold text-sm">Memuat pesanan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-black text-stone-900">Pesanan Saya</h1>
        <p className="text-xs text-stone-500">Pantau status pre-order pickup secara realtime</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border rounded-3xl p-12 text-center text-stone-400 text-xs">Belum ada pesanan.</div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            // isPaid: order sudah dibayar ATAU sudah melewati tahap "menunggu pembayaran"
            const isPaid = order.payment_status === "paid" || order.order_status !== "waiting_payment";
            const isCancelled = order.order_status === "cancelled";
            // timeLeft HANYA relevan untuk order yang BELUM dibayar & belum batal.
            // Jangan pakai timeLeft untuk menentukan "expired" pada order yang sudah paid!
            const timeLeft = !isPaid && !isCancelled ? getTimerRemaining(order.created_at) : null;
            // Order dianggap benar-benar kedaluwarsa hanya jika BELUM dibayar, BELUM dibatalkan manual,
            // dan waktu 5 menit sudah habis.
            const isExpired = !isPaid && !isCancelled && !timeLeft;

            let badgeLabel: string;
            let badgeClass: string;
            if (isPaid) {
              badgeLabel = "Sudah Dibayar";
              badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-200";
            } else if (isCancelled || isExpired) {
              badgeLabel = "Dibatalkan / Expired";
              badgeClass = "bg-red-100 text-red-900 border-red-200";
            } else {
              badgeLabel = "Menunggu Pembayaran";
              badgeClass = "bg-blue-100 text-blue-900 border-blue-200";
            }

            return (
              <div key={order.id} className="bg-white border rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <span className="text-xs font-black text-emerald-800 uppercase block">NO. PESANAN: {order.order_number}</span>
                    <span className="text-[11px] text-stone-500 font-semibold">
                      <CalendarClock className="mr-1 inline size-3.5" /> Pickup: {order.pickup_date} Pukul {order.pickup_time} WIB
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                </div>

                {/* Progress bar: tampil untuk SEMUA order yang tidak dibatalkan/expired,
                    tidak peduli apakah masih menunggu bayar atau sudah paid.
                    Sebelumnya ini bergantung pada `timeLeft`, yang selalu null setelah dibayar,
                    jadi progress bar hilang total begitu order dibayar. */}
                {!isCancelled && !isExpired && (
                  <div className="bg-stone-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {getOrderStatusInfo().map((stage) => {
                        const order_sequence = ["waiting_payment", "processing", "ready_pickup", "completed"];
                        const isActive = order_sequence.indexOf(order.order_status) >= order_sequence.indexOf(stage.key);
                        const isCurrent = order.order_status === stage.key;
                        const Icon = stage.icon;

                        return (
                          <div key={stage.key} className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                              isCurrent ? "bg-orange-600 text-white shadow-md" : isActive ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-400"
                            }`}>
                              <Icon className="size-4" />
                            </div>
                            <p className={`text-[9px] font-bold text-center ${isCurrent ? "text-orange-700" : isActive ? "text-emerald-700" : "text-stone-400"}`}>
                              {stage.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-stone-50/70 rounded-2xl p-4 border space-y-2">
                  <p className="text-[10px] font-black uppercase text-stone-400">Detail Menu:</p>
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs font-semibold text-stone-800">
                      <span>{item.quantity}x {item.menus?.name || "Menu"}</span>
                      <span>Rp {Number(item.subtotal || item.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">Total Biaya</span>
                    <span className="text-lg font-black text-emerald-900">Rp {Number(order.total).toLocaleString("id-ID")}</span>
                  </div>

                  {!isPaid && !isCancelled && (
                    <div className="flex items-center gap-3">
                      {timeLeft ? (
                        <>
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block font-bold">Sisa Waktu Bayar</span>
                            <span className="text-xs font-black text-red-600 font-mono">{timeLeft}</span>
                          </div>
                          <button
                            onClick={() => handlePay(order)}
                            disabled={payLoading}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                          >
                            Bayar Sekarang
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-red-700 font-bold flex items-center gap-1.5 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                          <AlertCircle className="size-4" /> Kedaluwarsa
                        </span>
                      )}
                    </div>
                  )}

                  {isPaid && (
                    <span className="text-xs font-black px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-900 border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-600" /> Pembayaran Berhasil
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}