interface StatsCardProps {
  value: string;
  label: string;
}

export function StatsCard({ value, label }: StatsCardProps) {
  return (
    <div className="rounded-[18px] bg-[#1D4ED8]/30 px-5 py-4 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="text-[22px] font-bold leading-none">{value}</p>
      <p className="mt-2 text-sm text-white/90">{label}</p>
    </div>
  );
}
