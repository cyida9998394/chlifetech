type Props = {
  className?: string;
};

export default function HandDrawnUnderline({ className }: Props) {
  return (
    <svg
      viewBox="0 0 320 60"
      fill="none"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d="M6,18 C110,10 210,28 288,48"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <g transform="translate(278,38)" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15,20 C9,15 2,12 2,6 C2,2 6,0 9,3 C10,4 10.5,5 11,6.5 C11.5,4.5 12.5,3 14,2.5 C17.5,1.5 20,3.5 19.5,7 C19,12.5 19,15 15,20 Z" />
      </g>
    </svg>
  );
}
