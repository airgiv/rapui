/* a soft photograph of a courthouse at first light, drawn in SVG: a warm sky, a
   classical front with its steps and columns, trees either side, all a little out
   of focus so it reads as a photo behind the live parts and ships no image file */
export function Courthouse() {
  const cols = Array.from({ length: 8 }, (_, i) => 520 + i * 80);
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="ch-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ea6cf" />
          <stop offset="0.55" stopColor="#cdd6e6" />
          <stop offset="1" stopColor="#f2dccb" />
        </linearGradient>
        <radialGradient id="ch-sun" cx="0.72" cy="0.62" r="0.5">
          <stop offset="0" stopColor="#fff1dc" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff1dc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ch-stone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d3c8" />
          <stop offset="0.6" stopColor="#efe9df" />
          <stop offset="1" stopColor="#e2dbcf" />
        </linearGradient>
        <filter id="ch-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="ch-far" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <rect width="1600" height="900" fill="url(#ch-sky)" />
      <rect width="1600" height="900" fill="url(#ch-sun)" />
      {/* far trees */}
      <g filter="url(#ch-far)" fill="#4d6a5a" opacity="0.8">
        <ellipse cx="120" cy="560" rx="260" ry="200" />
        <ellipse cx="1500" cy="540" rx="280" ry="220" />
        <ellipse cx="360" cy="620" rx="200" ry="120" fill="#5f7c66" />
        <ellipse cx="1260" cy="620" rx="220" ry="130" fill="#5f7c66" />
      </g>
      <g filter="url(#ch-soft)">
        {/* dome */}
        <path d="M720 250 Q800 150 880 250 Z" fill="#e6dfd3" />
        <rect x="792" y="128" width="16" height="40" rx="4" fill="#d3ccc0" />
        <rect x="700" y="248" width="200" height="34" fill="#ddd6ca" />
        {/* pediment and entablature */}
        <path d="M470 380 L800 270 L1130 380 Z" fill="#efe9df" />
        <path d="M530 368 L800 288 L1070 368 Z" fill="#e0d9cd" />
        <rect x="460" y="378" width="680" height="40" fill="#e9e3d8" />
        <rect x="460" y="414" width="680" height="10" fill="#cfc8bb" />
        {/* columns, shaded on their left */}
        {cols.map((x) => (
          <g key={x}>
            <rect x={x - 22} y="424" width="44" height="250" fill="url(#ch-stone)" />
            <rect x={x - 22} y="424" width="12" height="250" fill="#c9c1b3" opacity="0.7" />
            <rect x={x - 28} y="424" width="56" height="12" fill="#e7e0d4" />
          </g>
        ))}
        {/* the shade behind the colonnade */}
        <rect x="478" y="436" width="644" height="238" fill="#8e8a86" opacity="0.18" />
        {/* steps */}
        <rect x="440" y="674" width="720" height="18" fill="#e9e3d8" />
        <rect x="410" y="692" width="780" height="18" fill="#ddd6ca" />
        <rect x="380" y="710" width="840" height="18" fill="#e9e3d8" />
        <rect x="350" y="728" width="900" height="20" fill="#d6cfc2" />
      </g>
      {/* lawn and path */}
      <rect y="748" width="1600" height="152" fill="#7d9a76" />
      <path d="M700 748 L900 748 L1040 900 L560 900 Z" fill="#e4dccd" opacity="0.9" />
      {/* near trees, the most out of focus */}
      <g filter="url(#ch-far)">
        <ellipse cx="-20" cy="420" rx="260" ry="420" fill="#2f4a3a" />
        <ellipse cx="1640" cy="400" rx="260" ry="430" fill="#2f4a3a" />
      </g>
    </svg>
  );
}
