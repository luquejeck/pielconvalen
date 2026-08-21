type Props = { className?: string };

export function IconoWhatsApp({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.01-1.04 2.47 1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.42 9.42 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 6.67 2.77 9.35 9.35 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43zM20.13 3.9A11.32 11.32 0 0 0 12.05.56C5.79.56.7 5.65.7 11.91c0 2 .52 3.95 1.52 5.67L.6 23.44l6-1.57a11.33 11.33 0 0 0 5.44 1.39h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
    </svg>
  );
}

export function IconoInstagram({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoPin({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconoReloj({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function IconoCheck({ className = "h-4 w-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoFlecha({ className = "h-4 w-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoBrillo({ className = "h-6 w-6" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" strokeLinejoin="round" />
      <path d="M18 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoGota({ className = "h-6 w-6" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M12 3.5s6 6.4 6 10.2a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoHoja({ className = "h-6 w-6" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M20 4S9 4 6 9c-2.5 4.2 0 9 0 9s5-.5 8-3.5S20 4 20 4z" strokeLinejoin="round" />
      <path d="M5 20c1.5-4.5 4.5-8 9-10.5" strokeLinecap="round" />
    </svg>
  );
}

/** Dermaplaning: la hojita en angulo, sin filo dibujado para no asustar. */
export function IconoHojilla({ className = "h-6 w-6" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M3.5 15.5 13 6a3 3 0 0 1 4.2 0l1.3 1.3a3 3 0 0 1 0 4.2l-9.5 9.5H3.5v-5.5z" strokeLinejoin="round" />
      <path d="M12.5 7.5 17 12" strokeLinecap="round" />
    </svg>
  );
}

/** Microneedling: los puntitos que trabajan sobre la superficie. */
export function IconoAgujas({ className = "h-6 w-6" }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <path d="M4 17.5h16" strokeLinecap="round" />
      <path d="M7 13.5v-6M12 13.5v-8M17 13.5v-6" strokeLinecap="round" />
      <circle cx="7" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="3.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
