/* evaluator.js - deterministic Bretton-style quality packet generator.
 * Pure functions. No LLM judge: every rule is a structural check over the
 * run trace and report, and every finding carries an evidence pointer
 * (claim, source, or missing step). Runs in browser and in Node.
 */
"use strict";
(function (globalScope) {
  const DIMENSIONS = [
    { id: "completeness", label: "Completeness", alt: "Completeness" },
    { id: "groundedness", label: "Groundedness", alt: "Claim support" },
    { id: "trajectory", label: "Trajectory", alt: "Workflow process" },
    { id: "format", label: "Format", alt: "Deliverable fitness" }
  ];

  const SEV_POINTS = { high: 40, medium: 12, info: 0 };

  /* claim kinds whose evidence requirements are structural */
  const CLAIM_EVIDENCE = {
    screen_result:   { check: "sanctions_screen", expected: ["miss", "none"], label: "sanctions clearance", evidence: "a retrieved hit/miss record with the list name and retrieval time" },
    pep_result:      { check: "pep_check", expected: ["miss", "none"], label: "PEP clearance", evidence: "a retrieved PEP screen result" },
    media_result:    { check: "adverse_media", expected: ["none", "miss"], label: "adverse media clearance", evidence: "a retrieved media scan result" },
    address_match:   { check: "address_verification", expected: ["match"], label: "address confirmation", evidence: "a retrieved address verification result" },
    risk_claim:      { check: "risk_rating", expected: null, label: "risk rating", evidence: "a completed risk rating step" }
  };

  const PLACEHOLDER_RE = /\bTBD\b|placeholder|to be completed|\blorem\b/i;

  function findCheck(moduleSpec, check) {
    return moduleSpec.requiredChecks.find(function (rc) { return rc.check === check; });
  }

  function completedSteps(run) {
    const map = {};
    for (const step of run.trace.steps) {
      if (step.status === "completed" && !map[step.check]) { map[step.check] = step; }
    }
    return map;
  }

  function sourcesById(run) {
    const map = {};
    for (const s of run.trace.sources) { map[s.id] = s; }
    return map;
  }

  function push(findings, stub, ev) {
    ev = ev || {};
    stub.ev = {
      kind: ev.kind,
      chip: ev.chip,
      ref: ev.ref || {}
    };
    if (!stub.claim && ev.claim) { stub.claim = ev.claim; }
    findings.push(stub);
  }

  function evaluateRun(run, moduleSpec) {
    const findings = [];
    const steps = completedSteps(run);
    const srcs = sourcesById(run);

    /* ---------- Groundedness / Claim support ---------- */
    for (const section of run.report.sections) {
      for (const s of section.sentences) {
        const kind = s.claimKind || "none";
        if (kind === "meta") { continue; }

        const rule = CLAIM_EVIDENCE[kind];
        if (rule) {
          const step = steps[rule.check];
          const hasSrcs = s.sources && s.sources.length > 0;
          const resultOk = !rule.expected || (step && rule.expected.indexOf(step.result) !== -1);
          if (!hasSrcs || !step || !resultOk) {
            const rc = findCheck(moduleSpec, rule.check);
            const why = !hasSrcs ? "the sentence carries no source pointer"
              : !step ? "the evidencing step never completed"
              : "the retrieved step result does not support the claim";
            push(findings, {
              id: "g" + (findings.length + 1),
              dimension: "groundedness",
              severity: "high",
              rule: "claim_evidence",
              title: "Unsupported " + rule.label + " claim",
              note: "Required evidence: " + rule.evidence + ". " + (rc ? "Checkpoint " + rc.id + ": " + rc.checkpoint : ""),
              detail: "The report asserts a " + rule.label + " but " + why + " in the run trace.",
              claim: { section: section.id, sentenceId: s.id, text: s.text },
              missingStep: rc
            }, {
              kind: "claim",
              chip: "Claim " + s.id,
              ref: { sentenceId: s.id },
              claim: { section: section.id, sentenceId: s.id, text: s.text }
            });
          }
        } else {
          if (!s.sources || s.sources.length === 0) {
            push(findings, {
              id: "g" + (findings.length + 1),
              dimension: "groundedness",
              severity: "medium",
              rule: "unsupported_claim",
              title: "Claim without source pointer",
              note: "The sentence must point to an entry in the run trace sources.",
              detail: "The report sentence makes a factual claim with no source pointer.",
              claim: { section: section.id, sentenceId: s.id, text: s.text }
            }, {
              kind: "claim",
              chip: "Claim " + s.id,
              ref: { sentenceId: s.id },
              claim: { section: section.id, sentenceId: s.id, text: s.text }
            });
          }
        }

        for (const sid of s.sources || []) {
          if (!srcs[sid]) {
            push(findings, {
              id: "g" + (findings.length + 1),
              dimension: "groundedness",
              severity: "high",
              rule: "dangling_pointer",
              title: "Source pointer not found in run trace: " + sid,
              note: "Every pointer must resolve to a retrieved source in the trace.",
              detail: "The sentence cites " + sid + " which does not exist in the run trace sources.",
              claim: { section: section.id, sentenceId: s.id, text: s.text }
            }, {
              kind: "source",
              chip: "Source " + sid,
              ref: { sourceId: sid },
              claim: { section: section.id, sentenceId: s.id, text: s.text }
            });
          }
        }
      }
    }

    /* ---------- Completeness ---------- */
    for (const rc of moduleSpec.requiredChecks) {
      const done = steps[rc.check];
      if (!done) {
        const attempted = run.trace.steps.find(function (st) { return st.check === rc.check; });
        if (!attempted) {
          push(findings, {
            id: "c" + (findings.length + 1),
            dimension: "completeness",
            severity: "high",
            rule: "skipped_check",
            title: "Skipped required check: " + rc.label,
            note: rc.checkpoint,
            detail: "The run never executed checkpoint " + rc.id + ".",
            missingStep: rc
          }, {
            kind: "missing_step",
            chip: rc.id + " " + rc.label,
            ref: { checkpointId: rc.id }
          });
        } else {
          push(findings, {
            id: "c" + (findings.length + 1),
            dimension: "completeness",
            severity: "medium",
            rule: "check_not_completed",
            title: "Required check not completed: " + rc.label,
            note: "Step status is \"" + attempted.status + "\": " + (attempted.detail || "no detail recorded") + " Checkpoint " + rc.id + ": " + rc.checkpoint,
            detail: "Checkpoint " + rc.id + " was attempted but never reached a completed state.",
            missingStep: rc
          }, {
            kind: "missing_step",
            chip: rc.id + " " + rc.label,
            ref: { checkpointId: rc.id }
          });
        }
      } else if (!done.sourceIds || done.sourceIds.length === 0) {
        push(findings, {
          id: "c" + (findings.length + 1),
          dimension: "completeness",
          severity: "medium",
          rule: "check_without_source",
          title: "Check completed without a recorded source: " + rc.label,
          note: "A completed check must attach the source it used.",
          detail: "Step " + done.id + " completed with no source attached.",
          step: done
        }, {
          kind: "step",
          chip: "Step " + done.id,
          ref: { stepId: done.id }
        });
      }
    }

    /* ---------- Trajectory / Workflow process ---------- */
    for (const step of run.trace.steps) {
      if (step.status === "failed") {
        const retried = run.trace.steps.some(function (s2) {
          return s2.check === step.check && s2.status === "completed" && Date.parse(s2.startedAt) >= Date.parse(step.completedAt);
        });
        if (!retried) {
          push(findings, {
            id: "t" + (findings.length + 1),
            dimension: "trajectory",
            severity: "high",
            rule: "failed_no_retry",
            title: "Check failed without successful retry: " + step.label,
            note: "A failed check must be retried to a completed state before the run closes.",
            detail: step.detail || "",
            step: step
          }, {
            kind: "step",
            chip: "Step " + step.id,
            ref: { stepId: step.id }
          });
        }
      }
      if (step.completedAt && run.reportFinalizedAt && Date.parse(step.completedAt) > Date.parse(run.reportFinalizedAt)) {
        const sid = (step.sourceIds && step.sourceIds[0]) || null;
        push(findings, {
          id: "t" + (findings.length + 1),
          dimension: "trajectory",
          severity: "medium",
          rule: "evidence_after_finalization",
          title: "Evidence retrieved after report finalization: " + step.label,
          note: "Step completed " + step.completedAt + "; report finalized " + run.reportFinalizedAt + ". The run signed off before this evidence was retrieved.",
          detail: (sid ? "Attached source: " + sid + "." : "No source attached to the step."),
          step: step,
          source: sid ? srcs[sid] : null
        }, {
          kind: "step",
          chip: "Step " + step.id,
          ref: { stepId: step.id }
        });
      }
    }

    /* ---------- Format / Deliverable fitness ---------- */
    for (const req of moduleSpec.requiredSections) {
      const present = run.report.sections.some(function (sec) { return sec.id === req.id; });
      if (!present) {
        push(findings, {
          id: "f" + (findings.length + 1),
          dimension: "format",
          severity: "medium",
          rule: "missing_section",
          title: "Missing required section: " + req.label,
          note: "The deliverable must contain every section required by " + moduleSpec.label + ".",
          detail: "Section \"" + req.label + "\" is absent from the report.",
          section: req
        }, {
          kind: "section",
          chip: "Section " + req.label,
          ref: { sectionId: req.id }
        });
      }
    }
    for (const section of run.report.sections) {
      for (const s of section.sentences) {
        if (PLACEHOLDER_RE.test(s.text)) {
          push(findings, {
            id: "f" + (findings.length + 1),
            dimension: "format",
            severity: "medium",
            rule: "placeholder",
            title: "Placeholder text in deliverable",
            note: "Placeholder wording must be resolved before the report ships.",
            detail: "Sentence \"" + s.text + "\" carries placeholder wording.",
            claim: { section: section.id, sentenceId: s.id, text: s.text }
          }, {
            kind: "claim",
            chip: "Claim " + s.id,
            ref: { sentenceId: s.id },
            claim: { section: section.id, sentenceId: s.id, text: s.text }
          });
        }
      }
    }

    /* ---------- integrity: every finding must carry an evidence pointer ---------- */
    const integrity = { allFindingsHaveEvidencePointers: true, violations: [] };
    for (const f of findings) {
      if (!f.ev || !f.ev.kind || !f.ev.chip) {
        integrity.allFindingsHaveEvidencePointers = false;
        integrity.violations.push(f.id);
      }
    }

    /* ---------- dimensions + gate ---------- */
    const dimResults = DIMENSIONS.map(function (d) {
      const fs = findings.filter(function (f) { return f.dimension === d.id; });
      const material = fs.filter(function (f) { return f.severity !== "info"; });
      const pass = material.length === 0;
      const score = pass ? 100 : Math.max(20, 100 - fs.reduce(function (acc, f) { return acc + (SEV_POINTS[f.severity] || 0); }, 0));
      return {
        id: d.id, label: d.label, alt: d.alt,
        pass: pass, score: score,
        findingCount: fs.length,
        materialCount: material.length,
        findingIds: fs.map(function (f) { return f.id; })
      };
    });

    const gate = {
      escalate: dimResults.some(function (d) { return !d.pass; }),
      blockers: findings.filter(function (f) { return f.severity === "high" || f.severity === "medium"; })
    };

    /* ---------- table row: case | pass/fail | reason ---------- */
    let verdict = "PASS";
    let reason = "All four dimensions pass; no material findings. Ship.";
    let failed = [];
    if (!integrity.allFindingsHaveEvidencePointers) {
      verdict = "FAIL";
      reason = "INVALID PACKET: a finding lacks an evidence pointer (" + integrity.violations.join(", ") + ").";
    } else {
      failed = dimResults.filter(function (d) { return !d.pass; });
      if (failed.length) {
        verdict = "FAIL";
        const parts = failed.map(function (d) {
          const top = findings.filter(function (f) { return f.dimension === d.id; }).sort(function (a, b) {
            return severityRank(a.severity) - severityRank(b.severity);
          })[0];
          return d.label + ": " + top.title + " (" + top.ev.chip + ")";
        });
        reason = parts.join("; ") + ".";
      }
    }

    return {
      packetId: "packet-" + run.id + "-" + Date.now(),
      runId: run.id,
      caseId: run.caseId,
      evaluatedAt: new Date().toISOString(),
      generator: "bretton-evaluator-prototype v1.0",
      module: { id: moduleSpec.id, label: moduleSpec.label },
      dimResults: dimResults,
      findings: findings,
      counts: {
        total: findings.length,
        high: findings.filter(function (f) { return f.severity === "high"; }).length,
        medium: findings.filter(function (f) { return f.severity === "medium"; }).length,
        info: findings.filter(function (f) { return f.severity === "info"; }).length
      },
      gate: gate,
      evalTable: { verdict: verdict, reason: reason },
      integrity: integrity
    };
  }

  function severityRank(sev) {
    return sev === "high" ? 0 : sev === "medium" ? 1 : 2;
  }

  function evaluateAll(runs, moduleSpec) {
    const packets = {};
    for (const r of runs) { packets[r.id] = evaluateRun(r, moduleSpec); }
    return packets;
  }

  const BrettonEvaluator = {
    DIMENSIONS: DIMENSIONS,
    evaluateRun: evaluateRun,
    evaluateAll: evaluateAll
  };
  globalScope.BrettonEvaluator = BrettonEvaluator;
  if (typeof module !== "undefined" && module.exports) { module.exports = { BrettonEvaluator: BrettonEvaluator }; }
})(typeof globalThis !== "undefined" ? globalThis : this);
