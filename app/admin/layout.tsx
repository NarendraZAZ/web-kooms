import AdminSidebar from "@/components/layouts/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.10),_transparent_32%),linear-gradient(135deg,_#fffdf8_0%,_#f5fbf6_100%)] md:flex">
      <AdminSidebar />

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}