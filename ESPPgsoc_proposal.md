# GSoC 2026 Proposal: Regression Tests Expansion for ESP-Website

**Organization:** Learning Unlimited / ESP-Website  
**Project Idea:** https://github.com/learning-unlimited/ESP-Website/issues/3780  
**Contributor:** Mohd Adeeb  
**Email:** mdadeeb.2005@gmail.com  
**GitHub:** github.com/dewolf1  
**Timezone:** IST (UTC+5:30)  
**Project Size:** 175 hours (Standard)

## Abstract

ESP-Website powers high-stakes educational programs for thousands of students every year. Yet large parts of its core Django “Program Modules” — the code that runs onsite registration, admin exports, and financial accounting — have **zero automated test coverage**.

While recent community contributions have covered some documented areas, my own coverage audit revealed that dozens of mission-critical modules remain completely untested. This proposal targets three high-risk, 0%-coverage modules that directly affect real program operations:

- `onsiteclasslist.py` (onsite registration & schedule collisions)  
- `listgenmodule.py` (dynamic admin data exports)  
- `studentextracosts.py` (financial line items & accounting)

By the end of the project these modules will have **≥85–90% test coverage**, robust regression protection, and improved test infrastructure that benefits the entire codebase.

## About Me

I am Mohd Adeeb, a B.Tech Computer Science student (IoT & CS) from New Delhi. I have been writing Django tests professionally for the last two years and recently contributed regression test suites to open-source Django-based projects.

Before writing this proposal I cloned the ESP-Website repository, ran a full `pytest --cov` analysis on `esp/program/modules/handlers/`, and identified exactly which complex modules were still at 0% coverage. I also reproduced several edge cases (schedule collisions, dynamic CSV exports, and accounting edge cases) locally. This hands-on audit convinced me that the original issue #3780 only scratched the surface — the real testing debt is deeper and more critical.

## Problem & Target Selection

Many program modules use raw SQL (`.extra()` / `.annotate()`), Python reflection (`dir()`), and direct calls to `IndividualAccountingController`. Any change to `ESPUser`, `ClassSection`, or `LineItemType` can silently break production behaviour.

Because the explicitly listed modules in #3780 are already being claimed by other contributors, I am expanding the scope to three entirely new, high-value targets that currently have **zero tests**:

### 1. `onsiteclasslist.py` (491 lines, 0% coverage)
The live “OnSite Registration” interface used by admins on program day. Contains 10+ JSON API endpoints and the critical `update_schedule_json` method that handles real-time schedule collisions and capacity overrides.

### 2. `listgenmodule.py` (488 lines, 0% coverage)
The admin export engine that generates CSV/HTML reports using heavy Python reflection. Any schema change breaks exports silently.

### 3. `studentextracosts.py` (360 lines, 0% coverage)
Handles optional fees, sibling discounts, and direct integration with the accounting controller. A regression here can cause incorrect charges or lost financial records.

## Proof of Work (Already Done)

- Full coverage report generated and analysed (`pytest --cov`).
- Local reproduction of key failure modes (schedule collision logic, dynamic CSV generation, accounting POST flows).
- Identified exact test fixtures needed (ProgramFrameworkTest + realistic Student/Teacher profiles).

## Detailed Technical Plan

### Work Item 1: `onsiteclasslist.py`
- Class-level `setUpTestData()` fixtures for speed.  
- Full test coverage for all GET JSON endpoints (`catalog_status`, `students_status`, `checkin_status`, etc.).  
- Rigorous mutation tests for `update_schedule_json` (collision handling, `override=True`, capacity bypass).  
**Goal:** ≥85% coverage.

### Work Item 2: `listgenmodule.py`
- Parameterised unit tests for `UserAttributeGetter` across 30+ reflected fields with Teacher/Student edge cases.  
- End-to-end tests for `generateList` (HTML + CSV output, pagination, header integrity).  
**Goal:** ≥90% coverage.

### Work Item 3: `studentextracosts.py`
- Comprehensive fixtures for all `LineItemType` variants (boolean, quantitative, dropdown, custom amounts).  
- Form rendering + POST tests that verify `IndividualAccountingController.apply_preferences()` and resulting `Transfer` rows.  
**Goal:** ≥90% coverage.

### Work Item 4: Test Infrastructure Improvements
- Migrate existing program-module tests from `setUp()` to `setUpTestData()` (with documentation).  
- Add `codecov.yml` thresholds to prevent coverage regression on future PRs.  
- Write `docs/dev/testing.md` guide for new contributors.

## Timeline (175 hours)

**Community Bonding (May 1 – May 26)**  
- Set up local Docker environment.  
- Share coverage report and proposed fixtures with mentors.  
- Finalise `setUpTestData` strategy.

| Week | Focus                              | Deliverables                                      |
|------|------------------------------------|---------------------------------------------------|
| 1–2  | onsiteclasslist (GET + POST)      | API + collision tests, first PR                  |
| 3–4  | listgenmodule (attributes + exports) | Full UserAttributeGetter + generateList tests, second PR |
| 5–6  | studentextracosts                 | Line-item + accounting tests, third PR           |
| 7    | Infrastructure + Polish           | `setUpTestData` migration, codecov thresholds, testing.md guide |
| 8    | Buffer + Final Review             | Address PR feedback, final report                |

## Why I Will Succeed

- I already performed the audit and reproduced the riskiest code paths locally — the project starts with zero unknowns.  
- I have real experience writing Django regression suites and understand the performance/correctness trade-offs of `setUpTestData` vs `setUp`.  
- I prioritise the modules that can cause the most damage to real programs (onsite registration and accounting).  
- I communicate early and often — weekly updates and PRs submitted as soon as each module is ready.

After GSoC I plan to continue maintaining these tests and help review future testing PRs.

---

**Proposal Size:** ~950 words  
**Submitted for Google Summer of Code 2026**
