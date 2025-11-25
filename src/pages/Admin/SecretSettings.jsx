import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

const ADMIN_IDS = [7547827275, 1262947322];

export default function SecretSettings() {
  const [form, setForm] = useState({
    card_number: "",
    card_name: "",
    fragment_api: "",
    telegram_session: "",
    tg_api_id: "",
    tg_api_hash: "",
    bot_token: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [isAdmin, setIsAdmin] = useState(null);

  const navigate = useNavigate();

  const goToPremiumadmin = () => navigate("/premiumadmin");
  const goTostarsadmin = () => navigate("/starsadmin");

  // ============================
  // 1) TELEGRAM ADMIN CHECK
  // ============================
  useEffect(() => {
    try {
      const tg = window.Telegram.WebApp;
      tg.ready();

      const user = tg.initDataUnsafe?.user;
      setIsAdmin(user && ADMIN_IDS.includes(user.id));
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // ============================
  // 2) LOAD SECRET DATA
  // ============================
  useEffect(() => {
    fetch(`/api/admin/secret`)
      .then(async (res) => {
        const data = await res.json();
        setForm(data.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Couldn't load data");
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/secret/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch {
      setSaving(false);
      setError("Failed to save");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <>
      {/* INLINE CSS */}
      <style>{`
        .secret-container { 
          max-width: 440px; 
          margin: 0 auto; 
          padding: 18px; 
          font-family: Inter, sans-serif;
          color: #111;
        }
        .blurred {
          filter: blur(5px);
          pointer-events: none;
          user-select: none;
        }
        .admin-blocker {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 20;
        }
        .admin-block-box {
          background: #fff;
          padding: 25px;
          width: 90%;
          max-width: 380px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        }
        .admin-block-box h2 {
          margin-bottom: 10px;
          color: #c62828;
        }
        .title-small {
          font-size: 15px;
          font-weight: 600;
          color: #0088cc;
          margin-bottom: 10px;
        }
        .admin-nav {
          display: flex;
          gap: 10px;
        }
        .btn-nav1 {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          background: #f4f4f4;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-nav1:hover {
          background: #e3e3e3;
        }
        .title-main {
          font-size: 20px;
          font-weight: 700;
          margin: 20px 0 10px;
        }
        .error-box {
          background: #ffe6e6;
          padding: 10px;
          color: #b00020;
          border-left: 4px solid #b00020;
          border-radius: 8px;
          margin: 10px 0;
        }
        .success-box {
          background: #e6ffe9;
          padding: 10px;
          color: #1b8a32;
          border-left: 4px solid #1b8a32;
          border-radius: 8px;
          margin: 10px 0;
        }
        .form-grid {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .input-group label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 5px;
          display: block;
        }
        .input-group input {
          padding: 12px;
          width: 100%;
          border-radius: 10px;
          border: 1.5px solid #ddd;
          background: #fafafa;
          transition: 0.2s;
          font-size: 14px;
        }
        .input-group input:focus {
          border-color: #0088cc;
          background: #fff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,136,204,0.15);
        }
        .input-group input:disabled {
          background: #e3e3e3;
          border-color: #ccc;
          color: #777;
        }
        .save-btn {
          width: 100%;
          margin-top: 20px;
          padding: 14px;
          background: #0088cc;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: 0.2s;
        }
        .save-btn:disabled {
          background: #8fc7e6;
        }
      `}</style>

      <div className={`secret-container ${isAdmin === false ? "blurred" : ""}`}>
        
        {/* Admin bloklangan ekran */}
        {isAdmin === false && (
          <div className="admin-blocker">
            <div className="admin-block-box">
              <h2>⛔ Ruxsat yo‘q</h2>
              <p>Bu bo‘lim faqat <b>administratorlar</b> uchun.</p>
              <p>Telegram orqali qayta urinib ko‘ring.</p>
            </div>
          </div>
        )}

        <h3 className="title-small">⭐ Admin panel</h3>

        <div className="admin-nav">
          <button className="btn-nav1" onClick={goTostarsadmin}>Stars panel</button>
          <button className="btn-nav1" onClick={goToPremiumadmin}>Premium panel</button>
        </div>

        <h2 className="title-main">🔐 Secret Information Settings</h2>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">Saved successfully ✔</div>}

        <div className="form-grid">
          {Object.keys(form).map((key) => (
            <div className="input-group" key={key}>
              <label>{key.replace(/_/g, " ").toUpperCase()}</label>
              <input
                name={key}
                value={form[key] || ""}
                onChange={handleChange}
                autoComplete="off"
                disabled={!isAdmin}
              />
            </div>
          ))}
        </div>

        <button className="save-btn" disabled={saving || !isAdmin} onClick={save}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </>
  );
}
