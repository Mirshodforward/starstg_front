import React, { useEffect, useMemo, useState } from "react";
import "./AdminPremium.css"; // oddiy CSS

const BASE = "http://localhost:5000";

const API = {
  list: BASE + "/api/admin/premium/list",
  get: (id) => BASE + `/api/admin/premium/get/${id}`,
  update: (id) => BASE + `/api/admin/premium/update/${id}`,
  resend: (id) => BASE + `/api/admin/premium/resend/${id}`,
};


export default function PremiumAdminPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(API.list);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchQuery =
        o.username.includes(query) || String(o.id) === query;
      return matchStatus && matchQuery;
    });
  }, [orders, query, statusFilter]);

  const openDetail = async (id) => {
    setDetailId(id);
    setDetailLoading(true);

    try {
      const res = await fetch(API.get(id));
      const data = await res.json();
      setDetail(data.order);
    } catch (err) {
      console.error("Detail error:", err);
    }

    setDetailLoading(false);
  };

  const updateStatus = async (status) => {
    await fetch(API.update(detailId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
    openDetail(detailId);
  };

  const resendPremium = async () => {
    const res = await fetch(API.resend(detailId), { method: "POST" });
    const data = await res.json();
    alert("Resend natija: " + JSON.stringify(data));
  };

  // quick stats
  const stats = useMemo(() => {
    let s = {
      total: orders.length,
      pending: 0,
      completed: 0,
      premium_sent: 0,
      failed: 0,
      expired: 0,
    };
    orders.forEach((o) => {
      if (s[o.status] !== undefined) s[o.status]++;
    });
    return s;
  }, [orders]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Premium Admin Panel</h2>
        <button className="btn" onClick={fetchOrders}>Yangilash</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="card"><b>Jami:</b> {stats.total}</div>
        <div className="card"><b>Pending:</b> {stats.pending}</div>
        <div className="card"><b>Completed:</b> {stats.completed}</div>
        <div className="card"><b>Sent:</b> {stats.premium_sent}</div>
        <div className="card"><b>Failed:</b> {stats.failed}</div>
        <div className="card"><b>Expired:</b> {stats.expired}</div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          className="input"
          placeholder="Search username or id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">pending</option>
          <option value="completed">completed</option>
          <option value="premium_sent">premium_sent</option>
          <option value="failed">failed</option>
          <option value="expired">expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Amount</th>
                <th>Months</th>
                <th>Status</th>
                <th>TxID</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>@{o.username}</td>
                  <td>{o.amount?.toLocaleString()}</td>
                  <td>{o.muddat_oy}</td>
                  <td>{o.status}</td>
                  <td>{o.transaction_id || "-"}</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    <button className="btn-small" onClick={() => openDetail(o.id)}>
                      OCHISH
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                    Hech narsa yo‘q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {detailId && (
        <div className="modal">
          <div className="modal-body">
            <h3>Order #{detailId}</h3>

            {detailLoading && <p>Yuklanmoqda...</p>}

            {detail && (
              <>
                <p><b>User:</b> @{detail.username}</p>
                <p><b>Amount:</b> {detail.amount}</p>
                <p><b>Months:</b> {detail.muddat_oy}</p>
                <p><b>Status:</b> {detail.status}</p>
                <p><b>TxID:</b> {detail.transaction_id || "-"}</p>
                <p><b>Card:</b> **** {detail.card_last4 || "----"}</p>

                <div className="modal-actions">
                  <button className="btn" onClick={() => updateStatus("premium_sent")}>
                    Mark Sent
                  </button>

                  <button className="btn-red" onClick={() => updateStatus("failed")}>
                    Mark Failed
                  </button>

                  {/* <button className="btn-yellow" onClick={resendPremium}>
                    Resend
                  </button> */}
                </div>
              </>
            )}

            <button className="btn mt" onClick={() => setDetailId(null)}>
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
