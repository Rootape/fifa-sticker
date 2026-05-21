import { flagSrcSet, flagUrl } from "@/lib/flags";

type Props = {
  teamCode: string;
  teamName: string;
  size?: number;
  className?: string;
};

export function TeamFlag({ teamCode, teamName, size = 80, className }: Props) {
  const code = teamCode.toUpperCase();
  const wrapper = `inline-flex items-center justify-center overflow-hidden rounded-md ring-1 ring-[color:var(--color-border)] bg-[color:var(--color-surface)] ${className ?? ""}`;
  const style = { width: size, height: Math.round(size * 0.66) };

  if (code === "FWC") {
    return (
      <span
        className={`${wrapper} font-bold text-[color:#062b1f] bg-gradient-to-br from-[color:var(--color-brand)] to-emerald-700`}
        style={style}
        aria-label="FIFA World Cup"
      >
        <span className="text-[11px] tracking-wider leading-none">FIFA</span>
      </span>
    );
  }

  const src = flagUrl(code, size);
  const srcSet = flagSrcSet(code, size);
  if (!src) {
    return (
      <span className={wrapper} style={style} aria-label={teamName}>
        <span className="font-mono text-[10px] text-[color:var(--color-text-muted)]">
          {code}
        </span>
      </span>
    );
  }
  return (
    <span className={wrapper} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={srcSet ?? undefined}
        alt={`Bandeira ${teamName}`}
        width={size}
        height={Math.round(size * 0.66)}
        className="block w-full h-full object-cover"
        loading="lazy"
      />
    </span>
  );
}
