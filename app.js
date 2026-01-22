/* Tank Temperature Logger
   - 6 positions: 1..6
   - depths: top, mid, bottom
   - live evaluation vs acceptable min/max
   - diagram shows selected depth
   - snapshots saved to localStorage; export CSV
*/

const POSITIONS = [1,2,3,4,5,6];
const DEPTHS = [
  { key: "top", label: "Top" },
  { key: "mid", label: "Mid" },
  { key: "bottom", label: "Bottom" },
];

const STORAGE_KEY = "tank_temp_log_v1";

let currentDepth = "top";

const els = {
  unit: document.getElementById("unitSelect"),
  ranges: {
    topMin: document.getElementById("topMin"),
    topMax: document.getElementById("topMax"),
    midMin: document.getElementById("midMin"),
    midMax: document.getElementById("midMax"),
    botMin: document.getElementById("botMin"),
    botMax: document.getElementById("botMax"),
  },
  tempTableBody: document.querySelector("#tempTable tbody"),
  logTableBody: document.querySelector("#logTable tbody"),
  btnSave: document.getElementById("btnSave"),
  btnExport: document.getElementById("btnExport"),
  btnClear: document.getElementById("btnClear"),
  depthButtons: Array.from(document.querySelectorAll(".seg-btn")),
  markers: Array.from(document.querySelectorAll(".marker")),
};

console.log("Initializing els object");
console.log("depthButtons found:", els.depthButtons.length, els.depthButtons);
console.log("markers found:", els.markers.length, els.markers);

function clampNum(n) {
  if (Number.isFinite(n)) return n;
  return null;
}

function readRanges() {
  return {
    unit: els.unit.value,
    top: {
      min: clampNum(parseFloat(els.ranges.topMin.value)),
      max: clampNum(parseFloat(els.ranges.topMax.value)),
    },
    mid: {
      min: clampNum(parseFloat(els.ranges.midMin.value)),
      max: clampNum(parseFloat(els.ranges.midMax.value)),
    },
    bottom: {
      min: clampNum(parseFloat(els.ranges.botMin.value)),
      max: clampNum(parseFloat(els.ranges.botMax.value)),
    },
  };
}

function getInputId(pos, depthKey) {
  return `t_${pos}_${depthKey}`;
}

function readTempsFromInputs() {
  const temps = {};
  for (const pos of POSITIONS) {
    temps[pos] = {};
    for (const d of DEPTHS) {
      const id = getInputId(pos, d.key);
      const el = document.getElementById(id);
      if (!el) {
        console.warn("Input not found:", id);
        temps[pos][d.key] = null;
        continue;
      }
      const raw = el.value.trim();
      temps[pos][d.key] = raw === "" ? null : clampNum(parseFloat(raw));
    }
  }
  return temps;
}

function statusForValue(value, range) {
  // Empty is not an error; it's "empty"
  if (value === null) return "empty";
  if (range.min === null || range.max === null) return "empty"; // range invalid => don't scream
  if (value < range.min || value > range.max) return "out";
  return "ok";
}

function worstStatus(a, b) {
  // out > ok > empty (empty is informational)
  const rank = { out: 3, ok: 2, empty: 1 };
  return rank[a] >= rank[b] ? a : b;
}

function renderTempTable() {
  const ranges = readRanges();
  const temps = readTempsFromInputs();

  console.log("renderTempTable called");
  console.log("tempTableBody:", els.tempTableBody);
  console.log("tempTableBody.children.length:", els.tempTableBody.children.length);

  // Build rows if empty or if they don't have the proper structure (cells with badges)
  if (els.tempTableBody.children.length === 0 ||
      !els.tempTableBody.querySelector(".cell") ||
      !els.tempTableBody.querySelector(".badge")) {
    console.log("Building table rows for", POSITIONS.length, "positions");
    els.tempTableBody.innerHTML = "";
    for (const pos of POSITIONS) {
      console.log("Creating row for position", pos);
      const tr = document.createElement("tr");

      const tdPos = document.createElement("td");
      tdPos.textContent = String(pos);
      tr.appendChild(tdPos);

      for (const d of DEPTHS) {
        const td = document.createElement("td");
        const wrap = document.createElement("div");
        wrap.className = "cell";

        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.1";
        input.placeholder = "—";
        input.id = getInputId(pos, d.key);
        console.log("Created input with id:", input.id);
        input.addEventListener("input", () => {
          evaluateAndPaint();
        });

        const badge = document.createElement("span");
        badge.className = "badge empty";
        badge.id = `b_${pos}_${d.key}`;
        badge.textContent = "Empty";

        wrap.appendChild(input);
        wrap.appendChild(badge);
        td.appendChild(wrap);
        tr.appendChild(td);
      }

      const tdWorst = document.createElement("td");
      tdWorst.className = "row-status empty";
      tdWorst.id = `worst_${pos}`;
      tdWorst.textContent = "Empty";
      tr.appendChild(tdWorst);

      els.tempTableBody.appendChild(tr);
      console.log("Appended row for position", pos);
    }
    console.log("All rows built. Total children:", els.tempTableBody.children.length);
  }

  // Evaluate + update badges + worst column
  for (const pos of POSITIONS) {
    let worst = "empty";
    for (const d of DEPTHS) {
      const val = temps[pos][d.key];
      const r = ranges[d.key];
      const st = statusForValue(val, r);

      const badge = document.getElementById(`b_${pos}_${d.key}`);
      if (badge) {
        badge.className = `badge ${st}`;
        badge.textContent = st === "ok" ? "OK" : st === "out" ? "OUT" : "Empty";
      }

      worst = worstStatus(worst, st);
    }
    const worstEl = document.getElementById(`worst_${pos}`);
    if (worstEl) {
      worstEl.className = `row-status ${worst}`;
      worstEl.textContent = worst === "ok" ? "OK" : worst === "out" ? "OUT" : "Empty";
    }
  }
}

function paintDiagramForDepth(depthKey) {
  console.log("paintDiagramForDepth called with:", depthKey);
  const ranges = readRanges();
  const temps = readTempsFromInputs();

  console.log("Updating markers for depth:", depthKey);
  for (const marker of els.markers) {
    const pos = parseInt(marker.getAttribute("data-pos"), 10);
    const val = temps[pos][depthKey];
    const st = statusForValue(val, ranges[depthKey]);

    console.log(`Marker pos ${pos}: value=${val}, status=${st}`);

    marker.classList.remove("ok", "out", "empty");
    marker.classList.add(st);
  }
  console.log("Diagram painting complete");
}

function evaluateAndPaint() {
  renderTempTable();
  paintDiagramForDepth(currentDepth);
}

function setDepth(depthKey) {
  console.log("setDepth called with:", depthKey);
  currentDepth = depthKey;
  console.log("currentDepth updated to:", currentDepth);

  for (const b of els.depthButtons) {
    const btnDepth = b.getAttribute("data-depth");
    const isActive = btnDepth === depthKey;
    b.classList.toggle("active", isActive);
    console.log(`Button for depth ${btnDepth}:`, isActive ? "active" : "inactive");
  }

  paintDiagramForDepth(depthKey);
}

function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLog(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function anyOut(snapshot) {
  for (const pos of POSITIONS) {
    for (const d of DEPTHS) {
      const v = snapshot.temps[pos][d.key];
      const r = snapshot.ranges[d.key];
      const st = statusForValue(v, r);
      if (st === "out") return true;
    }
  }
  return false;
}

function snapshotCurrent() {
  const ranges = readRanges();
  const temps = readTempsFromInputs();

  // quick range sanity: if min > max, swap? no. Just keep it and user will see "Empty" statuses.
  const now = new Date();
  return {
    ts: now.toISOString(),
    unit: ranges.unit,
    ranges: {
      top: { min: ranges.top.min, max: ranges.top.max },
      mid: { min: ranges.mid.min, max: ranges.mid.max },
      bottom: { min: ranges.bottom.min, max: ranges.bottom.max },
    },
    temps, // {1:{top:..,mid:..,bottom:..}, ...}
  };
}

function formatRanges(r) {
  const f = (x) => (x === null ? "—" : x.toFixed(1));
  return `T[${f(r.top.min)}..${f(r.top.max)}], M[${f(r.mid.min)}..${f(r.mid.max)}], B[${f(r.bottom.min)}..${f(r.bottom.max)}]`;
}

function miniDataString(temps) {
  // compact string; useful in log table
  const parts = [];
  for (const pos of POSITIONS) {
    const t = temps[pos];
    const f = (x) => (x === null ? "—" : x.toFixed(1));
    parts.push(`${pos}:{T:${f(t.top)},M:${f(t.mid)},B:${f(t.bottom)}}`);
  }
  return parts.join("  ");
}

function renderLogTable() {
  const entries = loadLog();
  els.logTableBody.innerHTML = "";

  for (const e of entries.slice().reverse()) {
    const tr = document.createElement("tr");

    const tdTs = document.createElement("td");
    tdTs.textContent = e.ts.replace("T", " ").replace("Z", "Z");
    tr.appendChild(tdTs);

    const tdUnit = document.createElement("td");
    tdUnit.textContent = e.unit || "—";
    tr.appendChild(tdUnit);

    const tdRanges = document.createElement("td");
    tdRanges.textContent = formatRanges(e.ranges);
    tr.appendChild(tdRanges);

    const tdAny = document.createElement("td");
    const out = anyOut(e);
    tdAny.textContent = out ? "YES" : "NO";
    tdAny.style.color = out ? "var(--out)" : "var(--ok)";
    tdAny.style.fontWeight = "800";
    tr.appendChild(tdAny);

    const tdData = document.createElement("td");
    const div = document.createElement("div");
    div.className = "data-mini";
    div.title = miniDataString(e.temps);
    div.textContent = miniDataString(e.temps);
    tdData.appendChild(div);
    tr.appendChild(tdData);

    els.logTableBody.appendChild(tr);
  }
}

function toCSV(entries) {
  const header = [
    "timestamp",
    "unit",
    "top_min","top_max",
    "mid_min","mid_max",
    "bottom_min","bottom_max",
    // temps: pos_depth
    ...POSITIONS.flatMap(p => ["top","mid","bottom"].map(d => `pos${p}_${d}`)),
  ];

  const rows = [header];

  for (const e of entries) {
    const r = e.ranges;
    const f = (x) => (x === null || x === undefined ? "" : String(x));
    const row = [
      e.ts,
      e.unit || "",
      f(r.top.min), f(r.top.max),
      f(r.mid.min), f(r.mid.max),
      f(r.bottom.min), f(r.bottom.max),
    ];

    for (const pos of POSITIONS) {
      row.push(f(e.temps[pos].top));
      row.push(f(e.temps[pos].mid));
      row.push(f(e.temps[pos].bottom));
    }
    rows.push(row);
  }

  return rows.map(cols => cols.map(escapeCSV).join(",")).join("\n");
}

function escapeCSV(value) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function init() {
  console.log("init called");
  console.log("DOM loaded");

  // build table
  renderTempTable();
  evaluateAndPaint();
  renderLogTable();

  console.log("Setting initial depth to:", currentDepth);
  paintDiagramForDepth(currentDepth);

  // Add event listeners to any existing inputs (fallback HTML)
  document.querySelectorAll("#tempTable input[type='number']").forEach(input => {
    console.log("Adding listener to existing input:", input.id);
    input.addEventListener("input", () => {
      evaluateAndPaint();
    });
  });

  // listeners: ranges/unit changes
  els.unit.addEventListener("change", () => {
    evaluateAndPaint();
  });
  Object.values(els.ranges).forEach(input => {
    input.addEventListener("input", () => {
      evaluateAndPaint();
    });
  });

  // depth toggles
  console.log("Attaching event listeners to depth buttons");
  for (const b of els.depthButtons) {
    const depth = b.getAttribute("data-depth");
    console.log("Attaching listener to button with depth:", depth);
    b.addEventListener("click", () => {
      console.log("Depth button clicked:", depth);
      setDepth(depth);
    });
  }

  // save snapshot
  els.btnSave.addEventListener("click", () => {
    const snap = snapshotCurrent();
    const entries = loadLog();
    entries.push(snap);
    saveLog(entries);
    renderLogTable();
  });

  // export CSV
  els.btnExport.addEventListener("click", () => {
    const entries = loadLog();
    const csv = toCSV(entries);
    const ts = new Date().toISOString().slice(0,19).replaceAll(":","-");
    downloadText(`tank_temp_log_${ts}.csv`, csv);
  });

  // clear log
  els.btnClear.addEventListener("click", () => {
    if (!confirm("Clear all saved snapshots from this browser?")) return;
    saveLog([]);
    renderLogTable();
  });
}

init();

