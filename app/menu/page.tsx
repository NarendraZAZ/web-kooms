import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { Shell } from "lucide-react";

export const revalidate = 0;

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "customer";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) role = profile.role;
  }

  let { data: menus, error: menuError } = await supabase
    .from("menus")
    .select("*")
    .eq("is_available", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (menuError?.message.includes("menus.deleted_at does not exist")) {
    const fallback = await supabase
      .from("menus")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false });
    menus = fallback.data;
    menuError = fallback.error;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Fresh Seafood Menu
        </span>
        <h1 className="text-3xl font-black text-stone-900">
          Katalog Menu Kerang OISHII
        </h1>
        <p className="text-xs text-stone-500">
          Pesan Pre-Order Pickup Direct — Hemat Tanpa Biaya Markup Platform!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menus?.map((menu) => {
          const onlinePrice = menu.price || 0;
          const pickupPrice =
            menu.offline_price && menu.offline_price > 0
              ? menu.offline_price
              : menu.price;

          return (
            <div
              key={menu.id}
              className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="relative overflow-hidden">
                {menu.image_url ? (
                  <img
                    src={menu.image_url}
                    alt={menu.name}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-52 bg-emerald-50 flex items-center justify-center text-emerald-400 font-bold text-4xl">
                    <Shell className="size-10" aria-hidden="true" />
                  </div>
                )}
                {menu.is_available && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-1 rounded-full text-[10px] font-bold">
                    Tersedia
                  </div>
                )}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-extrabold text-lg text-stone-900 line-clamp-1">
                  {menu.name}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {menu.description || "Spesialis olahan kerang saus lezat."}
                </p>
              </div>

              <div className="p-5 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center">
                <div>
                  {onlinePrice > pickupPrice && (
                    <span className="text-[10px] font-semibold text-stone-400 line-through block leading-tight">
                      Online: Rp {Number(onlinePrice).toLocaleString("id-ID")}
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase block tracking-wider mt-0.5">
                    Harga Direct Pickup
                  </span>
                  <span className="text-lg font-black text-stone-900">
                    Rp {Number(pickupPrice).toLocaleString("id-ID")}
                  </span>
                </div>

                <AddToCartButton
                  menuId={menu.id}
                  menuName={menu.name}
                  isLoggedIn={!!user}
                  userRole={role}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}