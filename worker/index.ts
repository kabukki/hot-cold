import { env } from "cloudflare:workers";
import { similarity } from "ml-distance";

export default {
  async fetch(request) {
    const secret = 'car';

    const url = new URL(request.url);

    if (url.pathname === "/guess") {
      const text = url.searchParams.get("q") ?? "";

      if (text) {
        const [guessEmbedding] = await env.VECTORIZE.getByIds([text]);

        if (!guessEmbedding) {
          return new Response("-1", { status: 404, headers: { "content-type": "text/plain" } });
        }

        const [secretEmbedding] = await env.VECTORIZE.getByIds([secret]);

        const sim = similarity.cosine(guessEmbedding.values, secretEmbedding.values);
        const score = Math.round(sim * 100);

        // Debug
        const top = await env.VECTORIZE.query(secretEmbedding.values, { topK: 10 });
        console.log('top', top);

        return new Response(score.toString(), { headers: { "content-type": "text/plain" } });
      }

      return new Response("0", { headers: { "content-type": "text/plain" } });
    }

		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
