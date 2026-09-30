import BrandLogo from './components/BrandLogo';
/** Shared SVG monogram. Chat replies use their own pixel marker. */
export default function AevoriMark({
  small = false,
  busy = false,
}: {
  small?: boolean;
  busy?: boolean;
}) {
  return (
    <span
      className={`aevori-mark ${small ? 'small' : ''} ${busy ? 'active' : ''}`}
      aria-hidden="true"
    >
      <BrandLogo symbol />
    </span>
  );
}
