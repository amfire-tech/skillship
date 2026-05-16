/*
 * File:    frontend/src/components/ui/TableRowSkeleton.tsx
 * Purpose: Reusable shimmer rows for admin list tables (schools, users, quizzes).
 * Owner:   Pranav
 */

import { Skeleton } from "./Skeleton";

interface TableRowSkeletonProps {
  rows?: number;
  columns: number;
  withAvatar?: boolean;
}

export function TableRowSkeleton({ rows = 6, columns, withAvatar = false }: TableRowSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[var(--border)]/60 last:border-0">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-5 py-3.5">
              {c === 0 && withAvatar ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : c === columns - 1 ? (
                <div className="flex items-center justify-end gap-3">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ) : (
                <Skeleton className="h-4" style={{ width: `${50 + ((r * 7 + c * 11) % 40)}%` }} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
