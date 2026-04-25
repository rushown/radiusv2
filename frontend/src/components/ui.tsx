import React from "react";
import type { TxStatus } from "@/types";
import { EXPLORER_URL } from "@/config/chain";

export function cx(...args: (string | boolean | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?:    "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth, className, children, disabled, ...rest }, ref) => {
    const v = { primary: "btn-primary", secondary: "btn-secondary", ghost: "btn-ghost", danger: "btn-danger" }[variant];
    const s = { xs: "btn-xs", sm: "btn-sm", md: "btn-md", lg: "btn-lg" }[size];
    return (
      <button
        ref={ref}
        className={cx(v, s, fullWidth && "w-full", className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, glow, hover }: {
  children: React.ReactNode; className?: string; glow?: boolean; hover?: boolean;
}) {
  return (
    <div className={cx(glow ? "card-blue" : "card", hover && "card-hover", className)}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string;
  prefix?: React.ReactNode; suffix?: React.ReactNode;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, suffix, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="font-body text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3.5 text-slate-500 text-sm select-none pointer-events-none z-10">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cx(
              "input-base",
              error ? "input-error" : "",
              prefix ? "pl-9" : "",
              suffix ? "pr-20" : "",
              className
            )}
            aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
            aria-invalid={!!error}
            {...rest}
          />
          {suffix && (
            <span className="absolute right-3.5 text-slate-500 text-sm font-medium select-none pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-600 font-body leading-relaxed">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-err`} className="text-xs text-danger-400 font-body flex items-center gap-1" role="alert">
            <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    pending:   { cls: "badge-pending",   dot: "bg-warn-400 animate-pulse",  label: "Pending"   },
    claimed:   { cls: "badge-claimed",   dot: "bg-success-400",             label: "Claimed"   },
    expired:   { cls: "badge-expired",   dot: "bg-danger-400",              label: "Expired"   },
    reclaimed: { cls: "badge-reclaimed", dot: "bg-slate-400",               label: "Reclaimed" },
  };
  const v = map[status] ?? { cls: "badge-reclaimed", dot: "bg-slate-500", label: status };
  return (
    <span className={v.cls}>
      <span className={cx("w-1.5 h-1.5 rounded-full shrink-0 flex-none", v.dot)} aria-hidden="true"/>
      {v.label}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = "md", className }: { size?: "sm"|"md"|"lg"; className?: string }) {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  return (
    <svg className={cx("animate-spin text-sky-400", s, className)} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true"/>;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cx("card p-5 sm:p-6 flex flex-col gap-5", className)} aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-3 w-16 rounded-full"/>
          <Skeleton className="h-10 w-40"/>
        </div>
        <Skeleton className="h-6 w-20 rounded-full shrink-0"/>
      </div>
      <div className="rounded-xl overflow-hidden border border-mon-700/40 divide-y divide-mon-700/40">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center px-4 py-3">
            <Skeleton className="h-3 w-20"/><Skeleton className="h-3 w-28"/>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cx("grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4", className)} aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 flex flex-col gap-2.5">
          <Skeleton className="h-3 w-16 rounded-full"/>
          <Skeleton className="h-6 w-24"/>
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="px-4 sm:px-5 flex flex-col" aria-hidden="true">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-4 border-b border-mon-700/30 last:border-0">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex gap-2.5 items-center"><Skeleton className="h-5 w-20"/><Skeleton className="h-5 w-16 rounded-full"/></div>
            <Skeleton className="h-3 w-44"/>
          </div>
          <Skeleton className="h-8 w-20 rounded-xl shrink-0"/>
        </div>
      ))}
    </div>
  );
}

// ─── TxStatusBar ──────────────────────────────────────────────────────────────
const TX_MESSAGES: Record<string, string> = {
  approving:          "Waiting for approval in wallet…",
  "approval-pending": "Approval confirming on-chain…",
  creating:           "Waiting for signature in wallet…",
  "tx-pending":       "Transaction submitted — confirming…",
  confirmed:          "Confirmed!",
  error:              "Transaction failed.",
};

export function TxStatusBar({ status, txHash, error }: {
  status: TxStatus | string; txHash?: string | null; error?: string | null;
}) {
  if (status === "idle") return null;
  const isErr = status === "error";
  const isOk  = status === "confirmed";
  const msg   = isErr && error ? error : (TX_MESSAGES[status] ?? status);

  return (
    <div
      role="status" aria-live="polite"
      className={cx(
        "rounded-xl border px-4 py-3 flex items-start gap-3 text-sm font-body",
        isErr ? "border-danger-500/25 text-danger-300"
              : isOk ? "border-success-500/25 text-success-300"
                     : "border-mon-700/60 text-slate-300",
      )}
      style={{
        backgroundColor: isErr ? "rgba(239,68,68,0.06)" : isOk ? "rgba(34,197,94,0.06)" : "rgba(14,26,56,0.6)"
      }}
    >
      <span className="mt-0.5 shrink-0 flex-none">
        {!isErr && !isOk && <Spinner size="sm"/>}
        {isOk && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
            <svg className="h-3 w-3 text-success-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </span>
        )}
        {isErr && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
            <svg className="h-3 w-3 text-danger-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </span>
        )}
      </span>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="leading-snug break-words">{msg}</span>
        {txHash && (
          <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 underline text-xs font-mono truncate block"
          >{txHash.slice(0, 22)}… ↗</a>
        )}
      </div>
    </div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children, variant = "blue" }: { children: React.ReactNode; variant?: "blue"|"gray" }) {
  return (
    <span className={cx(
      "inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium font-body border",
      variant === "blue"
        ? "bg-sky-400/10 text-sky-400 border-sky-400/20"
        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
    )}>{children}</span>
  );
}