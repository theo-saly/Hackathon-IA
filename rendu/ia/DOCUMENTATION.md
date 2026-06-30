# IA — Documentation Technique

**Équipe :** Inacio RODRIGUES, Théo SALY, Olivier DICK, Hayat MEGHLAT

---

## 1. Modèle financier — phi3-financial (production)

Le modèle `phi3-financial` est un adaptateur LoRA entraîné sur `microsoft/Phi-3-mini-4k-instruct`, déployé via Ollama sur le serveur INFRA (`172.20.10.5:11434`).

### Ce qu'on a fait

**Validation :** on a écrit un script de test (`test_financial_model.py`) qui envoie 12 questions au modèle sur 4 domaines (concepts fondamentaux, analyse de bilan, marchés financiers, gestion des risques). Les 12 tests passent. On a aussi vérifié que le modèle refusait les requêtes malveillantes.

**Optimisation :** on a ajusté les paramètres d'inférence dans le Modelfile Ollama pour améliorer la qualité des réponses :

| Paramètre | Valeur | Raison |
|---|---|---|
| `temperature` | 0.3 | Réponses précises et déterministes |
| `num_ctx` | 4096 | Fenêtre de contexte étendue |
| `repeat_penalty` | 1.1 | Évite les répétitions |
| `num_predict` | 512 | Réponses complètes |

```bash
# Lancer les tests
python test_financial_model.py
```

---

## 2. Modèle médical — Fine-tuning QLoRA (expérimental)

### Objectif

Spécialiser `microsoft/Phi-3.5-mini-instruct` sur des conversations médicales à partir du dataset [`ruslanmv/ai-medical-chatbot`](https://huggingface.co/datasets/ruslanmv/ai-medical-chatbot).

L'équipe DATA a nettoyé le dataset brut (250 000 échanges) pour fournir **4 000 exemples de qualité** (`datasets/medical_dataset_final.json`).

### Technique : QLoRA

On charge le modèle en **quantization 4-bit** pour réduire la mémoire, puis on entraîne un **adaptateur LoRA** (rank 16) par-dessus. Seul ~1% des paramètres est modifié. Résultat : entraînable sur **GPU T4 Google Colab en 20-30 minutes**.

### Entraînement sur Google Colab

1. Ouvrir `medical_finetune_colab.ipynb` sur [colab.research.google.com](https://colab.research.google.com)
2. Activer le GPU : **Runtime → Changer le type d'exécution → GPU T4**
3. Exécuter toutes les cellules dans l'ordre
4. Uploader `datasets/medical_dataset_final.json` quand demandé
5. Le modèle est sauvegardé dans `./phi35-medical-lora/`
6. Télécharger le dossier via le panneau **Fichiers → Télécharger**

### Fichiers

| Fichier | Description |
|---|---|
| `medical_finetune_colab.ipynb` | Notebook Colab clé en main |
| `scripts/train_medical_model.py` | Script Python autonome (avec `--hf` pour charger depuis HuggingFace) |
| `test_financial_model.py` | Script de validation du modèle financier |

---

> ⚠️ Le modèle médical est **expérimental** et ne remplace pas l'avis d'un médecin. Non destiné à la production.
