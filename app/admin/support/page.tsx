import { Clock3, Inbox, Mail, MessageSquareText, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ResolveMessageButton from "@/components/support/ResolveMessageButton";
import ReviewToggleButton from "@/components/support/ReviewToggleButton";

export const revalidate = 0;

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: messages, error } = await supabase
    .from("support_messages")
    .select("id, customer_name, customer_email, subject, message, status, is_review, created_at, resolved_at")
    .order("created_at", { ascending: false });

  const unreadCount = messages?.filter((message) => message.status === "unread").length || 0;
  const reviewCount = messages?.filter((message) => message.is_review).length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
            <Inbox className="size-4" aria-hidden="true" /> Admin workspace
          </div>
          <h1 className="text-3xl font-black tracking-tight text-stone-900">Pusat Bantuan</h1>
          <p className="mt-1 text-sm text-stone-500">Kelola pertanyaan customer yang dikirim melalui formulir email di web.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <span className="font-black">{unreadCount}</span> pesan belum dibaca
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <Star className="inline size-3.5 mr-1" aria-hidden="true" /> <span className="font-black">{reviewCount}</span> ditandai sebagai review
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          Inbox belum tersedia. {error.message}
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-14 text-center text-sm text-stone-500">
          <MessageSquareText className="mx-auto mb-3 size-8 text-stone-400" aria-hidden="true" />
          Belum ada pesan customer.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <article key={message.id} className={`rounded-2xl border p-5 shadow-sm transition-all ${message.is_review ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-200 bg-white'}`}>
              <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-start" style={{borderColor: message.is_review ? '#d1fae5' : '#f3f4f6'}}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-stone-900">{message.subject || "Pertanyaan Customer"}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${message.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}`}>
                      {message.status === "resolved" ? "Selesai" : message.status === "read" ? "Dibaca" : "Baru"}
                    </span>
                    {message.is_review && (
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Star className="size-3" aria-hidden="true" /> Review
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    <span className="font-bold text-stone-700">{message.customer_name}</span>
                    <a href={`mailto:${message.customer_email}`} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                      <Mail className="size-3.5" aria-hidden="true" /> {message.customer_email}
                    </a>
                  </p>
                </div>
                <p className="flex items-center gap-1 text-xs text-stone-400">
                  <Clock3 className="size-3.5" aria-hidden="true" /> {new Date(message.created_at).toLocaleString("id-ID")}
                </p>
              </div>
              <p className="whitespace-pre-wrap py-4 text-sm leading-relaxed text-stone-700">{message.message}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {message.status !== "resolved" && <ResolveMessageButton messageId={message.id} />}
                <ReviewToggleButton messageId={message.id} isReview={message.is_review || false} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}