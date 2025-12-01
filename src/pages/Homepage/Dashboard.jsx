// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import "./dashboard.css";

import starsGif from "../../assets/stars.gif";
import premiumGif from "../../assets/premium_gif.gif";

const GOAL = 999999;

// Formatlash
const formatAmount = (num) =>
  num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function Dashboard() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);

  const [txs, setTxs] = useState([]);
  const [totalSum, setTotalSum] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ============================================================
      1) TELEGRAMDAN USERNAME ANIQLASH
  ============================================================ */
  useEffect(() => {
    try {
      WebApp.ready();

      const tgUser =
        WebApp?.initDataUnsafe?.user?.username ||
        window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;

      if (tgUser) {
        setIsTelegram(true);
        setUsername(tgUser);
      } else {
        // Telegram emas → tarixni ko‘rsatilmaydi
        setIsTelegram(false);
        setUsername(null);
      }
    } catch (err) {
      setIsTelegram(false);
      setUsername(null);
    }
  }, []);

  /* ============================================================
      2) USER TRANSAKSIYALARINI O‘QISH
  ============================================================ */
  useEffect(() => {
    if (!isTelegram || !username) return;

    const loadTxs = async () => {
      try {
        setLoading(true);
        setError(null);

        const clean = username.startsWith("@")
          ? username.slice(1)
          : username;

        const starsRes = await fetch(
          `/api/transactions/all`
        );
        const premRes = await fetch(
          `/api/admin/premium/list?status=all`
        );

        const allStars = await starsRes.json();
        const premJson = await premRes.json();
        const allPremium = premJson.orders || [];

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

        setTxs(combined);

        // Sum stars_sent + premium_sent
        const sum = combined
          .filter((t) =>
            ["stars_sent", "premium_sent"].includes(t.status)
          )
          .reduce((s, t) => s + Number(t.amount || 0), 0);

        setTotalSum(sum);
      } catch (e) {
        setError("Serverdan ma'lumot olishda xato");
      } finally {
        setLoading(false);
      }
    };

    loadTxs();
  }, [isTelegram, username]);

  const percent = Math.min(100, Math.round((totalSum / GOAL) * 100));

  return (
    <div className="dashboard-root_dashboard">

      {/* HEADER */}
      <header className="dash-header_dashboard">
        <h1>Premium Fast — Dashboard</h1>
      </header>

      {/* ACTION BUTTONS */}
      <div className="top-actions_dashboard">
        <div className="card action-card_dashboard" onClick={() => navigate("/stars")}>
          <div className="card-icon_dashboard">
            <img src={starsGif} className="plan-gif_dashboard" />
          </div>
          <div className="card-body_dashboard">
            <div className="card-title_dashboard">Stars olish</div>
          </div>
        </div>

        <div className="card action-card_dashboard" onClick={() => navigate("/premium")}>
          <div className="card-icon_dashboard">
            <img src={premiumGif} className="plan-gif_dashboard" />
          </div>
          <div className="card-body_dashboard">
            <div className="card-title_dashboard">Premium olish</div>
          </div>
        </div>
      </div>

      <main className="dash-main_dashboard">

        {/* GOAL SECTION */}
        <section className="challenge-card-card_dashboard">
          <div className="challenge-header_dashboard">
            <div>
              <h3>Umumiy savdo maqsadi</h3>
              <p className="goal-sub_dashboard">999 999 so‘m — NFT sovg‘a!</p>
            </div>

            <div className="goal-values_dashboard">
              <div className="current_dashboard">{formatAmount(totalSum)} so'm</div>
              <div className="goal_dashboard">{formatAmount(GOAL)} so'm</div>
            </div>
          </div>

          <div className="progress-bar_dashboard">
            <div
              className="progress-fill_dashboard"
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <div className="progress-meta_dashboard">
            <span>{percent}%</span>
          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section className="history-card-card_dashboard">
          <div className="history-header_dashboard">
            <h3>Tarix @{username}</h3>

            {!isTelegram && (
              <small className="muted_dashboard">
                Tarix faqat Telegram Mini-App orqali ishlaydi
              </small>
            )}
          </div>

          {!isTelegram && (
            <div className="no-history_dashboard">
              <p>Mini-App orqali kirishingiz kerak.</p>
            </div>
          )}

          {isTelegram && loading && <p>Yuklanmoqda...</p>}
          {isTelegram && error && <p className="error_dashboard">{error}</p>}

          {isTelegram && !loading && txs.length === 0 && (
            <div className="no-history_dashboard">
              <p>Tranzaksiyalar topilmadi.</p>
            </div>
          )}

          {isTelegram && txs.length > 0 && (
            <ul className="tx-list_dashboard">
              {txs.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="tx-item_dashboard">
                  <div className="tx-left_dashboard">
                    <div className={`tx-badge_dashboard ${t.kind}`}>
                      {t.kind === "stars" ? "⭐" : "💎"}
                    </div>
                  </div>

                  <div className="tx-main_dashboard">
                    <div className="tx-top_dashboard">
                      <div className="tx-username_dashboard">@{t.username}</div>
                      <div className="tx-amount_dashboard">
                        {formatAmount(t.amount)} so'm
                      </div>
                    </div>

                    <div className="tx-bottom_dashboard">
                      <div className="tx-meta_dashboard">
                        {t.stars ? `${t.stars}⭐` : ""}
                        {t.muddat_oy ? ` • ${t.muddat_oy} oy` : ""}
                      </div>

                      {/* STATUS ranglari */}
                      <div className={`tx-status badge_dashboard-${t.status}`}>
                        {t.status}
                      </div>

                      <div className="tx-date_dashboard">
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
