/**
 * WCAG contrast maths for the theme tokens in index.css, so colour changes
 * are checked in CI. jsdom never paints, so contrast can't be measured on
 * rendered pages; instead the token values themselves are checked.
 */

export type Rgb = readonly [number, number, number]; // gamma-encoded sRGB, 0–1

/** Converts `oklch(L C H)` to sRGB (clamped to the displayable range). */
export function oklchToRgb(value: string): Rgb {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value.trim());
  if (!match) throw new Error(`Not an oklch() colour: ${value}`);
  const [l, c, h] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);

  // OKLab → linear sRGB (Björn Ottosson's published matrices).
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const encode = (v: number) => {
    const x = Math.min(Math.max(v, 0), 1);
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  };
  return [encode(linear[0] ?? 0), encode(linear[1] ?? 0), encode(linear[2] ?? 0)];
}

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** A colour at `alpha` opacity painted over `background`, as browsers composite it. */
export function over(color: Rgb, alpha: number, background: Rgb): Rgb {
  return [0, 1, 2].map(
    (i) => (color[i] ?? 0) * alpha + (background[i] ?? 0) * (1 - alpha),
  ) as unknown as Rgb;
}

/** Converts `#rrggbb` (or `#rgb`) to sRGB. */
export function hexToRgb(value: string): Rgb {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match?.[1]) throw new Error(`Not a hex colour: ${value}`);
  const digits = match[1];
  const hex = digits.length === 3 ? digits.replace(/./g, '$&$&') : digits;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as unknown as Rgb;
}

/** Reads `--name: oklch(...)` or `--name: #hex` declarations from a block such as `:root { … }`. */
export function readTokens(css: string, selector: ':root' | '.dark'): Record<string, Rgb> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block`);
  const block = css.slice(start, css.indexOf('}', start));
  const tokens: Record<string, Rgb> = {};
  for (const [, name, value] of block.matchAll(
    /--([\w-]+):\s*(oklch\([^)]*\)|#[0-9a-fA-F]{3,6})\b/g,
  )) {
    if (name && value) tokens[name] = value.startsWith('#') ? hexToRgb(value) : oklchToRgb(value);
  }
  return tokens;
}
