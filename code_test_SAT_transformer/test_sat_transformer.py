"""
sanity_check.py
===============
Test de vérification de l'apprenabilité : vérifier si le modèle peut apprendre sur un jeu de données artificiel "facile".

Logique :
  - Génération de deux types de formules :
      SAT   → 3-SAT aléatoire, rapport clauses/variables = 2.0 (bien en dessous du point de transition, presque toujours satisfiable)
      UNSAT → Insertion délibérée d'une paire de clauses contradictoires (x) ∧ (¬x), donc forcément insatisfiable
  - Ces deux types présentent des différences structurelles évidentes, le modèle devrait donc apprendre facilement.
  - Si même cela échoue, cela indique un problème dans le code ou l'architecture.
  - Si l'apprentissage réussit (val_acc > 90 %), le modèle est sain et la difficulté réelle vient de la tâche sur les données SATLIB originales.

Exécution (Colab) :
  !pip install python-sat -q
  %run sanity_check.py
"""

import random, torch, torch.nn as nn, time
from torch.utils.data import DataLoader
from collections import Counter

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {device}")

# ── Génération des données artificielles ──────────────────────────────────────────────
def make_easy_sat(num_vars=20, ratio=2.0, seed=None):
    """3-SAT aléatoire de faible densité de clauses, presque toujours SAT"""
    rng = random.Random(seed)
    num_clauses = int(num_vars * ratio)
    clauses = []
    for _ in range(num_clauses):
        vs = rng.sample(range(1, num_vars + 1), 3)
        clause = [v if rng.random() > 0.5 else -v for v in vs]
        clauses.append(clause)
    return clauses

def make_obvious_unsat(num_vars=20, ratio=2.0, seed=None):
    """Formule rendue insatisfiable par une paire contradictoire (x1) ∧ (¬x1)"""
    rng = random.Random(seed)
    num_clauses = int(num_vars * ratio)
    clauses = []
    # Noyau contradictoire : une paire de clauses unitaires
    clauses.append([1])
    clauses.append([-1])
    for _ in range(num_clauses - 2):
        vs = rng.sample(range(1, num_vars + 1), 3)
        clause = [v if rng.random() > 0.5 else -v for v in vs]
        clauses.append(clause)
    return clauses

def generate_easy_dataset(n=1000, num_vars=20, seed=42):
    rng = random.Random(seed)
    data = []
    for i in range(n // 2):
        data.append((make_easy_sat(num_vars,  seed=rng.randint(0, 999999)), 1))
        data.append((make_obvious_unsat(num_vars, seed=rng.randint(0, 999999)), 0))
    rng.shuffle(data)
    return data

# ── Tokenisation (identique à celle du programme principal) ──────────────────────────
PAD_ID = 0
SEP_ID = 1

def build_vocab_from_clauses(all_clauses, num_vars):
    token2id = {'PAD': 0, 'SEP': 1}
    for v in range(1, num_vars + 1):
        token2id[f'x{v}']  = len(token2id)
        token2id[f'~x{v}'] = len(token2id)
    return token2id

def encode(clauses, token2id, max_len=256):
    tokens, boundaries = [], []
    for i, clause in enumerate(clauses):
        start = len(tokens)
        for lit in clause:
            if len(tokens) >= max_len:
                break
            key = f'x{lit}' if lit > 0 else f'~x{-lit}'
            tokens.append(token2id.get(key, PAD_ID))
        end = len(tokens)
        if end > start:
            boundaries.append(list(range(start, end)))
        if len(tokens) >= max_len:
            break
        if i < len(clauses) - 1:
            tokens.append(SEP_ID)
    tokens = tokens + [PAD_ID] * (max_len - len(tokens))
    return torch.tensor(tokens, dtype=torch.long), boundaries

# ── Modèle (identique au programme principal) ──────────────────────────────────────
class ClauseTransformer(nn.Module):
    def __init__(self, vocab_size, d_model=64, nhead=4, num_layers=2, max_len=256, dropout=0.1):
        super().__init__()
        self.pad_id = PAD_ID
        self.d_model = d_model
        self.embedding = nn.Embedding(vocab_size, d_model, padding_idx=PAD_ID)
        self.pos_embedding = nn.Parameter(torch.randn(1, max_len, d_model) * 0.02)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model, nhead, dim_feedforward=d_model*4,
            dropout=dropout, batch_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers)
        self.clause_mlp = nn.Sequential(nn.Linear(d_model, d_model), nn.GELU(), nn.Dropout(dropout))
        self.norm = nn.LayerNorm(d_model)
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2), nn.GELU(),
            nn.Dropout(dropout), nn.Linear(d_model // 2, 1)
        )

    def forward(self, token_ids, clause_boundaries):
        mask = (token_ids == self.pad_id)
        x = self.embedding(token_ids) + self.pos_embedding[:, :token_ids.size(1), :]
        x = self.transformer(x, src_key_padding_mask=mask)
        batch_embs = []
        for b in range(x.size(0)):
            embs = []
            for idx_list in clause_boundaries[b]:
                valid = [i for i in idx_list if i < x.size(1)]
                if valid:
                    embs.append(x[b, valid, :].mean(0))
            if embs:
                mat = self.clause_mlp(torch.stack(embs))
                batch_embs.append(mat.mean(0))
            else:
                batch_embs.append(torch.zeros(self.d_model, device=x.device))
        out = self.norm(torch.stack(batch_embs))
        return self.classifier(out).squeeze(-1)

def collate(batch):
    toks = torch.stack([b[0] for b in batch])
    bnds = [b[1] for b in batch]
    lbls = torch.tensor([b[2] for b in batch], dtype=torch.float)
    return toks, bnds, lbls

# ── Entraînement ──────────────────────────────────────────────────────────────────────
def run():
    NUM_VARS = 20
    MAX_LEN  = 256
    N_TRAIN  = 800
    N_VAL    = 100

    print("Génération du jeu de données facile...")
    all_data = generate_easy_dataset(n=N_TRAIN + N_VAL, num_vars=NUM_VARS)
    token2id = build_vocab_from_clauses(None, NUM_VARS)

    encoded = [(encode(c, token2id, MAX_LEN)[0],
                encode(c, token2id, MAX_LEN)[1], lbl)
               for c, lbl in all_data]

    train_data = encoded[:N_TRAIN]
    val_data   = encoded[N_TRAIN:]
    print(f"Train labels: {Counter(x[2] for x in train_data)}")
    print(f"Val   labels: {Counter(x[2] for x in val_data)}")

    train_loader = DataLoader(train_data, batch_size=32, shuffle=True,  collate_fn=collate)
    val_loader   = DataLoader(val_data,   batch_size=32, shuffle=False, collate_fn=collate)

    model   = ClauseTransformer(len(token2id), d_model=64, nhead=4, num_layers=2, max_len=MAX_LEN).to(device)
    loss_fn = nn.BCEWithLogitsLoss()
    opt     = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

    print(f"\nParamètres : {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
    print("-" * 50)

    for epoch in range(1, 21):
        model.train()
        for toks, bnds, lbls in train_loader:
            toks, lbls = toks.to(device), lbls.to(device)
            loss = loss_fn(model(toks, bnds), lbls)
            opt.zero_grad(); loss.backward(); opt.step()

        model.eval()
        correct = total = 0
        with torch.no_grad():
            for toks, bnds, lbls in val_loader:
                toks, lbls = toks.to(device), lbls.to(device)
                pred = (torch.sigmoid(model(toks, bnds)) > 0.5).float()
                correct += (pred == lbls).sum().item()
                total   += lbls.size(0)
        acc = correct / total
        print(f"Epoch {epoch:2d} | val_acc = {acc:.4f}", "  ← Le modèle apprend !" if acc > 0.8 else "")

    print("\nConclusion :")
    print("  val_acc > 90 %  → L'architecture du modèle est bonne, la tâche originale (SATLIB point de transition) est difficile.")
    print("  val_acc ≈ 50 %  → Il reste des bugs dans le code, à corriger.")

if __name__ == '__main__':
    run()