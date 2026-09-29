import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance — Shree Himalaya Basic School",
  description: "Our website is temporarily under maintenance. We'll be back shortly.",
};

export default function MaintenancePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background blobs */}
      <div style={{
        position: "absolute", top: "10%", left: "15%",
        width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "pulse 4s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "15%", right: "10%",
        width: "250px", height: "250px",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "pulse 5s ease-in-out infinite 1s",
      }} />

      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "24px",
        padding: "3rem 2.5rem",
        maxWidth: "520px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Gear Icon */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "90px", height: "90px",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          borderRadius: "50%",
          marginBottom: "1.5rem",
          boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
          animation: "spin 8s linear infinite",
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </div>

        {/* School Logo Text */}
        <p style={{ color: "#93c5fd", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          🏫 Shree Himalaya Basic School
        </p>

        <h1 style={{
          color: "white",
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "0.75rem",
          lineHeight: 1.2,
        }}>
          Under Maintenance
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          We&apos;re currently performing scheduled maintenance to improve your experience. We&apos;ll be back very shortly!
        </p>

        {/* Progress-like divider */}
        <div style={{
          height: "3px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "99px",
          marginBottom: "2rem",
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%",
            width: "60%",
            background: "linear-gradient(90deg, #3b82f6, #6366f1)",
            borderRadius: "99px",
            animation: "progress 3s ease-in-out infinite alternate",
          }} />
        </div>

        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.75rem" }}>
          {[
            { icon: "📍", label: "Location", value: "Bharatpur-11, Chitwan" },
            { icon: "📞", label: "Contact", value: "+977-9855065451" },
            { icon: "📧", label: "Email", value: "himalayabasicschool01@gmail.com" },
            { icon: "🕐", label: "Status", value: "Back soon" },
          ].map((item) => (
            <div key={item.label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "0.75rem",
              textAlign: "left",
            }}>
              <p style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                {item.icon} {item.label}
              </p>
              <p style={{ color: "#e2e8f0", fontSize: "0.78rem", fontWeight: 500, wordBreak: "break-word" }}>{item.value}</p>
            </div>
          ))}
        </div>

        <p style={{ color: "#475569", fontSize: "0.75rem" }}>
          If you are the admin,{" "}
          <a href="/admin/login" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>
            sign in here →
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes progress {
          from { transform: translateX(-40%); }
          to { transform: translateX(40%); }
        }
      `}</style>
    </main>
  );
}
