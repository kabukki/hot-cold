import json, sys
from wordfreq import iter_wordlist
from gensim.models import KeyedVectors
import numpy as np

def main():
    model = KeyedVectors.load_word2vec_format("GoogleNews-vectors-negative300.bin", binary=True)
    out = open("vectors.jsonl", "w", encoding="utf-8")
    kept = 0
    missed = 0

    for w in iter_wordlist("en", wordlist="best"):
        if w in model.key_to_index:
            vec = model[w].astype(np.float32)
            rec = {"id": w, "values": vec.tolist()}
            out.write(json.dumps(rec) + "\n")
            kept += 1
        else:
            missed += 1

        if (kept + missed) % 1000 == 0:
            print(f"... processed {kept + missed}, kept={kept}, missed={missed}", file=sys.stderr)

    out.close()
    print(f"Done. Wrote {kept} vectors. Missed {missed}.", file=sys.stderr)

if __name__ == "__main__":
    main()
