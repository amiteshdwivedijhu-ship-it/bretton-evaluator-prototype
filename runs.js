/* runs.js - synthetic Bretton-style agent runs (KYC/EDD, all fiction)
 * Public-fiction subjects only. No real customer data, no live bank systems.
 * Load order: before evaluator.js and app.js in the browser.
 */
"use strict";
(function (globalScope) {
  const MODULE = {
    id: "edd-baseline-v2",
    label: "EDD Baseline v2",
    requiredChecks: [
      { id: "EDD-1", check: "entity_registry", label: "Entity registration lookup",
        checkpoint: "Confirm the legal entity exists and its register status is active." },
      { id: "EDD-2", check: "sanctions_screen", label: "Sanctions screening",
        checkpoint: "Screen the subject and principals against applicable sanctions lists and record the hit or miss with the list name and retrieval time." },
      { id: "EDD-3", check: "address_verification", label: "Address verification",
        checkpoint: "Verify the correspondence address against a qualifying address dataset." },
      { id: "EDD-4", check: "pep_check", label: "PEP check",
        checkpoint: "Screen the subject and principals for politically exposed persons." },
      { id: "EDD-5", check: "adverse_media", label: "Adverse media scan",
        checkpoint: "Scan reputable sources for adverse media on the subject and principals." },
      { id: "EDD-6", check: "ownership_lookup", label: "Ownership review",
        checkpoint: "Identify and document beneficial owners." },
      { id: "EDD-7", check: "risk_rating", label: "Risk rating",
        checkpoint: "Apply the risk rating methodology to the completed file." }
    ],
    requiredSections: [
      { id: "entity", label: "Entity profile" },
      { id: "screening", label: "Screening summary" },
      { id: "risk", label: "Risk assessment" },
      { id: "signoff", label: "Sign-off" }
    ]
  };

  /* ---------------- RUN A: complete, grounded ---------------- */
  const runA = {
    id: "run-a",
    caseId: "CASE-2026-0917-A",
    note: "Complete and grounded EDD. Every claim has a source pointer.",
    subject: {
      entity: "ALDERBROOK DISTRIBUTION LIMITED",
      jurisdiction: "United Kingdom",
      regNo: "GB 4482017",
      principal: "J. R. Vankirk (sole principal)"
    },
    agent: { name: "bretton-agent", version: "v1.2.4", runId: "run_4f92a" },
    startedAt: "2026-09-12T08:10:00Z",
    reportFinalizedAt: "2026-09-12T08:42:17Z",
    report: {
      sections: [
        { id: "entity", title: "Entity profile", sentences: [
          { id: "a-entity-1", text: "ALDERBROOK DISTRIBUTION LIMITED is a wholesale distributor of household and consumer goods, registered in England and Wales on 14 March 2011.", sources: ["src-a1"] },
          { id: "a-entity-2", text: "Registered office: Unit 4, Severnside Industrial Estate, Bristol BS11 8HA, United Kingdom.", sources: ["src-a1", "src-a3"] },
          { id: "a-entity-3", text: "The company register status of the entity is Active; no strike-off notice was found.", sources: ["src-a1"] }
        ]},
        { id: "screening", title: "Screening summary", sentences: [
          { id: "a-screen-1", text: "Sanctions screening of the entity and its principal returned no hits across the screening feed.", claimKind: "screen_result", sources: ["src-a2"] },
          { id: "a-screen-2", text: "No subject or principal was identified as a politically exposed person.", claimKind: "pep_result", sources: ["src-a4"] },
          { id: "a-screen-3", text: "The adverse media scan found no adverse items; one neutral mention in a 2019 trade press story was recorded.", claimKind: "media_result", sources: ["src-a5"] },
          { id: "a-screen-4", text: "Correspondence address verification returned a match against the qualifying address dataset.", claimKind: "address_match", sources: ["src-a3"] }
        ]},
        { id: "risk", title: "Risk assessment", sentences: [
          { id: "a-risk-1", text: "The entity operates a low-volume, low-value wholesale ledger with UK-resident counterparties; materiality is low.", sources: ["src-a1"] },
          { id: "a-risk-2", text: "Overall risk rating: Low (12/100) under the EDD Baseline v2 methodology.", claimKind: "risk_claim", sources: ["src-a1", "src-a6"] }
        ]},
        { id: "signoff", title: "Sign-off", sentences: [
          { id: "a-sign-1", text: "All EDD Baseline v2 checkpoints were completed and evidenced; this report is examiner-ready.", claimKind: "meta", sources: [] }
        ]}
      ]
    },
    trace: {
      steps: [
        { id: "st-a1", check: "entity_registry", label: "Entity registration lookup", status: "completed", performedBy: "agent", result: "active",
          detail: "Status active; incorporated 14 Mar 2011; no strike-off notice.", sourceIds: ["src-a1"],
          startedAt: "2026-09-12T08:12:00Z", completedAt: "2026-09-12T08:14:00Z" },
        { id: "st-a2", check: "sanctions_screen", label: "Sanctions screening", status: "completed", performedBy: "agent", result: "miss",
          detail: "0 hits for the entity and principal J. R. Vankirk across the screening feed.", sourceIds: ["src-a2"],
          startedAt: "2026-09-12T08:15:00Z", completedAt: "2026-09-12T08:19:00Z" },
        { id: "st-a3", check: "address_verification", label: "Address verification", status: "completed", performedBy: "agent", result: "match",
          detail: "Registered office matches the national address dataset entry.", sourceIds: ["src-a3"],
          startedAt: "2026-09-12T08:20:00Z", completedAt: "2026-09-12T08:22:00Z" },
        { id: "st-a4", check: "pep_check", label: "PEP check", status: "completed", performedBy: "agent", result: "miss",
          detail: "0 PEP identifiers for entity and principal.", sourceIds: ["src-a4"],
          startedAt: "2026-09-12T08:23:00Z", completedAt: "2026-09-12T08:25:00Z" },
        { id: "st-a5", check: "adverse_media", label: "Adverse media scan", status: "completed", performedBy: "agent", result: "none",
          detail: "1 neutral 2019 trade press mention recorded; no adverse items.", sourceIds: ["src-a5"],
          startedAt: "2026-09-12T08:26:00Z", completedAt: "2026-09-12T08:31:00Z" },
        { id: "st-a6", check: "ownership_lookup", label: "Ownership review", status: "completed", performedBy: "agent", result: "2 beneficial owners",
          detail: "J. R. Vankirk 82%, A. Vankirk 18% via direct holdings.", sourceIds: ["src-a6"],
          startedAt: "2026-09-12T08:32:00Z", completedAt: "2026-09-12T08:35:00Z" },
        { id: "st-a7", check: "risk_rating", label: "Risk rating", status: "completed", performedBy: "agent", result: "low",
          detail: "Score 12/100 under the EDD Baseline v2 methodology.", sourceIds: ["src-a1", "src-a2", "src-a3", "src-a4", "src-a5", "src-a6"],
          startedAt: "2026-09-12T08:36:00Z", completedAt: "2026-09-12T08:40:00Z" },
        { id: "st-a8", check: "reviewer_review", label: "Second-person review", status: "completed", performedBy: "human", result: "no-gaps",
          detail: "Findings and sources re-checked by a second reviewer; no gaps.", sourceIds: [],
          startedAt: "2026-09-12T08:41:00Z", completedAt: "2026-09-12T08:42:00Z" }
      ],
      sources: [
        { id: "src-a1", name: "Company register: Companies House (UK)", kind: "registry", retrievedAt: "2026-09-10T09:14:00Z", detail: "Company profile, status, registered office." },
        { id: "src-a2", name: "Sanctions screening feed (synthetic global index)", kind: "screening", retrievedAt: "2026-09-11T10:02:00Z", detail: "0 hits, entity and principal." },
        { id: "src-a3", name: "National address dataset (UK, synthetic)", kind: "address", retrievedAt: "2026-09-11T10:11:00Z", detail: "Address entry for registered office." },
        { id: "src-a4", name: "PEP screening index (GB subset, synthetic)", kind: "screening", retrievedAt: "2026-09-11T10:15:00Z", detail: "0 PEP identifiers." },
        { id: "src-a5", name: "Adverse media corpus (synthetic news archive)", kind: "media", retrievedAt: "2026-09-11T13:40:00Z", detail: "1 neutral 2019 trade press mention." },
        { id: "src-a6", name: "Registry of beneficial ownership (UK, synthetic)", kind: "ownership", retrievedAt: "2026-09-11T13:52:00Z", detail: "Shareholding percentages." }
      ]
    }
  };

  /* ---------------- RUN B: unsupported sanctions clearance ---------------- */
  const runB = {
    id: "run-b",
    caseId: "CASE-2026-0918-B",
    note: "Report claims a sanctions clear. The run never retrieved hit/miss evidence.",
    subject: {
      entity: "NORDPORT COMMODITIES B.V.",
      jurisdiction: "Netherlands",
      regNo: "NL 88412076",
      principal: "L. Dekkers (sole beneficial owner)"
    },
    agent: { name: "bretton-agent", version: "v1.2.4", runId: "run_77cd2" },
    startedAt: "2026-09-12T11:05:00Z",
    reportFinalizedAt: "2026-09-12T11:37:00Z",
    report: {
      sections: [
        { id: "entity", title: "Entity profile", sentences: [
          { id: "b-entity-1", text: "NORDPORT COMMODITIES B.V. is a commodities trading company registered in the Netherlands on 3 February 2019.", sources: ["src-b1"] },
          { id: "b-entity-2", text: "Registered address: Westerkade 12, 3016 CP Rotterdam, Netherlands.", sources: ["src-b1", "src-b3"] }
        ]},
        { id: "screening", title: "Screening summary", sentences: [
          { id: "b-screen-1", text: "Sanctions screening returned no matches for the entity or its principal.", claimKind: "screen_result", sources: [] },
          { id: "b-screen-2", text: "No politically exposed persons were identified among the entity or its principal.", claimKind: "pep_result", sources: ["src-b4"] },
          { id: "b-screen-3", text: "No adverse media items were found for the entity or its principal.", claimKind: "media_result", sources: ["src-b5"] },
          { id: "b-screen-4", text: "Registered address verification returned a match; the registered address is current.", claimKind: "address_match", sources: ["src-b3"] }
        ]},
        { id: "risk", title: "Risk assessment", sentences: [
          { id: "b-risk-1", text: "Risk rating: TBD, pending completion of the sanctions screening evidence.", sources: [] }
        ]},
        { id: "signoff", title: "Sign-off", sentences: [
          { id: "b-sign-1", text: "The case file has been assembled for examiner review.", claimKind: "meta", sources: [] }
        ]}
      ]
    },
    trace: {
      steps: [
        { id: "st-b1", check: "entity_registry", label: "Entity registration lookup", status: "completed", performedBy: "agent", result: "active",
          detail: "Status active; incorporated 3 Feb 2019.", sourceIds: ["src-b1"],
          startedAt: "2026-09-12T11:06:00Z", completedAt: "2026-09-12T11:08:00Z" },
        { id: "st-b2", check: "address_verification", label: "Address verification", status: "completed", performedBy: "agent", result: "match",
          detail: "Registered address matches the address dataset entry.", sourceIds: ["src-b3"],
          startedAt: "2026-09-12T11:10:00Z", completedAt: "2026-09-12T11:12:00Z" },
        { id: "st-b3", check: "pep_check", label: "PEP check", status: "completed", performedBy: "agent", result: "miss",
          detail: "0 PEP identifiers for entity and principal.", sourceIds: ["src-b4"],
          startedAt: "2026-09-12T11:13:00Z", completedAt: "2026-09-12T11:15:00Z" },
        { id: "st-b4", check: "adverse_media", label: "Adverse media scan", status: "completed", performedBy: "agent", result: "none",
          detail: "No adverse items.", sourceIds: ["src-b5"],
          startedAt: "2026-09-12T11:16:00Z", completedAt: "2026-09-12T11:21:00Z" },
        { id: "st-b5", check: "ownership_lookup", label: "Ownership review", status: "completed", performedBy: "agent", result: "1 beneficial owner",
          detail: "L. Dekkers holds 100% via holding vehicle HBK B.V. (synthetic).", sourceIds: ["src-b6"],
          startedAt: "2026-09-12T11:22:00Z", completedAt: "2026-09-12T11:24:00Z" },
        { id: "st-b6", check: "risk_rating", label: "Risk rating", status: "blocked", performedBy: "agent", result: null,
          detail: "Blocked: waiting on sanctions screening evidence (EDD-2).", sourceIds: [],
          startedAt: "2026-09-12T11:25:00Z", completedAt: "2026-09-12T11:26:00Z" }
      ],
      sources: [
        { id: "src-b1", name: "Company register: KvK Handelsregister (NL, synthetic)", kind: "registry", retrievedAt: "2026-09-12T11:07:00Z", detail: "Company profile, status." },
        { id: "src-b3", name: "National address dataset (NL, synthetic)", kind: "address", retrievedAt: "2026-09-12T11:11:00Z", detail: "Address entry for registered address." },
        { id: "src-b4", name: "PEP screening index (NL subset, synthetic)", kind: "screening", retrievedAt: "2026-09-12T11:14:00Z", detail: "0 PEP identifiers." },
        { id: "src-b5", name: "Adverse media corpus (synthetic news archive)", kind: "media", retrievedAt: "2026-09-12T11:20:00Z", detail: "No adverse items." },
        { id: "src-b6", name: "Registry of beneficial ownership (NL, synthetic)", kind: "ownership", retrievedAt: "2026-09-12T11:23:00Z", detail: "Direct and indirect holdings." }
      ]
    }
  };

  /* ---------------- RUN C: skipped address verification ---------------- */
  const runC = {
    id: "run-c",
    caseId: "CASE-2026-0919-C",
    note: "Skips the required address verification step and asserts the address anyway.",
    subject: {
      entity: "ORIENT GULF TRADING PTE. LTD.",
      jurisdiction: "Singapore",
      regNo: "SG 202312441K",
      principal: "S. K. Balaji (sole beneficial owner)"
    },
    agent: { name: "bretton-agent", version: "v1.2.4", runId: "run_a51e8" },
    startedAt: "2026-09-12T14:20:00Z",
    reportFinalizedAt: "2026-09-12T15:00:00Z",
    report: {
      sections: [
        { id: "entity", title: "Entity profile", sentences: [
          { id: "c-entity-1", text: "ORIENT GULF TRADING PTE. LTD. is an import and distribution company incorporated in Singapore on 8 June 2023.", sources: ["src-c1"] },
          { id: "c-entity-2", text: "Registered address: 22 Boon Lay Road, Singapore 649920.", sources: ["src-c1"] }
        ]},
        { id: "screening", title: "Screening summary", sentences: [
          { id: "c-screen-1", text: "Sanctions screening returned no hits for the entity or its principal.", claimKind: "screen_result", sources: ["src-c2"] },
          { id: "c-screen-2", text: "No politically exposed persons were identified.", claimKind: "pep_result", sources: ["src-c4"] },
          { id: "c-screen-3", text: "The adverse media scan returned no adverse items.", claimKind: "media_result", sources: ["src-c5"] },
          { id: "c-screen-4", text: "Correspondence address verification against the national address dataset returned a match.", claimKind: "address_match", sources: [] }
        ]},
        { id: "risk", title: "Risk assessment", sentences: [
          { id: "c-risk-1", text: "Overall risk rating: Low (22/100) under the EDD Baseline v2 methodology.", claimKind: "risk_claim", sources: ["src-c1", "src-c6"] }
        ]},
        { id: "signoff", title: "Sign-off", sentences: [
          { id: "c-sign-1", text: "All checkpoints are complete and the report is examiner-ready.", claimKind: "meta", sources: [] }
        ]}
      ]
    },
    trace: {
      steps: [
        { id: "st-c1", check: "entity_registry", label: "Entity registration lookup", status: "completed", performedBy: "agent", result: "active",
          detail: "Status active; incorporated 8 Jun 2023.", sourceIds: ["src-c1"],
          startedAt: "2026-09-12T14:21:00Z", completedAt: "2026-09-12T14:23:00Z" },
        { id: "st-c2", check: "sanctions_screen", label: "Sanctions screening", status: "completed", performedBy: "agent", result: "miss",
          detail: "0 hits for entity and principal.", sourceIds: ["src-c2"],
          startedAt: "2026-09-12T14:24:00Z", completedAt: "2026-09-12T14:28:00Z" },
        { id: "st-c3", check: "pep_check", label: "PEP check", status: "completed", performedBy: "agent", result: "miss",
          detail: "0 PEP identifiers.", sourceIds: ["src-c4"],
          startedAt: "2026-09-12T14:29:00Z", completedAt: "2026-09-12T14:31:00Z" },
        { id: "st-c4", check: "adverse_media", label: "Adverse media scan", status: "completed", performedBy: "agent", result: "none",
          detail: "Long-running scan; completed after the report was finalized.", sourceIds: ["src-c5"],
          startedAt: "2026-09-12T14:32:00Z", completedAt: "2026-09-12T15:03:10Z" },
        { id: "st-c5", check: "ownership_lookup", label: "Ownership review", status: "completed", performedBy: "agent", result: "1 beneficial owner",
          detail: "S. K. Balaji holds 100%.", sourceIds: ["src-c6"],
          startedAt: "2026-09-12T14:46:00Z", completedAt: "2026-09-12T14:48:00Z" },
        { id: "st-c6", check: "risk_rating", label: "Risk rating", status: "completed", performedBy: "agent", result: "low",
          detail: "Score 22/100 under the EDD Baseline v2 methodology.", sourceIds: ["src-c1", "src-c6"],
          startedAt: "2026-09-12T14:50:00Z", completedAt: "2026-09-12T14:52:00Z" }
      ],
      sources: [
        { id: "src-c1", name: "Company register: ACRA (SG, synthetic)", kind: "registry", retrievedAt: "2026-09-12T14:22:00Z", detail: "Company profile, status, registered address." },
        { id: "src-c2", name: "Sanctions screening feed (synthetic global index)", kind: "screening", retrievedAt: "2026-09-12T14:25:00Z", detail: "0 hits, entity and principal." },
        { id: "src-c4", name: "PEP screening index (SG subset, synthetic)", kind: "screening", retrievedAt: "2026-09-12T14:30:00Z", detail: "0 PEP identifiers." },
        { id: "src-c5", name: "Adverse media corpus (synthetic news archive)", kind: "media", retrievedAt: "2026-09-12T15:03:10Z", detail: "No adverse items. Retrieved after report finalization." },
        { id: "src-c6", name: "Registry of beneficial ownership (SG, synthetic)", kind: "ownership", retrievedAt: "2026-09-12T14:47:00Z", detail: "Direct holdings." }
      ]
    }
  };

  const RUNS = [runA, runB, runC];

  globalScope.RUNS = RUNS;
  globalScope.MODULE = MODULE;
  if (typeof module !== "undefined" && module.exports) { module.exports = { RUNS: RUNS, MODULE: MODULE }; }
})(typeof globalThis !== "undefined" ? globalThis : this);
