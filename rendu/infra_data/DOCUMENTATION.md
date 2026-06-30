# Projet TechCorp — Documentation Technique INFRA & DATA

**Équipe :** Inacio RODRIGUES, Théo SALY, Olivier DICK, Hayat MEGHLAT

---

## 1. Contexte du projet

TechCorp Industries doit reprendre, valider et finaliser un projet IA laissé par une équipe précédente écartée pour soupçon de compromission du code et des données. L'objectif est double : déployer en production un modèle financier (Phi-3.5-Financial) accessible via une interface chat, et explorer en R&D le fine-tuning LoRA d'un modèle médical expérimental.

---

## 2. INFRA — Serveur d'inférence

### 2.1 Choix techniques

| Élément | Choix | Justification |
|---|---|---|
| OS | Ubuntu Server 24.04 LTS | Meilleur support ML/Docker, pas d'interface graphique |
| Hyperviseur | VMware (réseau Bridged) | Accessible depuis le réseau local/hotspot |
| Solution | Ollama dans Docker | Gère nativement les modèles GGUF quantisés, adapté au CPU-only |

### 2.2 Déploiement réalisé

```bash
# Installation Docker (méthode officielle)
# Conteneur Ollama avec volume persistant
docker run -d --name ollama -v ollama_data:/root/.ollama -p 11434:11434 ollama/ollama

# Récupération du projet
git clone https://github.com/H04K/hackathon_ynov.git
git lfs pull  # pour récupérer les vrais fichiers dataset

# Création du modèle financier
docker exec -it ollama ollama create phi3-financial -f /root/Modelfile

# Téléchargement du modèle de base pour le médical
docker exec -it ollama ollama pull phi3.5
```

### 2.3 Accès réseau

| Élément | Valeur |
|---|---|
| IP de la VM | `172.20.10.5` |
| Port | `11434` |
| URL locale | `http://localhost:11434` |
| URL réseau (DEV WEB) | `http://172.20.10.5:11434` |
| Modèle financier | `phi3-financial` |
| Modèle base médical | `phi3.5` |

**Endpoints Ollama :**
- `GET /api/tags` — liste des modèles
- `POST /api/chat` — chat avec historique
- `POST /api/generate` — génération simple

### 2.4 Tests de validation

```bash
# Liste des modèles
curl http://localhost:11434/api/tags

# Test génération financière (~11s, réponse cohérente en français)
curl http://localhost:11434/api/generate -d '{"model":"phi3-financial","prompt":"Qu'\''est-ce que le PER ?"}'

# Accès réseau depuis PC externe
curl http://172.20.10.5:11434/api/tags
```

### 2.5 Point d'audit — incohérence relevée

Le script `train_finance_model.py` utilise `microsoft/Phi-3-mini-4k-instruct` alors que le README et la nomenclature annoncent Phi-3.5. Documenté comme point d'attention pour l'audit CYBER.

### 2.6 Sécurité

- L'API Ollama est exposée **sans authentification** sur `0.0.0.0:11434`
- Alternative recommandée : restreindre à `127.0.0.1` + tunnel SSH pour les accès distants

---

## 3. DATA — Préparation du dataset médical

### 3.1 Source

- **Dataset :** [ruslanmv/ai-medical-chatbot](https://huggingface.co/datasets/ruslanmv/ai-medical-chatbot)
- **Volume brut :** 256 916 exemples (colonnes : Description, Patient, Doctor)

### 3.2 Nettoyage (script `clean_medical_dataset.py`)

- Suppression des résidus HTML, caractères `\xa0`, troncatures `-->`
- Filtrage qualité : questions < 15 car. et réponses < 30 car. écartées ; réponses > 2000 car. écartées
- Déduplication sur la paire question/réponse
- Échantillonnage final : **4 000 exemples**

### 3.3 Rapport qualité

| Indicateur | Valeur |
|---|---|
| Exemples bruts | 256 916 |
| Exemples valides après nettoyage | 245 487 |
| Échantillon final retenu | 4 000 |
| Longueur moyenne des questions | 435 caractères |
| Longueur moyenne des réponses | 514 caractères |
| Fichier de sortie | `datasets/medical_dataset_final.json` |

---

## 4. Chemins clés du projet

| Chemin | Contenu |
|---|---|
| `ollama_server/Modelfile` | Définition du modèle financier |
| `models/phi3_financial/` | Poids du modèle financier hérité |
| `datasets/finance_dataset_final.json` | Dataset financier |
| `datasets/medical_dataset_final.json` | Dataset médical nettoyé (4 000 ex.) |
| `scripts/train_finance_model.py` | Script d'entraînement hérité |
| `rendu/ia/medical_finetune_colab.ipynb` | Notebook fine-tuning médical |
| `rendu/devweb/` | Interface web Next.js |
