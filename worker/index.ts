import { env } from "cloudflare:workers";
import { similarity } from "ml-distance";

export default {
  async fetch(request) {
    const secret = 'japan';

    const url = new URL(request.url);

    if (url.pathname === "/guess") {
      const text = url.searchParams.get("q") ?? "";

      if (text) {
        if (text === secret) {
          return new Response(JSON.stringify({ score: 100 }), { headers: { "content-type": "application/json" } });
        }

        const [secretEmbedding, guessEmbedding] = await env.VECTORIZE.getByIds([secret, text]);

        if (!guessEmbedding) {
          return new Response(JSON.stringify({ error: "Unknown word" }), { status: 404, headers: { "content-type": "application/json" } });
        }

        const sim = similarity.cosine(guessEmbedding.values, secretEmbedding.values);
        const score = Math.round(sim * 100);

        return new Response(JSON.stringify({ score }), { headers: { "content-type": "application/json" } });
      }

      return new Response(JSON.stringify({ score: 0 }), { headers: { "content-type": "application/json" } });
    }

		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
