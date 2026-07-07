// "use client";

// import { WalletAuth } from "@/components/wallet-auth";
// import { useState } from "react";

// export function LandingPage() {
//   const [showAuth, setShowAuth] = useState(false);

//   return (
//     <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#FAFAFA", fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      
//       {/* Nav */}
//       <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1A1A1A" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18 }}>
//           <div style={{ width: 32, height: 32, background: "#22C55E", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤝</div>
//           Trust Me Bro
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//           <span style={{ background: "#1A1A1A", border: "1px solid #22C55E33", color: "#22C55E", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500 }}>
//             <span style={{ width: 6, height: 6, background: "#22C55E", borderRadius: "50%", display: "inline-block", marginRight: 6 }} />
//             Coming Soon
//           </span>
//           <button
//             onClick={() => setShowAuth(true)}
//             style={{ background: "#22C55E", color: "#000", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}
//           >
//             Connect Wallet →
//           </button>
//         </div>
//       </nav>

//       {/* Hero */}
//       <section style={{ maxWidth: 860, margin: "0 auto", padding: "100px 40px 60px", textAlign: "center" }}>
//         <p style={{ color: "#22C55E", fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>
//           Built on Solana
//         </p>
//         <h1 style={{ fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 12 }}>
//           "Trust me bro."<br />
//           <span style={{ color: "#22C55E" }}>Now you actually can.</span>
//         </h1>
//         <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "#71717A", margin: "20px auto 40px", maxWidth: 480, lineHeight: 1.6 }}>
//           Create transparent loan agreements with people you trust. Every deal recorded on blockchain. No awkwardness, no forgotten debts.
//         </p>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
//           <button
//             onClick={() => setShowAuth(true)}
//             style={{ background: "#22C55E", color: "#000", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}
//           >
//             Connect Wallet →
//           </button>
//           <button
//             style={{ background: "transparent", color: "#FAFAFA", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 500, border: "1px solid #2A2A2A", cursor: "pointer" }}
//           >
//             See how it works
//           </button>
//         </div>
//         <p style={{ marginTop: 16, fontSize: 12, color: "#3F3F46" }}>🚧 Launching on Solana Mainnet soon</p>
//       </section>

//       {/* App Preview Mockup */}
//       <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px" }}>
//         <div style={{ background: "#111111", border: "1px solid #1F1F1F", borderRadius: 16, overflow: "hidden" }}>
//           <div style={{ background: "#0D0D0D", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #1A1A1A" }}>
//             <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
//             <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
//             <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
//             <span style={{ marginLeft: 8, fontSize: 12, color: "#3F3F46" }}>app.trustmebro.xyz</span>
//           </div>
//           <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//             {/* Trust Score */}
//             <div style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 10, padding: 16 }}>
//               <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#3F3F46", marginBottom: 8 }}>Trust Score</div>
//               <div style={{ fontSize: 42, fontWeight: 800, color: "#22C55E", lineHeight: 1 }}>87</div>
//               <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 600, marginTop: 4 }}>Reliable</div>
//               <div style={{ marginTop: 12, height: 4, background: "#1A1A1A", borderRadius: 2 }}>
//                 <div style={{ height: 4, width: "87%", background: "#22C55E", borderRadius: 2 }} />
//               </div>
//               <div style={{ marginTop: 8, fontSize: 11, color: "#3F3F46" }}>12 agreements completed</div>
//             </div>
//             {/* Agreements */}
//             <div style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 10, padding: 16 }}>
//               <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#3F3F46", marginBottom: 12 }}>My Agreements</div>
//               <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                 <div>
//                   <div style={{ fontSize: 20, fontWeight: 700 }}>₹5,000</div>
//                   <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>↗ Lent to Aman</div>
//                 </div>
//                 <span style={{ background: "#451A03", color: "#F59E0B", fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>Pending</span>
//               </div>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                 <div>
//                   <div style={{ fontSize: 20, fontWeight: 700 }}>₹2,500</div>
//                   <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>↙ Borrowed from Farid</div>
//                 </div>
//                 <span style={{ background: "#052E16", color: "#22C55E", fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>Repaid</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Features */}
//       <div style={{ maxWidth: 900, margin: "80px auto", padding: "0 40px" }}>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
//           {[
//             { icon: "🔗", title: "Blockchain proof", desc: "Every agreement recorded on Solana. Immutable, transparent, verifiable by anyone." },
//             { icon: "⭐", title: "Trust Score", desc: "Build a portable reputation based on how reliably you repay — not your salary." },
//             { icon: "📨", title: "Invite by link", desc: "Send a link to anyone. They connect their wallet and accept in one tap." },
//             { icon: "🤖", title: "AI insights", desc: "Understand exactly why your Trust Score changed with plain English explanations." },
//             { icon: "🔒", title: "Private by default", desc: "Only you and the other party see your agreements. No banks, no middlemen." },
//             { icon: "⚡", title: "30 seconds", desc: "Create a binding agreement faster than explaining the terms verbally." },
//           ].map((f) => (
//             <div key={f.title} style={{ background: "#111111", border: "1px solid #1F1F1F", borderRadius: 12, padding: 24 }}>
//               <div style={{ fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
//               <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
//               <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.6 }}>{f.desc}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Stats */}
//       <div style={{ maxWidth: 860, margin: "0 auto 80px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#1F1F1F", border: "1px solid #1F1F1F", borderRadius: 12, overflow: "hidden" }}>
//         {[
//           { num: "₹0", label: "Platform fees" },
//           { num: "~0.00008 SOL", label: "Per agreement" },
//           { num: "<400ms", label: "Solana confirmation" },
//         ].map((s) => (
//           <div key={s.label} style={{ background: "#111111", padding: 28, textAlign: "center" }}>
//             <div style={{ fontSize: 28, fontWeight: 800 }}>{s.num}</div>
//             <div style={{ fontSize: 12, color: "#71717A", marginTop: 4 }}>{s.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* Bottom CTA */}
//       <div style={{ textAlign: "center", padding: "80px 40px", borderTop: "1px solid #1A1A1A" }}>
//         <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 100, padding: "6px 14px", fontSize: 12, color: "#71717A", marginBottom: 32 }}>
//           ◎ Powered by Solana
//         </div>
//         <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
//           "Bhai kal de dunga"<br />ends here.
//         </h2>
//         <p style={{ color: "#71717A", fontSize: 15, marginBottom: 32 }}>
//           Join the waitlist. Be the first to build trust on-chain.
//         </p>
//         <button
//           onClick={() => setShowAuth(true)}
//           style={{ background: "#22C55E", color: "#000", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}
//         >
//           Connect Wallet →
//         </button>
//       </div>

//       {/* Footer */}
//       <footer style={{ padding: "24px 40px", borderTop: "1px solid #1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
//           🤝 Trust Me Bro
//         </div>
//         <div style={{ display: "flex", gap: 20 }}>
//           {["Twitter/X", "GitHub", "Solana Explorer"].map((l) => (
//             <a key={l} href="#" style={{ fontSize: 13, color: "#3F3F46", textDecoration: "none" }}>{l}</a>
//           ))}
//         </div>
//         <span style={{ fontSize: 12, color: "#3F3F46" }}>© 2026 Trust Me Bro</span>
//       </footer>

//       {/* Auth Modal */}
//       {showAuth && (
//         <div
//           onClick={() => setShowAuth(false)}
//           style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
//         >
//           <div onClick={(e) => e.stopPropagation()}>
//             <WalletAuth />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }