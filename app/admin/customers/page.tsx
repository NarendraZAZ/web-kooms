"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ChevronRight, Mail, Phone, MapPin, Calendar, Package, ArrowUpRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const supabase = createClient();

      // Mengambil hanya profil yang memiliki role customer (Admin dikecualikan)
      const { data, error } = await supabase
        .from("profiles")
        .select("*, orders(id, order_number, payment_method, order_status, payment_status, total, created_at)")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCustomers(data);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setOpenDialog(true);
  };

  const getTotalSpent = (orders: any[]) => {
    return orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  };

  const getOrderStats = (orders: any[]) => {
    if (!orders) return { total: 0, completed: 0, pending: 0 };
    return {
      total: orders.length,
      completed: orders.filter((o) => o.order_status === "completed").length,
      pending: orders.filter((o) => !["completed", "cancelled", "rejected"].includes(o.order_status)).length,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <h1 className="text-2xl font-black text-stone-900">Daftar Pelanggan KOOMS</h1>
        <p className="text-xs text-stone-500">Kelola profil dan riwayat transaksi pelanggan</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-xs font-bold text-stone-400">
            Memuat data pelanggan...
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-10 text-xs text-stone-400">
            Belum ada pelanggan terdaftar.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => {
              const stats = getOrderStats(customer.orders);
              const totalSpent = getTotalSpent(customer.orders);
              const lastOrder = customer.orders?.[customer.orders.length - 1];

              return (
                <div
                  key={customer.id}
                  className="border border-stone-200 rounded-2xl p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-1">
                        {customer.full_name || "Pelanggan KOOMS"}
                      </h3>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{customer.email || "Tidak ada email"}</p>
                    </div>
                    <ChevronRight className="size-4 text-stone-400 group-hover:text-emerald-600 transition-colors" aria-hidden="true" />
                  </div>

                  <div className="space-y-2 text-[11px] mb-3">
                    {customer.phone && (
                      <p className="flex items-center gap-2 text-stone-600">
                        <Phone className="size-3 text-stone-400" aria-hidden="true" />
                        <span>{customer.phone}</span>
                      </p>
                    )}
                    {customer.address && (
                      <p className="flex items-center gap-2 text-stone-600 line-clamp-2">
                        <MapPin className="size-3 text-stone-400 flex-shrink-0" aria-hidden="true" />
                        <span className="line-clamp-2">{customer.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="border-t border-stone-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">Total Pesanan</span>
                      <span className="font-bold text-stone-900">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">Total Belanja</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(totalSpent)}</span>
                    </div>
                    {lastOrder && (
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Pesanan Terakhir</span>
                        <span className="text-[10px] bg-stone-100 px-2 py-1 rounded">
                          {new Date(lastOrder.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Modal Dialog */}
      {selectedCustomer && (
        <ProfileModal
          customer={selectedCustomer}
          open={openDialog}
          onOpenChange={setOpenDialog}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

function ProfileModal({
  customer,
  open,
  onOpenChange,
  formatCurrency,
}: {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl transition-transform overflow-y-auto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-stone-900">
                {customer.full_name || "Pelanggan KOOMS"}
              </h2>
              <p className="text-xs text-stone-500 mt-1">Profil & Riwayat Pesanan</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Profile Information */}
          <div className="bg-stone-50 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-[11px] font-bold text-stone-500 uppercase">Email</p>
              <p className="text-sm text-stone-900 font-semibold flex items-center gap-2 mt-1">
                <Mail className="size-4 text-stone-400" aria-hidden="true" />
                <a href={`mailto:${customer.email}`} className="hover:underline text-emerald-700">
                  {customer.email || "-"}
                </a>
              </p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase">Nomor Telepon</p>
                <p className="text-sm text-stone-900 font-semibold flex items-center gap-2 mt-1">
                  <Phone className="size-4 text-stone-400" aria-hidden="true" />
                  <a href={`tel:${customer.phone}`} className="hover:underline text-emerald-700">
                    {customer.phone}
                  </a>
                </p>
              </div>
            )}
            {customer.address && (
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase">Alamat</p>
                <p className="text-sm text-stone-900 font-semibold flex gap-2 mt-1">
                  <MapPin className="size-4 text-stone-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {customer.address}
                </p>
              </div>
            )}
            {customer.created_at && (
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase">Member Sejak</p>
                <p className="text-sm text-stone-900 font-semibold flex items-center gap-2 mt-1">
                  <Calendar className="size-4 text-stone-400" aria-hidden="true" />
                  {new Date(customer.created_at).toLocaleDateString("id-ID")}
                </p>
              </div>
            )}
          </div>

          {/* Order Statistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Total Pesanan</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{customer.orders?.length || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Total Belanja</p>
              <p className="text-lg font-black text-blue-900 mt-1">
                {formatCurrency(customer.orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0)}
              </p>
            </div>
          </div>

          {/* Order History */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Package className="size-4" aria-hidden="true" />
              Riwayat Pesanan Terbaru
            </h3>
            {customer.orders && customer.orders.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customer.orders.slice(0, 10).map((order: any) => (
                  <Link
                    key={order.id}
                    href="/admin/dashboard"
                    className="block border border-stone-200 rounded-xl p-3 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-bold text-stone-900">
                        #{order.order_number}
                      </span>
                      <ArrowUpRight className="size-3.5 text-stone-400 group-hover:text-emerald-600 transition-colors" aria-hidden="true" />
                    </div>
                    <p className="text-[11px] text-stone-500">
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                        order.order_status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : ["cancelled", "rejected"].includes(order.order_status)
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.order_status === "completed" ? "Selesai" : order.order_status === "processing" ? "Diproses" : "Menunggu"}
                      </span>
                      <span className="text-xs font-bold text-stone-900">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center py-4">Belum ada riwayat pesanan</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold rounded-xl text-xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
