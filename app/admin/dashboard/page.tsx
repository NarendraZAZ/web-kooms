"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, ChefHat, FileSpreadsheet, Flame, Truck } from "lucide-react";

export default function SingleAdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("processing");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const supabase = createClient();

  const fetchOrders = async () => {
    setLoading(true);

    // 1. Eksekusi pengecekan kedaluwarsa via Server API (Bypass RLS)
    try {
      await fetch("/api/orders/check-expiration", { method: "GET" });
    } catch (error) {
      console.error("Gagal mengecek kedaluwarsa:", error);
    }

    // 2. Ambil pesanan dengan filter menyembunyikan yang 'cancelled'
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, profiles(full_name, email, phone)")
      .neq("order_status", "cancelled")
      .order("created_at", { ascending: false });

    if (!ordersData) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = ordersData.map((o) => o.id);
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("*, menus(name, price)")
      .in("order_id", orderIds);

    const formattedOrders = ordersData.map((order) => ({
      ...order,
      order_items: itemsData?.filter((item) => item.order_id === order.id) || [],
    }));

    setOrders(formattedOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStateTransition = async (orderId: string, nextStatus: string) => {
    const { error } = await supabase.from("orders").update({ order_status: nextStatus }).eq("id", orderId);
    if (error) {
      toast.error(`Gagal mengupdate status: ${error.message}`);
    } else {
      toast.success("Status pesanan berhasil diperbarui.");
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, order_status: nextStatus }));
      }
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) return;
    const excelData = orders.map((order, index) => ({
      No: index + 1,
      "No Pesanan": order.order_number,
      Pelanggan: order.profiles?.full_name || "-",
      "Tgl Pickup": order.pickup_date,
      "Jam Pickup": order.pickup_time,
      Status: order.order_status,
      Total: order.total,
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_KerangOISHII_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "waiting_payment") return o.order_status === "waiting_payment";
    if (filterStatus === "processing") return o.order_status === "processing";
    if (filterStatus === "ready_pickup") return o.order_status === "ready_pickup";
    if (filterStatus === "completed") return o.order_status === "completed";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-xs">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-stone-900">
            <ChefHat className="size-6 text-emerald-700" /> Dashboard Dapur Kerang OISHII
          </h1>
          <p className="text-xs text-stone-500">Kelola dan proses pesanan pickup secara realtime</p>
        </div>
        <button onClick={handleExportExcel} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2">
          <FileSpreadsheet className="size-4" /> Export Excel
        </button>
      </div>

      <div className="flex gap-2 border-b pb-2 flex-wrap">
        <button onClick={() => setFilterStatus("processing")} className={`px-4 py-2 rounded-xl text-xs font-bold ${filterStatus === "processing" ? "bg-amber-600 text-white" : "bg-stone-100"}`}>
          <Flame className="mr-1 inline size-3.5" /> Sedang Diproses / Dimasak
        </button>
        <button onClick={() => setFilterStatus("ready_pickup")} className={`px-4 py-2 rounded-xl text-xs font-bold ${filterStatus === "ready_pickup" ? "bg-purple-600 text-white" : "bg-stone-100"}`}>
          <Truck className="mr-1 inline size-3.5" /> Siap Diambil
        </button>
        <button onClick={() => setFilterStatus("waiting_payment")} className={`px-4 py-2 rounded-xl text-xs font-bold ${filterStatus === "waiting_payment" ? "bg-blue-600 text-white" : "bg-stone-100"}`}>
          Menunggu Pembayaran
        </button>
        <button onClick={() => setFilterStatus("completed")} className={`px-4 py-2 rounded-xl text-xs font-bold ${filterStatus === "completed" ? "bg-emerald-600 text-white" : "bg-stone-100"}`}>
          <CheckCircle2 className="mr-1 inline size-3.5" /> Selesai
        </button>
        <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 rounded-xl text-xs font-bold ${filterStatus === "all" ? "bg-stone-900 text-white" : "bg-stone-100"}`}>
          Semua Aktif ({orders.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-stone-400">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border-2 rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <span className="text-xs font-black text-stone-900 block">#{order.order_number}</span>
                  <span className="text-[11px] font-bold text-amber-900 block">
                    <CalendarClock className="mr-1 inline size-3.5" /> Pickup: {order.pickup_time} ({order.pickup_date})
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${order.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {order.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
                </span>
              </div>

              <div className="space-y-1 bg-stone-50 p-3 rounded-2xl border text-xs">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between font-bold text-stone-800">
                    <span>{item.quantity}x {item.menus?.name || "Item"}</span>
                    <span>Rp {Number(item.subtotal || item.price * item.quantity).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-1 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-stone-500 font-bold">Total:</span>
                  <span className="text-base font-black text-emerald-800">Rp {Number(order.total).toLocaleString("id-ID")}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSelectedOrder(order)} className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold rounded-xl text-xs">
                    Detail
                  </button>
                  {order.order_status === "processing" && (
                    <button onClick={() => handleStateTransition(order.id, "ready_pickup")} className="py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs">
                      <Truck className="mr-1 inline size-3.5" /> Siap Diambil
                    </button>
                  )}
                  {order.order_status === "ready_pickup" && (
                    <button onClick={() => handleStateTransition(order.id, "completed")} className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs">
                      <CheckCircle2 className="mr-1 inline size-3.5" /> Selesai
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-stone-900">Rincian #{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 text-lg">×</button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Pelanggan:</strong> {selectedOrder.profiles?.full_name} ({selectedOrder.profiles?.email})</p>
              <p><strong>Waktu Pickup:</strong> {selectedOrder.pickup_date} - {selectedOrder.pickup_time} WIB</p>
              {selectedOrder.notes && <p className="text-red-600 italic">Catatan: "{selectedOrder.notes}"</p>}
            </div>
            <div className="border-t pt-2 space-y-2">
              <p className="text-xs font-black uppercase text-stone-400">Item Pesanan:</p>
              {selectedOrder.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-xs font-semibold">
                  <span>{item.quantity}x {item.menus?.name}</span>
                  <span>Rp {Number(item.subtotal).toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-xs">Total:</span>
              <span className="text-lg font-black text-emerald-800">Rp {Number(selectedOrder.total).toLocaleString("id-ID")}</span>
            </div>
            <div className="pt-2 flex gap-2">
              {selectedOrder.order_status === "processing" && (
                <button onClick={() => handleStateTransition(selectedOrder.id, "ready_pickup")} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs">
                  Tandai Siap Diambil
                </button>
              )}
              {selectedOrder.order_status === "ready_pickup" && (
                <button onClick={() => handleStateTransition(selectedOrder.id, "completed")} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                  Konfirmasi Pesanan Selesai
                </button>
              )}
              <button onClick={() => setSelectedOrder(null)} className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}