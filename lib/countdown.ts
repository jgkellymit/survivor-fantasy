export function timeLeft(deadline: Date, now = new Date()): string | null {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  if (h >= 48) return `${Math.floor(h / 24)} days left`;
  if (h >= 1) return `${h} hour${h === 1 ? "" : "s"} left`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min left`;
}
