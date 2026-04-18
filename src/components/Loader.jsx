// /**
//  * WaitingLoader — Business / CRM "While You Are Waiting" Loader
//  *
//  * Cycles through: Meetings · Attendance · Accounts · Sales
//  * Each step has a unique hand-drawn SVG icon, stat line, and accent color.
//  *
//  * Usage:
//  *   import WaitingLoader from "./WaitingLoader";
//  *   {isLoading && <WaitingLoader />}
//  *
//  * Dependencies:
//  *   npm install framer-motion
//  *   (No Tailwind needed — fully self-contained inline styles)
//  */

// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// // ─── Category data ────────────────────────────────────────────────────────────

// const CATEGORIES = [
//   {
//     label: "Meetings",
//     sub: "This week",
//     stat: "24 scheduled",
//     accent: "#2a6b9a",
//     Icon: MeetingsIcon,
//   },
//   {
//     label: "Attendance",
//     sub: "Present today",
//     stat: "87% on time",
//     accent: "#3a8a5a",
//     Icon: AttendanceIcon,
//   },
//   {
//     label: "Accounts",
//     sub: "Active pipeline",
//     stat: "$1.4M tracked",
//     accent: "#a05c28",
//     Icon: AccountsIcon,
//   },
//   {
//     label: "Sales",
//     sub: "Q2 revenue",
//     stat: "+32% vs last qtr",
//     accent: "#7040a8",
//     Icon: SalesIcon,
//   },
// ];

// const STEP_MS = 2800;

// // ─── Shared SVG draw helpers ──────────────────────────────────────────────────

// function DrawPath({ d, strokeWidth = 1.4, delay = 0, duration = 0.8, draw, ...rest }) {
//   return (
//     <motion.path
//       d={d}
//       stroke="#2c2e38"
//       strokeWidth={strokeWidth}
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       fill="none"
//       initial={{ pathLength: 0, opacity: 0 }}
//       animate={draw ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
//       transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
//       {...rest}
//     />
//   );
// }

// function DrawRect({ x, y, width, height, strokeWidth = 1.2, delay = 0, duration = 0.35, draw }) {
//   const d = `M${x} ${y} L${x + width} ${y} L${x + width} ${y + height} L${x} ${y + height} Z`;
//   return <DrawPath d={d} strokeWidth={strokeWidth} delay={delay} duration={duration} draw={draw} />;
// }

// function DrawCircle({ cx, cy, r, strokeWidth = 1.3, delay = 0, duration = 0.4, draw }) {
//   return (
//     <motion.circle
//       cx={cx} cy={cy} r={r}
//       stroke="#2c2e38"
//       strokeWidth={strokeWidth}
//       fill="none"
//       initial={{ pathLength: 0, opacity: 0 }}
//       animate={draw ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
//       transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
//     />
//   );
// }

// // ─── Icons ────────────────────────────────────────────────────────────────────

// function MeetingsIcon({ draw }) {
//   return (
//     <svg viewBox="0 0 80 72" fill="none" width={80} height={72} style={{ overflow: "visible" }}>
//       <DrawPath d="M14 18 L14 64 L66 64 L66 18 Z" strokeWidth={1.4} delay={0.08} duration={0.80} draw={draw} />
//       <DrawPath d="M14 30 L66 30" strokeWidth={1.4} delay={0.05} duration={0.32} draw={draw} />
//       <DrawPath d="M26 14 L26 22" strokeWidth={1.6} delay={0.06} duration={0.20} draw={draw} />
//       <DrawPath d="M54 14 L54 22" strokeWidth={1.6} delay={0.12} duration={0.20} draw={draw} />
//       <DrawCircle cx={40} cy={47} r={10} strokeWidth={1.3} delay={0.90} duration={0.40} draw={draw} />
//       <DrawPath d="M40 41 L40 47" strokeWidth={1.4} delay={1.15} duration={0.28} draw={draw} />
//       <DrawPath d="M40 47 L45 50" strokeWidth={1.4} delay={1.28} duration={0.22} draw={draw} />
//     </svg>
//   );
// }

// function AttendanceIcon({ draw }) {
//   return (
//     <svg viewBox="0 0 80 72" fill="none" width={80} height={72} style={{ overflow: "visible" }}>
//       <DrawCircle cx={24} cy={22} r={7} strokeWidth={1.3} delay={0.08} duration={0.35} draw={draw} />
//       <DrawPath d="M10 54 Q10 38 24 38 Q38 38 38 54" strokeWidth={1.3} delay={0.38} duration={0.60} draw={draw} />
//       <DrawCircle cx={48} cy={25} r={6} strokeWidth={1.1} delay={0.15} duration={0.30} draw={draw} />
//       <DrawPath d="M36 56 Q36 42 48 42 Q60 42 60 56" strokeWidth={1.1} delay={0.42} duration={0.50} draw={draw} />
//       <DrawPath d="M55 18 L61 25 L72 12" strokeWidth={2.0} delay={1.05} duration={0.40} draw={draw} />
//     </svg>
//   );
// }

// function AccountsIcon({ draw }) {
//   return (
//     <svg viewBox="0 0 80 72" fill="none" width={80} height={72} style={{ overflow: "visible" }}>
//       <DrawPath d="M18 64 L18 20 L62 20 L62 64" strokeWidth={1.4} delay={0.08} duration={0.75} draw={draw} />
//       <DrawPath d="M12 20 L40 10 L68 20" strokeWidth={1.4} delay={0.05} duration={0.42} draw={draw} />
//       <DrawRect x={26} y={28} width={10} height={10} strokeWidth={1.1} delay={0.82} duration={0.26} draw={draw} />
//       <DrawRect x={44} y={28} width={10} height={10} strokeWidth={1.1} delay={0.94} duration={0.26} draw={draw} />
//       <DrawRect x={26} y={44} width={10} height={10} strokeWidth={1.1} delay={1.00} duration={0.26} draw={draw} />
//       <DrawRect x={44} y={44} width={10} height={10} strokeWidth={1.1} delay={1.10} duration={0.26} draw={draw} />
//       <DrawPath d="M34 64 L34 54 Q34 50 40 50 Q46 50 46 54 L46 64" strokeWidth={1.3} delay={1.10} duration={0.38} draw={draw} />
//     </svg>
//   );
// }

// function SalesIcon({ draw }) {
//   return (
//     <svg viewBox="0 0 80 72" fill="none" width={80} height={72} style={{ overflow: "visible" }}>
//       <DrawPath d="M12 64 L12 12" strokeWidth={1.4} delay={0.08} duration={0.50} draw={draw} />
//       <DrawPath d="M12 64 L68 64" strokeWidth={1.4} delay={0.05} duration={0.50} draw={draw} />
//       <DrawRect x={18} y={46} width={12} height={18} strokeWidth={1.3} delay={0.54} duration={0.35} draw={draw} />
//       <DrawRect x={34} y={38} width={12} height={26} strokeWidth={1.3} delay={0.68} duration={0.35} draw={draw} />
//       <DrawRect x={50} y={28} width={12} height={36} strokeWidth={1.3} delay={0.82} duration={0.35} draw={draw} />
//       <DrawPath d="M56 16 L66 6" strokeWidth={1.6} delay={1.10} duration={0.30} draw={draw} />
//       <DrawPath d="M58 6 L66 6 L66 14" strokeWidth={1.6} delay={1.10} duration={0.30} draw={draw} />
//     </svg>
//   );
// }

// // ─── Animation variants ───────────────────────────────────────────────────────

// const flipVariants = {
//   initial: { y: "110%", opacity: 0 },
//   animate: { y: "0%", opacity: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
//   exit: { y: "-110%", opacity: 0, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } },
// };

// const fadeSlideVariants = {
//   initial: { opacity: 0, y: 8 },
//   animate: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.15, ease: "easeOut" } },
//   exit: { opacity: 0, y: -6, transition: { duration: 0.25, ease: "easeIn" } },
// };

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function Loader({ style = {}, className = "" }) {
//   const [index, setIndex] = useState(0);
//   const [drawing, setDrawing] = useState(true);
//   const [barKey, setBarKey] = useState(0);
//   const timerRef = useRef(null);

//   useEffect(() => {
//     setDrawing(true);
//     setBarKey(k => k + 1);

//     timerRef.current = setInterval(() => {
//       setDrawing(false);
//       setTimeout(() => {
//         setIndex(i => (i + 1) % CATEGORIES.length);
//         setDrawing(true);
//         setBarKey(k => k + 1);
//       }, 340);
//     }, STEP_MS);

//     return () => clearInterval(timerRef.current);
//   }, [index]);

//   const cat = CATEGORIES[index];

//   return (
//     <div
//       className={className}
//       style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         minHeight: "100vh",
//         background: "",
//         fontFamily: "Georgia, 'Times New Roman', serif",
//         ...style,
//       }}
//     >
//       <div style={{
//         width: 320,
//         background: "",
//         borderRadius: 4,
//         padding: "36px 36px 28px",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
//       }}>

//         {/* Header */}
//         <p style={{
//           fontFamily: "'Helvetica Neue', Arial, sans-serif",
//           fontSize: 9,
//           fontWeight: 400,
//           letterSpacing: "0.22em",
//           textTransform: "uppercase",
//           color: "#999",
//           marginBottom: 32,
//           alignSelf: "flex-start",
//         }}>
//           While You Are Waiting…
//         </p>

//         {/* Icon */}
//         <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, width: "100%" }}>
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={cat.label}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1, transition: { duration: 0.15 } }}
//               exit={{ opacity: 0, transition: { duration: 0.15 } }}
//             >
//               <cat.Icon draw={drawing} />
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Flip category name */}
//         <div style={{ overflow: "hidden", height: 52, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
//           <AnimatePresence mode="wait">
//             <motion.h2
//               key={cat.label}
//               variants={flipVariants}
//               initial="initial"
//               animate="animate"
//               exit="exit"
//               style={{
//                 fontSize: 42,
//                 fontWeight: 700,
//                 color: "#1a1c22",
//                 letterSpacing: "-0.02em",
//                 lineHeight: 1,
//                 margin: 0,
//                 fontFamily: "Georgia, 'Times New Roman', serif",
//                 fontStyle: "italic",
//               }}
//             >
//               {cat.label}
//             </motion.h2>
//           </AnimatePresence>
//         </div>

//         {/* Stat line */}
//         <div style={{ height: 20, overflow: "hidden", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <AnimatePresence mode="wait">
//             <motion.p
//               key={cat.label + "-stat"}
//               variants={fadeSlideVariants}
//               initial="initial"
//               animate="animate"
//               exit="exit"
//               style={{
//                 fontFamily: "'Helvetica Neue', Arial, sans-serif",
//                 fontSize: 10,
//                 fontWeight: 400,
//                 letterSpacing: "0.1em",
//                 textTransform: "uppercase",
//                 color: "#999",
//                 margin: 0,
//               }}
//             >
//               {cat.sub}&nbsp;&nbsp;
//               <span style={{ color: cat.accent, fontWeight: 600 }}>{cat.stat}</span>
//             </motion.p>
//           </AnimatePresence>
//         </div>

//         {/* Progress bar */}
//         <div style={{ marginTop: 28, width: "100%", height: 2, background: "#dde0e8", borderRadius: 2, overflow: "hidden" }}>
//           <motion.div
//             key={barKey}
//             style={{ height: "100%", background: cat.accent, borderRadius: 2, originX: 0 }}
//             initial={{ scaleX: 0 }}
//             animate={{ scaleX: 1 }}
//             transition={{ duration: (STEP_MS - 400) / 1000, ease: "linear" }}
//           />
//         </div>

//       </div>
//     </div>
//   );
// }

// /*
//  * ─── Customise to your product ────────────────────────────────────────────────
//  *
//  * Swap labels, stats, and accent colors in the CATEGORIES array.
//  * Swap any Icon component to reuse a different SVG drawing.
//  *
//  * ─── Full-page overlay ────────────────────────────────────────────────────────
//  *
//  * {isLoading && (
//  *   <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
//  *     <WaitingLoader />
//  *   </div>
//  * )}
//  *
//  * ─── Inline (no full-screen background) ──────────────────────────────────────
//  *
//  * <WaitingLoader style={{ minHeight: "auto", background: "transparent", padding: "2rem 0" }} />
//  *
//  * ─── Dependency ───────────────────────────────────────────────────────────────
//  *   npm install framer-motion
//  */


const Loader = ({ size = 32, color = "#000", trackColor = "#e5e7eb", thickness = 2.5 }) => (
  <div className="h-screen w-full flex justify-center items-center translucent-inner rounded-xl">
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${thickness}px solid ${trackColor}`,
      borderTopColor: color,
      animation: "spin .8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  </div>
);

export default Loader;

// Usage:
// <Spinner />
// <Spinner size={24} color="#6366f1" />
// <Spinner size={48} color="#10b981" thickness={3} />