import { env } from "cloudflare:workers";
import { similarity } from "ml-distance";

async function getEmbedding(text: string) {
  const [vector] = await env.VECTORIZE.getByIds([text]);

  if (vector) {
    return vector.values;
  } else {
    const { data: [values] } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text }) as any;
    await env.VECTORIZE.upsert([
      { id: text, values },
    ]);
    return values;
  }
}

/**
 * Map cosine similarity -> 0..100 with exact caps:
 *  - sim <= minSim  => 0
 *  - sim >= maxSim  => 100
 * Tunables:
 *  - minSim: bruit de fond (≈ 0.20–0.35 selon ton modèle)
 *  - maxSim: “vraiment très proche” (≈ 0.85–0.95)
 *  - gamma: courbure (>1 = plus exigeant)
 */
function similarityToScore(
  sim: number,
  { minSim = 0.5, maxSim = 1, gamma = 0.5, smooth = true } = {}
) {
  console.log('sim', sim);
  // 1) normaliser dans [0..1] en pinçant la plage utile
  let t = (sim - minSim) / (maxSim - minSim);
  t = Math.max(0, Math.min(1, t));           // clamp

  // 2) (optionnel) lisser pour une montée plus “organique”
  if (smooth) t = t * t * (3 - 2 * t);        // smoothstep

  // 3) accentuer ou adoucir la courbe
  t = Math.pow(t, gamma);

  // 4) 0..100 avec garantie : sim>=maxSim => 100 ; sim<=minSim => 0
  return Math.round(t * 100);
}

export default {
  async fetch(request) {
    const secret = 'car';

    const url = new URL(request.url);

    if (url.pathname === "/guess") {
      const text = url.searchParams.get("q") ?? "";

      if (text) {
        const [guessEmbedding, secretEmbedding] = await Promise.all([getEmbedding(text), getEmbedding(secret)]);
        const score = similarityToScore(similarity.cosine(guessEmbedding, secretEmbedding));

        return new Response(score.toString(), { headers: { "content-type": "text/plain" } });
      }

      return new Response("0", { headers: { "content-type": "text/plain" } });
    }

		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
