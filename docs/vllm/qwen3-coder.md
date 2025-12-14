# Qwen3 Coder 30B FP8 - Configuration vLLM

> Testé sur **2x RTX 3090** (48GB VRAM total)

Configuration pour `Qwen/Qwen3-Coder-30B-A3B-Instruct-FP8` avec vLLM.

## Lancement vLLM

```bash
vllm serve Qwen/Qwen3-Coder-30B-A3B-Instruct-FP8 \
  --served-model-name qwen3-coder-30b-fp8 \
  --tool-call-parser qwen3_coder \
  --enable-auto-tool-choice \
  --tensor-parallel-size 2 \
  --dtype auto \
  --kv-cache-dtype fp8 \
  --max-model-len 132000 \
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
| `--tool-call-parser` | `qwen3_coder` | Parser spécifique Qwen3 Coder |
| `--enable-auto-tool-choice` | - | Active la sélection automatique des tools |

> ⚠️ Utiliser `qwen3_coder`, pas `hermes` ni `mistral`.

### Performance 2x RTX 3090

| Option | Valeur | Description |
|--------|--------|-------------|
| `--tensor-parallel-size` | `2` | Split sur 2 GPUs |
| `--kv-cache-dtype` | `fp8` | Cache KV en FP8 (économie VRAM) |
| `--max-model-len` | `132000` | Context 132k tokens |
| `--gpu-memory-utilization` | `0.94` | Laisser marge pour éviter OOM |

## Comparaison Devstral vs Qwen3 Coder

| Aspect | Devstral 24B | Qwen3 Coder 30B FP8 |
|--------|--------------|---------------------|
| Tool parser | `mistral` | `qwen3_coder` |
| Context max | 140k | 132k |
| Format tool IDs | 9 chars alphanum | Standard |
| Quantization | BF16 | FP8 natif |
| VRAM 2x3090 | ✅ | ✅ |

## Variables d'environnement

```bash
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
CUDA_VISIBLE_DEVICES=0,1
```

## Vérification

```bash
# Health check
curl http://localhost:8000/health

# Test completion
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder-30b-fp8",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
