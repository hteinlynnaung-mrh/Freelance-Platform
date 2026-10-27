type ArcherMarkProps = {
  size?: number;
  className?: string;
};

export function ArcherMark({ size = 28, className = "" }: ArcherMarkProps) {
  return (
    <svg
      className={`archer-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Archer logo"
    >
      <path className="archer-mark-tile" d="M14 2h20c6.627 0 12 5.373 12 12v20c0 6.627-5.373 12-12 12H14C7.373 46 2 40.627 2 34V14C2 7.373 7.373 2 14 2Z" />
      <path className="archer-mark-bow" d="M13 35c2.6-13.7 6.25-21 11-21s8.4 7.3 11 21" />
      <path className="archer-mark-arrow" d="M11 31 34 13" />
      <path className="archer-mark-arrowhead" d="m34 13-1.5 5.2M34 13l-5.2 1.5" />
      <path className="archer-mark-feather" d="m13 29-3.5-1.5M13 29l-1 3.5" />
    </svg>
  );
}
