import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Activity as ActivityIcon, 
  Wallet, 
  MonitorPlay,
  Cloud,
  LogOut,
  Plus,
  Download,
  Search,
  Calculator
} from "lucide-react";
import { useFinanceData } from "./store";
import { loginWithGoogle, logout } from "./firebase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = {
  bg: "#0A0E1A",
  surface: "#111827",
  card: "#151E2D",
  border: "#1E2D45",
  accent: "#00D4AA",
  accentDim: "#00D4AA22",
  accentSoft: "#00D4AA44",
  gold: "#F5A623",
  goldDim: "#F5A62322",
  red: "#FF4D6D",
  redDim: "#FF4D6D22",
  blue: "#3B82F6",
  blueDim: "#3B82F622",
  text: "#E8F0FE",
  textMid: "#8A9BB8",
  textDim: "#4A5568",
};

const NAV = [
  { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { id: "transactions", icon: <ArrowLeftRight size={18} />, label: "Transações" },
  { id: "history", icon: <ActivityIcon size={18} />, label: "Histórico" },
  { id: "cashflow", icon: <Wallet size={18} />, label: "Fluxo de Caixa" },
  { id: "budgets", icon: <Wallet size={18} />, label: "Orçamentos" },
  { id: "simulator", icon: <Calculator size={18} />, label: "Calculadora" },
];

function Checkbox({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <div 
      onClick={onChange}
      style={{
        width: 18, height: 18, borderRadius: 6,
        border: `1.5px solid ${checked ? COLORS.accent : COLORS.textMid}`,
        background: checked ? COLORS.accent : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      <motion.svg
        initial={false}
        animate={checked ? "checked" : "unchecked"}
        variants={{ checked: { opacity: 1, scale: 1 }, unchecked: { opacity: 0, scale: 0.5 } }}
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.bg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      >
        <motion.polyline
          points="20 6 9 17 4 12"
          variants={{ checked: { pathLength: 1 }, unchecked: { pathLength: 0 } }}
          transition={{ duration: 0.3 }}
        />
      </motion.svg>
    </div>
  );
}

function Sparkline({ data, color, width = 100, height = 36 }: any) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v: number, i: number) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const area = `M ${pts[0]} L ${pts.join(" L ")} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color})`} />
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data }: any) {
  if (data.length === 0) return <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMid, fontSize: 12 }}>Sem dados de fluxo</div>;
  const maxVal = Math.max(1, ...data.flatMap((d: any) => [d.income, d.expense]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, padding: "0 4px" }}>
      {data.map((d: any, i: number) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 110 }}>
            <div
              style={{
                width: 10,
                height: `${(d.income / maxVal) * 110}px`,
                background: `linear-gradient(to top, ${COLORS.accent}, ${COLORS.accent}88)`,
                borderRadius: "3px 3px 0 0",
                transition: "height 0.8s cubic-bezier(.4,0,.2,1)",
              }}
            />
            <div
              style={{
                width: 10,
                height: `${(d.expense / maxVal) * 110}px`,
                background: `linear-gradient(to top, ${COLORS.red}, ${COLORS.red}88)`,
                borderRadius: "3px 3px 0 0",
                transition: "height 0.8s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: "monospace" }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function LineChartSVG({ data, color }: any) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d: any) => d.value));
  const min = Math.min(0, ...data.map((d: any) => d.value));
  const range = max - min || 1;

  const pts = data.map((d: any, i: number) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 90 - 5;
    return `${x},${y}`;
  });

  const path = `M ${pts.join(" L ")}`;
  const area = `M ${pts[0].split(',')[0]} 100 L ${pts[0]} L ${pts.join(" L ")} L ${pts[pts.length-1].split(',')[0]} 100 Z`;

  return (
    <div style={{ width: "100%", height: 110, position: "relative" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`lgrad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#lgrad-${color.replace('#','')})`} />
        <path d={path} stroke={color} strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function DonutChart({ data, size = 120 }: any) {
  if (data.length === 0) return <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMid, fontSize: 12 }}>Sem dados</div>;
  const cx = size / 2, cy = size / 2, r = size * 0.38, sw = size * 0.13;
  const total = data.reduce((s: number, d: any) => s + d.value, 0);
  let angle = -90;
  const slices = data.map((d: any) => {
    const pct = d.value / total;
    const start = angle;
    angle += pct * 360;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(start));
    const y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(angle - 0.5));
    const y2 = cy + r * Math.sin(rad(angle - 0.5));
    const lg = pct > 0.5 ? 1 : 0;
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2}`, pct };
  });
  return (
    <svg width={size} height={size}>
      {slices.map((s: any, i: number) => (
        <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={sw} strokeLinecap="butt" opacity={0.9} />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={COLORS.text} fontSize={11} fontWeight="700">
        {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={COLORS.textMid} fontSize={9}>
        total/mês
      </text>
    </svg>
  );
}

function HealthArc({ score }: any) {
  const r = 52, cx = 64, cy = 64, sw = 10;
  const circ = Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? COLORS.accent : score >= 40 ? COLORS.gold : COLORS.red;
  return (
    <svg width={128} height={80} viewBox="0 0 128 90">
      <path d={`M 12,76 A ${r} ${r} 0 0 1 116,76`} fill="none" stroke={COLORS.border} strokeWidth={sw} strokeLinecap="round" />
      <path
        d={`M 12,76 A ${r} ${r} 0 0 1 116,76`}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <text x={64} y={72} textAnchor="middle" fill={color} fontSize={22} fontWeight="800">{score.toFixed(0)}</text>
      <text x={64} y={86} textAnchor="middle" fill={COLORS.textMid} fontSize={9}>Índice de Saúde</text>
    </svg>
  );
}

function Sidebar({ active, onNav, collapsed, user }: any) {
  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        minHeight: "100vh",
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      <div style={{ padding: "0 20px 32px", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accent}, #00A882)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 900,
            color: "#0A0E1A",
            flexShrink: 0,
          }}
        >
          ER
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>
              EconRational
            </div>
            <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>Finance OS</div>
          </motion.div>
        )}
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: active === n.id ? COLORS.accentDim : "transparent",
              borderLeft: active === n.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              color: active === n.id ? COLORS.accent : COLORS.textMid,
              fontSize: 13,
              fontWeight: active === n.id ? 700 : 500,
              textAlign: "left",
              width: "100%",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ flexShrink: 0, display: "flex" }}>{n.icon}</span>
            {!collapsed && n.label}
          </button>
        ))}
      </nav>

      {user && (
        <div
          style={{
            margin: "16px 10px 0",
            padding: "12px",
            borderRadius: 10,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.accent}44, ${COLORS.blue}44)`,
              border: `1.5px solid ${COLORS.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: COLORS.accent, flexShrink: 0,
              overflow: "hidden"
            }}
          >
            {user.photoURL ? <img src={user.photoURL} alt="Avatar" width="34" height="34" /> : user.email?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.displayName || "Usuário"}</div>
              <div style={{ fontSize: 10, color: COLORS.accent, whiteSpace: "nowrap", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }} onClick={logout}>
                <LogOut size={10} /> Sair
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function KPI({ label, value, sub, color, sparkData, prefix = "R$" }: any) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
      <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {label}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 2 }}>{prefix}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
            {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {sub && <div style={{ fontSize: 10, color }}>{sub}</div>}
        </div>
        {sparkData && sparkData.length > 0 && <Sparkline data={sparkData} color={color} />}
      </div>
    </div>
  );
}

function AlertBadge({ alert }: any) {
  const cfg = {
    warning: { color: COLORS.gold, icon: "⚠" },
    success: { color: COLORS.accent, icon: "✓" },
    info: { color: COLORS.blue, icon: "ℹ" },
  }[alert.type as keyof typeof alert.type] || { color: COLORS.textMid, icon: "-" };
  
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 8,
        background: `${cfg.color}11`,
        border: `1px solid ${cfg.color}33`,
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: cfg.color, fontSize: 13, marginTop: 1 }}>{cfg.icon}</span>
      <span style={{ fontSize: 12, color: COLORS.textMid, lineHeight: 1.5 }}>{alert.msg}</span>
    </div>
  );
}

function DashboardPage({ store }: any) {
  const { transactions, goal, budgets, updateGoal } = store;
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(goal?.monthlySavingsGoal?.toString() || "3000");
  const [planningMode, setPlanningMode] = useState(false);

  const stats = useMemo(() => {
    let inc = 0, exp = 0;
    const catMap: Record<string, number> = {};
    const monthlyMap: Record<string, {income: number, expense: number}> = {};

    transactions.forEach((t: any) => {
      const monthStr = t.date.split('/')[1] || "01";
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { income: 0, expense: 0 };

      if (t.type === 'income') {
        inc += t.amount;
        monthlyMap[monthStr].income += t.amount;
      } else {
        exp += t.amount;
        monthlyMap[monthStr].expense += t.amount;
        catMap[t.cat] = (catMap[t.cat] || 0) + t.amount;
      }
    });

    const balance = inc - exp;
    const savings = inc > 0 ? (inc - exp) : 0;
    const health = inc > 0 ? Math.min(100, Math.max(0, (savings / inc) * 100 * 2)) : 50;

    const catColors = [COLORS.blue, COLORS.accent, COLORS.gold, "#A78BFA", "#FB923C", COLORS.textDim];
    const expenses_breakdown = Object.entries(catMap).map(([label, value], i) => ({
      label, value: value as number, pct: Math.round(((value as number) / (exp || 1)) * 100), color: catColors[i % catColors.length]
    })).sort((a,b) => b.value - a.value).slice(0, 5);

    const sortedMonths = Object.keys(monthlyMap).sort();
    const cashflow = sortedMonths.map((month) => ({ month: `Mês ${month}`, ...monthlyMap[month] }));

    let cumulative = 0;
    const netWorthEvolution = sortedMonths.map(month => {
      cumulative += monthlyMap[month].income - monthlyMap[month].expense;
      return { month: `Mês ${month}`, value: cumulative };
    }).slice(-6);

    // Projeted expenses based on budgets
    let projectedExpenses = exp;
    if (budgets && budgets.length > 0) {
      projectedExpenses = budgets.reduce((total: number, b: any) => total + b.limit, 0);
    }
    const projectedBalance = inc - projectedExpenses;
    const projectedSavings = inc > 0 ? (inc - projectedExpenses) : 0;

    return { income: inc, expenses: exp, balance, savings, health, expenses_breakdown, cashflow, netWorthEvolution, projectedExpenses, projectedBalance, projectedSavings };
  }, [transactions, budgets]);

  const incomeData = stats.cashflow.map((d: any) => d.income);
  const expData = stats.cashflow.map((d: any) => d.expense);

  const currentGoal = goal ? goal.monthlySavingsGoal : 3000;
  
  const displayBalance = planningMode ? stats.projectedBalance : stats.balance;
  const displayExpenses = planningMode ? stats.projectedExpenses : stats.expenses;
  const displaySavings = planningMode ? stats.projectedSavings : stats.savings;
  
  const goalProgress = currentGoal > 0 ? Math.min(100, Math.max(0, (displaySavings / currentGoal) * 100)) : 0;
  const goalColor = goalProgress >= 100 ? COLORS.accent : goalProgress >= 50 ? COLORS.gold : COLORS.red;

  const handleSaveGoal = () => {
    updateGoal(Number(goalInput) || 3000);
    setIsEditingGoal(false);
  };

  const handleDownloadCSV = () => {
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentMonthTxs = transactions.filter((t: any) => {
      const month = t.date.split('/')[1];
      return month === mm;
    });
    
    const header = ["Data", "Descrição", "Categoria", "Tipo", "Valor"].join(",");
    const rows = currentMonthTxs.map((t: any) => {
      const desc = t.desc ? t.desc.replace(/"/g, '""') : "";
      return `${t.date},"${desc}","${t.cat}",${t.type === 'income' ? 'Receita' : 'Despesa'},${t.amount}`
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_mes_${mm}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById("dashboard-content");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: COLORS.bg });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("relatorio_dashboard.pdf");
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  return (
    <div id="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: 22, padding: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Resumo Geral</div>
            <div 
              onClick={() => setPlanningMode(!planningMode)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: planningMode ? COLORS.accentDim : COLORS.surface, 
                border: `1px solid ${planningMode ? COLORS.accent : COLORS.border}`, borderRadius: 20, padding: "4px 10px", 
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
               <div style={{ width: 8, height: 8, borderRadius: "50%", background: planningMode ? COLORS.accent : COLORS.textDim }} />
               <span style={{ fontSize: 11, fontWeight: 600, color: planningMode ? COLORS.accent : COLORS.textMid }}>
                  Modo Planejamento {planningMode ? "ON" : "OFF"}
               </span>
            </div>
         </div>
         <div style={{ display: "flex", gap: 10 }}>
           <button 
             onClick={handleDownloadCSV} 
             style={{ 
               background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text, 
               padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", 
               display: "flex", alignItems: "center", gap: 8 
             }}
           >
              <Download size={14} /> CSV
           </button>
           <button 
             onClick={handleDownloadPDF} 
             style={{ 
               background: COLORS.accent, border: "none", color: COLORS.bg, 
               padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", 
               display: "flex", alignItems: "center", gap: 8 
             }}
           >
              <Download size={14} /> PDF
           </button>
         </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <KPI label={planningMode ? "Patrimônio Projetado" : "Patrimônio Líquido"} value={displayBalance} color={COLORS.accent} />
        <KPI label="Receitas Totais" value={stats.income} color={COLORS.blue} sparkData={incomeData} />
        <KPI label={planningMode ? "Despesas Orçadas" : "Despesas Totais"} value={displayExpenses} color={COLORS.red} sparkData={planningMode ? undefined : expData} />
        <KPI label={planningMode ? "Poupança Projetada" : "Poupança Líquida"} value={displaySavings} color={COLORS.gold} />
      </div>
      
      {/* Meta de Poupança */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
           <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
             Meta de Poupança (Mês Atual)
           </div>
           {isEditingGoal ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                 <input 
                   type="number" 
                   value={goalInput} 
                   onChange={(e) => setGoalInput(e.target.value)} 
                   style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "4px 8px", borderRadius: 4, color: COLORS.text, fontSize: 12, width: 90 }}
                 />
                 <button onClick={handleSaveGoal} style={{ background: COLORS.accent, color: COLORS.bg, border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
              </div>
           ) : (
              <button 
                onClick={() => { setGoalInput(currentGoal.toString()); setIsEditingGoal(true); }}
                style={{ background: "transparent", color: COLORS.textMid, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
              >
                Editar Meta
              </button>
           )}
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
           <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
                 R$ {displaySavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMid }}>
                 de R$ {currentGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} {planningMode && "(Projetado)"}
              </div>
           </div>
           <div style={{ fontSize: 14, fontWeight: 700, color: goalColor }}>
             {goalProgress.toFixed(1)}% {planningMode ? "projetado" : "atingido"}
           </div>
        </div>

        <div style={{ width: "100%", height: 8, borderRadius: 4, background: COLORS.surface, overflow: "hidden" }}>
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${goalProgress}%` }}
             transition={{ duration: 1, ease: "easeOut" }}
             style={{ height: "100%", background: goalColor, borderRadius: 4 }}
           />
        </div>
      </div>

      {/* Evolução de Patrimônio */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px" }}>
        <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
           Evolução do Patrimônio (Últimos 6 Meses)
        </div>
        {stats.netWorthEvolution.length === 0 ? (
          <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMid, fontSize: 12 }}>Sem dados de evolução</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
                 R$ {stats.netWorthEvolution[stats.netWorthEvolution.length - 1].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <LineChartSVG data={stats.netWorthEvolution} color={COLORS.blue} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              {stats.netWorthEvolution.map((d: any, i: number) => (
                <span key={i} style={{ fontSize: 10, color: COLORS.textDim, fontFamily: "monospace" }}>{d.month}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-start", fontFamily: "'DM Mono', monospace" }}>Saúde Financeira</div>
          <HealthArc score={stats.health} />
          <div style={{ fontSize: 11, color: COLORS.textMid, textAlign: "center" }}>
            Resumo de economia atual.
          </div>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>Fluxo de Caixa</div>
          <BarChart data={stats.cashflow} />
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: COLORS.textMid }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.accent }} /> Receita
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: COLORS.textMid }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.red }} /> Despesa
            </div>
          </div>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>Despesas por Categoria</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <DonutChart data={stats.expenses_breakdown} size={120} />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
              {stats.expenses_breakdown.map((d: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }} />
                    <span style={{ fontSize: 10, color: COLORS.textMid }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 10, color: COLORS.text, fontFamily: "monospace" }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionsPage({ store }: any) {
  const { transactions, addTransaction } = store;
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({ desc: "", type: "expense", amount: "", cat: "Geral", date: new Date().toLocaleDateString('pt-BR').substring(0,5) });

  const categories = ["all", ...Array.from(new Set(transactions.map((t: any) => t.cat)))];

  const filtered = transactions.filter((t: any) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCat !== "all" && t.cat !== filterCat) return false;
    if (searchTerm) {
      const matchSearch = t.desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.cat.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t: any) => t.id));
    }
  };

  const handleAdd = async () => {
    if (!newTx.desc || !newTx.amount) return;
    await addTransaction({
      desc: newTx.desc,
      type: newTx.type as "income" | "expense",
      amount: parseFloat(newTx.amount),
      cat: newTx.cat,
      date: newTx.date
    });
    setNewTx({ desc: "", type: "expense", amount: "", cat: "Geral", date: new Date().toLocaleDateString('pt-BR').substring(0,5) });
    setIsAdding(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters and Add */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", minWidth: 200, flex: 1, maxWidth: 300 }}>
             <Search size={16} color={COLORS.textMid} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
             <input 
               type="text"
               placeholder="Buscar transações..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               style={{ 
                 background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                 padding: "8px 12px 8px 34px", color: COLORS.text, fontSize: 13, width: "100%", outline: "none"
               }}
             />
          </div>

          <div style={{ display: "flex", gap: 6, background: COLORS.card, padding: 6, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            {["all", "income", "expense"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  background: filterType === f ? COLORS.surface : "transparent",
                  color: filterType === f ? COLORS.text : COLORS.textMid,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  boxShadow: filterType === f ? `0 2px 8px rgba(0,0,0,0.2)` : 'none',
                  transition: "all 0.2s"
                }}
              >
                {{ all: "Todas", income: "Receitas", expense: "Despesas" }[f as string]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, background: COLORS.card, padding: 6, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflowX: "auto", maxWidth: 400 }}>
            {categories.map((c: any) => (
              <button
                key={c as string}
                onClick={() => setFilterCat(c as string)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  background: filterCat === c ? COLORS.accentDim : "transparent",
                  color: filterCat === c ? COLORS.accent : COLORS.textMid,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s", whiteSpace: "nowrap"
                }}
              >
                {c === "all" ? "Todas Categorias" : c}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ background: COLORS.accent, color: COLORS.bg, border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {isAdding && (
         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px", display: "flex", gap: 14, alignItems: "flex-end" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
               <label style={{ fontSize: 11, color: COLORS.textMid }}>Descrição</label>
               <input value={newTx.desc} onChange={e => setNewTx({...newTx, desc: e.target.value})} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, color: COLORS.text, fontSize: 13 }} placeholder="Ex: Supermercado" />
            </div>
            <div style={{ width: 120, display: "flex", flexDirection: "column", gap: 6 }}>
               <label style={{ fontSize: 11, color: COLORS.textMid }}>Valor (R$)</label>
               <input type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, color: COLORS.text, fontSize: 13 }} placeholder="0.00" />
            </div>
            <div style={{ width: 140, display: "flex", flexDirection: "column", gap: 6 }}>
               <label style={{ fontSize: 11, color: COLORS.textMid }}>Categoria</label>
               <input value={newTx.cat} onChange={e => setNewTx({...newTx, cat: e.target.value})} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, color: COLORS.text, fontSize: 13 }} placeholder="Cat" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
               <label style={{ fontSize: 11, color: COLORS.textMid }}>Tipo</label>
               <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, color: COLORS.text, fontSize: 13 }}>
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
               </select>
            </div>
            <button onClick={handleAdd} style={{ background: COLORS.blue, color: "white", padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700 }}>Salvar</button>
         </motion.div>
      )}

      {/* Tabela de Transações */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ 
          display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 11, color: COLORS.textMid, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, gap: 14
        }}>
           <Checkbox checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={toggleAll} />
           <div style={{ flex: 1 }}>Descrição / Transação</div>
           <div style={{ width: 140, textAlign: "right" }}>Valor R$</div>
        </div>

        <AnimatePresence>
          {filtered.map((t: any, i: number) => (
            <motion.div
              layout
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, padding: 0 }}
              style={{
                display: "flex", alignItems: "center", padding: "14px 20px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none",
                gap: 14,
                background: selectedIds.includes(t.id) ? COLORS.accentSoft : "transparent",
                transition: "background 0.2s"
              }}
            >
              <Checkbox checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} />
              
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: COLORS.textMid, fontFamily: "'DM Mono', monospace" }}>{t.date} • {t.cat}</div>
              </div>

              <div style={{ 
                fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace",
                color: t.type === 'income' ? COLORS.accent : COLORS.text 
              }}>
                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               style={{ padding: 40, textAlign: "center", color: COLORS.textMid, fontSize: 13 }}
             >
               Nenhuma transação encontrada. Adicione uma no botão acima.
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HistoryPage({ store }: any) {
  const { activities } = store;

  const getIcon = (type: string) => {
    switch (type) {
      case "system": return COLORS.blue;
      case "alert": return COLORS.gold;
      case "income": return COLORS.accent;
      case "success": return COLORS.accent;
      default: return COLORS.textMid;
    }
  };

  if(!activities || activities.length === 0) {
    return <div style={{ color: COLORS.textMid, fontSize: 14 }}>Nenhum histórico disponível.</div>;
  }

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column" }}>
       <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "28px" }}>
          <div style={{ position: "relative" }}>
             <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: COLORS.border }} />

             {activities.map((act: any, i: number) => (
                <motion.div 
                  key={act.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: "flex", gap: 18, marginBottom: i === activities.length - 1 ? 0 : 28, position: "relative", zIndex: 1 }}
                >
                   <div style={{ 
                     width: 32, height: 32, borderRadius: "50%", background: COLORS.surface, 
                     border: `2px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                   }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: getIcon(act.type), boxShadow: `0 0 10px ${getIcon(act.type)}` }} />
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{act.action}</div>
                      <div style={{ fontSize: 13, color: COLORS.textMid, marginTop: 4 }}>{act.sub}</div>
                      <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8, fontFamily: "'DM Mono', monospace" }}>{act.time}</div>
                   </div>
                </motion.div>
             ))}
          </div>
       </div>
    </div>
  );
}

function SimulatorPage() {
  const [initial, setInitial] = useState<string>("1000");
  const [monthly, setMonthly] = useState<string>("500");
  const [rate, setRate] = useState<string>("10");
  const [years, setYears] = useState<string>("10");
  
  // ROI States
  const [roiInitial, setRoiInitial] = useState<string>("10000");
  const [roiFinal, setRoiFinal] = useState<string>("12500");
  
  const initialNum = Number(initial) || 0;
  const monthlyNum = Number(monthly) || 0;
  const rateNum = Number(rate) || 0;
  const yearsNum = Number(years) || 0;
  
  const monthlyRate = rateNum / 100 / 12;
  const totalMonths = yearsNum * 12;
  
  let totalSaved = initialNum + (monthlyNum * totalMonths);
  let total = initialNum;
  for(let i = 0; i < totalMonths; i++) {
    total = (total + monthlyNum) * (1 + monthlyRate);
  }
  const totalInterest = total - totalSaved;

  const roiInNum = Number(roiInitial) || 1;
  const roiFinNum = Number(roiFinal) || 0;
  const roiValue = ((roiFinNum - roiInNum) / roiInNum) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
       <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "28px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>Calculadora de Juros Compostos</div>
          
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 30 }}>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: COLORS.textMid }}>Valor Inicial (R$)</label>
                <input type="number" value={initial} onChange={e => setInitial(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, outline: "none" }} />
             </div>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: COLORS.textMid }}>Aporte Mensal (R$)</label>
                <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, outline: "none" }} />
             </div>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: COLORS.textMid }}>Taxa de Juros Anual (%)</label>
                <input type="number" value={rate} onChange={e => setRate(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, outline: "none" }} />
             </div>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: COLORS.textMid }}>Período (Anos)</label>
                <input type="number" value={years} onChange={e => setYears(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, outline: "none" }} />
             </div>
          </div>
          
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
             <div style={{ flex: 1, background: COLORS.surface, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12, color: COLORS.textMid, marginBottom: 8 }}>Total Acumulado</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.accent }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             </div>
             <div style={{ flex: 1, background: COLORS.surface, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12, color: COLORS.textMid, marginBottom: 8 }}>Valor Investido</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>R$ {totalSaved.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             </div>
             <div style={{ flex: 1, background: COLORS.surface, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12, color: COLORS.textMid, marginBottom: 8 }}>Total em Juros</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.gold }}>R$ {totalInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             </div>
          </div>
       </div>

       <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "28px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>Calculadora de ROI (Retorno sobre Investimento)</div>
          
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 30, alignItems: "flex-end" }}>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: COLORS.textMid }}>Investimento Inicial (R$)</label>
                <input type="number" value={roiInitial} onChange={e => setRoiInitial(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, outline: "none" }} />
             </div>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, color: COLORS.textMid }}>Valor Final (R$)</label>
                <input type="number" value={roiFinal} onChange={e => setRoiFinal(e.target.value)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, outline: "none" }} />
             </div>
             <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, color: COLORS.textMid, marginBottom: 8 }}>ROI Projetado</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: roiValue >= 0 ? COLORS.accent : COLORS.red }}>
                   {roiValue > 0 ? "+" : ""}{roiValue.toFixed(2)}%
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function BudgetsPage({ store }: any) {
  const { transactions, budgets, updateBudget } = store;
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newLimit, setNewLimit] = useState("");

  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentMonthExp = transactions.filter((t: any) => t.type === 'expense' && t.date.split('/')[1] === mm);

  const spendingByCat = currentMonthExp.reduce((acc: any, t: any) => {
    acc[t.cat] = (acc[t.cat] || 0) + t.amount;
    return acc;
  }, {});

  const handleSaveBudget = async () => {
    if (!newCat || !newLimit) return;
    const existing = budgets.find((b: any) => b.category === newCat);
    await updateBudget(existing ? existing.id : null, newCat, Number(newLimit));
    setNewCat("");
    setNewLimit("");
    setIsAdding(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header and Add Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
         <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Orçamentos por Categoria</div>
         <button 
           onClick={() => setIsAdding(!isAdding)}
           style={{ background: COLORS.accent, color: COLORS.bg, border: "none", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
         >
           <Plus size={16} /> Novo Orçamento
         </button>
      </div>

      {isAdding && (
         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px", display: "flex", gap: 14, alignItems: "flex-end" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
               <label style={{ fontSize: 11, color: COLORS.textMid }}>Categoria</label>
               <input value={newCat} onChange={e => setNewCat(e.target.value)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, color: COLORS.text, fontSize: 13 }} placeholder="Ex: Supermercado" />
            </div>
            <div style={{ width: 140, display: "flex", flexDirection: "column", gap: 6 }}>
               <label style={{ fontSize: 11, color: COLORS.textMid }}>Limite Mensal (R$)</label>
               <input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: "8px 12px", borderRadius: 6, color: COLORS.text, fontSize: 13 }} placeholder="0.00" />
            </div>
            <button onClick={handleSaveBudget} style={{ background: COLORS.blue, color: "white", padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700 }}>Salvar</button>
         </motion.div>
      )}

      {/* List of Budgets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
         <AnimatePresence>
            {budgets.map((b: any) => {
              const spent = spendingByCat[b.category] || 0;
              const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
              const p = Math.min(pct, 100);
              const isOver = pct >= 100;
              const isNear = pct >= 80 && !isOver;
              const color = isOver ? COLORS.red : isNear ? COLORS.gold : COLORS.accent;

              return (
                <motion.div
                  layout
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ background: COLORS.card, border: `1px solid ${isOver ? COLORS.red : COLORS.border}`, borderRadius: 14, padding: "20px", position: "relative", overflow: "hidden" }}
                >
                   {isOver && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: COLORS.red }} />}
                   
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{b.category}</div>
                      <button onClick={() => updateBudget(b.id, b.category, 0)} style={{ background: "transparent", border: "none", color: COLORS.textMid, cursor: "pointer", fontSize: 12 }}>X</button>
                   </div>
                   
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMid }}>de R$ {b.limit.toLocaleString('pt-BR')}</div>
                   </div>

                   <div style={{ width: "100%", height: 6, borderRadius: 3, background: COLORS.surface, overflow: "hidden", marginBottom: 8 }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${p}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ height: "100%", background: color, borderRadius: 3 }}
                      />
                   </div>

                   <div style={{ fontSize: 10, color: isOver ? COLORS.red : isNear ? COLORS.gold : COLORS.textMid }}>
                      {isOver ? `Atenção: Limite excedido em R$ ${(spent - b.limit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                       isNear ? `Você já gastou ${pct.toFixed(0)}% do orçamento.` : 
                       `Restam R$ ${(b.limit - spent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                   </div>
                </motion.div>
              )
            })}
         </AnimatePresence>
         {budgets.length === 0 && !isAdding && (
           <div style={{ color: COLORS.textMid, fontSize: 13, padding: 20 }}>Nenhum orçamento definido.</div>
         )}
      </div>
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyItems: "center", background: COLORS.bg, justifyContent: "center", flexDirection: "column", gap: 20 }}>
       <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.text }}>Econ<span style={{ color: COLORS.accent }}>Rational</span></div>
       <p style={{ color: COLORS.textMid, maxWidth: 400, textAlign: "center" }}>Faça login para acessar seu Finance OS protegido e otimizado na nuvem.</p>
       <button onClick={loginWithGoogle} style={{ padding: "12px 24px", background: COLORS.accent, color: COLORS.bg, border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
         Entrar com Google
       </button>
    </div>
  )
}

export default function App() {
  const store = useFinanceData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  if (store.loading) return <div style={{ height: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.accent, fontWeight: 700 }}>Carregando...</div>;
  if (!store.user) return <WelcomeScreen />;

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
      <Sidebar active={activeTab} onNav={setActiveTab} collapsed={collapsed} user={store.user} />
      
      <main style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {NAV.find(n => n.id === activeTab)?.label || "EconRational"}
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.card, padding: "8px 16px", borderRadius: 20, border: `1px solid ${COLORS.border}` }}>
             {store.isSyncing ? (
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                   <Cloud size={16} color={COLORS.accent} />
                 </motion.div>
             ) : (
                 <Cloud size={16} color={COLORS.textMid} />
             )}
             <span style={{ fontSize: 12, color: COLORS.textMid, fontWeight: 500 }}>
                {store.isSyncing ? "Sincronizando nuvem..." : `Sincronizado: ${store.lastSync?.toLocaleTimeString() || 'agora'}`}
             </span>
          </div>
        </header>

        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
             <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.2 }}
             >
               {activeTab === "dashboard" && <DashboardPage store={store} />}
               {activeTab === "transactions" && <TransactionsPage store={store} />}
               {activeTab === "history" && <HistoryPage store={store} />}
               {activeTab === "simulator" && <SimulatorPage />}
               {["cashflow"].includes(activeTab) && (
                  <div style={{ padding: 40, textAlign: "center", color: COLORS.textMid, background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <Wallet size={48} color={COLORS.border} strokeWidth={1} style={{ margin: "0 auto 16px" }} />
                     <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>Módulo "{NAV.find(n => n.id === activeTab)?.label}" em desenvolvimento</div>
                     <span style={{ fontSize: 13, marginTop: 10, display: "inline-block", color: COLORS.accent }}>Disponível na próxima atualização da EconRational.</span>
                  </div>
               )}
             </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
