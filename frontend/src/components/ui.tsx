import React from "react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function cx(...args: (string | boolean | undefined | null)[]) {
  return args.filter(Boolean).join(" ");
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}
export function Button({
  variant = "primary", size = "md", loading = false,
  className, children, disabled, ...rest
}: ButtonProps) {
  const base = cx(
    variant === "primary"   && "btn-primary",
    variant === "secondary" && "btn-secondary",
    variant === "ghost"     && "btn-ghost",
    variant === "danger"    && "btn-danger",
    size === "xs" && "px-3 py-1.5 text-xs",
    size === "sm" && "px-4 py-2 text-sm",
    size === "md" && "px-5 py-2.5 text-sm",
    size === "lg" && "px-7 py-3.5 text-base",
    className
  );
  return (
    <button className={base} disabled={disabled || loading} {...rest}>
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; glow?: boolean; hover?: boolean; }
export function Card({ children, className, glow, hover }: CardProps) {
  return (
    <div className={cx(glow ? "card-glow" : "card", hover && "transition-shadow duration-200", className)}>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string; prefix?: string; suffix?: string;
}
export function Input({ label, hint, error, prefix, suffix, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-body text-sm font-medium text-choc-200">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-4 text-choc-400 text-sm select-none pointer-events-none">{prefix}</span>}
        <input
          id={inputId}
          className={cx(
            "input-field",
            error ? "border-ember-500/60 focus:ring-ember-500/30 focus:border-ember-500/60" : "",
            prefix && "pl-9",
            suffix && "pr-16",
            className
          )}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          {...rest}
        />
        {suffix && (
          <span className="absolute right-4 text-choc-400 text-sm font-medium select-none pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-choc-400 font-body leading-relaxed">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-err`} className="text-xs text-ember-400 font-body" role="alert">{error}</p>
      )}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    pending:   { cls: "badge-pending",   dot: "bg-gold-400 animate-pulse", label: "Pending" },
    claimed:   { cls: "badge-claimed",   dot: "bg-jade-400",               label: "Claimed" },
    expired:   { cls: "badge-expired",   dot: "bg-ember-400",              label: "Expired" },
    reclaimed: { cls: "badge-reclaimed", dot: "bg-choc-300",               label: "Reclaimed" },
  };
  const v = map[status] ?? { cls: "badge-reclaimed", dot: "bg-choc-400", label: status };
  return (
    <span className={v.cls}>
      <span className={cx("w-1.5 h-1.5 rounded-full shrink-0", v.dot)} aria-hidden="true"/>
      {v.label}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = "md", className }: { size?: "sm"|"md"|"lg"; className?: string }) {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  return (
    <svg className={cx("animate-spin text-gold-500", s, className)} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
interface SkeletonProps { className?: string; }
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cx("skeleton", className)} aria-hidden="true"/>;
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cx("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}/>
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cx("card p-5 flex flex-col gap-4", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28"/>
        <Skeleton className="h-5 w-16 rounded-full"/>
      </div>
      <Skeleton className="h-8 w-40"/>
      <div className="flex flex-col gap-2 border-t border-choc-700/40 pt-3">
        <div className="flex justify-between"><Skeleton className="h-3.5 w-20"/><Skeleton className="h-3.5 w-24"/></div>
        <div className="flex justify-between"><Skeleton className="h-3.5 w-16"/><Skeleton className="h-3.5 w-32"/></div>
        <div className="flex justify-between"><Skeleton className="h-3.5 w-24"/><Skeleton className="h-3.5 w-20"/></div>
      </div>
    </div>
  );
}

export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-hidden="true">
      {[...Array(4)].map((_,i) => (
        <div key={i} className="card p-4 flex flex-col gap-2">
          <Skeleton className="h-3 w-16"/>
          <Skeleton className="h-6 w-24"/>
        </div>
      ))}
    </div>
  );
}

// ─── TxStatusBar ──────────────────────────────────────────────────────────────
export function TxStatusBar({ status, txHash, error }: { status: string; txHash?: string|null; error?: string|null }) {
  if (status === "idle") return null;
  const msgs: Record<string, string> = {
    approving:        "Waiting for USDC approval in wallet…",
    "approval-pending":"Approval confirming on-chain…",
    creating:         "Waiting for transaction signature…",
    "tx-pending":     "Transaction submitted, confirming…",
    confirmed:        "Transaction confirmed!",
    error:            error || "Transaction failed.",
  };
  const isErr = status === "error";
  const isOk  = status === "confirmed";
  return (
    <div
      role="status" aria-live="polite"
      className={cx(
        "rounded-xl border px-4 py-3 flex items-start gap-3 font-body text-sm transition-all duration-300",
        isErr ? "bg-ember-600/10 border-ember-600/30 text-ember-300"
              : isOk ? "bg-jade-500/10 border-jade-600/30 text-jade-300"
                     : "bg-choc-800 border-choc-600/60 text-choc-200"
      )}
    >
      {!isErr && !isOk && <Spinner size="sm" className="mt-0.5 shrink-0"/>}
      {isOk && (
        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-jade-500/20 flex items-center justify-center">
          <svg className="h-2.5 w-2.5 text-jade-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </span>
      )}
      {isErr && (
        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-ember-500/20 flex items-center justify-center">
          <svg className="h-2.5 w-2.5 text-ember-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </span>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="leading-snug">{msgs[status]}</span>
        {txHash && (
          <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            className="text-gold-500 hover:text-gold-400 underline text-xs font-mono truncate"
          >{txHash.slice(0, 20)}… ↗</a>
        )}
      </div>
    </div>
  );
}
