"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import SubmitButton from "@/components/ui/submit-button";

export default function CategoryForm() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;

    const { error } = await supabase.from("categories").insert({
      name,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Kategori berhasil ditambahkan.");

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-xl border p-6"
    >
      <h1 className="text-2xl font-bold">
        Tambah Kategori
      </h1>

      <input
        name="name"
        placeholder="Nama kategori"
        className="w-full rounded border p-3"
        required
      />

      <SubmitButton
        pendingLabel="Menyimpan..."
        className="rounded bg-emerald-700 px-5 py-3 text-white transition hover:bg-emerald-800"
      >
        Simpan
      </SubmitButton>
    </form>
  );
}