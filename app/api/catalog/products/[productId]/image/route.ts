import { getPostgresClient } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const database = getPostgresClient();
  const [image] = await database<
    Array<{ image_data: Buffer | null; content_type: string | null }>
  >`
    SELECT pi.image_data, pi.content_type
    FROM product_images pi
    JOIN products p ON p.id = pi.product_id
    WHERE p.id = ${productId}
      AND p.deleted_at IS NULL
      AND pi.display_order = 1
      AND pi.image_data IS NOT NULL
      AND pi.content_type IN ('image/jpeg', 'image/png', 'image/webp')
    LIMIT 1
  `;

  if (!image?.image_data || !image.content_type) {
    return new Response("Imagem não encontrada.", { status: 404 });
  }

  return new Response(new Uint8Array(image.image_data), {
    headers: {
      "Content-Type": image.content_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
