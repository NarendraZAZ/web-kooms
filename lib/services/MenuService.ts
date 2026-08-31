import { SupabaseClient } from "@supabase/supabase-js";

export class MenuService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // SCRUD: Read + Search + Sortir
  public async getMenus(searchQuery: string = "", sortBy: string = "latest", includeArchived: boolean = true) {
    const load = (useSoftDelete: boolean) => {
      let query = this.supabase.from("menus").select("*, categories(name)");

      // Keep older deployments usable while the soft-delete migration is being applied.
      if (useSoftDelete && !includeArchived) query = query.is("deleted_at", null);

      if (searchQuery.trim() !== "") {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (sortBy === "price_low") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price_high") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "name_asc") {
        query = query.order("name", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      return query;
    };

    let result = await load(true);
    if (result.error?.message.includes("menus.deleted_at does not exist")) {
      result = await load(false);
    }

    if (result.error) throw new Error(result.error.message);
    return result.data || [];
  }

  // Get menu with stock check - returns null if out of stock or archived
  public async getMenuForCart(menuId: string) {
    const { data, error } = await this.supabase
      .from("menus")
      .select("*")
      .eq("id", menuId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) return null;
    if (!data) return null;

    // Check if stock is 0 and auto-archive it
    if (data.stock === 0 && !data.deleted_at) {
      await this.autoArchiveZeroStock(menuId);
      return null; // Menu tidak bisa dipesankan karena stok habis
    }

    return data.is_available ? data : null;
  }

  // Auto-archive menu when stock reaches 0
  private async autoArchiveZeroStock(menuId: string) {
    await this.supabase
      .from("menus")
      .update({ deleted_at: new Date().toISOString(), is_available: false })
      .eq("id", menuId);
  }

  // SCRUD: Delete
  public async deleteMenu(menuId: string) {
    const { error } = await this.supabase.from("menus").update({ deleted_at: new Date().toISOString(), is_available: false }).eq("id", menuId);
    if (error) return { success: false, error: error.message };

    return { success: true };
  }

  // Restore menu from archive
  public async restoreMenu(menuId: string) {
    try {
      const { data, error: fetchError } = await this.supabase
        .from("menus")
        .select("stock")
        .eq("id", menuId)
        .maybeSingle();

      if (fetchError) {
        return { success: false, error: `Gagal mengambil data menu: ${fetchError.message}` };
      }

      // Cek jika stock masih 0, tolak restore
      if (data?.stock === 0) {
        return { success: false, error: "Tidak dapat mengembalikan menu dengan stok 0. Silakan update stok terlebih dahulu." };
      }

      // Update menu untuk restore
      const { error } = await this.supabase
        .from("menus")
        .update({ deleted_at: null, is_available: true })
        .eq("id", menuId);

      if (error) {
        return { success: false, error: `Gagal mengembalikan menu: ${error.message}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Terjadi kesalahan saat restore menu." };
    }
  }

  public async forceDeleteMenu(menuId: string) {
    await this.supabase.from("cart_items").delete().eq("menu_id", menuId);
    await this.supabase.from("order_items").delete().eq("menu_id", menuId);
    const { error } = await this.supabase.from("menus").delete().eq("id", menuId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Update menu stock
  public async updateMenuStock(menuId: string, newStock: number) {
    try {
      // Jika stok menjadi 0, otomatis arsipkan
      const updateData: any = { stock: newStock };
      if (newStock === 0) {
        updateData.deleted_at = new Date().toISOString();
        updateData.is_available = false;
      } else if (newStock > 0) {
        // Jika stok update ke nilai > 0 dari 0, dan menu sudah diarsipkan, restore otomatis
        const { data } = await this.supabase
          .from("menus")
          .select("deleted_at")
          .eq("id", menuId)
          .maybeSingle();

        if (data?.deleted_at) {
          updateData.deleted_at = null;
          updateData.is_available = true;
        }
      }

      const { error } = await this.supabase
        .from("menus")
        .update(updateData)
        .eq("id", menuId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Gagal mengupdate stok menu." };
    }
  }
}