import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { removeCartItem, updateCartQuantity } from "@/app/actions/cart";
import { AlertTriangle, ArrowUpRight, MapPin, CreditCard, Package, Truck, Check } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("*, menus(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  const { data: activeOrder } = await supabase
    .from("orders")
    .select("id, order_number, order_status")
    .eq("customer_id", user.id)
    .not("order_status", "in", '("completed","cancelled","rejected")')
    .maybeSingle();

  const total =
    cartItems?.reduce((sum, item) => {
      const itemPrice = item.menus?.offline_price || item.menus?.price || 0;
      return sum + itemPrice * item.quantity;
    }, 0) || 0;

  const gmapsUrl = "https://maps.app.goo.gl/CqCqt6ttfYW4k9kk7";
  const embedMapUrl =
    "https://maps.google.com/maps?q=Kerang%20OISHII%20Perumahan%20Puri%20Bukit%20Ngaliyan%20B.32%20Semarang&t=&z=16&ie=UTF8&iwloc=&output=embed";

  const formatOptionText = (optionsRaw: any) => {
    if (!optionsRaw) return null;
    if (typeof optionsRaw === "string") {
      if (optionsRaw.startsWith("{") || optionsRaw.startsWith("[")) {
        try {
          const parsed = JSON.parse(optionsRaw);
          return Object.values(parsed).join(" • ");
        } catch {
          return optionsRaw;
        }
      }
      return optionsRaw;
    }
    if (typeof optionsRaw === "object") {
      return Object.values(optionsRaw).join(" • ");
    }
    return String(optionsRaw);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-black text-slate-800">
        Keranjang Pre-Order Kerang OISHII
      </h1>

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-orange-900">
              <MapPin className="mr-1 inline size-4" aria-hidden="true" /> Lokasi Outlet Kerang OISHII (Pickup Station)
            </p>
            <p className="text-xs text-slate-600">
              Kerang OISHII, Perumahan Puri Bukit Ngaliyan B.32
            </p>
          </div>
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs"
          >
            Buka GMaps <ArrowUpRight className="ml-1 inline size-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="w-full h-48 rounded-xl overflow-hidden border border-orange-200 shadow-inner">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={embedMapUrl}
            title="Outlet Kerang OISHII Ngaliyan"
          ></iframe>
        </div>
      </div>

      {activeOrder ? (
        <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="font-extrabold text-amber-900 text-base">
              Pesanan Aktif #{activeOrder.order_number}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3 border border-amber-200">
            <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider mb-2">Status Pesanan</p>
            <div className="flex items-center justify-between gap-2">
              {[
                { key: 'waiting_payment', label: 'Pembayaran', icon: CreditCard },
                { key: 'processing', label: 'Diproses', icon: Package },
                { key: 'ready_pickup', label: 'Siap Diambil', icon: Truck },
                { key: 'completed', label: 'Selesai', icon: Check },
              ].map((stage) => {
                const isActive = ['waiting_payment', 'processing', 'ready_pickup', 'completed'].indexOf(activeOrder.order_status) >= ['waiting_payment', 'processing', 'ready_pickup', 'completed'].indexOf(stage.key);
                const isCurrent = activeOrder.order_status === stage.key;
                const Icon = stage.icon;
                
                return (
                  <div key={stage.key} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 transition-all ${
                        isCurrent
                          ? 'bg-orange-600 text-white ring-2 ring-orange-200'
                          : isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </div>
                    <p className={`text-[8px] font-bold text-center leading-tight ${
                      isCurrent
                        ? 'text-orange-700'
                        : isActive
                        ? 'text-emerald-700'
                        : 'text-stone-400'
                    }`}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Selesaikan pesanan aktif terlebih dahulu sebelum membuat pesanan pre-order baru untuk mencegah penumpukan antrean.
          </p>
          <Link
            href={`/orders/${activeOrder.id}`}
            className="inline-block px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
          >
            <MapPin className="mr-1 inline size-3.5" aria-hidden="true" /> Lihat & Pantau Pesanan Aktif
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {!cartItems || cartItems.length === 0 ? (
            <div className="text-center py-10 border rounded-2xl bg-slate-50 space-y-3">
              <p className="text-slate-500 text-sm">Keranjang kamu masih kosong.</p>
              <Link
                href="/menu"
                className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold"
              >
                Pilih Menu Makanan
              </Link>
            </div>
          ) : (
            <>
              {cartItems.map((item) => {
                const itemPrice = item.menus?.offline_price || item.menus?.price || 0;
                const displayOption = formatOptionText(item.options);

                const decreaseQuantity = updateCartQuantity.bind(null, item.id, item.quantity - 1);
                const increaseQuantity = updateCartQuantity.bind(null, item.id, item.quantity + 1);
                const removeItem = removeCartItem.bind(null, item.id);

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{item.menus?.name}</p>
                      {displayOption && (
                        <p className="text-xs text-emerald-700 font-bold mt-0.5">
                          Varian: {displayOption}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Rp {Number(itemPrice).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <form action={decreaseQuantity}>
                        <SubmitButton
                          pendingLabel="..."
                          className="w-7 h-7 border rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </SubmitButton>
                      </form>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <form action={increaseQuantity}>
                        <SubmitButton
                          pendingLabel="..."
                          className="w-7 h-7 border rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </SubmitButton>
                      </form>
                      <form action={removeItem}>
                        <SubmitButton
                          pendingLabel="Menghapus..."
                          className="text-red-500 hover:text-red-700 text-xs font-bold ml-2 cursor-pointer"
                        >
                          Hapus
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                );
              })}

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold text-base text-slate-700">
                  Total Biaya:
                </span>
                <span className="font-black text-xl text-green-600">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold transition-all shadow-md active:scale-98"
              >
                Lanjut Bayar via Midtrans
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}