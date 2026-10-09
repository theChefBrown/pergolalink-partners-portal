export function PergolaIllustration() {
  return (
    <svg className="pergola" viewBox="0 0 600 500" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="roof" x1="180" y1="100" x2="430" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--structure-top)" />
          <stop offset="1" stopColor="var(--structure-bottom)" />
        </linearGradient>
        <linearGradient id="glass" x1="135" y1="190" x2="400" y2="390" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" stopOpacity=".12" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity=".01" />
        </linearGradient>
      </defs>
      <g className="drawing-grid" stroke="var(--diagram-grid)" strokeWidth=".7">
        {Array.from({ length: 12 }, (_, i) => <path key={`a${i}`} d={`M${-180 + i * 55} 340l440 180`} />)}
        {Array.from({ length: 12 }, (_, i) => <path key={`b${i}`} d={`M${i * 55} 495l400-245`} />)}
      </g>
      <path d="m83 373 275 105 200-135-275-105Z" fill="var(--accent)" opacity=".035" />
      <g className="pergola-structure" strokeLinejoin="round">
        <path d="m302 110 218 91v171l-218-90Z" fill="url(#glass)" stroke="var(--structure-line)" />
        <path d="m111 216 209 79v168l-209-80Z" fill="url(#glass)" stroke="var(--structure-line)" />
        <path d="M181 245v162m70-135v162M375 143v169m70-139v169" stroke="var(--structure-line)" opacity=".6" />
        <path d="m302 110 10 4v170l-10 7-9-4V116Z" fill="var(--structure-bottom)" stroke="var(--structure-line)" />
        <path d="m111 213 12 5v174l-12 7-9-4V218Z" fill="var(--structure-bottom)" stroke="var(--structure-line)" />
        <path d="m513 203 12-6v174l-12 8-9-4V208Z" fill="var(--structure-bottom)" stroke="var(--structure-line)" />
        <path d="m316 293 14-7v174l-14 9-10-4V298Z" fill="var(--structure-bottom)" stroke="var(--structure-line)" />
        <path d="m100 203 196-120 238 97-211 129Z" fill="url(#roof)" stroke="var(--structure-line)" />
        <g stroke="var(--slat-line)" strokeWidth="5">
          {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${119 + i * 13} ${201 - i * 8}l204 83`} />)}
        </g>
        <path d="m100 203 223 91 211-127v23L323 319l-223-91Z" fill="var(--structure-bottom)" stroke="var(--structure-line)" />
        <path d="m111 222 211 86 200-121" stroke="var(--accent)" strokeWidth="2" className="pergola-light" />
        <path d="M323 319v141" stroke="var(--structure-line)" />
      </g>
      <g stroke="var(--accent)" strokeWidth=".8" opacity=".6">
        <path d="m95 426 213 83m-215-89-6 12m222 71-5 12M548 204v168m-6-168h12m-12 168h12" />
        <circle cx="111" cy="221" r="5" fill="var(--background)" />
        <circle cx="323" cy="307" r="5" fill="var(--background)" />
        <circle cx="522" cy="187" r="5" fill="var(--background)" />
      </g>
    </svg>
  );
}
