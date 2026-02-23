export function CocarelyLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cocarelyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* Heart shape */}
      <path
        d="M20 35C10 28 2 22 2 14C2 8 6.5 3.5 11.5 3.5C14.5 3.5 17.5 5.5 20 9C22.5 5.5 25.5 3.5 28.5 3.5C33.5 3.5 38 8 38 14C38 22 30 28 20 35Z"
        fill="url(#cocarelyGrad)"
      />
      {/* ECG heartbeat line */}
      <path
        d="M5 19L13 19L15.5 13L18 25L20.5 11L23 21L25 19L35 19"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
