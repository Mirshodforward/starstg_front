import React, { useEffect, useState } from "react";


import { useNavigate } from "react-router-dom";
import "./home.css";


export default function Home() {
const CARD_NUMBER = import.meta.env.VITE_CARD_NUMBER;
const CARD_NAME = import.meta.env.VITE_CARD_NAME;
const NARX = parseInt(import.meta.env.VITE_NARX);



  const [backendStatus, setBackendStatus] = useState("");
  const [username, setUsername] = useState("");
  const [stars, setStars] = useState("");
  const [price, setPrice] = useState(0);
 

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("pending");
  const [txId, setTxId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [timer, setTimer] = useState(20);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [countdown, setCountdown] = useState(3600);
  const [intervalId, setIntervalId] = useState(null);
  const navigate = useNavigate();
  
  const goToPremium = () => {
    setShowModal(false);
    navigate("/premium");
  };
  const goToHome = () => {
    setShowModal(false);
    navigate("/");
  };
 

  const formatAmount = (num) =>
    num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // Backend status
  useEffect(() => {
    //fetch("http://localhost:5000/api/status")
    fetch("/api/status")
      .then(res => res.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus("Backend offline ❌"));
  }, []);

  // Stars price
  useEffect(() => {
    const total = stars ? parseInt(stars) * (NARX) : 0;
    setPrice(total);
  }, [stars]);

  // Timer for stars_sent
  useEffect(() => {
    if (status === "stars_sent") {
      const countdown = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            setShowModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [status]);

  // Real-time search (RobynHood API)
  useEffect(() => {
    if (!username) {
      setProfile(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingProfile(true);
        const cleanUsername = username.startsWith("@")
          ? username.slice(1)
          : username;

        //const profileRes = await fetch("http://localhost:5000/api/search", {
        const profileRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUsername }),
        });

        const data = await profileRes.json();
        if (profileRes.ok) setProfile(data);
        else setProfile(null);
      } catch (err) {
        console.error("❌ Profil qidiruv xato:", err);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [username]);

  // Copy card
  const handleCopy = () => {
    navigator.clipboard.writeText(CARD_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy amount
  const handleCopyamount = () => {
    navigator.clipboard.writeText(order?.amount);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1 hour countdown
  const startCountdown = () => {
    setCountdown(3600);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setStatus("expired");
          setShowModal(false);
          alert("⏰ To‘lov muddati tugadi.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  // Check order status
  const checkOrderStatus = async (createdOrder) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          //`http://localhost:5000/api/transactions/${createdOrder.id}`
          `/api/transactions/${createdOrder.id}`
        );
        const data = await res.json();

        if (data.status !== status) setStatus(data.status);

        if (data.status === "stars_sent") {
          clearInterval(interval);
          setTxId(data.transaction_id);
        }

        if (data.status === "expired") {
          clearInterval(interval);
          setShowModal(false);
          alert("❌ To‘lov muddati tugadi.");
        }
      } catch (err) {
        console.error("⚠️ Status olish xato:", err);
      }
    }, 2000);
  };

 
  // 💳 Create order — NOW FULLY CORRECT
const handlePayment = async () => {

  if (stars < 50) {
    alert("Minimum 50 ta yulduz kiritilishi kerak!");
    return;
  }

  if (!username || !stars) {
    alert("Iltimos, username va stars kiriting!");
    return;
  }

  if (!profile || !profile.recipient) {
    alert("Foydalanuvchi topilmadi!");
    return;
  }

    try {
      //const res = await fetch("http://localhost:5000/api/order", {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          recipient: profile.recipient, // <- MUHIM O'ZGARISH
          stars: parseInt(stars),
          amount: price,
        }),
      });

      const newOrder = await res.json();
      setOrder(newOrder);
      setShowModal(true);
      checkOrderStatus(newOrder);
      startCountdown();
    } catch (err) {
      console.error("❌ Order yaratishda xato:", err);
      alert("Order yaratishda xato");
    }
  };

  // Cleanup
  useEffect(() => {
    if (!showModal && intervalId) clearInterval(intervalId);
  }, [showModal]);

  const formatTime = (sec) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="home-container">
      <img
        src="../src/assets/stars.gif"
        alt="stars"
        className="plan-gif"
      />
      <h1>Stars Fast Bot</h1>
      
      <p>{backendStatus}</p>

      {/* Profile */}
      {profile && (
        <div className="profile-preview-small">
          <img
            src={profile.imageUrl || "../src/assets/default_image.png"}
            className="profile-img-small"
          />
          <div className="profile-info">
            <div className="name">{profile.fullName}</div>
            <div className="username">@{profile.username}</div>
          </div>
        </div>
      )}

      {loadingProfile && (
        <div className="loader-arc">
          <div className="loader-arc-1"></div>
          <div className="loader-arc-2">
            <span></span><span></span><span></span>
          </div>
        </div>
      )}
     
      {/* Form */}
      <div className="form-card">
        <div className="input-group">
          <input
            className="tg-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username kiriting"
          />
         <input className="tg-input" type="number" value={stars} onChange={(e) => setStars(e.target.value)} placeholder="Stars miqdori: minimum 50" />


          <p className="price-text">To‘lov summasi: <b>{price}</b> so‘m</p>
        </div>

        <div className="actions">
          <button className="tg-button" onClick={handlePayment}>
            To‘lov qilish
          </button>
        </div>
      </div>

      {/* ---------------- MODAL ---------------- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>To‘lov Jarayoni</h2>

            {profile && (
              <div className="profile-preview-modal">
                <img
                  src={profile.imageUrl || "../src/assets/default_image.png"}
                  className="profile-img-modal"
                />
                <div className="name">{profile.fullName}</div>
                <div className="username">@{profile.username}</div>
              </div>
            )}

            {/* PENDING */}
            {status === "pending" && (
              <div className="pending-section">
                <p><b>⭐ Stars soni:</b> {order?.stars}</p>

                <div className="inline-row">
                  <span className="label">Karta</span>
                  <span className="value">{CARD_NUMBER}</span>

                  <button className="btn-copy" onClick={handleCopy}>Copy</button>
                </div>
                 <div className="inline-row">
                  <span className="label">Karta ismi</span>
                  <span className="value">{CARD_NAME}</span>
                  
                  
                </div>

                <div className="inline-row">
                  <span className="label">To‘lov</span>
                  <span className="value">{formatAmount(order?.amount)} so‘m</span>
                  <button className="btn-copy" onClick={handleCopyamount}>
                    Copy
                  </button>
                </div>

                <p className="hint">
                  💡 Diqqat! Aynan <b>{order?.amount}</b> so‘m to‘lang!
                </p>

                {copied && <span className="copied">Nusxalandi!</span>}

                <p className="countdown-text">
                  To‘lov uchun qolgan vaqt: <b>{formatTime(countdown)}</b>
                </p>

                <div className="loader-arc"></div>
                <p>To‘lov kutilmoqda...</p>

                <button className="tg-button ghost" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
              </div>
            )}

            {/* COMPLETED */}
            {status === "completed" && (
              <div className="sending-section">
                <p className="status-success">To‘lov qilindi✅</p>
                <div className="loader-orbit"></div>
                <p>Stars yuborilmoqda...</p>
              </div>
            )}

            {/* STARS SENT */}
            {status === "stars_sent" && (
              <div className="success-section">
                <p className="success-text">
    		          {order?.stars} ta yulduz <b>@{order?.username}</b> ga yuborildi!
                </p>

                {txId && (
                  <div className="txid-chip">
                    <code>{txId}</code>
                    <button
                      className="btn-copy"
                      onClick={() => navigator.clipboard.writeText(txId)}
                    >
                      Copy
                    </button>
                  </div>
                )}

                <p className="timer">Oyna {timer} soniyada yopiladi</p>
                <button className="tg-button ghost" onClick={() => setShowModal(false)}>
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="btn-container">
        <button className="btn-nav" onClick={goToHome}>Stars</button>
        <button className="btn-nav" onClick={goToPremium}>Premium</button>
      </div>


    </div>
  );
}
