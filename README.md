# Bretton Evaluator prototype

A workbench-style quality packet for agent runs, built as an unofficial prototype in Bretton's visual language. Given a synthetic agent run (case report draft plus tool/evidence trace), it returns a deterministic quality packet scoring Completeness, Groundedness (Claim support), Trajectory (Workflow process), and Format (Deliverable fitness).

Every finding carries an evidence pointer to a specific claim, source, or missing step, and a ship or escalate gate closes the packet. The grader is fully deterministic: structural rules over the run trace, no LLM judge.

## Demo runs (90 second walkthrough)

- Run A: complete, grounded EDD case. All four dimensions pass, ship.
- Run B: report claims a sanctions clear without retrieved hit/miss evidence. Groundedness fails on the cited sentence, escalate.
- Run C: required address verification skipped. Completeness and Trajectory fail naming the step, escalate.

## Run it locally

Open `index.html` in a browser, or serve the folder, e.g. `python3 -m http.server 8000`.

No build step, no dependencies.

## Notes

- All subjects, traces, and sources are synthetic fiction. No real customer data, no live bank systems.
- Unofficial prototype built from Bretton public materials only (bretton.com, the Evaluator blog posts, and the public site palette).
- Rubric vocabulary follows Bretton's published evaluator dimensions: Completeness, Groundedness / Claim support, Trajectory / Workflow process, Format / Deliverable fitness.
