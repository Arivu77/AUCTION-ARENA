import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ToastProvider, useToast, Button, Modal } from '../ui/index';
import { formatPrice, getBasePriceInPaise, getNextBidAmount, getQuickBidAmounts } from '../../utils/bidUtils';
import { db } from '../../firebase';
import ChatBox from '../chat/ChatBox';
import { ref as dbRef, update as dbUpdate, onValue, get as dbGet } from 'firebase/database';

// ── Injected Styles ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,900;1,900&family=Inter:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

  * { box-sizing: border-box; }

  .ar-root {
    font-family: 'Inter', sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .ar-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 50;
    height: 6.5vh;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: var(--bg-overlay);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-color);
  }
  .ar-header-left { display: flex; align-items: center; gap: 10px; }
  .ar-logo-icon {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(20,209,255,0.08);
    border: 1px solid rgba(20,209,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
  }
  .ar-logo-text {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900; font-style: italic;
    font-size: 1.35rem;
    color: #14d1ff;
    letter-spacing: -0.03em;
  }
  .ar-pause-btn {
    width: 30px; height: 30px; border-radius: 6px;
    background: rgba(20,209,255,0.08);
    border: 1px solid rgba(20,209,255,0.3);
    color: #14d1ff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-size: 14px;
  }
  .ar-pause-btn:hover { background: rgba(20,209,255,0.15); }
  .ar-pause-btn:active { transform: scale(0.9); }
  .ar-header-right { display: flex; align-items: center; gap: 12px; }
  .ar-end-btn {
    display: flex; flex-direction: column; align-items: center; gap: 1px;
    cursor: pointer; transition: all 0.15s; background: none; border: none;
    padding: 2px 4px;
  }
  .ar-end-btn:active { transform: scale(0.9); }
  .ar-end-circle {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(220,38,38,0.08);
    border: 1px solid rgba(220,38,38,0.3);
    display: flex; align-items: center; justify-content: center;
    color: #f87171; transition: all 0.15s;
  }
  .ar-end-btn:hover .ar-end-circle { background: rgba(220,38,38,0.18); }
  .ar-end-label { font-size: 7px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(248,113,113,0.6); }
  .ar-purse-block { text-align: right; }
  .ar-purse-label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; display: block; }
  .ar-purse-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 1.05rem;
    color: #14d1ff; line-height: 1.1;
  }
  .ar-slots-val { font-size: 8px; color: #555; font-weight: 600; }

  /* ── MAIN LAYOUT ── */
  .ar-main {
    position: relative; z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
    overflow: hidden;
    padding-bottom: 25vh;
  }

  @media (min-width: 1024px) {
    .ar-main {
      max-width: 1400px;
      display: grid;
      grid-template-columns: 280px 1fr 280px;
      gap: 24px;
      align-items: start;
      padding: 24px 24px 24px;
      overflow: hidden;
    }
    .ar-aside { display: flex !important; flex-direction: column; gap: 16px; }
    .ar-mobile-squad-bar { display: none !important; }
    .ar-bottom-nav { display: none !important; }
    .ar-stage { padding: 0 !important; }
    .ar-bid-section {
      position: static !important;
      transform: none !important;
      background: none !important;
      backdrop-filter: none !important;
      border: none !important;
      padding: 0 !important;
      box-shadow: none !important;
      margin-top: 1vh !important;
      width: 100% !important;
    }
  }

  /* ── ASIDE (desktop only) ── */
  .ar-aside { display: none; }
  .ar-glass-card {
    background: rgba(14,14,14,0.9);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 18px;
  }
  .ar-card-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 0.95rem; font-weight: 700;
    color: #14d1ff; letter-spacing: 0.05em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 10px; margin-bottom: 14px;
  }
  .ar-squad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ar-squad-stat-lbl { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #555; }
  .ar-squad-stat-val { font-family: 'Barlow Condensed', sans-serif; font-size: 1.5rem; font-weight: 700; color: #d8e3fb; }
  .ar-squad-stat-val.hl { color: #14d1ff; }

  .ar-feed-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 7px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 0.78rem;
  }
  .ar-feed-item:last-child { border-bottom: none; }
  .ar-feed-time { font-size: 8px; color: #444; white-space: nowrap; margin-top: 1px; }
  .ar-feed-msg { flex: 1; color: #888; }
  .ar-feed-msg.latest { color: #d8e3fb; font-weight: 600; }

  .ar-contender {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .ar-contender:last-child { border-bottom: none; }
  .ar-contender-logo {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 0.95rem; color: #14d1ff;
  }
  .ar-contender-name { font-size: 0.8rem; font-weight: 600; color: #d8e3fb; }
  .ar-contender-bid { font-family: 'Barlow Condensed', sans-serif; font-size: 1rem; font-weight: 700; color: #14d1ff; }

  .ar-budget-bar-bg { width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden; margin: 8px 0 4px; }
  .ar-budget-bar-fill { height: 100%; background: linear-gradient(90deg, rgba(20,209,255,0.6), #14d1ff); border-radius: 999px; transition: width 0.5s ease; }

  .ar-admin-card {
    background: rgba(8,8,8,0.95);
    border: 1px solid rgba(255,193,7,0.15);
    border-radius: 12px; padding: 16px;
  }
  .ar-admin-title { font-size: 9px; font-weight: 700; color: #ffc107; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
  .ar-admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .ar-admin-btn {
    padding: 8px 10px; border-radius: 7px; font-size: 11px; font-weight: 700;
    border: none; cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em;
  }
  .ar-admin-btn:active { transform: scale(0.95); }
  .ar-admin-btn.green { background: rgba(0,230,118,0.1); color: #00e676; border: 1px solid rgba(0,230,118,0.2); }
  .ar-admin-btn.gold { background: rgba(255,193,7,0.1); color: #ffc107; border: 1px solid rgba(255,193,7,0.2); }
  .ar-admin-btn.cyan { background: rgba(20,209,255,0.1); color: #14d1ff; border: 1px solid rgba(20,209,255,0.2); }
  .ar-admin-btn.purple { background: rgba(123,97,255,0.1); color: #7b61ff; border: 1px solid rgba(123,97,255,0.2); }
  .ar-admin-btn.red { background: rgba(255,23,68,0.1); color: #ff1744; border: 1px solid rgba(255,23,68,0.2); }
  .ar-admin-btn.ghost { background: rgba(255,255,255,0.04); color: #888; border: 1px solid rgba(255,255,255,0.07); }
  .ar-admin-btn.full { grid-column: span 2; background: rgba(255,23,68,0.1); color: #ff1744; border: 1px solid rgba(255,23,68,0.2); }

  /* ── CENTER STAGE ── */
  .ar-stage {
    display: flex; flex-direction: column; align-items: center;
    width: 100%; padding: 0 16px;
    padding-top: 0.5vh;
    flex: 1;
    overflow: visible;
  }

  /* ── PLAYER CARD ── */
  .ar-card-wrap {
    width: 100%; max-width: 400px;
    position: relative;
    margin-top: 1.5vh;
    border-radius: 2vh;
    overflow: visible;
    box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-color);
    background: var(--bg-card);
    transition: box-shadow 0.3s;
  }
  .ar-card-wrap.urgent { box-shadow: 0 24px 80px rgba(0,0,0,0.95), 0 0 0 2px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.15); }

  /* Stadium image area */
  .ar-card-stadium {
    position: relative;
    width: 100%; height: 22vh;
    overflow: hidden;
    border-top-left-radius: 2vh;
    border-top-right-radius: 2vh;
  }
  .ar-stadium-bg {
    width: 100%; height: 100%;
    object-fit: cover;
    filter: brightness(0.55) saturate(0.8);
  }
  .ar-stadium-fallback {
    width: 100%; height: 100%;
    background: radial-gradient(ellipse at 50% 30%, rgba(20,80,120,0.6) 0%, var(--bg-primary) 70%);
    display: flex; align-items: center; justify-content: center;
  }
  .ar-player-img-wrap {
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 20vh; height: 21vh;
    display: flex; align-items: flex-end; justify-content: center;
    z-index: 5;
    filter: drop-shadow(0 -8px 24px rgba(0,0,0,0.9));
  }
  .ar-player-img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: top;
  }
  .ar-player-img-fallback {
    width: 17vh; height: 17vh; border-radius: 50%;
    background: radial-gradient(circle, rgba(20,209,255,0.12), var(--bg-primary));
    border: 2px solid rgba(20,209,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 4vh;
  }
  .ar-stadium-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.15) 70%, var(--bg-card) 100%);
    z-index: 3;
  }
  .ar-top-accent {
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px; z-index: 10;
    background: linear-gradient(90deg, transparent, #14d1ff, transparent);
    transition: background 0.3s;
  }
  .ar-top-accent.urgent { background: linear-gradient(90deg, transparent, #ef4444, transparent); }

  /* Timer overlay on card — left side inside */
  .ar-timer-wrap {
    position: absolute;
    left: 12px; top: 40%;
    transform: translateY(-50%);
    z-index: 20;
    display: flex; flex-direction: column; align-items: center; gap: 0.4vh;
  }
  @media (min-width: 400px) { .ar-timer-wrap { left: 14px; } }
  .ar-timer-ring {
    width: 7vh; height: 7vh; border-radius: 50%;
    background: var(--bg-surface);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(20,209,255,0.3);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: border-color 0.15s, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.15s ease-out;
    will-change: transform, box-shadow;
  }
  .ar-timer-ring.urgent { border-color: rgba(239,68,68,0.5); }
  .ar-timer-svg { position: absolute; inset: 0; transform: rotate(-90deg); }
  .ar-timer-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.3rem; font-weight: 900;
    color: #14d1ff; position: relative; z-index: 1;
    line-height: 1; transition: color 0.15s;
  }
  .ar-timer-call {
    font-size: 7px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: #ef4444;
    animation: ar-blink 1s infinite;
    text-align: center;
  }
  @keyframes ar-blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

  /* Card body area */
  .ar-card-body {
    padding: 1.2vh 20px 1.5vh;
    background: var(--bg-card);
    position: relative;
    border-bottom-left-radius: 2vh;
    border-bottom-right-radius: 2vh;
  }
  .ar-player-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 2.8vh; font-weight: 900;
    color: #ffffff; text-transform: uppercase;
    letter-spacing: -0.01em; line-height: 1;
    text-align: center; margin-bottom: 0.2vh;
  }

  .ar-player-badges {
    display: flex; justify-content: center; gap: 0.5vh; margin-bottom: 1vh; flex-wrap: wrap;
  }
  .ar-badge {
    padding: 3px 10px; border-radius: 999px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ar-badge-cyan { background: rgba(20,209,255,0.08); border: 1px solid rgba(20,209,255,0.25); color: #14d1ff; }
  .ar-badge-muted { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #888; }
  .ar-badge-gold { background: rgba(255,193,7,0.08); border: 1px solid rgba(255,193,7,0.25); color: #ffc107; }
  .ar-badge-pink { background: rgba(255,60,172,0.08); border: 1px solid rgba(255,60,172,0.25); color: #ff3cac; }
  .ar-badge-purple { background: rgba(123,97,255,0.08); border: 1px solid rgba(123,97,255,0.25); color: #7b61ff; }

  .ar-bid-row {
    display: flex; align-items: stretch; justify-content: center;
    gap: 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 1.2vh;
  }
  .ar-bid-col { flex: 1; text-align: center; padding: 0 12px; }
  .ar-bid-col:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.06); }
  .ar-bid-lbl { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin-bottom: 4px; }
  .ar-bid-lbl.cyan { color: rgba(20,209,255,0.7); }
  .ar-bid-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.15rem; font-weight: 700;
    color: #ccc; line-height: 1;
  }
  .ar-current-bid-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 2.5vh; font-weight: 900;
    color: #14d1ff; line-height: 1;
    transition: color 0.3s;
  }
  .ar-current-bid-val.urgent { color: #ef4444; }
  .ar-current-bid-val.winning { color: #22c55e; }
  .ar-bid-who { font-size: 9px; color: rgba(20,209,255,0.6); font-weight: 600; margin-top: 3px; letter-spacing: 0.05em; }
  .ar-bid-who.winning { color: #22c55e; }

  /* ── PLAYER COUNTER ── */
  .ar-counter {
    display: flex; align-items: center; gap: 8px;
    margin-top: 0.6vh; font-size: 1vh; font-weight: 700;
    letter-spacing: 0.1em; color: #444; text-transform: uppercase;
  }
  .ar-counter-dots { display: flex; gap: 0.3vh; }
  .ar-counter-dot {
    width: 0.6vh; height: 0.6vh; border-radius: 50%;
    background: #222; transition: background 0.2s;
  }
  .ar-counter-dot.done { background: #333; }
  .ar-counter-dot.active { background: #14d1ff; }

  /* ── TICKER / MARQUEE ── */
  .ar-ticker {
    width: 100%; max-width: 400px;
    height: 3.2vh; overflow: hidden;
    display: flex; align-items: center;
    border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    margin-top: 0.6vh;
  }
  .ar-ticker-msg {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #14d1ff;
    animation: ar-blink 1.5s infinite;
    padding: 0 12px;
  }
  .ar-marquee-track {
    display: flex; gap: 32px; white-space: nowrap;
    animation: ar-marquee 16s linear infinite;
    padding: 0 12px;
  }
  @keyframes ar-marquee { 0% { transform: translateX(60%); } 100% { transform: translateX(-100%); } }
  .ar-marquee-item { font-size: 10px; color: #444; }
  .ar-marquee-item b { color: #14d1ff; }

  /* ── BID BUTTON ── */
  .ar-bid-section {
    width: calc(100% - 28px); max-width: 400px;
    display: flex; flex-direction: column;
    gap: 0; margin-top: 1vh;
    position: fixed;
    bottom: 7.2vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 45;
    background: rgba(13, 13, 13, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1.8vh;
    padding: 1.2vh 16px;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.8);
    transition: all 0.2s ease;
  }
  .ar-bid-btn {
    position: relative;
    width: 100%; height: 7.5vh;
    background: #14d1ff;
    color: #001c26;
    border: none; border-radius: 1.5vh;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 2.2vh; font-weight: 900;
    letter-spacing: -0.01em; text-transform: uppercase;
    cursor: pointer; overflow: hidden;
    box-shadow: 0 0 40px rgba(20,209,255,0.3), 0 4px 20px rgba(0,0,0,0.6);
    transition: all 0.12s;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1px;
  }
  .ar-bid-btn:hover:not(:disabled) { box-shadow: 0 0 60px rgba(20,209,255,0.55), 0 4px 20px rgba(0,0,0,0.6); transform: translateY(-1px); }
  .ar-bid-btn:active:not(:disabled) { transform: scale(0.98); }
  .ar-bid-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; background: rgba(255,255,255,0.08); color: #666; }
  .ar-bid-btn.leading { background: #22c55e; color: #000; box-shadow: 0 0 40px rgba(34,197,94,0.3); }
  .ar-bid-btn-sub {
    font-family: 'Inter', sans-serif;
    font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    opacity: 0.65;
  }
  .ar-bid-btn::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: rgba(255,255,255,0.3);
  }

  /* quick bids row */
  .ar-quick-bids {
    display: flex; gap: 0.6vh; justify-content: center; flex-wrap: wrap;
    margin-top: 0.8vh;
  }
  .ar-quick-btn {
    padding: 0.5vh 1.2vh; border-radius: 0.8vh;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 1.2vh; font-weight: 600;
    color: #888; cursor: pointer; transition: all 0.12s;
  }
  .ar-quick-btn:hover:not(:disabled) { border-color: rgba(20,209,255,0.4); color: #14d1ff; }
  .ar-quick-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* pass + auto row */
  .ar-action-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1vh 4px 0;
  }
  .ar-pass-btn {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
    text-transform: uppercase; color: #555;
    background: none; border: none; cursor: pointer; transition: color 0.15s;
    padding: 4px 0;
  }
  .ar-pass-btn:hover:not(:disabled) { color: #d8e3fb; }
  .ar-pass-btn:disabled { cursor: not-allowed; opacity: 0.5; }
  .ar-auto-btn {
    display: flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
    text-transform: uppercase; color: #555;
    background: none; border: none; cursor: pointer; transition: all 0.15s;
    padding: 4px 0;
  }
  .ar-auto-btn:hover { color: #d8e3fb; }
  .ar-auto-dot {
    width: 28px; height: 16px; border-radius: 999px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    position: relative; transition: all 0.2s;
  }
  .ar-auto-dot.on { background: rgba(20,209,255,0.25); border-color: rgba(20,209,255,0.5); }
  .ar-auto-dot::after {
    content: '';
    position: absolute; top: 2px; left: 2px;
    width: 10px; height: 10px; border-radius: 50%;
    background: #555; transition: all 0.2s;
  }
  .ar-auto-dot.on::after { left: 14px; background: #14d1ff; }
  .ar-auto-label { transition: color 0.2s; }
  .ar-auto-label.on { color: #14d1ff; }

  /* ── STATES (idle/announcing/etc) ── */
  .ar-state-wrap {
    display: flex; flex-direction: column; align-items: center;
    gap: 2vh; padding: 8vh 24px 5vh; text-align: center;
    width: 100%;
  }
  .ar-state-icon { font-size: 4.5vh; }
  .ar-state-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 3.5vh; font-weight: 900; color: #14d1ff;
    letter-spacing: -0.02em; text-transform: uppercase;
  }
  .ar-state-sub { font-size: 1.3vh; color: #555; }
  .ar-dots { display: flex; gap: 7px; }
  .ar-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #14d1ff;
    animation: ar-dot-pulse 0.8s infinite;
  }
  .ar-dot:nth-child(2) { animation-delay: 0.2s; }
  .ar-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes ar-dot-pulse { 0%,100% { opacity: 0.25; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1); } }

  /* ── BOTTOM SQUAD BAR (mobile) ── */
  .ar-mobile-squad-bar {
    position: fixed; bottom: 7vh; left: 0; right: 0; z-index: 40;
    padding: 0 14px 0.5vh;
    transition: bottom 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ar-squad-pill {
    background: rgba(10,10,10,0.95);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 999px; padding: 0.8vh 20px;
    display: flex; justify-content: space-around; align-items: center;
    box-shadow: 0 -4px 30px rgba(0,0,0,0.7);
    cursor: pointer;
  }
  .ar-squad-pill-stat {
    display: flex; align-items: center; gap: 5px;
    font-size: 1.2vh; font-weight: 700; color: #d8e3fb;
  }
  .ar-squad-pill-stat .ms { font-family: 'Material Symbols Outlined'; font-size: 1.5vh; color: #14d1ff; }
  .ar-pill-div { width: 1px; height: 1.4vh; background: rgba(255,255,255,0.07); }

  /* ── BOTTOM NAV ── */
  .ar-bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    display: flex; justify-content: space-around; align-items: center;
    padding: 0.6vh 16px 1.5vh;
    background: var(--bg-overlay);
    backdrop-filter: blur(24px);
    border-top: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
  }
  .ar-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    color: #555; cursor: pointer; transition: all 0.2s;
    border-radius: 999px; padding: 0.4vh 16px;
  }
  .ar-nav-item:active { transform: scale(0.9); }
  .ar-nav-item.active { color: #14d1ff; background: rgba(20,209,255,0.08); }
  .ar-nav-item .ms { font-family: 'Material Symbols Outlined'; font-size: 2.5vh; }
  .ar-nav-lbl { font-size: 1vh; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }

  /* ── PAUSE OVERLAY ── */
  .ar-pause-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,0.96);
    backdrop-filter: blur(24px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px;
  }
  .ar-pause-card {
    width: 100%; max-width: 420px;
    background: rgba(12,12,12,0.98);
    border: 1px solid rgba(255,255,255,0.06);
    border-top: 2px solid #14d1ff;
    border-radius: 18px; padding: 32px;
    display: flex; flex-direction: column; gap: 24px;
    box-shadow: 0 0 80px rgba(20,209,255,0.08);
  }
  .ar-pause-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 3.2rem; font-weight: 900;
    color: #14d1ff; text-align: center;
    letter-spacing: -0.02em; text-transform: uppercase;
    animation: ar-blink 2s infinite;
  }
  .ar-pause-sub { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; text-align: center; margin-top: -16px; }
  .ar-pause-snap {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px; padding: 18px;
  }
  .ar-pause-snap-title { font-size: 9px; font-weight: 700; color: #555; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 12px; }
  .ar-resume-btn {
    width: 100%; height: 62px;
    background: #14d1ff; color: #001c26;
    border: none; border-radius: 12px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.6rem; font-weight: 900; text-transform: uppercase;
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 0 30px rgba(20,209,255,0.25);
    letter-spacing: -0.01em;
  }
  .ar-resume-btn:disabled { opacity: 0.6; cursor: wait; }
  .ar-resume-btn:not(:disabled):active { transform: scale(0.97); }

  /* ── SOLD OVERLAY ── */
  .ar-sold-overlay {
    position: fixed; inset: 0; z-index: 90;
    background: rgba(0,0,0,0.94);
    backdrop-filter: blur(12px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px; gap: 20px;
    animation: ar-fade-in 0.3s ease;
  }
  @keyframes ar-fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .ar-sold-stamp {
    border: 4px solid #22c55e;
    color: #22c55e;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 3.5rem; font-weight: 900;
    padding: 8px 32px;
    letter-spacing: 0.05em; text-transform: uppercase;
    animation: ar-stamp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.4);
    box-shadow: 0 0 50px rgba(34,197,94,0.3);
  }
  .ar-unsold-stamp {
    border-color: #ef4444; color: #ef4444;
    box-shadow: 0 0 50px rgba(239,68,68,0.3);
  }
  @keyframes ar-stamp {
    0% { transform: scale(2) rotate(-12deg); opacity: 0; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  .ar-sold-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 3rem; font-weight: 900; color: #fff;
    text-transform: uppercase; text-align: center; line-height: 1;
  }
  .ar-sold-price { font-family: 'Barlow Condensed', sans-serif; font-size: 1.8rem; font-weight: 700; color: #fff; }
  .ar-sold-team-box {
    padding: 14px 28px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; gap: 14px;
  }
  .ar-sold-team-box.my { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.3); }
  .ar-sold-team-label { font-size: 10px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }
  .ar-sold-team-name { font-family: 'Barlow Condensed', sans-serif; font-size: 1.4rem; font-weight: 900; color: #fff; text-transform: uppercase; }
  .ar-sold-team-name.my { color: #22c55e; }

  /* ── COMPLETION OVERLAY ── */
  .ar-done-overlay {
    position: fixed; inset: 0; z-index: 110;
    background: rgba(0,0,0,0.98);
    backdrop-filter: blur(24px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px;
    animation: ar-fade-in 0.4s ease;
  }
  .ar-done-content { width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 20px; text-align: center; }
  .ar-done-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 3.5rem; font-weight: 900; color: #22c55e;
    letter-spacing: -0.02em; text-transform: uppercase;
  }
  .ar-done-btn {
    width: 100%; height: 62px;
    background: #22c55e; color: #000;
    border: none; border-radius: 12px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.6rem; font-weight: 900; text-transform: uppercase;
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 0 30px rgba(34,197,94,0.25);
    letter-spacing: -0.01em;
  }
  .ar-done-btn:hover { filter: brightness(1.1); }
  .ar-done-btn:active { transform: scale(0.97); }

  /* scrollbar hide */
  .no-scrollbar { scrollbar-width: none; }
  .no-scrollbar::-webkit-scrollbar { display: none; }

  /* Material icon helper */
  .ms {
    font-family: 'Material Symbols Outlined';
    font-weight: 400; font-style: normal;
    line-height: 1; letter-spacing: normal;
    display: inline-block; vertical-align: middle;
  }

  /* input style */
  .ar-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 10px 14px;
    color: #d8e3fb; font-size: 1rem; width: 100%; outline: none;
    transition: border 0.15s;
  }
  .ar-input:focus { border-color: rgba(20,209,255,0.5); }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ── Icon helper ────────────────────────────────────────────────────────────────
function Icon({ name, size = 20, fill = 0, style = {} }) {
  return (
    <span
      className="ms"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        ...style
      }}
    >
      {name}
    </span>
  );
}

// Color interpolation helper for smooth transition from green (#00e676) -> orange (#f97316) -> red (#ef4444)
const interpolateColor = (color1, color2, factor) => {
  const parseRGB = (c) => {
    if (c.startsWith('#')) {
      return [
        parseInt(c.substring(1, 3), 16),
        parseInt(c.substring(3, 5), 16),
        parseInt(c.substring(5, 7), 16)
      ];
    }
    const match = c.match(/\d+/g);
    return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
  };

  const [r1, g1, b1] = parseRGB(color1);
  const [r2, g2, b2] = parseRGB(color2);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `rgb(${r}, ${g}, ${b})`;
};

// ── Timer Ring ─────────────────────────────────────────────────────────────────
function TimerRing({ timeLeft, totalTime = 15, paused, timerEnd, serverTimeOffset = 0 }) {
  const textRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    let animId;

    const updateTimer = () => {
      const now = Date.now() + serverTimeOffset;
      const remainingMs = Math.max(0, (timerEnd || 0) - now);
      const remainingSecs = Math.ceil(remainingMs / 1000);

      const pct = Math.max(0, remainingMs / (totalTime * 1000));

      // Smooth color interpolation
      let color = '#00e676';
      if (pct < 0.33) {
        // Transition from orange (#f97316) to red (#ef4444) over final 33% of time
        const factor = (0.33 - pct) / 0.33;
        color = interpolateColor('#f97316', '#ef4444', Math.min(1, Math.max(0, factor)));
      } else if (pct < 0.67) {
        // Transition from green (#00e676) to orange (#f97316) over middle 34% of time
        const factor = (0.67 - pct) / 0.34;
        color = interpolateColor('#00e676', '#f97316', Math.min(1, Math.max(0, factor)));
      }

      // Generate soft outer and inner glows using the current interpolated RGB color
      const glowColor = color.replace('rgb', 'rgba').replace(')', ', 0.45)');
      const shadowStyle = `0 0 16px ${glowColor}, inset 0 0 10px ${glowColor}, 0 4px 20px rgba(0,0,0,0.7)`;

      if (textRef.current) {
        textRef.current.textContent = remainingSecs;
        textRef.current.style.color = color;
      }
      if (wrapRef.current) {
        wrapRef.current.style.borderColor = `${color}80`;
        wrapRef.current.style.boxShadow = shadowStyle;

        // Apply a smooth pulse scale in final 5 seconds
        if (remainingSecs <= 5) {
          const pulseScale = 1 + 0.04 * Math.sin(now / 120);
          wrapRef.current.style.transform = `scale(${pulseScale})`;
        } else {
          wrapRef.current.style.transform = 'scale(1)';
        }
      }

      if (!paused && remainingMs > 0) {
        animId = requestAnimationFrame(updateTimer);
      }
    };

    if (timerEnd && !paused) {
      animId = requestAnimationFrame(updateTimer);
    } else {
      // Draw static frame (paused/idle)
      const remainingMs = Math.max(0, (timerEnd || 0) - (Date.now() + serverTimeOffset));
      const remainingSecs = timerEnd ? Math.ceil(remainingMs / 1000) : timeLeft;
      const pct = timerEnd ? Math.max(0, remainingMs / (totalTime * 1000)) : Math.max(0, timeLeft / totalTime);

      let color = '#00e676';
      if (pct < 0.33) {
        color = interpolateColor('#f97316', '#ef4444', Math.min(1, Math.max(0, (0.33 - pct) / 0.33)));
      } else if (pct < 0.67) {
        color = interpolateColor('#00e676', '#f97316', Math.min(1, Math.max(0, (0.67 - pct) / 0.34)));
      }

      const glowColor = color.replace('rgb', 'rgba').replace(')', ', 0.3)');
      const shadowStyle = `0 0 10px ${glowColor}, inset 0 0 6px ${glowColor}, 0 4px 20px rgba(0,0,0,0.7)`;

      if (textRef.current) {
        textRef.current.textContent = remainingSecs;
        textRef.current.style.color = color;
      }
      if (wrapRef.current) {
        wrapRef.current.style.borderColor = `${color}50`;
        wrapRef.current.style.boxShadow = shadowStyle;
        wrapRef.current.style.transform = 'scale(1)';
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [timerEnd, paused, timeLeft, totalTime, serverTimeOffset]);

  const stateLabel = timeLeft <= 5 ? (timeLeft <= 3 ? 'TWICE' : 'ONCE') : timeLeft <= 10 ? 'FINAL CALL' : '';

  return (
    <div className="ar-timer-wrap">
      <div ref={wrapRef} className="ar-timer-ring">
        <span ref={textRef} className="ar-timer-num">{timeLeft}</span>
      </div>
      {stateLabel && (
        <span className="ar-timer-call">{stateLabel}</span>
      )}
    </div>
  );
}

// ── Set color map (mirrors CreateAuction) ──────────────────────────────────────────────────
const AR_SET_COLORS = {
  'Marquee Set':          { bg: 'rgba(255,193,7,0.12)',   border: 'rgba(255,193,7,0.35)',   color: '#ffc107' },
  'Capped Batter':        { bg: 'rgba(20,209,255,0.10)',  border: 'rgba(20,209,255,0.3)',   color: '#14d1ff' },
  'Uncapped Batter':      { bg: 'rgba(20,209,255,0.07)',  border: 'rgba(20,209,255,0.2)',   color: '#7ad8f5' },
  'Capped Bowler':        { bg: 'rgba(255,60,172,0.10)',  border: 'rgba(255,60,172,0.3)',   color: '#ff3cac' },
  'Uncapped Bowler':      { bg: 'rgba(255,60,172,0.07)',  border: 'rgba(255,60,172,0.2)',   color: '#f59bc8' },
  'Capped All-rounder':   { bg: 'rgba(123,97,255,0.10)', border: 'rgba(123,97,255,0.3)',   color: '#7b61ff' },
  'Uncapped All-rounder': { bg: 'rgba(123,97,255,0.07)', border: 'rgba(123,97,255,0.2)',   color: '#b8a9ff' },
  'Capped Wicketkeeper':  { bg: 'rgba(0,230,118,0.10)',  border: 'rgba(0,230,118,0.3)',    color: '#00e676' },
  'Uncapped Wicketkeeper':{ bg: 'rgba(0,230,118,0.07)',  border: 'rgba(0,230,118,0.2)',    color: '#7bdfab' },
};

// ── Player Card ────────────────────────────────────────────────────────────────
function PlayerCard({ player, auctionState, currentBid, iAmHighestBidder, timeLeft, totalTime, paused, timerEnd, serverTimeOffset }) {
  if (!player) return null;
  const isBidding = auctionState === 'bidding';
  const isSold = auctionState === 'sold';
  const isUnsold = auctionState === 'unsold';
  const danger = timeLeft <= 5 && isBidding;

  const roleBadge = {
    'Batter': 'ar-badge-cyan',
    'Bowler': 'ar-badge-pink',
    'All-Rounder': 'ar-badge-purple',
    'WK-Batter': 'ar-badge-gold',
  }[player.role] || 'ar-badge-muted';

  // Prefer new `set` field, fall back to old `category`
  const playerSet = player.set || player.category || '';
  const setColor = AR_SET_COLORS[playerSet];

  const hasImage = !!player.imageUrl;
  const fallbackSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=050505`;

  const currentBidFormatted = formatPrice(currentBid?.amount || getBasePriceInPaise(player.basePrice));
  const winningText = iAmHighestBidder ? '✓ WINNING' : currentBid ? `▲ ${currentBid.teamName || ''}` : null;

  // Performance rating color
  const ratingColor = (player.score || 0) >= 90 ? '#00e676'
    : (player.score || 0) >= 80 ? '#14d1ff'
    : (player.score || 0) >= 70 ? '#ffc107' : '#888';

  return (
    <div className={`ar-card-wrap ${danger ? 'urgent' : ''}`}>
      {/* top accent — color shifts based on set */}
      <div
        className={`ar-top-accent ${danger ? 'urgent' : ''}`}
        style={!danger && setColor ? { background: `linear-gradient(90deg, transparent, ${setColor.color}, transparent)` } : {}}
      />

      {/* Stadium / player image area */}
      <div className="ar-card-stadium">
        {hasImage ? (
          <>
            <img
              src={player.imageUrl}
              alt=""
              className="ar-stadium-bg"
              referrerPolicy="no-referrer"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="ar-stadium-overlay" />
            <div className="ar-player-img-wrap">
              <img
                src={player.imageUrl}
                alt={player.name}
                className="ar-player-img"
                referrerPolicy="no-referrer"
                onError={e => {
                  e.target.style.borderRadius = '50%';
                  e.target.style.background = 'rgba(20,209,255,0.05)';
                  e.target.onerror = () => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  };
                  e.target.src = fallbackSrc;
                }}
              />
              <div className="ar-player-img-fallback" style={{ display: 'none' }}>🏏</div>
            </div>
          </>
        ) : (
          <>
            <div className="ar-stadium-fallback" />
            <div className="ar-stadium-overlay" />
            <div className="ar-player-img-wrap">
              {/* DiceBear avatar as default — auto-generated from player name */}
              <img
                src={fallbackSrc}
                alt={player.name}
                className="ar-player-img"
                style={{ borderRadius: '50%', objectFit: 'cover', background: 'rgba(20,209,255,0.05)' }}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="ar-player-img-fallback" style={{ display: 'none' }}>🏏</div>
            </div>
          </>
        )}

        {playerSet && (
          <div style={{
            position: 'absolute', top: 10, right: 12, zIndex: 10,
            padding: '3px 10px', borderRadius: 999,
            fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: setColor?.bg || 'rgba(255,255,255,0.07)',
            border: `1px solid ${setColor?.border || 'rgba(255,255,255,0.15)'}`,
            color: setColor?.color || '#888',
            backdropFilter: 'blur(6px)',
          }}>{playerSet}</div>
        )}
        {isSold && (
          <div style={{
            position: 'absolute', top: 10, left: 12, zIndex: 10,
            background: '#22c55e', color: '#000',
            fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
            padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase'
          }}>SOLD</div>
        )}
        {isUnsold && (
          <div style={{
            position: 'absolute', top: 10, left: 12, zIndex: 10,
            background: '#ef4444', color: '#fff',
            fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
            padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase'
          }}>UNSOLD</div>
        )}
      </div>

      {/* Timer ring — left side */}
      {isBidding && typeof timeLeft === 'number' && (
        <TimerRing timeLeft={timeLeft} totalTime={totalTime} paused={paused} timerEnd={timerEnd} serverTimeOffset={serverTimeOffset} />
      )}

      {/* Card body */}
      <div className="ar-card-body">
        {/* Name */}
        <div className="ar-player-name">{player.name}</div>

        {/* Badges — role, country, capped */}
        <div className="ar-player-badges">
          <span className={`ar-badge ${roleBadge}`}>{player.role}</span>
          <span className="ar-badge ar-badge-muted">{player.country}</span>
          {player.age > 0 && (
            <span className="ar-badge ar-badge-muted">{player.age} yrs</span>
          )}
          {player.capped !== undefined && (
            <span className={`ar-badge ${player.capped ? 'ar-badge-cyan' : 'ar-badge-muted'}`}>
              {player.capped ? 'Capped' : 'Uncapped'}
            </span>
          )}
        </div>

        {/* Performance Rating bar */}
        {player.score > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>PERFORMANCE RATING</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 700, color: ratingColor }}>{player.score}</span>
            </div>
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                width: `${Math.min(100, player.score)}%`,
                background: `linear-gradient(90deg, ${ratingColor}88, ${ratingColor})`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}

        {/* Bid row */}
        <div className="ar-bid-row">
          <div className="ar-bid-col">
            <div className="ar-bid-lbl">BASE PRICE</div>
            <div className="ar-bid-val">{player.basePrice}</div>
          </div>
          <div className="ar-bid-col">
            <div className={`ar-bid-lbl ${isBidding ? 'cyan' : ''}`}>
              {isBidding ? 'CURRENT BID' : isSold ? 'SOLD FOR' : 'STARTING AT'}
            </div>
            <div className={`ar-current-bid-val ${danger ? 'urgent' : ''} ${iAmHighestBidder && isBidding ? 'winning' : ''}`}>
              {isSold ? formatPrice(currentBid?.amount) : (currentBid ? currentBidFormatted : '—')}
            </div>
            {winningText && isBidding && (
              <div className={`ar-bid-who ${iAmHighestBidder ? 'winning' : ''}`}>
                {winningText}
              </div>
            )}
            {isSold && currentBid?.teamName && (
              <div className="ar-bid-who">🔨 {currentBid.teamName}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
function AdminPanel({ isOwner, isHostVerified, setIsHostVerified, auction, roomAdminKey, roomCode, onStart, onPause, onResume, onUndo, onForce, onMarkUnsold, onSkip, onEnd }) {
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const verify = () => {
    if (keyInput === roomAdminKey || !roomAdminKey) {
      setIsHostVerified(true);
    } else {
      alert('Incorrect admin key');
    }
  };

  const hasAccess = isOwner || isHostVerified;

  if (!hasAccess) {
    return (
      <div className="ar-admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ar-admin-title">🔐 Admin Controls</div>
        {roomAdminKey && (
          !showKey ? (
            <button className="ar-admin-btn gold" style={{ width: '100%' }} onClick={() => setShowKey(true)}>Unlock Controls</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="ar-input" placeholder="Admin Key" type="password" value={keyInput}
                onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} />
              <button className="ar-admin-btn gold" onClick={verify} style={{ width: '100%' }}>Verify</button>
            </div>
          )
        )}
        <div style={{ background: 'rgba(0,217,255,0.06)', border: '1px solid rgba(0,217,255,0.15)', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Room Code:</span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 800, fontSize: '0.9rem', color: '#fff', letterSpacing: '0.1em' }}>{roomCode || '—'}</span>
        </div>
      </div>
    );
  }

  const aState = auction?.state;
  return (
    <div className="ar-admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="ar-admin-title">👑 Host Controls</div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', marginBottom: 6 }}>
        {roomAdminKey && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#ffc107', fontWeight: 600 }}>Host Key:</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 700 }}>{roomAdminKey}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: roomAdminKey ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: roomAdminKey ? 4 : 0 }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Room Code:</span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontWeight: 700 }}>{roomCode || '—'}</span>
        </div>
      </div>

      <div className="ar-admin-grid">
        {aState === 'idle' && <button className="ar-admin-btn green" onClick={onStart}>▶ Start</button>}
        {aState === 'bidding' && !auction?.paused && <button className="ar-admin-btn gold" onClick={onPause}>⏸ Pause</button>}
        {auction?.paused && <button className="ar-admin-btn cyan" onClick={onResume}>▶ Resume</button>}
        {(aState === 'sold' || aState === 'unsold') && <button className="ar-admin-btn ghost" onClick={onUndo}>↩ Undo</button>}
        {aState === 'bidding' && <button className="ar-admin-btn purple" onClick={onForce}>🔨 Force</button>}
        {aState === 'bidding' && <button className="ar-admin-btn red" onClick={onMarkUnsold}>✕ Unsold</button>}
        {aState !== 'idle' && <button className="ar-admin-btn ghost" onClick={onSkip}>⏭ Skip</button>}
        <button className="ar-admin-btn full" onClick={onEnd}>🔚 End Auction</button>
      </div>
    </div>
  );
}

const validateBid = (team, player, amount, settings) => {
  if (!team) return { ok: false, reason: 'Team not found' };
  
  // 1. Check purse
  if ((team.purse || 0) < amount) {
    return { ok: false, reason: `Insufficient purse! Remaining: ${formatPrice(team.purse)}, Bid: ${formatPrice(amount)}` };
  }

  // 2. Check max squad size
  const maxSquad = Number(settings.maxSquadSize) || 18;
  const currentSquadSize = (team.players || []).length;
  if (currentSquadSize >= maxSquad) {
    return { ok: false, reason: `Squad is already full! (Max: ${maxSquad})` };
  }

  // 3. Check overseas limit
  const isOverseas = player.country && player.country.toLowerCase() !== 'india';
  if (isOverseas) {
    const overseasLimit = Number(settings.overseasLimit) || 4;
    const currentOverseas = (team.players || []).filter(p => p.country && p.country.toLowerCase() !== 'india').length;
    if (currentOverseas >= overseasLimit) {
      return { ok: false, reason: `Overseas player limit reached! (Max: ${overseasLimit})` };
    }
  }

  // 4. Check role slot balance (mathematically verify if minimums are still achievable)
  const slotsRemaining = maxSquad - currentSquadSize;
  const role = player.role;
  
  const currentBatters = (team.players || []).filter(p => p.role === 'Batter').length;
  const currentBowlers = (team.players || []).filter(p => p.role === 'Bowler').length;
  const currentAllRounders = (team.players || []).filter(p => p.role === 'All-Rounder').length;
  const currentKeepers = (team.players || []).filter(p => p.role === 'WK-Batter').length;

  const minBatters = Number(settings.minBatters) || 0;
  const minBowlers = Number(settings.minBowlers) || 0;
  const minAllRounders = Number(settings.minAllRounders) || 0;
  const minKeepers = Number(settings.minKeepers) || 0;

  const unmetBatters = Math.max(0, minBatters - (currentBatters + (role === 'Batter' ? 1 : 0)));
  const unmetBowlers = Math.max(0, minBowlers - (currentBowlers + (role === 'Bowler' ? 1 : 0)));
  const unmetAllRounders = Math.max(0, minAllRounders - (currentAllRounders + (role === 'All-Rounder' ? 1 : 0)));
  const unmetKeepers = Math.max(0, minKeepers - (currentKeepers + (role === 'WK-Batter' ? 1 : 0)));

  const totalUnmetRoles = unmetBatters + unmetBowlers + unmetAllRounders + unmetKeepers;
  if (totalUnmetRoles > (slotsRemaining - 1)) {
    const unmetList = [];
    if (unmetBatters > 0) unmetList.push(`${unmetBatters} Batters`);
    if (unmetBowlers > 0) unmetList.push(`${unmetBowlers} Bowlers`);
    if (unmetAllRounders > 0) unmetList.push(`${unmetAllRounders} All-Rounders`);
    if (unmetKeepers > 0) unmetList.push(`${unmetKeepers} Keepers`);
    return { 
      ok: false, 
      reason: `Buying this player leaves only ${slotsRemaining - 1} slots, but you need at least ${totalUnmetRoles} slots to satisfy remaining requirements: ${unmetList.join(', ')}` 
    };
  }

  // 5. Check uncapped minimums if applicable
  const minUncapped = Number(settings.minUncapped) || 0;
  if (minUncapped > 0) {
    const isUncapped = !player.capped;
    const currentUncapped = (team.players || []).filter(p => !p.capped).length;
    const unmetUncapped = Math.max(0, minUncapped - (currentUncapped + (isUncapped ? 1 : 0)));
    if (unmetUncapped > (slotsRemaining - 1)) {
      return {
        ok: false,
        reason: `Buying this player leaves only ${slotsRemaining - 1} slots, but you need at least ${unmetUncapped} slots for Uncapped players.`
      };
    }
  }

  return { ok: true };
};

// ── MAIN CONTENT ───────────────────────────────────────────────────────────────
function AuctionContent() {
  injectStyles();
  const { roomId } = useParams();
  const { user } = useAuth();
  const addToast = useToast();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [feedEvents, setFeedEvents] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoBid, setAutoBid] = useState({ enabled: false, maxAmount: 0 });
  const [showAutoBid, setShowAutoBid] = useState(false);
  const [customBidInput, setCustomBidInput] = useState('');
  const [showCustomBid, setShowCustomBid] = useState(false);
  const [isHostVerified, setIsHostVerified] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSquadsModal, setShowSquadsModal] = useState(false);
  const [selectedSquadTeamId, setSelectedSquadTeamId] = useState(user?.uid || '');
  const [mobileTab, setMobileTab] = useState('auction');
  const [resumeCountdown, setResumeCountdown] = useState(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const timerRef = useRef(null);
  const roomRef = useRef(null);
  const lastBidTimeRef = useRef(0);

  // Sync server time offset
  useEffect(() => {
    if (!db) return;
    const offsetRef = dbRef(db, '.info/serverTimeOffset');
    const unsub = onValue(offsetRef, snap => {
      if (snap.exists()) {
        setServerTimeOffset(snap.val() || 0);
      }
    });
    return () => unsub();
  }, []);

  const isOwner = room?.meta?.ownerId === user?.uid;
  const auction = room?.auction;
  const bidHistory = auction?.bidHistory || [];
  const settings = room?.meta?.settings || {};
  const myTeam = room?.teams?.[user?.uid];
  const teams = room?.teams ? Object.entries(room.teams) : [];
  const currentBid = auction?.currentBid;
  const auctionState = auction?.state;
  const iAmHighestBidder = currentBid?.teamId === user?.uid;

  const myPlayers = myTeam?.players || [];
  const roleCounts = myPlayers.reduce((acc, p) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc; }, {});

  const soldCount = auction?.soldCount || 0;
  const totalPlayers = Object.keys(room?.players || {}).length;
  const currentPlayerIndex = Math.max(1, Math.min(totalPlayers, totalPlayers - (auction?.playerQueue?.length || 0)));

  const nextBidAmount = (() => {
    if (!auction?.currentPlayer) return 0;
    const base = getBasePriceInPaise(auction.currentPlayer.basePrice);
    if (!currentBid) return base;
    return getNextBidAmount(currentBid.amount, settings);
  })();
  const canBid = auctionState === 'bidding' && !auction?.paused && !iAmHighestBidder && validateBid(myTeam, auction?.currentPlayer, nextBidAmount, settings).ok;

  const purseMax = settings?.teamPurseAmount || 1000000000;
  const purseUsed = purseMax - (myTeam?.purse || purseMax);
  const purseUsedPct = Math.min(100, (purseUsed / purseMax) * 100);

  // ── Firebase / Demo listener ─────────────────────────────────────────────
  useEffect(() => {
    let unsub = () => { };
    if (db) {
      unsub = onValue(dbRef(db, `rooms/${roomId}`), snap => {
        if (snap.exists()) {
          const data = snap.val();
          roomRef.current = data;
          setRoom(data);
          if (data.meta?.status === 'finished') navigate(`/results/${roomId}`);
        }
      });
    } else {
      const stored = localStorage.getItem(`aa_room_${roomId}`);
      if (stored) { const data = JSON.parse(stored); roomRef.current = data; setRoom(data); }
    }
    return () => unsub();
  }, [roomId, navigate]);

  const saveLocal = useCallback((updater) => {
    const stored = localStorage.getItem(`aa_room_${roomId}`);
    if (!stored) return;
    const data = JSON.parse(stored);
    const updated = typeof updater === 'function' ? updater(data) : { ...data, ...updater };
    localStorage.setItem(`aa_room_${roomId}`, JSON.stringify(updated));
    roomRef.current = updated;
    setRoom({ ...updated });
  }, [roomId]);

  const updateAuction = useCallback(async (changes) => {
    try {
      if (db) { await dbUpdate(dbRef(db, `rooms/${roomId}/auction`), changes); return; }
    } catch { }
    saveLocal(d => ({ ...d, auction: { ...(d.auction || {}), ...changes } }));
  }, [roomId, saveLocal]);

  const updateTeam = useCallback(async (teamId, changes) => {
    try {
      if (db) { await dbUpdate(dbRef(db, `rooms/${roomId}/teams/${teamId}`), changes); return; }
    } catch { }
    saveLocal(d => ({ ...d, teams: { ...(d.teams || {}), [teamId]: { ...(d.teams?.[teamId] || {}), ...changes } } }));
  }, [roomId, saveLocal]);

  const updatePlayer = useCallback(async (playerId, changes) => {
    try {
      if (db) { await dbUpdate(dbRef(db, `rooms/${roomId}/players/${playerId}`), changes); return; }
    } catch { }
    saveLocal(d => ({ ...d, players: { ...(d.players || {}), [playerId]: { ...(d.players?.[playerId] || {}), ...changes } } }));
  }, [roomId, saveLocal]);

  const pushEvent = useCallback((event) => {
    setFeedEvents(prev => [...prev.slice(-50), { ...event, timestamp: Date.now() }]);
  }, []);

  const triggerLeaderboardUpdate = useCallback(async (currentRoom) => {
    if (!currentRoom || !currentRoom.teams || currentRoom.meta?.leaderboardUpdated) return;
    try {
      if (db) {
        await dbUpdate(dbRef(db, `rooms/${roomId}/meta`), { leaderboardUpdated: true });
        
        const teams = Object.entries(currentRoom.teams);
        for (const [uid, team] of teams) {
          const teamScore = team.score || 0;
          const leaderRef = dbRef(db, `leaderboard/${uid}`);
          const snap = await dbGet(leaderRef);
          
          let gamesPlayed = 1;
          let totalPoints = teamScore;
          // Use displayName (profile name) if stored on the team, fall back to team name
          const name = team.displayName || team.name || 'Anonymous';
          
          if (snap.exists()) {
            const currentData = snap.val();
            gamesPlayed = (currentData.gamesPlayed || 0) + 1;
            totalPoints = (currentData.totalPoints || 0) + teamScore;
          }
          
          const ppm = Number((totalPoints / gamesPlayed).toFixed(2));
          await dbUpdate(leaderRef, {
            uid,
            name,
            gamesPlayed,
            totalPoints,
            scorePercentage: ppm,
            ppm
          });
        }
      } else {
        try {
          const stored = localStorage.getItem('aa_demo_leaderboard');
          const leaderboard = stored ? JSON.parse(stored) : {};
          
          const teams = Object.entries(currentRoom.teams);
          for (const [uid, team] of teams) {
            const teamScore = team.score || 0;
            // Use displayName (profile name) if stored, fall back to existing leaderboard name or team name
            const profileName = team.displayName || team.name || 'Anonymous';
            const currentData = leaderboard[uid] || { gamesPlayed: 0, totalPoints: 0, name: profileName };
            
            const gamesPlayed = currentData.gamesPlayed + 1;
            const totalPoints = currentData.totalPoints + teamScore;
            
            const ppm = Number((totalPoints / gamesPlayed).toFixed(2));
            leaderboard[uid] = {
              uid,
              name: team.displayName || currentData.name,
              gamesPlayed,
              totalPoints,
              scorePercentage: ppm,
              ppm
            };
          }
          localStorage.setItem('aa_demo_leaderboard', JSON.stringify(leaderboard));
        } catch (err) {
          console.error("Failed to update local demo leaderboard:", err);
        }
      }
    } catch (err) {
      console.error("Failed to update global leaderboard:", err);
    }
  }, [roomId]);

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (auctionState !== 'bidding' || !auction?.timerEnd || auction?.paused) { setTimeLeft(0); return; }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((auction.timerEnd - (Date.now() + serverTimeOffset)) / 1000));
      setTimeLeft(rem);
      if (rem <= 0 && isOwner) { clearInterval(timerRef.current); handleTimerExpire(); }
    };
    tick();
    timerRef.current = setInterval(tick, 300);
    return () => clearInterval(timerRef.current);
  }, [auction?.timerEnd, auctionState, auction?.paused, isOwner, serverTimeOffset]);

  // ── Advance to next player ─────────────────────────────────────────────
  const advanceToNextPlayer = useCallback(async () => {
    if (!isOwner) return;
    const cur = roomRef.current || room;
    const queue = [...(cur.auction?.playerQueue || [])];
    if (queue.length === 0) {
      await updateAuction({ state: 'idle', bidHistory: [] });
      await triggerLeaderboardUpdate(cur);
      if (db) {
        try {
          await dbUpdate(dbRef(db, `rooms/${roomId}/meta`), { status: 'finished' });
        } catch (err) {
          console.error("Failed to finish room meta:", err);
        }
      } else {
        saveLocal(d => ({ ...d, meta: { ...(d.meta || {}), status: 'finished' } }));
      }
      navigate(`/results/${roomId}`);
      return;
    }
    const nextId = queue.shift();
    const nextPlayer = cur.players?.[nextId];
    if (!nextPlayer) { setTimeout(advanceToNextPlayer, 100); return; }

    await updateAuction({ state: 'announcing', currentPlayer: null, currentBid: null, timerEnd: null, playerQueue: queue, bidHistory: [] });
    pushEvent({ type: 'system', icon: '🎯', msg: `Next up: ${nextPlayer.name}` });

    setTimeout(async () => {
      await updateAuction({ state: 'revealing', currentPlayer: nextPlayer });
      setTimeout(async () => {
        const timerEnd = (Date.now() + serverTimeOffset) + (settings.timerDurationMs || 15000);
        await updateAuction({ state: 'bidding', timerEnd });
        pushEvent({ type: 'system', icon: '🔔', msg: `Bidding open — ${nextPlayer.name} — Base: ${nextPlayer.basePrice}` });
      }, 2500);
    }, 3000);
  }, [isOwner, room, roomId, settings.timerDurationMs, navigate, updateAuction, pushEvent, saveLocal, serverTimeOffset]);

  // ── Timer expire ───────────────────────────────────────────────────────
  const handleTimerExpire = useCallback(async () => {
    if (!isOwner) return;
    const cur = roomRef.current || room;
    const bid = cur.auction?.currentBid;
    const player = cur.auction?.currentPlayer;
    if (!player) return;

    if (bid) {
      const team = cur.teams?.[bid.teamId] || {};
      const validation = validateBid(team, player, bid.amount, settings);
      if (validation.ok) {
        const newPurse = Math.max(0, (team.purse || 0) - bid.amount);
        const newPlayers = [...(team.players || []), { ...player, soldFor: bid.amount }];
        const newScore = newPlayers.reduce((s, p) => s + (p.score || 0), 0);
        await updateTeam(bid.teamId, { purse: newPurse, players: newPlayers, score: newScore });
        await updatePlayer(player.id, { status: 'sold', boughtBy: bid.teamId, soldFor: bid.amount });
        await updateAuction({ state: 'sold', soldCount: (cur.auction?.soldCount || 0) + 1, bidHistory: [] });
        pushEvent({ type: 'sold', icon: '🔨', msg: `${player.name} SOLD to ${bid.teamName} for ${formatPrice(bid.amount)}!` });
        addToast(`${player.name} sold for ${formatPrice(bid.amount)}!`, 'success', '🔨 SOLD!');
      } else {
        await updatePlayer(player.id, { status: 'unsold' });
        await updateAuction({ state: 'unsold', unsoldCount: (cur.auction?.unsoldCount || 0) + 1, bidHistory: [] });
        pushEvent({ type: 'unsold', icon: '⚠️', msg: `${player.name} went UNSOLD due to rule violation: ${validation.reason}` });
      }
    } else {
      await updatePlayer(player.id, { status: 'unsold' });
      await updateAuction({ state: 'unsold', unsoldCount: (cur.auction?.unsoldCount || 0) + 1, bidHistory: [] });
      pushEvent({ type: 'unsold', icon: '❌', msg: `${player.name} went UNSOLD.` });
    }
    setTimeout(advanceToNextPlayer, 2800);
  }, [isOwner, room, roomId, settings, advanceToNextPlayer, updateTeam, updatePlayer, updateAuction, addToast, pushEvent]);

  // ── Auto-start ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOwner && auctionState === 'idle' && room?.meta?.status === 'auction') {
      const t = setTimeout(advanceToNextPlayer, 1500);
      return () => clearTimeout(t);
    }
  }, [isOwner, auctionState, room?.meta?.status, advanceToNextPlayer]);

  // ── Auto-bid ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoBid.enabled || !autoBid.maxAmount || iAmHighestBidder || auctionState !== 'bidding') return;
    if (!auction?.currentPlayer || !myTeam) return;
    const next = currentBid ? getNextBidAmount(currentBid.amount, settings) : getBasePriceInPaise(auction.currentPlayer.basePrice);
    const validation = validateBid(myTeam, auction.currentPlayer, next, settings);
    if (next <= autoBid.maxAmount && validation.ok) {
      const delay = setTimeout(() => placeBid(next), 800);
      return () => clearTimeout(delay);
    }
  }, [currentBid?.amount, autoBid, iAmHighestBidder, auctionState, settings, myTeam, auction?.currentPlayer]);

  // ── Place Bid ──────────────────────────────────────────────────────────
  const placeBid = useCallback((forcedAmount) => {
    if (!myTeam || !auction?.currentPlayer) return;

    // Debounce rapid double clicks (400ms threshold)
    const now = Date.now();
    if (now - lastBidTimeRef.current < 400) return;
    lastBidTimeRef.current = now;

    const base = getBasePriceInPaise(auction.currentPlayer.basePrice);
    const nextAmount = forcedAmount || (currentBid ? getNextBidAmount(currentBid.amount, settings) : base);
    
    const validation = validateBid(myTeam, auction.currentPlayer, nextAmount, settings);
    if (!validation.ok) {
      addToast(validation.reason, 'error', 'Cannot Bid');
      return;
    }

    const timerEnd = (Date.now() + serverTimeOffset) + (settings.timerDurationMs || 15000);
    const bidData = { teamId: user.uid, teamName: user.displayName || 'Player', amount: nextAmount, timestamp: (Date.now() + serverTimeOffset) };

    pushEvent({ type: 'bid', icon: '💰', msg: `${user.displayName || 'You'} bid ${formatPrice(nextAmount)}` });

    // Sync to database in background
    updateAuction({ currentBid: bidData, timerEnd, bidHistory: [...(room?.auction?.bidHistory || []), bidData] }).catch(err => {
      console.error('Failed to sync bid to database:', err);
    });
  }, [auction, currentBid, room, myTeam, user, settings, iAmHighestBidder, updateAuction, addToast, pushEvent, serverTimeOffset]);

  // ── Admin actions ──────────────────────────────────────────────────────
  const handleStart = async () => {
    if (db) {
      try {
        await dbUpdate(dbRef(db, `rooms/${roomId}/meta`), { status: 'auction' });
      } catch (err) {
        console.error("Failed to start room meta:", err);
      }
    } else {
      saveLocal(d => ({ ...d, meta: { ...(d.meta || {}), status: 'auction' } }));
    }
    pushEvent({ type: 'system', icon: '🚀', msg: 'Auction has started!' });
    addToast('Auction started!', 'success', '🚀 Let the bidding begin!');
  };

  const handlePause = async () => {
    await updateAuction({ paused: true });
    pushEvent({ type: 'system', icon: '⏸️', msg: 'Auction paused by host.' });
    addToast('Auction paused', 'info', '⏸️ Paused');
  };

  const handleResume = async () => {
    if (resumeCountdown !== null) return;
    let count = 3;
    setResumeCountdown(count);
    const iv = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(iv);
        setResumeCountdown(null);
        const timerEnd = Date.now() + (settings.timerDurationMs || 15000);
        updateAuction({ paused: false, ...(auctionState === 'bidding' ? { timerEnd } : {}) });
        pushEvent({ type: 'system', icon: '▶️', msg: 'Auction resumed!' });
        addToast('Auction resumed!', 'success', '▶️ Resumed');
      } else {
        setResumeCountdown(count);
      }
    }, 1000);
  };

  const handleUndo = async () => {
    const cur = roomRef.current || room;
    const player = cur.auction?.currentPlayer;
    const bid = cur.auction?.currentBid;
    if (!player) return;
    if (auctionState === 'sold' && bid) {
      const team = cur.teams?.[bid.teamId] || {};
      const newPlayers = (team.players || []).filter(p => p.id !== player.id);
      const newScore = newPlayers.reduce((s, p) => s + (p.score || 0), 0);
      await updateTeam(bid.teamId, { purse: (team.purse || 0) + bid.amount, players: newPlayers, score: newScore });
      await updatePlayer(player.id, { status: 'pending', boughtBy: null, soldFor: null });
    }
    const origQueue = cur.auction?.originalQueue || [];
    const curQueue = [...(cur.auction?.playerQueue || [])];
    const origIdx = origQueue.indexOf(player.id);
    if (origIdx !== -1) curQueue.splice(Math.min(origIdx, curQueue.length), 0, player.id);
    else curQueue.unshift(player.id);
    await updateAuction({ state: 'idle', currentPlayer: null, currentBid: null, timerEnd: null, playerQueue: curQueue, soldCount: Math.max(0, (cur.auction?.soldCount || 0) - (auctionState === 'sold' ? 1 : 0)), bidHistory: [] });
    pushEvent({ type: 'system', icon: '↩️', msg: `Undo: ${player.name} returned to queue.` });
    addToast(`Undo successful`, 'info');
  };

  const handleForceSell = async () => {
    await handleTimerExpire();
    addToast('Force sold!', 'success');
  };

  const handleMarkUnsold = async () => {
    const cur = roomRef.current || room;
    const player = cur.auction?.currentPlayer;
    if (!player) return;
    await updatePlayer(player.id, { status: 'unsold' });
    await updateAuction({ state: 'unsold', unsoldCount: (cur.auction?.unsoldCount || 0) + 1, bidHistory: [] });
    pushEvent({ type: 'unsold', icon: '❌', msg: `${player.name} marked UNSOLD.` });
    setTimeout(advanceToNextPlayer, 2800);
  };

  const handleSkip = async () => {
    const cur = roomRef.current || room;
    const player = cur.auction?.currentPlayer;
    if (player) {
      const curQueue = [...(cur.auction?.playerQueue || [])];
      curQueue.push(player.id);
      await updateAuction({ playerQueue: curQueue });
      pushEvent({ type: 'system', icon: '⏭️', msg: `${player.name} skipped to end of queue.` });
    }
    await advanceToNextPlayer();
  };

  const handleEndAuction = async () => {
    const cur = roomRef.current || room;
    await triggerLeaderboardUpdate(cur);
    if (db) {
      try {
        await dbUpdate(dbRef(db, `rooms/${roomId}/meta`), { status: 'finished' });
      } catch (err) {
        console.error("Failed to end room meta:", err);
      }
    } else {
      saveLocal(d => ({ ...d, meta: { ...(d.meta || {}), status: 'finished' } }));
    }
    navigate(`/results/${roomId}`);
  };

  if (!room) {
    return (
      <div className="ar-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, minHeight: '100vh' }}>
        <div style={{ width: 60, height: 60, border: '3px solid rgba(20,209,255,0.15)', borderTop: '3px solid #14d1ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Connecting...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="ar-root">
      {/* Atmospheric BG */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(0,60,100,0.15) 0%, transparent 65%)' }} />
      </div>

      {/* ── HEADER ── */}
      <header className="ar-header">
        <div className="ar-header-left">

          {/* Pause btn — always visible to owners/hosts */}
          {(isOwner || isHostVerified) && !auction?.paused && (
            <button className="ar-pause-btn" onClick={handlePause} title="Pause Auction">
              <Icon name="pause" size={16} />
            </button>
          )}
        </div>

        {/* Center: progress (desktop) */}
        <div style={{ flex: 1, maxWidth: 220, display: 'flex', flexDirection: 'column', gap: 4, margin: '0 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', textAlign: 'center' }}>
            {soldCount} / {totalPlayers} SOLD
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalPlayers ? (soldCount / totalPlayers) * 100 : 0}%`, background: 'linear-gradient(90deg, rgba(20,209,255,0.6), #14d1ff)', borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div className="ar-header-right">
          {(isOwner || isHostVerified) && (
            <button className="ar-end-btn" onClick={() => setShowEndConfirm(true)} title="End Auction">
              <div className="ar-end-circle"><Icon name="power_settings_new" size={14} /></div>
              <span className="ar-end-label">End Session</span>
            </button>
          )}
          {myTeam && (
            <div className="ar-purse-block">
              <span className="ar-purse-label">Purse Remaining</span>
              <div className="ar-purse-val">{formatPrice(myTeam.purse)} • {myPlayers.length}/{settings.maxSquadSize || 18}</div>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: '0.9rem' }} title="Dashboard">🏠</button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="ar-main" style={{ paddingTop: '6.5vh' }}>

        {/* LEFT ASIDE (desktop) */}
        <aside className="ar-aside">
          <div className="ar-glass-card">
            <div className="ar-card-title">SQUAD BALANCE</div>
            <div className="ar-squad-grid">
              <div><div className="ar-squad-stat-lbl">Batters</div><div className="ar-squad-stat-val">{String(roleCounts['Batter'] || 0).padStart(2, '0')}</div></div>
              <div><div className="ar-squad-stat-lbl">Bowlers</div><div className="ar-squad-stat-val">{String(roleCounts['Bowler'] || 0).padStart(2, '0')}</div></div>
              <div><div className="ar-squad-stat-lbl">All-Rounders</div><div className="ar-squad-stat-val">{String(roleCounts['All-Rounder'] || 0).padStart(2, '0')}</div></div>
              <div><div className="ar-squad-stat-lbl">Keepers</div><div className="ar-squad-stat-val">{String(roleCounts['WK-Batter'] || 0).padStart(2, '0')}</div></div>
              <div style={{ gridColumn: 'span 2', marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ar-squad-stat-lbl">Slots Left</span>
                <span className="ar-squad-stat-val hl" style={{ fontSize: '1.25rem' }}>{(settings.maxSquadSize || 18) - myPlayers.length}</span>
              </div>
            </div>
          </div>

          <div className="ar-glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
            <div className="ar-card-title">LIVE FEED</div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
              {feedEvents.length === 0 ? (
                <div style={{ color: '#444', fontSize: '0.78rem', textAlign: 'center', padding: '12px 0' }}>Events will appear here…</div>
              ) : feedEvents.slice(-20).reverse().map((e, i) => {
                const timeAgo = e.timestamp ? Math.round((Date.now() - e.timestamp) / 1000) : 0;
                const timeStr = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
                return (
                  <div key={i} className="ar-feed-item">
                    <div className={`ar-feed-msg ${i === 0 ? 'latest' : ''}`}>{e.icon} {e.msg}</div>
                    <span className="ar-feed-time">{timeStr}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <AdminPanel
            isOwner={isOwner} isHostVerified={isHostVerified} setIsHostVerified={setIsHostVerified}
            auction={auction} roomAdminKey={room?.meta?.adminKey} roomCode={room?.meta?.code}
            onStart={handleStart} onPause={handlePause} onResume={handleResume}
            onUndo={handleUndo} onForce={handleForceSell}
            onMarkUnsold={handleMarkUnsold} onSkip={handleSkip} onEnd={() => setShowEndConfirm(true)}
          />
        </aside>

        {/* CENTER STAGE */}
        <section className="ar-stage">

          {/* IDLE */}
          {(!auctionState || auctionState === 'idle') && (
            <div className="ar-state-wrap">
              <div className="ar-state-icon">🏟️</div>
              <div className="ar-state-title">WAR ROOM</div>
              <div className="ar-state-sub">{isOwner ? 'Start the auction when all teams are ready.' : 'Waiting for the host to start the auction…'}</div>
              {isOwner && room?.meta?.status !== 'auction' && (
                <button
                  className="ar-bid-btn"
                  style={{ maxWidth: 280, height: 60, fontSize: '1.5rem', marginTop: 8 }}
                  onClick={handleStart}
                >
                  🚀 START AUCTION
                </button>
              )}
            </div>
          )}

          {/* ANNOUNCING */}
          {auctionState === 'announcing' && (
            <div className="ar-state-wrap">
              <div className="ar-state-icon">🎯</div>
              <div className="ar-state-title">NEXT PLAYER<br />INCOMING</div>
              <div className="ar-dots">
                <div className="ar-dot" /><div className="ar-dot" /><div className="ar-dot" />
              </div>
            </div>
          )}

          {/* REVEALING */}
          {auctionState === 'revealing' && auction?.currentPlayer && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 20, width: '100%' }}>
              <div style={{ fontSize: '0.82rem', color: '#ffc107', fontWeight: 800, letterSpacing: '0.2em', animation: 'ar-blink 1.5s infinite' }}>✨ PLAYER REVEALED</div>
              <PlayerCard player={auction.currentPlayer} auctionState="revealing" paused={auction?.paused} timerEnd={auction?.timerEnd} serverTimeOffset={serverTimeOffset} />
            </div>
          )}

          {/* BIDDING / SOLD / UNSOLD */}
          {['bidding', 'sold', 'unsold'].includes(auctionState) && auction?.currentPlayer && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%' }}>

              {/* Player Card */}
              <PlayerCard
                player={auction.currentPlayer}
                auctionState={auctionState}
                currentBid={currentBid}
                iAmHighestBidder={iAmHighestBidder}
                timeLeft={timeLeft}
                totalTime={settings.timerDuration || 15}
                paused={auction?.paused}
                timerEnd={auction?.timerEnd}
                serverTimeOffset={serverTimeOffset}
              />

              {/* Player counter */}
              <div className="ar-counter">
                <span>PLAYER {currentPlayerIndex} / {totalPlayers}</span>
                <div className="ar-counter-dots">
                  {Array.from({ length: Math.min(totalPlayers, 12) }).map((_, i) => {
                    const isActive = i === (currentPlayerIndex - 1);
                    const isDone = i < (currentPlayerIndex - 1);
                    return (
                      <div
                        key={i}
                        className={`ar-counter-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Ticker */}
              <div className="ar-ticker">
                {feedEvents.length > 0 ? (
                  <div className="ar-marquee-track">
                    {feedEvents.slice(-8).map((e, i) => (
                      <span key={i} className="ar-marquee-item"><b>{e.icon}</b> {e.msg}</span>
                    ))}
                  </div>
                ) : (
                  <div className="ar-marquee-track">
                    <span className="ar-marquee-item"><b>⚡</b> Real-time auction in progress…</span>
                    <span className="ar-marquee-item"><b>🏏</b> Monitor your squad balance carefully!</span>
                  </div>
                )}
              </div>

              {/* BID CONTROLS */}
              {auctionState === 'bidding' && myTeam && (mobileTab === 'auction') && (
                <div className="ar-bid-section">
                  {/* Main BID button */}
                  <button
                    id="bid-action-btn"
                    className={`ar-bid-btn ${iAmHighestBidder ? 'leading' : ''}`}
                    onClick={() => placeBid()}
                    disabled={!canBid}
                  >
                    <span>{iAmHighestBidder ? '✅ LEADING BID' : `BID ${formatPrice(nextBidAmount)}`}</span>
                    <span className="ar-bid-btn-sub">
                     {iAmHighestBidder ? 'You are the highest bidder' : `NEXT INCREMENT: ${formatPrice(currentBid ? getNextBidAmount(currentBid.amount, settings) - currentBid.amount : 0)}`}
                    </span>
                  </button>

                  {/* Quick bids */}
                  <div className="ar-quick-bids" style={{ marginTop: 10 }}>
                    {getQuickBidAmounts(settings).map(({ label, amount }) => {
                      const base = currentBid?.amount || getBasePriceInPaise(auction?.currentPlayer?.basePrice || '20L');
                      const bidAmt = base + amount;
                      const disabled = !myTeam || myTeam.purse < bidAmt;
                      return (
                        <button
                          key={label}
                          className="ar-quick-btn"
                          disabled={disabled}
                          onClick={() => placeBid(bidAmt)}
                        >
                          {label}
                        </button>
                      );
                    })}
                    <button className="ar-quick-btn" onClick={() => setShowCustomBid(true)}>Custom</button>
                  </div>

                  {/* Pass + Auto-bid row */}
                  <div className="ar-action-row">
                    <button className="ar-pass-btn" onClick={handleSkip} disabled={!isOwner && !isHostVerified}>
                      <Icon name="skip_next" size={15} />
                      PASS ROUND
                    </button>
                    <button className="ar-auto-btn" onClick={() => setAutoBid(a => ({ ...a, enabled: !a.enabled }))}>
                      AUTO-BID
                      <div className={`ar-auto-dot ${autoBid.enabled ? 'on' : ''}`} />
                      <span className={`ar-auto-label ${autoBid.enabled ? 'on' : ''}`}>{autoBid.enabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sold / Unsold messages */}
              {auctionState !== 'bidding' && (
                <div style={{ textAlign: 'center', color: '#555', fontSize: '0.88rem', marginTop: 20 }}>
                  {auctionState === 'sold' && '✅ Sold! Next player incoming…'}
                  {auctionState === 'unsold' && '❌ Unsold. Next player incoming…'}
                </div>
              )}
            </div>
          )}

          {/* Mobile Admin Tab */}
          {mobileTab === 'admin' && (
            <div style={{ width: '100%', maxWidth: 400, marginTop: 16 }}>
              <AdminPanel
                isOwner={isOwner} isHostVerified={isHostVerified} setIsHostVerified={setIsHostVerified}
                auction={auction} roomAdminKey={room?.meta?.adminKey} roomCode={room?.meta?.code}
                onStart={handleStart} onPause={handlePause} onResume={handleResume}
                onUndo={handleUndo} onForce={handleForceSell}
                onMarkUnsold={handleMarkUnsold} onSkip={handleSkip} onEnd={() => setShowEndConfirm(true)}
              />
            </div>
          )}
        </section>

        {/* RIGHT ASIDE (desktop) */}
        <aside className="ar-aside">
          {/* Top Contenders */}
          <div className="ar-glass-card">
            <div className="ar-card-title">TOP CONTENDERS</div>
            {bidHistory.length === 0 ? (
              <div style={{ color: '#444', fontSize: '0.78rem', textAlign: 'center', padding: '12px 0' }}>No bids yet</div>
            ) : [...bidHistory].reverse().slice(0, 5).map((bid, i) => (
              <div key={i} className="ar-contender" style={{ opacity: i === 0 ? 1 : Math.max(0.35, 0.8 - i * 0.15) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ar-contender-logo">{(bid.teamName || '?').charAt(0)}</div>
                  <span className="ar-contender-name" style={{ color: i === 0 ? '#d8e3fb' : '#666' }}>{bid.teamName}</span>
                </div>
                <span className="ar-contender-bid" style={{ color: i === 0 ? '#14d1ff' : '#555' }}>{formatPrice(bid.amount)}</span>
              </div>
            ))}
          </div>

          {/* Budget Usage */}
          {myTeam && (
            <div className="ar-glass-card">
              <div className="ar-card-title">BUDGET USAGE</div>
              <div className="ar-budget-bar-bg">
                <div className="ar-budget-bar-fill" style={{ width: `${purseUsedPct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', letterSpacing: '0.06em', marginTop: 4 }}>
                <span>USED: {formatPrice(purseUsed)}</span>
                <span>MAX: {formatPrice(purseMax)}</span>
              </div>
              <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>MY SQUAD</span>
                  <button onClick={() => { setSelectedSquadTeamId(user.uid); setShowSquadsModal(true); }}
                    style={{ fontSize: 10, color: '#14d1ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    VIEW ALL →
                  </button>
                </div>
                <div className="ar-squad-grid">
                  <div><div className="ar-squad-stat-lbl">Batters</div><div className="ar-squad-stat-val">{String(roleCounts['Batter'] || 0).padStart(2, '0')}</div></div>
                  <div><div className="ar-squad-stat-lbl">Bowlers</div><div className="ar-squad-stat-val">{String(roleCounts['Bowler'] || 0).padStart(2, '0')}</div></div>
                  <div><div className="ar-squad-stat-lbl">All-Rnd</div><div className="ar-squad-stat-val">{String(roleCounts['All-Rounder'] || 0).padStart(2, '0')}</div></div>
                  <div><div className="ar-squad-stat-lbl">WK</div><div className="ar-squad-stat-val">{String(roleCounts['WK-Batter'] || 0).padStart(2, '0')}</div></div>
                </div>
              </div>
            </div>
          )}

          {/* All Teams */}
          <div className="ar-glass-card">
            <div className="ar-card-title">ALL TEAMS</div>
            {teams.map(([uid, team]) => {
              const isActive = uid === currentBid?.teamId;
              const numPlayers = (team.players || []).length;
              const totalPoints = team.score || 0;
              const avgRating = numPlayers > 0 ? (totalPoints / numPlayers).toFixed(1) : '0.0';
              return (
                <div key={uid} className="ar-contender" style={{ cursor: 'pointer' }} onClick={() => { setSelectedSquadTeamId(uid); setShowSquadsModal(true); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="ar-contender-logo" style={{ borderColor: isActive ? '#14d1ff' : 'transparent', border: isActive ? '1px solid #14d1ff' : '1px solid rgba(255,255,255,0.06)' }}>
                      {(team.name || '?').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: isActive ? '#14d1ff' : '#d8e3fb' }}>{team.name}</div>
                      <div style={{ fontSize: 9, color: '#555', display: 'flex', flexWrap: 'wrap', gap: '4px 6px', marginTop: 1 }}>
                        <span>{numPlayers} players</span>
                        <span>•</span>
                        <span>Avg: {avgRating}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--accent-gold)' }}>Pts: {totalPoints}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '1rem', fontWeight: 700, color: '#ffc107' }}>{formatPrice(team.purse)}</span>
                </div>
              );
            })}
          </div>

          <AdminPanel
            isOwner={isOwner} isHostVerified={isHostVerified} setIsHostVerified={setIsHostVerified}
            auction={auction} roomAdminKey={room?.meta?.adminKey} roomCode={room?.meta?.code}
            onStart={handleStart} onPause={handlePause} onResume={handleResume}
            onUndo={handleUndo} onForce={handleForceSell}
            onMarkUnsold={handleMarkUnsold} onSkip={handleSkip} onEnd={() => setShowEndConfirm(true)}
          />
        </aside>
      </main>

      {/* ── PAUSE OVERLAY ── */}
      {auction?.paused && (
        <div className="ar-pause-overlay">
          <div className="ar-pause-card">
            <div>
              <div className="ar-pause-title">TIMEOUT</div>
              <div className="ar-pause-sub">Auction Paused by Admin</div>
            </div>
            <div className="ar-pause-snap">
              <div className="ar-pause-snap-title">Current Snapshot</div>
              <div className="ar-squad-grid" style={{ marginBottom: 12 }}>
                <div><div className="ar-squad-stat-lbl">Remaining Purse</div><div className="ar-squad-stat-val hl">{myTeam ? formatPrice(myTeam.purse) : '—'}</div></div>
                <div><div className="ar-squad-stat-lbl">Slots Filled</div><div className="ar-squad-stat-val">{myPlayers.length} / {settings.maxSquadSize || 18}</div></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700 }}>
                  <Icon name="sports_cricket" size={14} style={{ color: '#14d1ff' }} />{roleCounts['Batter'] || 0} BAT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700 }}>
                  <Icon name="sports_handball" size={14} style={{ color: '#14d1ff' }} />{roleCounts['Bowler'] || 0} BOWL
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700 }}>
                  <Icon name="swap_horiz" size={14} style={{ color: '#14d1ff' }} />{roleCounts['All-Rounder'] || 0} AR
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700 }}>
                  <Icon name="public" size={14} style={{ color: '#14d1ff' }} />{roleCounts['WK-Batter'] || 0} WK
                </div>
              </div>
            </div>
            {(isOwner || isHostVerified) && (
              <button className="ar-resume-btn" onClick={handleResume} disabled={resumeCountdown !== null}>
                {resumeCountdown !== null ? `RESUMING IN ${resumeCountdown}...` : 'RESUME AUCTION'}
              </button>
            )}
            {!isOwner && !isHostVerified && (
              <div style={{ textAlign: 'center', color: '#555', fontSize: '0.88rem' }}>Waiting for host to resume…</div>
            )}
          </div>
        </div>
      )}

      {/* ── SOLD BANNER (full screen overlay) ── */}
      {(auctionState === 'sold' || auctionState === 'unsold') && auction?.currentPlayer && (
        <div className="ar-sold-overlay" style={{ display: 'none' }}>
          {/* This is handled inline on card — hidden on purpose, we show card state */}
        </div>
      )}

      {/* ── MOBILE SQUAD BAR ── */}
      <div 
        className="ar-mobile-squad-bar"
        style={auctionState === 'bidding' && myTeam && mobileTab === 'auction' ? { bottom: '24.5vh' } : {}}
      >
        <div
          className="ar-squad-pill"
          onClick={() => { setSelectedSquadTeamId(user?.uid || ''); setShowSquadsModal(true); }}
        >
          <div className="ar-squad-pill-stat">
            <span className="ms" style={{ fontSize: 13, color: '#14d1ff' }}>sports_cricket</span>
            {roleCounts['Batter'] || 0} BAT
          </div>
          <div className="ar-pill-div" />
          <div className="ar-squad-pill-stat">
            <span className="ms" style={{ fontSize: 13, color: '#14d1ff' }}>sports_handball</span>
            {roleCounts['Bowler'] || 0} BOWL
          </div>
          <div className="ar-pill-div" />
          <div className="ar-squad-pill-stat">
            <span className="ms" style={{ fontSize: 13, color: '#14d1ff' }}>public</span>
            {roleCounts['WK-Batter'] || 0} WK
          </div>
          <div className="ar-pill-div" />
          <div className="ar-squad-pill-stat">
            <span className="ms" style={{ fontSize: 13, color: '#14d1ff' }}>swap_horiz</span>
            {roleCounts['All-Rounder'] || 0} AR
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="ar-bottom-nav">
        <div className={`ar-nav-item ${mobileTab === 'auction' ? 'active' : ''}`} onClick={() => setMobileTab('auction')}>
          <span className="ms" style={{ fontSize: 22, fontVariationSettings: mobileTab === 'auction' ? '"FILL" 1' : '"FILL" 0' }}>gavel</span>
          <span className="ar-nav-lbl">Auction</span>
        </div>
        <div className={`ar-nav-item ${mobileTab === 'squad' ? 'active' : ''}`} onClick={() => { setMobileTab('squad'); setSelectedSquadTeamId(user?.uid || ''); setShowSquadsModal(true); }}>
          <span className="ms" style={{ fontSize: 22 }}>groups</span>
          <span className="ar-nav-lbl">Squad</span>
        </div>
        <div className={`ar-nav-item ${mobileTab === 'admin' ? 'active' : ''}`} onClick={() => setMobileTab(mobileTab === 'admin' ? 'auction' : 'admin')}>
          <span className="ms" style={{ fontSize: 22 }}>admin_panel_settings</span>
          <span className="ar-nav-lbl">Admin</span>
        </div>
      </nav>

      {/* ── MODALS ── */}

      {/* Auto-bid */}
      <Modal open={showAutoBid} onClose={() => setShowAutoBid(false)} title="🤖 Auto-Bid Settings"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAutoBid({ enabled: false, maxAmount: 0 }); setShowAutoBid(false); }}>Disable</Button>
            <Button variant="cyan" onClick={() => setShowAutoBid(false)}>Save</Button>
          </>
        }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Auto-bid will automatically place bids on your behalf up to your maximum amount.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoBid.enabled} onChange={e => setAutoBid(a => ({ ...a, enabled: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#14d1ff' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable Auto-Bid</span>
          </label>
          {autoBid.enabled && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Maximum Bid (Crores)</label>
              <input type="number" className="ar-input" placeholder="e.g. 5" min="0" step="0.5"
                value={autoBid.maxAmount / 10000000 || ''}
                onChange={e => setAutoBid(a => ({ ...a, maxAmount: Number(e.target.value) * 10000000 }))} />
            </div>
          )}
        </div>
      </Modal>

      {/* Custom bid */}
      <Modal open={showCustomBid} onClose={() => setShowCustomBid(false)} title="💰 Custom Bid Amount"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCustomBid(false)}>Cancel</Button>
            <Button variant="cyan" onClick={() => {
              const amount = parseFloat(customBidInput) * 10000000;
              if (amount > 0) { placeBid(amount); setShowCustomBid(false); setCustomBidInput(''); }
            }}>Place Bid</Button>
          </>
        }>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Amount (Crores)</label>
          <input type="number" className="ar-input" placeholder="e.g. 8.5" min="0" step="0.5"
            value={customBidInput} onChange={e => setCustomBidInput(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') { const amount = parseFloat(customBidInput) * 10000000; if (amount > 0) { placeBid(amount); setShowCustomBid(false); setCustomBidInput(''); } } }} />
        </div>
      </Modal>

      {/* End auction confirm */}
      <Modal open={showEndConfirm} onClose={() => setShowEndConfirm(false)} title="🔚 End Auction?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEndConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setShowEndConfirm(false); handleEndAuction(); }}>Confirm End</Button>
          </>
        }>
        <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6 }}>
          Are you sure you want to end the auction? This will finalize all purchases and redirect everyone to the results page. This action cannot be undone.
        </p>
      </Modal>

      {/* Squads Modal */}
      <Modal open={showSquadsModal} onClose={() => setShowSquadsModal(false)} title="📋 Arena Squads"
        footer={<Button variant="cyan" onClick={() => setShowSquadsModal(false)}>Close</Button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {teams.map(([uid, team]) => {
              const isSelected = uid === selectedSquadTeamId;
              const isMy = uid === user?.uid;
              return (
                <button key={uid} onClick={() => setSelectedSquadTeamId(uid)}
                  style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${isSelected ? 'rgba(20,209,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: isSelected ? 'rgba(20,209,255,0.1)' : 'transparent', color: isSelected ? '#14d1ff' : '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {team.name}
                  <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '1px 6px', fontSize: 10 }}>{(team.players || []).length}</span>
                  {isMy && <span style={{ color: '#14d1ff', fontSize: 10 }}>⭐</span>}
                </button>
              );
            })}
          </div>

          {/* Selected team */}
          {(() => {
            const selectedEntry = teams.find(([uid]) => uid === selectedSquadTeamId);
            if (!selectedEntry) return <div style={{ color: '#888' }}>Select a team.</div>;
            const [, team] = selectedEntry;
            const draftedPlayers = team.players || [];
            const countByRole = draftedPlayers.reduce((acc, p) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc; }, {});

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>REMAINING BUDGET</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1.3rem', fontWeight: 700, color: '#ffc107' }}>{formatPrice(team.purse)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>PLAYERS BOUGHT</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1.3rem', fontWeight: 700, color: '#14d1ff' }}>{draftedPlayers.length} / {settings.maxSquadSize || 15}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>TOTAL SCORE</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1.3rem', fontWeight: 700, color: '#00e676' }}>{team.score || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>AVERAGE RATING</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1.3rem', fontWeight: 700, color: '#7b61ff' }}>{draftedPlayers.length > 0 ? ((team.score || 0) / draftedPlayers.length).toFixed(1) : '0.0'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Batter', 'Bowler', 'All-Rounder', 'WK-Batter'].map(role => {
                    const colorMap = { 'Batter': '#00D9FF', 'Bowler': '#FF3CAC', 'All-Rounder': '#7B61FF', 'WK-Batter': '#FFC107' };
                    const color = colorMap[role];
                    return (
                      <span key={role} style={{ padding: '3px 10px', borderRadius: 999, background: `${color}12`, border: `1px solid ${color}25`, color, fontSize: 11, fontWeight: 700 }}>
                        {role}: {countByRole[role] || 0}
                      </span>
                    );
                  })}
                </div>
                <div style={{ maxHeight: 'min(60vh, 450px)', overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(20,209,255,0.04)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 9, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>PLAYER</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 9, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ROLE</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 9, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftedPlayers.map((p, idx) => {
                        const colorMap = { 'Batter': '#00D9FF', 'Bowler': '#FF3CAC', 'All-Rounder': '#7B61FF', 'WK-Batter': '#FFC107' };
                        const color = colorMap[p.role] || '#888';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 700 }}>{p.name}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 999, background: `${color}15`, border: `1px solid ${color}30`, color, fontSize: 10, fontWeight: 700 }}>{p.role}</span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'Barlow Condensed', fontWeight: 700, color: '#ffc107', fontSize: '0.9rem' }}>{formatPrice(p.soldFor)}</td>
                          </tr>
                        );
                      })}
                      {draftedPlayers.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', color: '#888', padding: '24px 0', fontSize: '0.82rem' }}>No players bought yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>

      {/* Floating Draggable Chat Widget */}
      <ChatBox roomId={roomId} isMinimized={true} />
    </div>
  );
}

export default function AuctionRoom() {
  return <ToastProvider><AuctionContent /></ToastProvider>;
}
