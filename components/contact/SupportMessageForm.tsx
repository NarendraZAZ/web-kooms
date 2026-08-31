"use client";

import { FormEvent, useState, useTransition } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { submitSupportMessage } from "@/app/actions/support";

export default function SupportMessageForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await submitSupportMessage(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSent(true);
      form.reset();
      toast.success("Pesan berhasil dikirim ke pusat bantuan.");
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        Pesanmu sudah diterima. Admin akan membalas melalui email yang kamu cantumkan.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="customerName" required placeholder="Nama lengkap" className="rounded-xl border border-stone-300 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
        <input name="customerEmail" type="email" required placeholder="Email untuk balasan" className="rounded-xl border border-stone-300 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
      </div>
      <textarea name="message" required rows={5} placeholder="Ceritakan kebutuhanmu atau kendala pesanan..." className="w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
      <button disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-stone-700 disabled:opacity-50">
        <Send className="size-4" aria-hidden="true" /> {isPending ? "Mengirim..." : "Kirim melalui email"}
      </button>
      <p className="flex items-center gap-2 text-xs text-stone-500"><Mail className="size-3.5" aria-hidden="true" /> Balasan dikirim ke alamat email yang kamu isi.</p>
    </form>
  );
}
