interface BenefitItemProps {
  text: string;
}

export function BenefitItem({ text }: BenefitItemProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-emerald-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M9 12.75 11.25 15 15 9.75" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <span className="text-[17px] leading-8 text-slate-800">{text}</span>
    </li>
  );
}
