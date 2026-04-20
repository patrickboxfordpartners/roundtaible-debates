interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 36, text: "text-lg" },
  lg: { icon: 48, text: "text-2xl" },
};

export function Logo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Table circle */}
        <circle cx="24" cy="24" r="14" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />

        {/* Seats - 6 circles evenly spaced around the table */}
        <circle cx="24" cy="6" r="4" fill="currentColor" />
        <circle cx="39.6" cy="15" r="4" fill="currentColor" />
        <circle cx="39.6" cy="33" r="4" fill="currentColor" />
        <circle cx="24" cy="42" r="4" fill="currentColor" />
        <circle cx="8.4" cy="33" r="4" fill="currentColor" />
        <circle cx="8.4" cy="15" r="4" fill="currentColor" />
      </svg>

      {!iconOnly && (
        <span className={`font-playfair font-bold tracking-tight ${text}`}>
          roundt<span className="text-primary font-extrabold">AI</span>ble
        </span>
      )}
    </span>
  );
}
