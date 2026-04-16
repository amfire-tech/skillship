"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
