import { useId } from 'react';
/** Original, generic device illustration; no Apple artwork or logo. */
export default function MacImage({
  name = '',
  className = '',
}: {
  name?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const laptop = /book/i.test(name);
  const desktop = /imac/i.test(name);
  return (
    <svg
      className={`mac-product-image ${className}`}
      viewBox="0 0 320 230"
      role="img"
      aria-label={name || 'Your computer'}
    >
      <defs>
        <linearGradient id={id + 'metal'} x2="0" y2="1">
          <stop stopColor="#e4e7ec" />
          <stop offset=".48" stopColor="#a6adb9" />
          <stop offset="1" stopColor="#5b6473" />
        </linearGradient>
        <linearGradient id={id + 'screen'} x2="1" y2="1">
          <stop stopColor="#34394a" />
          <stop offset="1" stopColor="#141824" />
        </linearGradient>
        <radialGradient id={id + 'glow'}>
          <stop stopColor="#bfcaf4" stopOpacity=".65" />
          <stop offset="1" stopColor="#6f87cf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="203" rx="120" ry="9" fill="currentColor" opacity=".07" />
      {laptop || desktop ? (
        <>
          <rect x="48" y="32" width="224" height="145" rx="12" fill={`url(#${id}metal)`} />
          <rect x="53" y="37" width="214" height="133" rx="8" fill={`url(#${id}screen)`} />
          <ellipse cx="167" cy="116" rx="94" ry="70" fill={`url(#${id}glow)`} />
          <path
            d="M68 135Q112 83 160 116T252 91"
            fill="none"
            stroke="#b6c5ed"
            strokeOpacity=".45"
            strokeWidth="1.5"
          />
          {laptop ? (
            <path
              d="M48 179H272L298 194Q300 201 288 201H32Q20 201 22 194ZM128 180H192L187 185H133Z"
              fill={`url(#${id}metal)`}
            />
          ) : (
            <path d="M143 177H177L184 198H204V203H116V198H136Z" fill={`url(#${id}metal)`} />
          )}
        </>
      ) : (
        <>
          <path
            d="M57 89Q58 66 82 66H238Q262 66 263 89V157Q260 173 240 177H80Q60 173 57 157Z"
            fill={`url(#${id}metal)`}
          />
          <ellipse cx="160" cy="77" rx="95" ry="17" fill="#e5e8ed" />
          <path
            d="M80 141H102M111 141H118"
            stroke="#384150"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="239" cy="142" r="2" fill="#d3f0de" />
          <path d="M124 82 156 73 191 80 159 89Z" fill="#aeb6c5" opacity=".5" />
        </>
      )}
    </svg>
  );
}
