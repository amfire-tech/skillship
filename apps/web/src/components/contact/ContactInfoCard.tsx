import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

const contactItems = [
  {
    label: "Email",
    value: "noreply@amfire.in",
    note: "Best for partnership and onboarding queries",
  },
  {
    label: "Phone",
    value: "+91 98765 43210",
    note: "Mon to Sat for school coordination support",
  },
  {
    label: "Office",
    value: "Bengaluru, Karnataka, India",
    note: "Serving schools across major Indian cities",
  },
  {
    label: "Working hours",
    value: "9:30 AM to 6:30 PM IST",
    note: "Typical response time within one business day",
  },
] as const;

export function ContactInfoCard() {
  return (
    <Card className="rounded-[28px] border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.18)]">
      <CardContent className="p-6 md:p-8">
        <Badge variant="info" className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
          Contact details
        </Badge>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
          Speak with the Skillship team
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          We support school leaders, coordinators, and district teams looking to
          plan AI and robotics programs with clarity.
        </p>

        <div className="mt-8 space-y-5">
          {contactItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-slate-600">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] p-5">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/75 px-4 py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Location preview
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Map integration placeholder for Bengaluru office and service regions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
