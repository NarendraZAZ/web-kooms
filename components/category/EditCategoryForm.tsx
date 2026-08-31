"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import SubmitButton from "@/components/ui/submit-button";

interface Props {
  category: {
    id: string;
    name: string;
  };
}

export default function EditCategoryForm({ category }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(category.name);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase
      .from("categories")
      .update({
        name,
      })
      .eq("id", category.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Kategori berhasil diperbarui.");
    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-xl border p-6"
    >
      <h1 className="text-2xl font-bold">
        Edit Kategori
      </h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border p-3"
      />

      <SubmitButton
        pendingLabel="Menyimpan..."
        className="rounded bg-emerald-700 px-5 py-3 text-white transition hover:bg-emerald-800"
      >
        Update
      </SubmitButton>
    </form>
  );
}