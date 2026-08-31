"use client";

import { CheckCircle2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { resolveSupportMessage } from "@/app/actions/support";

export default function ResolveMessageButton({ messageId }: { messageId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await resolveSupportMessage(messageId);
          if (result?.error) toast.error(result.error);
          else toast.success("Pesan ditandai selesai.");
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
    >
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      {isPending ? "Menyimpan..." : "Selesaikan"}
    </button>
  );
}