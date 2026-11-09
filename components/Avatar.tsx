export function Avatar({ name, photo, lg }: { name: string; photo?: string | null; lg?: boolean }) {
  const cls = lg ? "avatar lg" : "avatar";
  if (photo) return <img className={cls} src={photo} alt="" />;
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className={cls} aria-hidden>{initials}</span>;
}

export function CastawayChip({ name, photo, out }: { name: string; photo?: string | null; out?: boolean }) {
  return (
    <span className={out ? "chip out" : "chip"} title={out ? `${name} (out)` : name}>
      <Avatar name={name} photo={photo} />
      {name}
    </span>
  );
}
