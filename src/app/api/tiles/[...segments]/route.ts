import "server-only";

const ALLOWED = new Set(["voyager", "light_all", "dark_all"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ segments: string[] }> }) {
  const segments = (await params).segments;
  if (segments.length !== 4) return new Response("Bad request", { status: 400 });

  const [style, z, x, yRaw] = segments;
  const y = yRaw?.replace(/\.png$/, "") ?? "";

  if (!ALLOWED.has(style)) return new Response("Bad request", { status: 400 });
  if (!/^\d{1,2}$/.test(z) || +z > 20) return new Response("Bad request", { status: 400 });
  if (!/^\d+$/.test(x) || !/^\d+$/.test(y) || +x >= 2 ** +z || +y >= 2 ** +z) {
    return new Response("Bad request", { status: 400 });
  }

  const cartoKey = process.env.CARTO_KEY;
  if (!cartoKey) return new Response("CARTO map provider is not configured", { status: 500 });

  const upstream = `https://basemaps.cartocdn.com/rastertiles/${style}/${z}/${x}/${y}.png?key=${encodeURIComponent(cartoKey)}`;
  const res = await fetch(upstream, { cache: "force-cache", next: { revalidate: 31536000 } });
  if (!res.ok) return new Response("Upstream error", { status: 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
