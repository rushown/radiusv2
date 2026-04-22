import React from "react";
import { clsx } from "clsx";

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center font-body font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-chocolate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md";

  const variants = {
    primary:
      "bg-gold-500 text-chocolate-900 hover:bg-gold-400 active:bg-gold-600 shadow-gold-sm hover:shadow-gold-md animate-pulse-gold",
    secondary:
      "bg-chocolate-600 text-chocolate-100 border border-chocolate-500 hover:bg-chocolate-500 hover:border-chocolate-400",
    ghost:
      "bg-transparent text-chocolate-200 hover:bg-chocolate-700 hover:text-chocolate-50 border border-chocolate-600 hover:border-chocolate-500",
    danger:
      "bg-red-900/40 text-red-300 border border-red-800 hover:bg-red-900/60",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-chocolate-600/60 bg-chocolate-700/50 backdrop-blur-sm shadow-inset-chocolate",
        glow && "shadow-gold-sm border-gold-700/30",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "pending"
  | "claimed"
  | "expired"
  | "reclaimed"
  | "neutral";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: {
      label: "Pending",
      cls: "bg-gold-500/15 text-gold-400 border-gold-600/30",
    },
    claimed: {
      label: "Claimed",
      cls: "bg-green-900/30 text-green-400 border-green-700/30",
    },
    expired: {
      label: "Expired",
      cls: "bg-red-900/30 text-red-400 border-red-700/30",
    },
    reclaimed: {
      label: "Reclaimed",
      cls: "bg-chocolate-500/30 text-chocolate-200 border-chocolate-500/30",
    },
  };

  const variant = map[status] ?? {
    label: status,
    cls: "bg-chocolate-600/30 text-chocolate-300 border-chocolate-600/30",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-body",
        variant.cls
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          status === "pending" && "bg-gold-400 animate-pulse",
          status === "claimed" && "bg-green-400",
          status === "expired" && "bg-red-400",
          status === "reclaimed" && "bg-chocolate-300"
        )}
      />
      {variant.label}
    </span>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-body text-sm font-medium text-chocolate-200"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-chocolate-300 font-body text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            "w-full bg-chocolate-800 border rounded-lg px-3 py-2.5 text-chocolate-50 font-body text-sm placeholder-chocolate-400",
            "focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600",
            "transition-colors duration-150",
            error
              ? "border-red-700 focus:ring-red-700/30"
              : "border-chocolate-600 hover:border-chocolate-500",
            prefix && "pl-8",
            suffix && "pr-12",
            className
          )}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          aria-invalid={!!error}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-chocolate-300 font-body text-sm select-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-chocolate-400 font-body">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-red-400 font-body"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <svg
      className={clsx("animate-spin text-gold-500", sizes[size])}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── TxStatusBar ──────────────────────────────────────────────────────────────

export function TxStatusBar({
  status,
  txHash,
  error,
}: {
  status: string;
  txHash?: string | null;
  error?: string | null;
}) {
  if (status === "idle") return null;

  const messages: Record<string, string> = {
    approving: "Waiting for USDC approval signature…",
    "approval-pending": "Approval transaction confirming…",
    creating: "Waiting for transaction signature…",
    "tx-pending": "Transaction submitted, confirming on-chain…",
    confirmed: "Transaction confirmed!",
    error: error || "Transaction failed.",
  };

  const isError = status === "error";
  const isSuccess = status === "confirmed";

  return (
    <div
      className={clsx(
        "rounded-lg border px-4 py-3 flex items-start gap-3 font-body text-sm",
        isError
          ? "bg-red-900/20 border-red-800/50 text-red-300"
          : isSuccess
          ? "bg-green-900/20 border-green-800/50 text-green-300"
          : "bg-chocolate-800 border-chocolate-600 text-chocolate-200"
      )}
      role="status"
      aria-live="polite"
    >
      {!isError && !isSuccess && <Spinner size="sm" />}
      {isSuccess && (
        <svg className="h-4 w-4 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {isError && (
        <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <div className="flex flex-col gap-1">
        <span>{messages[status]}</span>
        {txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-500 hover:text-gold-400 underline text-xs"
          >
            View on ArcScan ↗
          </a>
        )}
      </div>
    </div>
  );
}

export { clsx };
