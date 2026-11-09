"use client";
import { useState } from "react";

const SIZE = 400;

/** Picks an image, crops it to a centred square (biased to the top, where faces are), and shrinks it to 400px JPEG. */
export function PhotoUpload({ castawayId, action }: { castawayId: string; action: (f: FormData) => Promise<void> }) {
  const [data, setData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      URL.revokeObjectURL(url);
      setErr("This browser can't read that image. Try a JPEG or PNG.");
      return;
    }
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = img.naturalHeight > img.naturalWidth ? (img.naturalHeight - side) * 0.15 : 0;
    const c = document.createElement("canvas");
    c.width = c.height = SIZE;
    c.getContext("2d")!.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
    URL.revokeObjectURL(url);
    setData(c.toDataURL("image/jpeg", 0.85));
  }

  return (
    <form action={async (f) => { setBusy(true); await action(f); }} className="row" style={{ gap: 8 }}>
      <input type="hidden" name="id" value={castawayId} />
      <input type="hidden" name="data" value={data ?? ""} />
      <label className="btn secondary small-btn">
        {data ? "Change" : "Upload photo"}
        <input type="file" accept="image/*" onChange={onPick} hidden />
      </label>
      {err && <span className="small" style={{ color: "var(--bad)" }}>{err}</span>}
      {data && (
        <>
          <img src={data} alt="Preview" className="avatar lg" />
          <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save photo"}</button>
        </>
      )}
    </form>
  );
}
