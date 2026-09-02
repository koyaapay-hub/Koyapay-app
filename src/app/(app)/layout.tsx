import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy flex justify-center sm:items-start sm:py-6">
      <div className="w-full max-w-[420px] min-h-screen sm:min-h-[820px] bg-paper sm:rounded-[28px] sm:border sm:border-white/10 sm:shadow-2xl overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
