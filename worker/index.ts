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
          return new Response("🎉", { headers: { "content-type": "text/plain" } });
        }

        const [secretEmbedding, guessEmbedding] = await env.VECTORIZE.getByIds([secret, text]);

        if (!guessEmbedding) {
          return new Response("Unknown word", { status: 404, headers: { "content-type": "text/plain" } });
        }

        const sim = similarity.cosine(guessEmbedding.values, secretEmbedding.values);
        const score = Math.round(sim * 100);

        return new Response(`${score}%`, { headers: { "content-type": "text/plain" } });
      }

      return new Response("0", { headers: { "content-type": "text/plain" } });
    }

		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
