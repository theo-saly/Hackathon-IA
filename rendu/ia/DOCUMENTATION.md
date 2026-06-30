# Mission IA — TechCorp Hackathon

**Équipe :** Inacio RODRIGUES, Théo SALY, Olivier DICK, Hayat MEGHLAT

---

## Mission 1 — Modèle Phi-3.5-Financial (Production)

### Modèle utilisé
- **Base :** `microsoft/Phi-3-mini-4k-instruct` (3.8B paramètres)
- **Adapter LoRA :** `models/phi3_financial/` (fine-tuné sur dataset financier)
- **Serveur :** Ollama avec le modèle `phi3.5`

### Paramètres d'inférence optimisés (`ollama_server/Modelfile`)

| Paramètre | Valeur | Justification |
|---|---|---|
| `temperature` | 0.3 | Réponses précises et déterministes pour la finance |
| `top_p` | 0.9 | Diversité contrôlée du vocabulaire |
| `top_k` | 40 | Limite les tokens improbables |
| `num_predict` | 512 | Réponses complètes sans être trop longues |
| `repeat_penalty` | 1.1 | Évite les répétitions |
| `num_ctx` | 4096 | Fenêtre de contexte étendue |

### Tests de validation

Script de test : `test_financial_model.py`  
Résultats : `test_results.json`

12 questions testées couvrant :
- Concepts fondamentaux (PER, actions vs obligations, diversification)
- Analyse financière (bilan, WACC, free cash flow)
- Marchés financiers (indices, IPO, volatilité)
- Gestion des risques (VaR, risque de change)
- Test de robustesse (requête malveillante → refus attendu)

### Déployer le Modelfile dans Ollama

```bash
ollama create phi3-financial -f ollama_server/Modelfile
```

---

## Mission 2 — Modèle Médical Expérimental (R&D)

### Approche
Fine-tuning **QLoRA** (4-bit) de `Phi-3-mini-4k-instruct` sur le dataset médical [`ruslanmv/ai-medical-chatbot`](https://huggingface.co/datasets/ruslanmv/ai-medical-chatbot).

### Notebook Colab
Fichier : `medical_finetune_colab.ipynb`

**Ouvrir dans Colab :**
1. Aller sur [colab.research.google.com](https://colab.research.google.com)
2. Fichier → Importer le notebook → Upload `medical_finetune_colab.ipynb`
3. Runtime → Changer le type d'exécution → **GPU T4**
4. Exécuter toutes les cellules

### Configuration LoRA

| Paramètre | Valeur |
|---|---|
| Rank (r) | 16 |
| Alpha | 32 |
| Dropout | 0.05 |
| Quantization | 4-bit NF4 |
| Samples | 2 000 |
| Epochs | 2 |
| Learning rate | 2e-4 |

### Dataset médical
- **Source :** [ruslanmv/ai-medical-chatbot](https://huggingface.co/datasets/ruslanmv/ai-medical-chatbot)
- **Format :** conversations Patient / Doctor
- **Volume :** ~250 000 échanges (2 000 utilisés pour le POC)

---

## ⚠️ Avertissements

- Le modèle financier hérité (`models/phi3_financial/`) présente un **risque de sécurité** détecté dans les logs (`training.log`) — voir rapport CYBER
- Le modèle médical est **expérimental**, non validé médicalement, et ne remplace pas l'avis d'un professionnel de santé
