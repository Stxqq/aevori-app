import './activity-indicator.css';
/** Three soft beats, implemented locally for AEVORI. */
export default function ActivityIndicator({ label = '' }: { label?: string; variant?: string }) {
  return (
    <span className="aevori-beats">
      <span aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}
