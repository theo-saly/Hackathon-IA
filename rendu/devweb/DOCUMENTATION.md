# Interface Web — TechCorp Financial Assistant

## Équipe

| Nom | Prénom |
|---|---|
| RODRIGUES | Inacio |
| SALY | Théo |
| DICK | Olivier |
| MEGHLAT | Hayat |
| Thomas | ALISON |
| Anas | BAHIAOUI |
| Lucas | BGDU67 |
---

## Description

Interface de chat web développée en **Next.js 16** permettant d'interagir en temps réel avec le modèle Phi-3.5 Financial via Ollama.

---

## Stack technique

| Élément | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Style | CSS Modules |
| Serveur IA | Ollama `localhost:11434` |
| Modèle | `phi3.5` |

---

## Lancer l'interface

### Prérequis

- [Node.js](https://nodejs.org) v18+
- [Ollama](https://ollama.com/download) installé et démarré
- Modèle `phi3.5` téléchargé

### 1. Démarrer Ollama avec CORS autorisé

```bash
# Windows PowerShell
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

### 2. Télécharger le modèle (première fois uniquement)

```bash
ollama pull phi3.5
```

### 3. Lancer l'interface

```bash
cd rendu/devweb
npm install
npm run dev
```

L'interface est accessible sur **http://localhost:3000**

---

## Fonctionnalités

- **Chat en temps réel** avec le modèle Phi-3.5 Financial
- **Historique de conversation** persistant pendant la session
- **Indicateur de connexion** au serveur Ollama (point vert animé = connecté)
- **Indicateur de frappe** animé pendant la génération de réponse
- **Suggestions** de questions pour démarrer rapidement
- **Textarea auto-redimensionnable** selon le contenu
- `Entrée` pour envoyer · `Shift+Entrée` pour saut de ligne

---

## Architecture

```
rendu/devweb/
├── app/
│   ├── layout.tsx          # Layout racine Next.js
│   ├── page.tsx            # Page principale
│   ├── globals.css         # Variables CSS globales
│   └── components/
│       ├── Chat.tsx        # Composant principal (logique + UI)
│       └── Chat.module.css # Styles scopés du composant
├── public/
├── package.json
└── next.config.ts
```

---

## Connexion à l'API Ollama

L'interface communique avec Ollama via son API REST :

```
POST http://localhost:11434/api/chat
{
  "model": "phi3.5",
  "messages": [...],
  "stream": false
}
```

Le statut de connexion est vérifié toutes les **10 secondes** via `GET /api/tags`.

---

## Choix techniques

- **Next.js App Router** — architecture moderne, server components par défaut, `"use client"` explicite pour les composants interactifs
- **CSS Modules** — styles scopés sans dépendance externe, évite les conflits
- **Pas de bibliothèque UI** — design custom léger et maîtrisé
- **`stream: false`** — réponse complète attendue avant affichage (plus simple à gérer côté client)
