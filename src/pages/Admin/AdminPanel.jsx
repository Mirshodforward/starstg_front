import React, { useEffect, useState } from "react";
import "./AdminPanel.css";

export default function AdminPanel() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalStars: 0,
    completed: 0,
    expired: 0,
    pending: 0,
    stars_sent: 0,
    failed: 0,
    error: 0,
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = "/api/transactions/all";
      if (filter !== "all") {
        url = `/api/transactions/status/${filter}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data);

      // --- Statistika hisoblash ---
      const stat = {
        totalStars: 0,
        completed: 0,
        expired: 0,
        pending: 0,
        stars_sent: 0,
        failed: 0,
        error: 0,
      };

      data.forEach((tx) => {
        stat.totalStars += tx.stars;
        if (stat[tx.status] !== undefined) stat[tx.status]++;
      });

      setStats(stat);

    } catch (err) {
      console.error("❌ Transactionlarni olishda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(
        `/api/transactions/update/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (data.success) fetchTransactions();
    } catch (err) {
      console.error("❌ Status update xato:", err);
    }
  };
  // ---------- STARS YUBORISH FUNKSIYASI ----------
  const sendStars = async (id) => {
  try {
    if (!window.confirm("⭐ Ushbu buyurtmaga stars yuborilsinmi?")) return;

    const res = await fetch(`/api/admin/stars/send/${id}`, {
      method: "POST",
    });

    const data = await res.json();

    if (data.success) {
      alert("🌟 Stars yuborildi!");
      fetchTransactions();
    } else {
      alert("❌ Xato: " + data.error);
    }

  } catch (err) {
    console.error("❌ Stars yuborishda xato:", err);
    alert("Server xato!");
  }
};

  const filteredTransactions = transactions.filter((tx) => {
    const s = search.toLowerCase();
    return (
      tx.username.toLowerCase().includes(s) ||
      tx.recipient?.toLowerCase().includes(s) ||
      tx.id.toString().includes(s)
    );
  });

  return (
    <div className="admin-panel">
      <h1 className="panel-title">Admin Panel</h1>

      {/* ---------- STAT CARDS ---------- */}
      <div className="stats-container">
        <div className="stat-card total">
          <p>Total Stars</p>
          <h3>{stats.totalStars}</h3>
        </div>
        <div className="stat-card completed">
          <p>Completed</p>
          <h3>{stats.completed}</h3>
        </div>
        <div className="stat-card pending">
          <p>Pending</p>
          <h3>{stats.pending}</h3>
        </div>
        <div className="stat-card sent">
          <p>Stars Sent</p>
          <h3>{stats.stars_sent}</h3>
        </div>
        <div className="stat-card expired">
          <p>Expired</p>
          <h3>{stats.expired}</h3>
        </div>
        <div className="stat-card error">
          <p>Error</p>
          <h3>{stats.error}</h3>
        </div>
        <div className="stat-card failed">
          <p>Failed</p>
          <h3>{stats.failed}</h3>
        </div>
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="filter-controls">
        <input
          type="text"
          placeholder="🔍 Search username, ID yoki recipient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="stars_sent">Stars Sent</option>
          <option value="failed">Failed</option>
          <option value="error">Error</option>
        </select>

        <button className="refresh-btn" onClick={fetchTransactions}>
          🔄 Refresh
        </button>
      </div>

      {/* ---------- TABLE ---------- */}
      {loading ? (
        <div className="loader">⏳ Loading...</div>
      ) : (
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Recipient ID</th>
                <th>Stars</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className={`status-${tx.status}`}>
                  <td>{tx.id}</td>
                  <td>@{tx.username}</td>
                  <td className="recipient-cell">
                    <code>{tx.recipient || "-"}</code>
                  </td>
                  <td>{tx.stars}</td>
                  <td>{tx.amount} so‘m</td>
                  <td className={`status-text ${tx.status}`}>{tx.status}</td>
                  <td>{tx.transaction_id || "-"}</td>
                  <td>{new Date(tx.created_at).toLocaleString()}</td>

                  <td>
  <div className="action-buttons">

    {tx.status === "pending" && (
      <button
        className="btn send-stars"
        onClick={() => sendStars(tx.id)}
      >
        🌟 Send Stars
      </button>
    )}

    <button
      className="btn complete"
      onClick={() => updateStatus(tx.id, "completed")}
    >
      ✅ Complete
    </button>

    <button
      className="btn expire"
      onClick={() => updateStatus(tx.id, "expired")}
    >
      ❌ Expire
    </button>

    <button
      className="btn fail"
      onClick={() => updateStatus(tx.id, "failed")}
    >
      ⚠️ Fail
    </button>

  </div>
</td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}
