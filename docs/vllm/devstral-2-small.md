# Devstral Small 2 24B - Configuration vLLM

> Testé sur **2x RTX 3090** (48GB VRAM total)

Configuration optimisée pour `mistralai/Devstral-Small-2-24B-Instruct-2512` avec vLLM.

## Lancement vLLM

```bash
vllm serve mistralai/Devstral-Small-2-24B-Instruct-2512 \
  --served-model-name devstral-small-2-24b \
  --tool-call-parser mistral \
  --enable-auto-tool-choice \
  --tensor-parallel-size 2 \
  --dtype auto \
  --kv-cache-dtype fp8 \
  --max-model-len 140000 \
  --max-num-batched-tokens 16384 \
  --max-num-seqs 4 \
  --enable-prefix-caching \
  --enable-chunked-prefill \
  --gpu-memory-utilization 0.94 \
  --host 0.0.0.0 \
  --port 8000
```

## Options critiques

### Tool Calling

| Option | Valeur | Description |
|--------|--------|-------------|
| `--tool-call-parser` | `mistral` | Parser spécifique Mistral pour les tool calls |
| `--enable-auto-tool-choice` | - | Active la sélection automatique des tools |

> ⚠️ **Sans ces options**, vLLM ne parse pas correctement les tool calls Mistral.

### Performance

| Option | Valeur | Description |
|--------|--------|-------------|
| `--tensor-parallel-size` | `2` | Nombre de GPUs (ajuster selon setup) |
| `--kv-cache-dtype` | `fp8` | Cache KV en FP8 pour économiser VRAM |
| `--max-model-len` | `140000` | Context window max (~140k tokens) |
| `--enable-prefix-caching` | - | Cache les préfixes communs |
| `--enable-chunked-prefill` | - | Prefill par chunks pour mieux gérer la mémoire |
| `--gpu-memory-utilization` | `0.94` | Utilisation GPU (laisser marge pour OOM) |

### Batching

| Option | Valeur | Description |
|--------|--------|-------------|
| `--max-num-batched-tokens` | `16384` | Tokens max par batch |
| `--max-num-seqs` | `4` | Séquences concurrentes max |

## Edge Cases Mistral/vLLM

Le proxy Token-Gate gère automatiquement ces problèmes de compatibilité :

### 1. Champ `index` interdit dans `tool_calls`

vLLM rejette les requêtes avec `index` dans les tool calls.

```typescript
// Avant (erreur vLLM)
tool_calls: [{ index: 0, id: "abc", function: {...} }]

// Après (OK)
tool_calls: [{ id: "abc", function: {...} }]
```

### 2. JSON malformé dans arguments

Mistral peut générer du JSON invalide. Le proxy sanitize :

```typescript
// Avant
arguments: "{ invalid json"

// Après
arguments: "{}"
```

### 3. Messages assistant vides

vLLM tokenizer échoue sur messages assistant sans contenu ni tool_calls.

```typescript
// Filtré automatiquement
{ role: "assistant", content: "" }
```

### 4. IDs tool_call > 9 caractères

Mistral limite les IDs à 9 caractères alphanumériques.

```typescript
// Avant
id: "toolu_01ABC123XYZ"

// Après  
id: "ABC123XYZ"
```

### 5. `tool_choice` sans `tools`

vLLM rejette `tool_choice` si `tools` est vide ou absent.

```typescript
// Avant (erreur)
{ tool_choice: "auto", tools: [] }

// Après (OK)
{ tools: [] }
```

## Variables d'environnement

```bash
# Performance PyTorch
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# HuggingFace (si modèle privé)
HF_TOKEN=hf_xxx
```

## Ressources requises

- **GPU**: 2x RTX 3090/4090 ou équivalent (48GB VRAM total)
- **RAM**: 64GB recommandé
- **Stockage**: ~50GB pour le modèle

## Vérification

```bash
# Health check
curl http://localhost:8000/health

# Test completion
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "devstral-small-2-24b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
