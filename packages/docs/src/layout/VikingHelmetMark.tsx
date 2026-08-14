export const VikingHelmetMark = ({ className = "brand__mark" }: { className?: string }) => (
  <svg viewBox="0 0 48 40" className={className} aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M24 6C13 6 6 15 6 26v6c0 3.3 2.7 6 6 6h24c3.3 0 6-2.7 6-6v-6C42 15 35 6 24 6ZM24 14c-6.6 0-11 5.3-11 12v6c0 1.1 0.9 2 2 2h4V22h10v12h4c1.1 0 2-0.9 2-2v-6c0-6.7-4.4-12-11-12Z"
    />
    <path fill="currentColor" d="M10 22C4 18 0 10 1 3c2.5 7 7.5 12.5 12 16.5-1 2.5-2 5-3 9.5Z" />
    <path fill="currentColor" d="M38 22c6-4 10-12 9-19-2.5 7-7.5 12.5-12 16.5 1 2.5 2 5 3 9.5Z" />
  </svg>
);

export default VikingHelmetMark;
