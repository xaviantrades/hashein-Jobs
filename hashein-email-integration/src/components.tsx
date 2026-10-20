import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function Brand({ href = "#top", onClick }: { href?: string; onClick?: () => void }) {
  return (
    <a className="brand" href={href} onClick={onClick} aria-label="Hashein Uganda, back to top">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 42 42" fill="none">
          <path d="M9 8V34M33 8V34M9 21H33" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
          <path d="M25 13L33 21" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        </svg>
      </span>
      <span className="brand-wordmark">
        <strong>HASHEIN</strong>
        <span>UGANDA</span>
      </span>
    </a>
  );
}

export function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`section-label${light ? " section-label--light" : ""}`}>
      <span className="section-label-line" aria-hidden="true" />
      {children}
    </p>
  );
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { y: 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.13 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  placeholder,
  children,
  disabled = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`form-field ${className}`}>
      <span className="field-label">{label} <span aria-hidden="true">*</span></span>
      <span className="select-shell">
        <select value={value} onChange={(event) => onChange(event.target.value)} required disabled={disabled}>
          <option value="" disabled>{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={17} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </label>
  );
}
