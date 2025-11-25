import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Premium.css";

export default function Premium() {
  const navigate = useNavigate();
  const PREMIUM_3 = parseInt(import.meta.env.VITE_PREMIUM_3);
  const PREMIUM_6 = parseInt(import.meta.env.VITE_PREMIUM_6);
  const PREMIUM_12 = parseInt(import.meta.env.VITE_PREMIUM_12);

  // ====================
  // STATE
  // ====================
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const plans = [
    { id: 1, label: "3 oy", price: PREMIUM_3, months: 3 },
    { id: 2, label: "6 oy", price: PREMIUM_6, months: 6 },
    { id: 3, label: "1 yil", price: PREMIUM_12, months: 12 },
  ];

  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [order, setOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [cardLast4, setCardLast4] = useState("");

  const countdownRef = useRef(null);
  const pollingRef = useRef(null);
  const [countdown, setCountdown] = useState(0);

  const [loadingBuy, setLoadingBuy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format
  const formatAmount = (num) =>
    num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // ================================
  // 🔍 PREMIUM SEARCH
  // ================================
  useEffect(() => {
    if (!username) {
      setProfile(null);
      setSearchError(null);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoadingProfile(true);

        const clean = username.replace("@", "");

        const res = await fetch("http://localhost:5000/api/premium/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: clean,                // ✔ TO‘G‘RI
            months: selectedPlan.months     // ✔ OPTIONAL
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setProfile(null);
          setSearchError(data.error || "Foydalanuvchi topilmadi");
          return;
        }

        setProfile({
          username: data.username,
          fullName: data.fullName,
          imageUrl: data.imageUrl,
          recipient: data.recipient, // ✔ BACKENDDAN KELGAN ID
        });

        setSearchError(null);
      } catch {
        setSearchError("Tarmoq xatosi");
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [username, selectedPlan]);

  // ================================
  // 🧾 ORDER YARATISH
  // ================================
  const handleCreateOrder = async () => {

    if (!profile?.username || !profile?.recipient) {
      alert("Foydalanuvchi topilmadi!");
      return;
    }

    setLoadingBuy(true);

    try {
      const res = await fetch("http://localhost:5000/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          recipient: profile.recipient, // ✔ ID
          months: selectedPlan.months,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Order yaratishda xato");
        return;
      }

      setOrder(data.order);
      setShowModal(true);
      setPaymentStatus("pending");
      setCardLast4("");

      startCountdown(3600);
      startPolling(data.order.id);

    } catch {
      alert("Server xatosi");
    } finally {
      setLoadingBuy(false);
    }
  };

  // ================================
  // 📡 POLLING
  // ================================
  const startPolling = (id) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/premium/transactions/${id}`);
        const data = await res.json();

        if (!res.ok) return;

        setPaymentStatus(data.status);
        setCardLast4(data.card_last4 || "");

        if (data.status === "premium_sent") {
          stopPolling();
          navigate("/premium/success", { state: { order: data } });
        }

        if (["failed", "error"].includes(data.status)) {
          stopPolling();
          navigate("/premium/error", {
            state: {
              reason: data.reason || "unknown",
              order: data,
            }
          });
        }

      } catch {}
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  // ================================
  // ⏳ TIMER
  // ================================
  const startCountdown = (sec) => {
    stopCountdown();
    setCountdown(sec);

    countdownRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          stopCountdown();
          setShowModal(false);
          alert("⏰ To‘lov muddati tugadi");
          setPaymentStatus("expired");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  useEffect(() => {
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  const copy = (t) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ================================
  // UI
  // ================================
  return (
    <div className="premium-container">

      <img src="../src/assets/diamond.gif" alt="premium" className="plan-gif" />
      <h2>Premium Fast Bot</h2>

      {/* SEARCH */}
      <div className="search-row">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Foydalanuvchi nomi @username"
        />
        {loadingProfile && <div className="loader-arc">🔄</div>}
      </div>

      {searchError && <div className="error">{searchError}</div>}

      {profile && (
        <div className="profile-preview">
          <img src={profile.imageUrl || "../src/assets/default_image.png"} />
          <div>
            <b>{profile.fullName}</b>
            <p>@{profile.username}</p>
          </div>
        </div>
      )}

      {/* PLANS */}
      <h3>Muddatni tanlang:</h3>

      <div className="plans">
        {plans.map((p) => (
          <label key={p.id} className={selectedPlan.id === p.id ? "plan selected" : "plan"}>
            <input
              type="radio"
              name="plan"
              checked={selectedPlan.id === p.id}
              onChange={() => setSelectedPlan(p)}
            />

            <img src="../src/assets/premium_gif.gif" className="plan-gif" />

            <div className="narx">
              <span>{p.label}</span>
              <span>{formatAmount(p.price)} so'm</span>
            </div>
          </label>
        ))}
      </div>

      <div className="actions">
        <button onClick={() => navigate("/")}>Orqaga</button>
        <button disabled={loadingBuy} onClick={handleCreateOrder}>
          {loadingBuy ? "Yuklanmoqda..." : "Premium olish"}
        </button>
      </div>

      {/* MODAL */}
      {showModal && order && (
        <div className="modal">
          <div className="modal-box">
            <h2>Premium olish jarayoni</h2>

            <p>Kimga: <b>@{(order.username)}</b></p>
            <p>Premium muddati: <b>{formatAmount(order.muddat_oy)} oy</b></p>
            

            <div className="payment-details">
              <div className="payment-info">
                <span>Karta:</span>
                <b>9860 **** **** 1694</b>
                <button onClick={() => copy("9860600435921694")}>Copy</button>
              </div>
              <div className="payment-info">
                <span>Ism/Fam:</span>
                <b>M/Q</b>
                
              </div>

              <div className="payment-info">
                <span>Summasi:</span>
                <b>{formatAmount(order.amount)} so'm</b>
                <button onClick={() => copy(order.amount)}>Copy</button>
              </div>
              <div>
                <p>Diqqat! Aynan (<b>{formatAmount(order.amount)} so'm</b>) summani to'lang! Aks holda to'lovni biz ko'rmay qolamiz </p>
                </div>

              {copied && <p className="copied">Nusxalandi!</p>}
            </div>

            <div className="status">
              
              
              <p>To'lov holati: <b>{paymentStatus.replace("_", " ")}</b></p>
              <p>To'lov<b> {formatTime(countdown)}</b> vaqtdan keyin eskiradi!</p>

              <div className="loader-arc"></div>
                <p>To‘lov kutilmoqda...</p>
              
              {cardLast4 && <p>Karta: **** **** **** {cardLast4}</p>}
              
            </div>

            <button
              onClick={() => {
                stopPolling();
                stopCountdown();
                setShowModal(false);
              }}>
              Bekor qilish
            </button>


          </div>


        </div>
      )}
   
      {/* NAVIGATION */}
      <div className="btn-container">
        <button className="btn-nav" onClick={() => navigate("/")}>Stars</button>
        <button className="btn-nav" onClick={() => navigate("/premium")}>Premium</button>
      </div>

    </div>
  );
}
