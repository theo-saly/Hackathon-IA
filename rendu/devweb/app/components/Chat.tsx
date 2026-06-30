"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import styles from "./Chat.module.css";

function Logo({ size = 36, standalone = false }: { size?: number; standalone?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {standalone && <rect width="32" height="32" rx="8" fill="url(#lg)" />}
      <polyline points="5,22 11,14 16,18 22,10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="20,10 27,10 27,17" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const OLLAMA_URL = "http://localhost:11434";
const MODEL = "phi3.5";
const SYSTEM_PROMPT = `You are a financial assistant specialized in helping financial analysts at TechCorp Industries.
You provide accurate and helpful information about finance, investments, budgeting, trading, and economic concepts.
Always respond in the same language as the user. Be concise and precise.`;

const SUGGESTIONS = [
  "Qu'est-ce que le PER ?",
  "Explique la diversification",
  "Comment lire un bilan ?",
  "C'est quoi le WACC ?",
];

type Message = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isGenerating]);

  async function checkStatus() {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`);
      setConnected(res.ok);
    } catch {
      setConnected(false);
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !connected || isGenerating) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: Message = { role: "user", content };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsGenerating(true);

    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...newHistory],
          stream: false,
        }),
      });
      const data = await res.json();
      const reply = data.message?.content ?? "Pas de réponse.";
      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Erreur de connexion au modèle." }]);
    }

    setIsGenerating(false);
    textareaRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  const statusClass =
    connected === null ? styles.statusPending :
    connected ? styles.statusOk :
    styles.statusErr;

  const statusText =
    connected === null ? "Connexion..." :
    connected ? "Connecté" :
    "Déconnecté";

  return (
    <div className={styles.layout}>
      <div className={styles.glow} />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}><Logo size={20} /></div>
          <div>
            <h1 className={styles.title}>Financial Assistant</h1>
            <p className={styles.subtitle}>TechCorp Industries · {MODEL}</p>
          </div>
        </div>
        <div className={`${styles.status} ${statusClass}`}>
          <div className={styles.statusDot} />
          <span>{statusText}</span>
        </div>
      </header>

      <div className={styles.chat} ref={chatRef}>
        {messages.length === 0 && !isGenerating ? (
          <div className={styles.empty}>
            <div className={styles.bigLogo}><Logo size={36} /></div>
            <h2 className={styles.emptyTitle}>Comment puis-je vous aider ?</h2>
            <p className={styles.emptyText}>
              Posez vos questions sur la finance, les investissements, les marchés ou l'analyse économique.
            </p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.suggestion} onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.msgWrap} ${styles[msg.role]}`}>
                <div className={styles.msgLabel}>{msg.role === "user" ? "Vous" : "Assistant"}</div>
                <div className={`${styles.message} ${styles[msg.role]}`}>{msg.content}</div>
              </div>
            ))}
            {isGenerating && (
              <div className={`${styles.msgWrap} ${styles.assistant}`}>
                <div className={styles.msgLabel}>Assistant</div>
                <div className={styles.typingBubble}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.input}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            placeholder="Posez votre question…"
            disabled={!connected || isGenerating}
          />
          <button
            className={styles.send}
            onClick={() => sendMessage()}
            disabled={!connected || isGenerating || !input.trim()}
          >
            <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className={styles.hint}>Entrée pour envoyer · Shift+Entrée pour un saut de ligne</p>
      </div>
    </div>
  );
}
