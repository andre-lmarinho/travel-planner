import "server-only";

const ALLOWED = new Set(["osm-bright", "osm-bright-grey", "osm-bright-smooth", "positron"]);

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

  const key = process.env.GEOAPIFY_KEY;
  if (!key) return new Response("GEOAPIFY_KEY not set", { status: 500 });

  const upstream = `https://maps.geoapify.com/v1/tile/${style}/${z}/${x}/${y}.png?apiKey=${key}`;
  const res = await fetch(upstream, { cache: "force-cache", next: { revalidate: 31536000 } });
  if (!res.ok) return new Response("Upstream error", { status: 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
