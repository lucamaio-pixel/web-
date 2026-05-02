import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-white border border-stone-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]",
          className
        )}
        {...props}
      />
    );
  }
);

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("px-5 pt-5 pb-3", className)} {...props} />;
  }
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3 ref={ref} className={cn("font-semibold text-stone-900", className)} {...props} />
    );
  }
);

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p ref={ref} className={cn("text-sm text-stone-500 mt-1", className)} {...props} />
    );
  }
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("px-5 pb-5", className)} {...props} />;
  }
);
