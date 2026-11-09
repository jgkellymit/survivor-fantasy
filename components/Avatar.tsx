type Size = "sm" | "md" | "lg" | "xl";

// Warm, tribe-like colours for castaways without a photo
const TRIBE = ["#e85d04", "#0f766e", "#7c3aed", "#ca8a04", "#be123c", "#2563eb", "#15803d", "#c2410c"];
function hue(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TRIBE[h % TRIBE.length];
}

export function Avatar({ name, photo, lg, size }: { name: string; photo?: string | null; lg?: boolean; size?: Size }) {
  const sz = size ?? (lg ? "lg" : "md");
  const cls = `avatar ${sz}`;
  if (photo) return <img className={cls} src={photo} alt="" loading="lazy" />;
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className={cls} style={{ background: hue(name) }} aria-hidden>{initials}</span>;
}

export function CastawayChip({ name, photo, out }: { name: string; photo?: string | null; out?: boolean }) {
  return (
    <span className={out ? "chip out" : "chip"} title={out ? `${name} (out)` : name}>
      <Avatar name={name} photo={photo} />
      {name}
      {out && <span className="snuffed" aria-label="out">🕯️</span>}
    </span>
  );
}

/** Bigger castaway tile for team displays: photo with name underneath; greyed with a snuffed torch when out. */
export function CastawayTile({ name, photo, out, rank }: { name: string; photo?: string | null; out?: boolean; rank?: number }) {
  return (
    <div className={out ? "tile out" : "tile"} title={out ? `${name} (out)` : name}>
      <div className="tile-pic">
        <Avatar name={name} photo={photo} size="lg" />
        {rank && <span className="tile-rank">{rank}</span>}
      </div>
      <span className="tile-name">{name.split(" ")[0]}</span>
    </div>
  );
}
