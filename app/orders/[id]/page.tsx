"use client";

import { use, useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, ChefHat, CreditCard, Clock3 } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

export default function LiveOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const supabase = createClient();

  const fetchOrder = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id, quantity, price, subtotal,
          menus (name, image_url)
        )
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (data) {
      setOrder(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    const channel = supabase
      .channel(`realtime-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handleMidtransPayment = async () => {
    if (!order) return;
    setPayLoading(true);
    try {
      const response = await fetch("/api/tokenizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.order_number }),
      });

      const tokenData = await response.json();
      if (!tokenData.token) {
        throw new Error(tokenData.message || tokenData.error || "Gagal mendapatkan token Midtrans.");
      }

      if (window.snap) {
        window.snap.pay(tokenData.token, {
          onSuccess: async () => {
            fetchOrder();
            toast.success("Pembayaran berhasil! Pesanan Anda sedang diproses.");
          },
          onPending: () => {
            toast.info("Menunggu pembayaran diselesaikan.");
          },
          onError: () => {
            toast.error("Pembayaran gagal, silakan coba lagi.");
          },
        });
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-600">Memuat status pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white border rounded-2xl space-y-4">
        <p className="text-red-600 font-bold">Pesanan tidak ditemukan.</p>
        <Link href="/orders" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold">
          Kembali ke Pesanan Saya
        </Link>
      </div>
    );
  }

  const isPaidOrProcessing = order.payment_status === "paid" || order.order_status !== "waiting_payment";

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js"}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />
      <div className="flex justify-between items-center">
        <Link href="/orders" className="text-xs font-bold text-orange-600 hover:underline">
          Kembali ke Daftar Pesanan
        </Link>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
          ID: {order.order_number}
        </span>
      </div>

      <div className="p-6 bg-white border rounded-2xl shadow-sm text-center space-y-4">
        <h1 className="text-xl font-extrabold text-slate-800">Status Penjemputan Pesanan</h1>

        <div className="inline-block px-4 py-2 rounded-full text-xs font-black tracking-wide uppercase shadow-sm">
          {order.order_status === "waiting_payment" && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
              <Clock3 className="mr-1 inline size-3.5" aria-hidden="true" /> MENUNGGU PEMBAYARAN
            </span>
          )}
          {order.order_status === "processing" && (
            <span className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full">
              <ChefHat className="mr-1 inline size-3.5" aria-hidden="true" /> SEDANG DIPROSES / DIMASAK ADMIN
            </span>
          )}
          {order.order_status === "ready_pickup" && (
            <span className="bg-purple-100 text-purple-900 px-3 py-1.5 rounded-full">
              SIAP DIAMBIL DI OUTLET
            </span>
          )}
          {order.order_status === "completed" && (
            <span className="bg-green-100 text-green-900 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden="true" /> PESANAN SELESAI
            </span>
          )}
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Jadwal Penjemputan di Outlet:</p>
          <p className="text-amber-800 font-extrabold text-sm">
            <CalendarClock className="mr-1 inline size-4" aria-hidden="true" /> {order.pickup_date} Pukul {order.pickup_time} WIB
          </p>
        </div>

        {!isPaidOrProcessing ? (
          <button
            type="button"
            onClick={handleMidtransPayment}
            disabled={payLoading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {payLoading ? "Memproses Token..." : <><CreditCard className="mr-1 inline size-4" aria-hidden="true" /> Bayar Sekarang via Midtrans Snap</>}
          </button>
        ) : (
          <div className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" /> Pembayaran Terkonfirmasi - Pesanan Diproses
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-2">
          Rincian Pesanan
        </h3>
        <div className="space-y-2">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-bold text-slate-800">{item.menus?.name}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} porsi x Rp {Number(item.price).toLocaleString("id-ID")}
                </p>
              </div>
              <span className="font-extrabold text-slate-900">
                Rp {Number(item.subtotal || item.price * item.quantity).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Total Pembayaran</span>
          <span className="font-black text-lg text-green-600">
            Rp {Number(order.total).toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </div>
  );
}