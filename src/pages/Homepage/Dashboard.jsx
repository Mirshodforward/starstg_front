// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import "./dashboard.css";

import starsGif from "../../assets/stars.gif";
import premiumGif from "../../assets/premium_gif.gif";

const GOAL = 500000;

const formatAmount = (num) =>
  num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function Dashboard() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);

  const [combinedTxs, setCombinedTxs] = useState([]);
  const [totalSum, setTotalSum] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ============================================================
      1) TELEGRAM USER DETECT
  ============================================================ */
  useEffect(() => {
    try {
      if (WebApp?.ready) {
        WebApp.ready();

        const tgUser =
          WebApp.initDataUnsafe?.user?.username ||
          WebApp.initData?.user?.username;

        if (tgUser) {
          setIsTelegram(true);
          setUsername(tgUser);
          return;
        }
      }

      // Fallback: window.Telegram API
      const wUser =
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username ||
        window?.Telegram?.WebApp?.initData?.user?.username;

      if (wUser) {
        setIsTelegram(true);
        setUsername(wUser);
        return;
      }

      // Not Telegram → no history
      setIsTelegram(false);
      setUsername(null);

    } catch (err) {
      setIsTelegram(false);
      setUsername(null);
    }
  }, []);

  /* ============================================================
      2) FETCH TRANSACTIONS ONLY IF TELEGRAM USER FOUND
  ============================================================ */
  useEffect(() => {
    if (!isTelegram || !username) return;

    const fetchTxs = async () => {
      try {
        setLoading(true);
        setError(null);

        const starsRes = await fetch("http://localhost:5001/api/transactions/all");
        const premRes = await fetch("http://localhost:5001/api/admin/premium/list?status=all");

        const allStars = await starsRes.json();
        const premJson = await premRes.json();
        const allPremium = premJson.orders || [];

        const clean = username.startsWith("@") ? username.slice(1) : username;

        const userStars = allStars.filter(
          (t) => (t.username || "").toLowerCase() === clean.toLowerCase()
        );

        const userPremium = allPremium.filter(
          (t) => (t.username || "").toLowerCase() === clean.toLowerCase()
        );

        const combined = [
          ...userStars.map((t) => ({ ...t, kind: "stars" })),
          ...userPremium.map((t) => ({ ...t, kind: "premium" })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setCombinedTxs(combined);

        const sum = combined.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        setTotalSum(sum);

      } catch (err) {
        setError("Serverdan ma'lumot olishda xato");
      } finally {
        setLoading(false);
      }
    };

    fetchTxs();
  }, [isTelegram, username]);


  /* ============================================================
      UI RENDER
  ============================================================ */

  const progressPercent = Math.min(100, Math.round((totalSum / GOAL) * 100));

  return (
    <div className="dashboard-root">
      <header className="dash-header">
        <h1>StarsPaymee — Dashboard</h1>
      </header>

      <div className="top-actions">
        <div className="card action-card" onClick={() => navigate("/stars")}>
          <div className="card-icon">
            <img src={starsGif} alt="stars" className="plan-gif" />
          </div>
          <div className="card-body">
            <div className="card-title">Stars olish</div>
            <div className="card-sub">Stars sahifasiga o'tish</div>
          </div>
        </div>

        <div className="card action-card" onClick={() => navigate("/premium")}>
          <div className="card-icon">
            <img src={premiumGif} className="plan-gif" />
          </div>
          <div className="card-body">
            <div className="card-title">Premium olish</div>
            <div className="card-sub">Premium sahifasiga o'tish</div>
          </div>
        </div>
      </div>

      <main className="dash-main">
        <section className="challenge-card card">
          <div className="challenge-header">
            <div>
              <h3>Umumiy savdo maqsadi</h3>
              <p className="goal-sub">500 000 so'mga yetganda NFT sovg‘a!</p>
            </div>
            <div className="goal-values">
              <div className="current">{formatAmount(totalSum)} so'm</div>
              <div className="goal">{formatAmount(GOAL)} so'm</div>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="progress-meta">
            <span>{progressPercent}%</span>
          </div>
        </section>

        <section className="history-card card">
          <div className="history-header">
            <h3>Tarix {username ? `(@${username})` : ""}</h3>
          </div>

          {/* Browser rejimi */}
          {!isTelegram && (
            <div className="no-history">
              <p>Tarix faqat Telegram Mini-App orqali mavjud.</p>
            </div>
          )}

          {/* Loading */}
          {loading && <p>Yuklanmoqda...</p>}

          {/* Errors */}
          {error && <p className="error">{error}</p>}

          {/* Telegramda, username bor, lekin tranzaksiyalar yo‘q */}
          {isTelegram && !loading && combinedTxs.length === 0 && (
            <div className="no-history">
              <p>Tranzaksiyalar topilmadi.</p>
            </div>
          )}

          {/* Transaction LIST */}
          {isTelegram && combinedTxs.length > 0 && (
            <ul className="tx-list">
              {combinedTxs.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="tx-item">
                  <div className="tx-left">
                    <div className={`tx-badge ${t.kind}`}>
                      {t.kind === "stars" ? "⭐" : "💎"}
                    </div>
                  </div>

                  <div className="tx-main">
                    <div className="tx-top">
                      <div className="tx-username">@{t.username}</div>
                      <div className="tx-amount">
                        {formatAmount(t.amount)} so'm
                      </div>
                    </div>

                    <div className="tx-bottom">
                      <div className="tx-meta">
                        {t.stars ? `${t.stars} stars` : ""}
                        {t.muddat_oy ? ` • ${t.muddat_oy} oy` : ""}
                        {t.transaction_id ? ` • TX: ${t.transaction_id}` : ""}
                      </div>

                      <div className={`tx-status ${t.status}`}>{t.status}</div>

                      <div className="tx-date">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
