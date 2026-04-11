"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const inInitialView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

    setVisible(inInitialView);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);

          if (once) {
            observer.unobserve(node);
          }

          return;
        }

        if (!once) {
          setVisible(false);
        }
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(
        "transform-gpu transition-all duration-700 ease-out will-change-transform motion-reduce:transform-none motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
      style={
        {
          ...style,
          transitionDelay: `${delay}ms`,
        } satisfies CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
