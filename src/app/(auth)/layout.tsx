export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy flex justify-center items-start sm:items-center p-0 sm:p-6">
      <div className="w-full max-w-[420px] min-h-screen sm:min-h-[820px] bg-paper sm:rounded-[28px] sm:border sm:border-white/10 sm:shadow-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
