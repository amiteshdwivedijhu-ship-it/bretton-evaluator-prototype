/* app.js - Workbench-style eval panel renderer for the Bretton Evaluator
 * prototype. Evaluates all runs once on load, re-renders the panel per
 * selection. Run A is the default view so the 90-second walkthrough starts
 * on a full pass.
 */
"use strict";
(function () {
  const RUNS = globalThis.RUNS;
  const MODULE = globalThis.MODULE;
  const E = globalThis.BrettonEvaluator;

  if (!RUNS || !MODULE || !E) { throw new Error("missing runs.js or evaluator.js"); }

  const packets = E.evaluateAll(RUNS, MODULE);
  const SEV_RANK = { high: 0, medium: 1, info: 2 };
  const KIND_LABEL = {
    screen_result: "sanctions clearance claim",
    pep_result: "PEP clearance claim",
    media_result: "media clearance claim",
    address_match: "address confirmation claim",
    risk_claim: "risk rating claim"
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let selected = "run-a";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtTime(iso) {
    if (!iso) { return ""; }
    const d = new Date(iso);
    const pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + " UTC";
  }

  function chips(kind, label) {
    return '<span class="chip chip-' + kind + '">' + esc(label) + "</span>";
  }

  function sourceChip(source, extra) {
    return '<button class="chip chip-source" data-srcid="' + esc(source.id) + '" title="Jump to source ' + esc(source.id) + '">' +
      esc(source.id) + " " + esc(source.name) + (extra ? " " + extra : "") + "</button>";
  }

  /* ---------------- rail ---------------- */
  function renderRail() {
    const rail = document.getElementById("rail");
    const html = '<div class="rail-head">Cases</div>' +
      RUNS.map(function (r) {
        const p = packets[r.id];
        const verdict = p.gate.escalate ? "ESCALATE" : "PASS";
        return '<div class="case-row' + (r.id === selected ? " selected" : "") + '" data-runid="' + esc(r.id) + '">' +
          '<div class="case-row-top">' +
          '<span class="chip ' + (p.gate.escalate ? "chip-fail" : "chip-pass") + '">' + verdict + "</span>" +
          '<span class="case-id">' + esc(r.caseId) + "</span></div>" +
          '<div class="case-subject">' + esc(r.subject.entity) + "</div>" +
          '<div class="case-note">' + esc(r.note) + "</div></div>";
      }).join("") +
      '<div class="rail-foot">' +
      '<div class="rail-foot-title">Severity</div>' +
      chips("high", "HIGH") + " " + chips("medium", "MEDIUM") + " " + chips("info", "INFO") +
      '<div class="rail-foot-title" style="margin-top:14px">Dimensions</div>' +
      "<div>Completeness</div><div>Groundedness (Claim support)</div><div>Trajectory (Workflow process)</div><div>Format (Deliverable fitness)</div>" +
      "</div>";
    rail.innerHTML = html;
    for (const row of rail.querySelectorAll(".case-row")) {
      row.addEventListener("click", function () { select(row.getAttribute("data-runid")); });
    }
  }

  /* ---------------- walkthrough strip ---------------- */
  function renderWalkthrough() {
    const el = document.getElementById("walkthrough");
    el.innerHTML = RUNS.map(function (r, i) {
      const p = packets[r.id];
      const verdict = p.gate.escalate ? "ESCALATE" : "SHIP";
      return '<button class="wt-pill" data-runid="' + esc(r.id) + '">' +
        '<span class="wt-num">' + (i + 1) + "</span>" +
        '<span class="wt-label">' + esc(r.note.split(".")[0]) + "</span>" +
        '<span class="chip ' + (p.gate.escalate ? "chip-fail" : "chip-pass") + '">' + verdict + "</span></button>";
    }).join("");
    for (const b of el.querySelectorAll("[data-runid]")) {
      b.addEventListener("click", function () { select(b.getAttribute("data-runid")); });
    }
  }

  /* ---------------- main panel ---------------- */
  function renderMain() {
    const r = RUNS.find(function (x) { return x.id === selected; });
    const p = packets[selected];
    const main = document.getElementById("main");

    const verdictChip = p.gate.escalate ? chips("fail", "ESCALATE") : chips("pass", "PASS");
    const dimsHtml = p.dimResults.map(function (d) {
      return '<div class="dim-card">' +
        '<div class="dim-top"><span class="chip ' + (d.pass ? "chip-pass" : "chip-fail") + '">' + (d.pass ? "PASS" : "FAIL") + "</span>" +
        '<span class="dim-findings">' + d.materialCount + " material</span></div>" +
        '<div class="dim-label">' + esc(d.label) + "</div>" +
        '<div class="dim-alt">' + esc(d.alt === d.label ? "" : d.alt) + "</div>" +
        '<div class="dim-score ' + (d.pass ? "ink" : "danger") + '">' + d.score + '<span class="dim-score-pct">%</span></div>' +
        '<div class="dim-bar"><div class="dim-bar-fill ' + (d.pass ? "fill-pass" : "fill-fail") + '" style="width:' + d.score + '%"></div></div>' +
        "</div>";
    }).join("");

    const gate = p.gate;
    const gateHtml = gate.escalate
      ? '<div class="gate gate-escalate"><div class="gate-main">' +
        '<div class="gate-title">ESCALATE</div>' +
        '<div class="gate-sub">Do not ship. Material findings must be resolved before examiner review.</div></div>' +
        '<div class="gate-side"><div class="gate-block-title">Blocking findings (' + gate.blockers.length + ")</div>" +
        gate.blockers.slice(0, 4).map(function (f) {
          return '<div class="gate-blocker">' + chips(f.severity, f.severity.toUpperCase()) + " " + esc(f.title) + "</div>";
        }).join("") +
        "</div></div>"
      : '<div class="gate gate-ship"><div class="gate-main">' +
        '<div class="gate-title">SHIP</div>' +
        '<div class="gate-sub">All four dimensions pass. No material findings. Ready for examiner sign-off.</div></div>' +
        '<div class="gate-side"><div class="gate-block-title">Gate rule</div>' +
        '<div class="gate-blocker">Ship only when all four dimensions pass and no material finding remains open.</div></div></div>';

    const findingsHtml = p.findings.length
      ? '<div class="panel" id="findings-panel"><div class="panel-head">' +
        "<h2>Findings (" + p.findings.length + ")</h2>" +
        '<span class="panel-sub">Every finding points to a claim, source, or missing step.</span></div>' +
        '<div class="finding-list">' + p.findings.slice().sort(function (a, b) {
          return SEV_RANK[a.severity] - SEV_RANK[b.severity];
        }).map(function (f) {
          const dim = p.dimResults.find(function (d) { return d.id === f.dimension; });
          let pointerHtml = "";
          if (f.ev.kind === "claim" && f.claim) {
            pointerHtml = '<button class="chip chip-claim" data-sent="' + esc(f.claim.sentenceId) + '" title="Open claim in report draft">' + esc(f.claim.sentenceId) + "</button>" +
              '<button class="chip chip-link" data-sent="' + esc(f.claim.sentenceId) + '">Open claim</button>';
          } else if (f.ev.kind === "missing_step" && f.missingStep) {
            pointerHtml = '<span class="chip chip-missing">' + esc(f.missingStep.id) + " " + esc(f.missingStep.label) + "</span>";
          } else if (f.ev.kind === "step" && f.step) {
            pointerHtml = '<span class="chip chip-step">Step ' + esc(f.step.id) + "</span>" +
              (f.source ? sourceChip(f.source, "") : "");
          } else if (f.ev.kind === "section") {
            pointerHtml = '<span class="chip chip-section">Section ' + esc(f.ev.chip.replace(/^Section /, "")) + "</span>";
          } else if (f.ev.kind === "source") {
            pointerHtml = '<span class="chip chip-step">' + esc(f.ev.chip) + "</span>";
          }
          const detail = f.claim
            ? '<div class="finding-claim"><span class="finding-claim-text">"' + esc(f.claim.text) + '"</span><span class="finding-quote-src">' + esc(f.claim.section) + " section</span></div>"
            : f.missingStep
            ? '<div class="finding-checkpoint">Checkpoint ' + esc(f.missingStep.id) + ": " + esc(f.missingStep.checkpoint) + "</div>"
            : "";
          return '<div class="finding-row">' +
            '<div class="finding-top">' + chips(f.severity, f.severity.toUpperCase()) +
            '<span class="finding-dim">' + esc(dim ? dim.label : f.dimension) + "</span>" +
            '<span class="finding-title">' + esc(f.title) + "</span>" +
            '<span class="finding-toggle" aria-hidden="true">+</span></div>' +
            '<div class="finding-detail">' +
            detail +
            (f.note ? '<div class="finding-note">' + esc(f.note) + "</div>" : "") +
            '<div class="finding-evidence"><span class="ptr-label">Points to evidence:</span> ' + pointerHtml + "</div>" +
            "</div></div>";
        }).join("") + "</div></div>"
      : '<div class="panel"><div class="panel-head"><h2>Findings (0)</h2>' +
        '<span class="panel-sub">No findings. Every checked sentence carries a source pointer and every required checkpoint ran.</span></div>' +
        '<div class="no-findings">' + chips("pass", "CLEAN") + " No material findings in this packet.</div></div>";

    const reportHtml = '<div class="panel" id="report-panel"><div class="panel-head">' +
      "<h2>Report draft (as filed)</h2><span class='panel-sub'>Sentence level view. Claims without a source pointer are tagged.</span></div>" +
      r.report.sections.map(function (sec) {
        return '<div class="report-section"><div class="report-section-title">' + esc(sec.title) + "</div>" +
          sec.sentences.map(function (s) {
            const link = s.sources && s.sources.length > 0
              ? s.sources.map(function (sid) {
                  const src = r.trace.sources.find(function (x) { return x.id === sid; });
                  return src ? sourceChip(src, fmtTime(src.retrievedAt)) : chips("high", "dangling " + sid);
                }).join(" ")
              : s.claimKind === "meta" ? "<span class='tag-meta'>meta sentence</span>" : chips("fail", "NO SOURCE POINTER");
            const kindTag = KIND_LABEL[s.claimKind] ? '<span class="tag-kind">' + KIND_LABEL[s.claimKind] + "</span>" : "";
            return '<div class="sentence" id="sent-' + esc(s.id) + '">' +
              '<span class="sent-id">' + esc(s.id) + "</span>" +
              '<span class="sent-text">' + esc(s.text) + "</span>" +
              "<span class='sent-side'>" + kindTag + link + "</span></div>";
          }).join("") + "</div>";
      }).join("") + "</div>";

    const executedChecks = r.trace.steps.map(function (s) { return s.check; });
    const ghostSteps = MODULE.requiredChecks.filter(function (rc) { return executedChecks.indexOf(rc.check) === -1; });

    const auditHtml = '<div class="panel" id="audit-panel"><div class="panel-head">' +
      "<h2>Audit log</h2><span class='panel-sub'>Executed steps in order. Required checks that never ran are dashed.</span></div>" +
      '<div class="timeline">' +
      r.trace.steps.map(function (s) {
        const statusChip = s.status === "completed" ? chips("pass", s.performedBy === "human" ? "REVIEWED" : "COMPLETED")
          : s.status === "blocked" ? chips("medium", "BLOCKED")
          : chips("fail", s.status.toUpperCase());
        const resultChip = s.result ? chips("info", "result " + s.result) : "";
        const srcs = s.sourceIds.map(function (sid) {
          const src = r.trace.sources.find(function (x) { return x.id === sid; });
          return src ? sourceChip(src, "") : "";
        }).join(" ");
        return '<div class="step-row">' +
          '<div class="step-dot ' + (s.status === "completed" ? "dot-ok" : s.status === "blocked" ? "dot-warn" : "dot-bad") + '"></div>' +
          '<div class="step-body"><div class="step-line">' +
          '<span class="step-label">' + esc(s.label) + "</span>" +
          '<span class="chip chip-check">' + esc(findCheckId(s.check)) + "</span>" + statusChip + resultChip +
          '<span class="step-time">' + fmtTime(s.completedAt) + "</span></div>" +
          (s.detail ? '<div class="step-detail">' + esc(s.detail) + "</div>" : "") +
          (srcs ? '<div class="step-sources">' + srcs + "</div>" : "") +
          "</div></div>";
      }).join("") +
      ghostSteps.map(function (rc) {
        return '<div class="step-row ghost"><div class="step-dot dot-miss"></div>' +
          '<div class="step-body"><div class="step-line">' +
          '<span class="step-label">' + esc(rc.label) + "</span>" +
          '<span class="chip chip-check">' + esc(rc.id) + "</span>" +
          chips("fail", "NOT EXECUTED") + '<span class="step-time">required, skipped</span></div>' +
          '<div class="step-detail">' + esc(rc.checkpoint) + "</div></div></div>";
      }).join("") +
      "</div></div>";

    const sourcesHtml = '<div class="panel" id="sources-panel"><div class="panel-head">' +
      "<h2>Sources (" + r.trace.sources.length + ")</h2><span class='panel-sub'>Retrieved evidence attached to the run trace.</span></div>" +
      '<div class="source-table">' +
      r.trace.sources.map(function (src) {
        const usedBy = r.trace.steps.filter(function (s) { return s.sourceIds.indexOf(src.id) !== -1; });
        return '<div class="source-row" id="src-' + esc(src.id) + '">' +
          '<div class="source-main"><span class="chip chip-source-static">' + esc(src.id) + "</span>" +
          '<span class="source-name">' + esc(src.name) + "</span>" +
          chips("info", src.kind) + "</div>" +
          (src.detail ? '<div class="source-detail">' + esc(src.detail) + "</div>" : "") +
          '<div class="source-meta">retrieved ' + fmtTime(src.retrievedAt) +
          (usedBy.length ? " · used by " + usedBy.map(function (s) { return esc(s.id); }).join(", ") : "") + "</div>" +
          "</div>";
      }).join("") + "</div></div>";

    const tableHtml = '<div class="panel" id="eval-table-panel"><div class="panel-head">' +
      "<h2>Eval summary: all runs</h2>" +
      "<span class='panel-sub'>Case | pass/fail | reason. Packets are deterministic; no LLM judge.</span></div>" +
      '<div class="eval-table"><div class="et-row et-head">' +
      "<div>Case</div><div>Subject</div><div>Pass / Fail</div><div>Reason</div></div>" +
      RUNS.map(function (rr) {
        const pp = packets[rr.id];
        return '<div class="et-row">' +
          "<div><strong>" + esc(rr.caseId) + "</strong><br><span class='muted'>" + esc(rr.id) + "</span></div>" +
          "<div>" + esc(rr.subject.entity) + "<br><span class='muted'>" + esc(rr.subject.jurisdiction) + "</span></div>" +
          "<div>" + chips(pp.evalTable.verdict === "PASS" ? "pass" : "fail", pp.evalTable.verdict) + "</div>" +
          "<div class='et-reason'>" + esc(pp.evalTable.reason) + "</div></div>";
      }).join("") + "</div></div>";

    const integrityOk = [packets["run-a"], packets["run-b"], packets["run-c"]].every(function (pp) { return pp.integrity.allFindingsHaveEvidencePointers; });
    const integrityHtml = '<div class="integrity ' + (integrityOk ? "integrity-ok" : "integrity-bad") + '">' +
      "Packet integrity self-check: every finding carries an evidence pointer (claim, source, or missing step). " +
      (integrityOk ? "Result: PASS. Validated at load across 3/3 packets." : "Result: FAIL.") + "</div>";

    main.innerHTML =
      '<div class="case-header panel">' +
      '<div class="case-left"><div class="case-kicker">' + esc(r.caseId) + " " + verdictChip + "</div>" +
      '<div class="case-entity">' + esc(r.subject.entity) + "</div>" +
      '<div class="case-meta">' + esc(r.subject.jurisdiction) + " · " + esc(r.subject.regNo) + " · " + esc(r.subject.principal) + "</div>" +
      '<div class="case-note-main">' + esc(r.note) + "</div></div>" +
      '<div class="case-right">' +
      '<div class="case-agent"><span class="chip chip-info">' + esc(r.agent.name + " " + r.agent.version) + "</span>" +
      '<span class="chip chip-info">' + esc(r.agent.runId) + "</span></div>" +
      "<div class='case-meta'>started " + fmtTime(r.startedAt) + " · finalized " + fmtTime(r.reportFinalizedAt) + "</div>" +
      '<div class="case-jump"><button class="btn btn-ghost" data-jump="audit-panel">Audit log</button>' +
      '<button class="btn btn-ghost" data-jump="sources-panel">Sources</button>' +
      '<button class="btn btn-ghost" data-jump="eval-table-panel">Eval summary</button></div>' +
      "</div></div>" +
      '<div class="walkthrough" id="walkthrough"></div>' +
      '<div class="dims">' + dimsHtml + "</div>" +
      gateHtml +
      findingsHtml +
      reportHtml +
      auditHtml +
      sourcesHtml +
      tableHtml +
      integrityHtml;
    renderWalkthrough();

    /* interactions */
    for (const b of main.querySelectorAll("[data-jump]")) {
      b.addEventListener("click", function () {
        document.getElementById(b.getAttribute("data-jump")).scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    for (const b of main.querySelectorAll("[data-sent]")) {
      b.addEventListener("click", function () {
        const sent = document.getElementById("sent-" + b.getAttribute("data-sent"));
        if (sent) {
          sent.scrollIntoView({ behavior: "smooth", block: "center" });
          sent.classList.add("flash");
          setTimeout(function () { sent.classList.remove("flash"); }, 2400);
        }
      });
    }
    for (const b of main.querySelectorAll("[data-srcid]")) {
      b.addEventListener("click", function () {
        const row = document.getElementById("src-" + b.getAttribute("data-srcid"));
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("flash");
          setTimeout(function () { row.classList.remove("flash"); }, 2400);
        }
      });
    }
    for (const row of main.querySelectorAll(".finding-row")) {
      row.addEventListener("click", function (ev) {
        if (ev.target.closest("[data-sent]") || ev.target.closest("[data-srcid]")) { return; }
        row.classList.toggle("open");
        const t = row.querySelector(".finding-toggle");
        if (t) { t.textContent = row.classList.contains("open") ? "−" : "+"; }
      });
    }
  }

  function findCheckId(check) {
    const rc = MODULE.requiredChecks.find(function (c) { return c.check === check; });
    return rc ? rc.id : check.toUpperCase();
  }

  function select(id) {
    selected = id;
    renderRail();
    renderMain();
  }

  document.getElementById("export-btn").addEventListener("click", function () {
    const p = packets[selected];
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = p.runId + "-quality-packet.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* boot: default run A, so the walkthrough starts on a full pass */
  renderRail();
  renderMain();
  window.__evaluatorPackets = packets; /* console inspection for demos */
})();
