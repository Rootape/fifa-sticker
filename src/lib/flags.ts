const FIFA_TO_ISO: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

const VALID_CDN_WIDTHS = [20, 40, 80, 160, 320, 640, 1280, 2560] as const;

function nearestCdnWidth(target: number): number {
  for (const w of VALID_CDN_WIDTHS) if (w >= target) return w;
  return VALID_CDN_WIDTHS[VALID_CDN_WIDTHS.length - 1];
}

export function flagUrl(teamCode: string, visualWidth: number = 80): string | null {
  const iso = FIFA_TO_ISO[teamCode.toUpperCase()];
  if (!iso) return null;
  return `https://flagcdn.com/w${nearestCdnWidth(visualWidth)}/${iso}.png`;
}

export function flagSrcSet(teamCode: string, visualWidth: number = 80): string | null {
  const iso = FIFA_TO_ISO[teamCode.toUpperCase()];
  if (!iso) return null;
  const w1 = nearestCdnWidth(visualWidth);
  const w2 = nearestCdnWidth(visualWidth * 2);
  return `https://flagcdn.com/w${w1}/${iso}.png 1x, https://flagcdn.com/w${w2}/${iso}.png 2x`;
}
