"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { toggleMessageAsReview } from "@/app/actions/support";
import { useState, useTransition } from "react";

export default function ReviewToggleButton({ messageId, isReview }: { messageId: string; isReview: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [localIsReview, setLocalIsReview] = useState(isReview);

  function handleToggleReview() {
    startTransition(async () => {
      const nextState = !localIsReview;
      const result = await toggleMessageAsReview(messageId, nextState);
      if (result?.success) {
        setLocalIsReview(nextState);
        toast.success(
          nextState
            ? "Pesan ditandai sebagai review dan akan tampil di beranda."
            : "Pesan dihapus dari daftar review."
        );
      } else {
        toast.error(result?.error || "Gagal memperbarui status review.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggleReview}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
        localIsReview
          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
      } disabled:opacity-50`}
    >
      <Star className="size-3.5" aria-hidden="true" fill={localIsReview ? "currentColor" : "none"} />
      {isPending ? "Memperbarui..." : localIsReview ? "Tampilkan di Beranda" : "Tandai Sebagai Review"}
    </button>
  );
}