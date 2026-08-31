import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: paidOrders, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(full_name),
      order_items(subtotal)
    `)
    .or("payment_status.eq.paid,order_status.eq.completed")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-6 text-red-600 font-medium">Gagal memuat rekapitulasi laporan.</div>;
  }

  const totalOmzet =
    paidOrders?.reduce((sum, order) => {
      const orderTotal =
        order.order_items && order.order_items.length > 0
          ? order.order_items.reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0)
          : Number(order.total || 0);
      return sum + orderTotal;
    }, 0) || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Rekapitulasi Omset Kerang OISHII</h1>
          <p className="text-xs text-stone-500">
            Laporan riil dari transaksi lunas aktif (Klik No. Order untuk melihat detail pesanan)
          </p>
        </div>
        <div className="text-right bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
            Total Omzet Lunas
          </p>
          <p className="text-2xl font-black text-emerald-600">
            Rp {totalOmzet.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b text-xs uppercase text-stone-500 font-bold">
            <tr>
              <th className="p-4">No. Order (Detail)</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Metode Pembayaran</th>
              <th className="p-4 text-right">Total Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {!paidOrders || paidOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-stone-400 text-xs">
                  Belum ada transaksi lunas terdata.
                </td>
              </tr>
            ) : (
              paidOrders.map((order) => {
                const calculatedTotal =
                  order.order_items && order.order_items.length > 0
                    ? order.order_items.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0)
                    : Number(order.total || 0);

                return (
                  <tr key={order.id} className="hover:bg-stone-50/80 transition-all">
                    <td className="p-4">
                      <Link
                        href={`/admin/dashboard`}
                        className="font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                      >
                        <span>{order.order_number}</span>
                      </Link>
                    </td>
                    <td className="p-4 text-xs font-semibold text-stone-700">
                      {order.profiles?.full_name || "Pelanggan"}
                    </td>
                    <td className="p-4 uppercase font-bold text-xs text-emerald-700">
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md">
                        Midtrans
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-emerald-600">
                      Rp {calculatedTotal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}