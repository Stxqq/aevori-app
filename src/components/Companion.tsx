import { useId } from 'react';
import { appearanceForTone, type CharacterAppearance } from '../../shared/character.mjs';
import './companion.css';
const bodies: Record<CharacterAppearance['shape'], string> = {
  aeri: 'M61 13C89 13 100 34 99 59C97 83 108 94 93 98C82 101 82 88 71 93C57 101 47 89 38 96C19 108 16 85 20 64C22 35 29 12 61 13Z',
  round: 'M60 20C87 20 103 38 103 62C103 88 88 101 61 101C32 101 17 87 17 62C17 38 34 20 60 20Z',
  cat: 'M24 42L23 15Q23 8 29 13L45 27Q60 23 75 27L91 13Q97 8 97 16L96 43C103 57 102 74 94 87Q83 101 60 100Q35 102 24 87C16 74 17 56 24 42Z',
  bot: 'M39 24H81Q101 24 101 44V78Q101 98 82 98H38Q19 98 19 78V44Q19 24 39 24Z',
};
function blend(hex: string, target: number, amount: number) {
  const rgb = [1, 3, 5].map((i) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + target * amount),
  );
  return `rgb(${rgb.join(',')})`;
}
export default function Companion({
  appearance,
  tone = 'pearl',
  active = false,
  size = 100,
}: {
  appearance?: CharacterAppearance;
  tone?: string;
  active?: boolean;
  size?: number;
}) {
  const id = 'character-' + useId().replace(/:/g, '');
  const look = appearance ?? appearanceForTone(tone);
  const color = /^#[0-9a-f]{6}$/i.test(look.color) ? look.color : '#d0d6dc';
  const luminance = [0.2126, 0.7152, 0.0722].reduce(
    (sum, w, i) => sum + w * parseInt(color.slice(1 + i * 2, 3 + i * 2), 16),
    0,
  );
  const ink = luminance < 95 ? '#fffaf4' : '#292a30';
  const light = blend(color, 255, 0.7);
  const shade = blend(color, 0, 0.1);
  return (
    <span
      className={`companion ${active ? 'working' : ''}`}
      data-shape={look.shape}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" focusable="false">
        <defs>
          <radialGradient id={id} cx="30%" cy="21%" r="87%">
            <stop stopColor={light} />
            <stop offset=".45" stopColor={color} />
            <stop offset="1" stopColor={blend(color, 0, 0.24)} />
          </radialGradient>
          <linearGradient id={id + 'rim'} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff" stopOpacity=".75" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".12" />
          </linearGradient>
          <radialGradient id={id + 'glow'}>
            <stop stopColor="#fff" stopOpacity=".72" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id={id + 's'} x="-35%" y="-40%" width="170%" height="185%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodOpacity=".12" />
          </filter>
        </defs>
        <ellipse
          className="companion-shadow"
          cx="60"
          cy="109"
          rx="27"
          ry="3.5"
          fill="currentColor"
          opacity=".08"
        />
        <g className="companion-body" filter={`url(#${id}s)`}>
          {look.shape === 'cat' && (
            <path
              className="companion-tail"
              d="M91 87Q112 88 106 67"
              stroke={shade}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {look.shape === 'bot' && (
            <g className="companion-antenna">
              <path d="M60 25V17" stroke={shade} strokeWidth="3" />
              <circle cx="60" cy="13" r="5" fill={color} />
              <circle cx="59" cy="12" r="1.5" fill="#fff" opacity=".7" />
            </g>
          )}
          {look.shape === 'bot' && (
            <g fill={shade}>
              <rect x="12" y="49" width="11" height="23" rx="5" />
              <rect x="97" y="49" width="11" height="23" rx="5" />
            </g>
          )}
          <path
            fill={`url(#${id})`}
            stroke={`url(#${id}rim)`}
            strokeWidth="1.2"
            d={bodies[look.shape] || bodies.aeri}
          />
          <ellipse cx="44" cy="37" rx="23" ry="17" fill={`url(#${id}glow)`} opacity=".5" />
          {look.shape === 'cat' && (
            <g fill={ink} opacity=".1">
              <path d="M29 22L31 41L42 31Z" />
              <path d="M91 22L89 41L78 31Z" />
            </g>
          )}
          <path
            d={
              look.shape === 'bot'
                ? 'M29 44Q29 34 42 34'
                : look.shape === 'round'
                  ? 'M29 48Q34 33 50 29'
                  : 'M30 48Q33 31 47 28'
            }
            fill="none"
            stroke="#fff"
            opacity=".45"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {look.shape === 'bot' && (
            <rect x="29" y="43" width="62" height="38" rx="15" fill={ink} opacity=".065" />
          )}
          <g className="companion-face">
            <g
              className="companion-eyes"
              fill={ink}
              stroke={ink}
              strokeLinecap="round"
              strokeWidth="2.8"
            >
              {look.eyes === 'happy' ? (
                <>
                  <path d="M41 58Q47 48 53 58" fill="none" />
                  <path d="M67 58Q73 48 79 58" fill="none" />
                </>
              ) : look.eyes === 'calm' ? (
                <>
                  <path d="M42 56Q47 60 52 56" fill="none" />
                  <path d="M68 56Q73 60 78 56" fill="none" />
                </>
              ) : (
                <>
                  <ellipse cx="47" cy="57" rx="4.4" ry="6.3" stroke="none" />
                  <ellipse cx="73" cy="57" rx="4.4" ry="6.3" stroke="none" />
                  <g fill="#fff" stroke="none" opacity=".78">
                    <ellipse cx="46" cy="55" rx="1.25" ry="1.8" />
                    <ellipse cx="72" cy="55" rx="1.25" ry="1.8" />
                  </g>
                </>
              )}
            </g>
            <path
              d={look.eyes === 'happy' ? 'M54 71Q60 80 66 71Z' : 'M56 72Q60 75 64 72'}
              fill={look.eyes === 'happy' ? ink : 'none'}
              stroke={ink}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <g fill="#dc819d" opacity=".35">
              <ellipse cx="36" cy="69" rx="5" ry="2.3" />
              <ellipse cx="84" cy="69" rx="5" ry="2.3" />
            </g>
          </g>
          {look.accessory === 'glasses' && (
            <g fill="none" stroke="#34353f" strokeWidth="2.7">
              <rect x="35" y="48" width="23" height="19" rx="7" />
              <rect x="62" y="48" width="23" height="19" rx="7" />
              <path d="M58 54H62M29 53L35 55M85 55L91 53" />
            </g>
          )}
          {look.accessory === 'headphones' && (
            <g>
              <path
                d="M19 58V47C19 4 101 4 101 47V58"
                fill="none"
                stroke="#30323b"
                strokeWidth="5"
              />
              <rect x="14" y="45" width="12" height="27" rx="6" fill="#353741" />
              <rect x="94" y="45" width="12" height="27" rx="6" fill="#353741" />
              <path
                d="M19 51V63M101 51V63"
                stroke="#9397a4"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}
          {look.accessory === 'sprout' && (
            <g>
              <path
                d="M60 24Q62 11 58 6"
                fill="none"
                stroke="#548264"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path d="M60 15C45 17 45 5 43 4C57 1 63 5 60 15Z" fill="#91b99a" />
              <path d="M61 18C75 20 81 11 80 7C65 5 60 9 61 18Z" fill="#609576" />
            </g>
          )}
        </g>
      </svg>
    </span>
  );
}
