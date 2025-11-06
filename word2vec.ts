import word2vec from "word2vec";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

const loadModel = promisify(word2vec.loadModel);

async function main () {
    const vocab = readFileSync('vocab.txt', 'utf8').split('\n');
    const model = await loadModel('./GoogleNews-vectors-negative300.bin');

    // todo p-map or chunks
    for (const word of vocab) {
        if (word.length === 0) continue;

        const { values } = model.getVector(word);
        console.log(word, JSON.stringify({
            id: word,
            values: Array.from(values),
        }));

        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${process.env.CLOUDFLARE_VECTORIZE_INDEX_NAME}/upsert`, {
            method: 'POST',
            body: JSON.stringify({
                vectors: [
                    {
                        id: word,
                        values: Array.from(values),
                    }
                ]
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
            },
        });

        if (!res.ok) {
            console.error(await res.text());
        }
    }
}

main().catch(console.error);
