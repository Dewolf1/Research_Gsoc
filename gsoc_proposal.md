# GSoC 2026 Proposal: Regression Tests Expansion for ESP-Website

---

**Organization:** Learning Unlimited / ESP-Website  
**Project Title:** Regression Tests Expansion  
**Project Idea Link:** https://github.com/learning-unlimited/ESP-Website/issues/3780  
**Contributor:** [YOUR FULL NAME]  
**Email:** [YOUR EMAIL]  
**GitHub:** [YOUR GITHUB HANDLE]  
**Time Zone:** [YOUR TIMEZONE, e.g., IST (UTC+5:30)]  
**Expected Project Length:** 175 hours (Standard)

---

## Abstract

ESP-Website is a Django-based platform used by Learning Unlimited chapters across the United States to run educational programs for thousands of students annually. Despite an automated CI/CD pipeline with Codecov integration, a significant portion of the codebase lacks automated test coverage. During my pre-proposal research I directly audited the codebase and found concrete evidence of the problem: a Python 2-era runtime crash hiding in an untested diagnostic method, an entire test file with 29 well-written tests that never runs in CI due to a missing import, and 16 JavaScript test specs with no CI integration. This proposal describes a systematic plan to close these gaps through new unit tests, improved CI configuration, and contributor documentation.

---

## About Me

**Name:** [YOUR FULL NAME]  
**University:** [YOUR UNIVERSITY]  
**Degree & Year:** [e.g., B.Tech Computer Science, 3rd Year]  
**Programming Languages:** Python, JavaScript, SQL  
**Relevant Experience:**  
[Write 2–3 sentences here. For example: "I have built and maintained test suites for Django web applications in [X project]. I am comfortable with pytest, Django's TestCase, and have used Codecov in CI pipelines. I have contributed to [open source project / personal project] and understand how to write fixture-based tests for database-heavy applications."]

**Why this project?**  
I want to contribute to a codebase that runs real educational programs for real students. After reading the issue description, I spent time auditing the actual source code before writing this proposal. That research turned up concrete bugs that tests would have prevented — which I've documented below. This project aligns with my interest in improving software reliability through systematic test coverage.

---

## Understanding the Problem

### The Current State

ESP-Website has automated CI via GitHub Actions ([.github/workflows/tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml)) powered by `pytest-django`. Coverage is reported to Codecov after every push. The test runner command is:

```bash
pytest -n auto --cov=. --cov-report=xml
```

However, the CI workflow runs **only Python tests** — there is no JavaScript test step despite 16 Jasmine spec files existing in the repository.

Test files for program modules are co-located in `esp/program/modules/tests/`, but they must be **manually imported** into [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) to be discovered by pytest. This non-standard pattern means new test files are silently skipped if the developer forgets to add the import.

### Concrete Evidence of the Problem

During my codebase audit I found three facts that demonstrate the urgency:

**Finding 1: A complete test file silently never runs in CI**  
[esp/program/modules/tests/studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) contains **29 test methods** across 573 lines covering the [StudentRegTwoPhase](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#56-561) module. However, the file is **not imported in [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py)**, so pytest never discovers or runs it. This is a high-impact immediate fix: one line added to [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) would instantly bring 29 tests into the CI pipeline.

```python
# This import is MISSING from __init__.py:
from esp.program.modules.tests.studentregtwophase import StudentRegTwoPhaseTest
```

**Finding 2: A Python 2 runtime crash hidden by missing tests**  
[esp/program/modules/handlers/schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py), line 368:

```python
classes = str1.join([unicode(c) for c in classes])
```

`unicode()` is a Python 2 built-in that **does not exist in Python 3**. Calling [hungry_teachers()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382), one of the scheduling diagnostic methods, causes a `NameError` crash at runtime. This bug has existed undetected because the method has never been tested. Writing a test for [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) would instantly catch it — and the fix is a one-character change (`unicode` → [str](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#445-537)).

**Finding 3: 15 of 16 JavaScript spec files have never been runnable**  
`esp/public/media/scripts/ajaxschedulingmodule/spec/` contains 16 Jasmine 1.3 spec files. There is one HTML runner at [esp/public/media/scripts/jasmine/SpecRunner.html](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/jasmine/SpecRunner.html), but it only includes [DirectorySpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/DirectorySpec.js) — the other 15 specs have **no runner at all** and have never been executed anywhere. None of the specs run in CI.

---

## Scope & Issues Addressed

### Issues Already Resolved (acknowledged, not re-proposed)

| Issue | Status | Evidence |
|-------|--------|---------|
| #599 Dashboard JSON tests | ✅ Merged (PR #4196) | [jsondatamodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py) — 383 lines, 15+ tests |
| #794 editclass/makeaclass tests | ✅ Merged (PR #4292) | [test_class_creation.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/test_class_creation.py) — 5 test classes |
| #3460 Fix selenium tests | ✅ Merged (PR #4339) | [seltests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/seltests.py) uses `StaticLiveServerTestCase` |

*I am not re-proposing any of these. Only unresolved work is described below.*

### Issues Proposed for This Project

| # | Issue | My Planned Contribution |
|---|-------|------------------------|
| #933 | TwoPhaseStudentReg tests | Fix [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py); add [save_priorities](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#361-444) success path; add auth test |
| #3773 | Scheduling Checks tests | 9+ new test methods; fix [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) Python 3 crash |
| #1452 | Ajax autocomplete tests | View-layer edge cases (limit, routing, content-type bug) |
| #3457 | JS tests in CI | Jest setup, spec migration, new CI workflow step |
| — | Test infrastructure | [setUpTestData](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) pattern; `docs/dev/testing.md`; Codecov threshold |

---

## Detailed Technical Plan

### Work Item 1: Fix [studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) CI registration (#933)

**File:** [esp/program/modules/tests/__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/__init__.py)  
**Change:** Add one import line.

**Additionally**, the handler ([studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py), 561 lines) has one untested path: the success branch of [save_priorities](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#361-444). This view accepts a JSON body of class priorities per timeslot and creates/updates `StudentRegistration` objects. I will write:

- `test_save_priorities_success` — posts valid priority JSON and asserts `StudentRegistration` objects are created with correct `relationship` and linked [section](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py#47-53)
- `test_studentreg2phase_requires_login` — asserts unauthenticated GET redirects to the login page

**Test setup pattern used:** `ProgramFrameworkTest` (existing base class). For [save_priorities](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#361-444), I need to also create a `StudentSubjectInterest` linking the student to a real [ClassSubject](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#312-320), and post JSON with a valid timeslot ID.

---

### Work Item 2: Expand Scheduling Checks tests (#3773)

**File to modify:** [esp/program/modules/tests/schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py)

**Important technical constraint:** `SchedulingCheckRunner.__init__` calls `get_current_request()` (line 118 of the handler), which reads from a Django thread-local. Tests must call:

```python
from esp.middleware.threadlocalrequest import ThreadLocals
request = RequestFactory().get('/')
ThreadLocals().process_request(request)
```

This pattern is already used in the 5 existing tests — I will follow it exactly.

**New test methods planned:**

| Test Method | What It Verifies |
|-------------|-----------------|
| `test_teachers_teaching_two_classes_same_time` | Same teacher assigned to 2 sections in same timeslot appears in report |
| `test_no_conflict_not_reported` | Teacher with non-overlapping sections produces empty report |
| `test_multiple_classes_same_resource_same_time` | Same room assigned to 2 sections in same slot is flagged |
| `test_room_capacity_mismatch` | Class with `class_size_max` > 1.5× room capacity appears in results |
| `test_classes_wrong_length` | Section whose timeslot span ≠ `duration` is flagged |
| `test_unapproved_scheduled_classes` | Section with `status=-10` that has a room assignment is flagged |
| `test_teachers_unavailable` | Teacher with no recorded availability in a scheduled slot appears |
| `test_incompletely_scheduled_classes` | Section with 2 timeslots but only 1 room assignment is flagged |
| `test_lunch_blocks_no_lunch_classes` | No lunch classes → empty result list |
| `test_hungry_teachers_no_crash` | Method runs without `NameError`; fixes the `unicode()` bug |

**Bug fix bundled with PR:**  
[schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py) line 368: change `unicode(c)` → [str(c)](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#445-537). This is a single-character fix but demonstrates that tests serve as a safety net for exactly this kind of silent regression.

---

### Work Item 3: Ajax Autocomplete View Tests (#1452)

**Existing coverage:** [esp/users/tests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py) [AjaxAutocompleteViewTest](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#796-871) (lines 796–870) covers authentication and basic staff/non-staff access control. [esp/users/tests_autocomplete.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests_autocomplete.py) covers the model method `ESPUser.ajax_autocomplete()`.

**What is missing at the view layer:**

1. **Response format verification** — no test checks that `result[0]` has both [id](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#280-293) and `ajax_str` keys, or that `ajax_str` includes both name and id (e.g., `"Springfield Academy (3)"`)
2. **`limit` parameter** — no test that `limit=1` caps output to 1 result
3. **`ajax_func` routing** — no test that passing `ajax_func=ajax_autocomplete_student` calls the student-specific method
4. **[prog](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#50-54) edge case** — no test that an invalid [prog](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#50-54) ID (non-numeric or non-existent) returns valid results rather than a 500

**Bug to surface and optionally fix:**  
[esp/db/views.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/db/views.py) line 68 returns `content_type='javascript/javascript'` — a non-standard MIME type (`application/json` is correct). I will write a test that asserts the content type equals `application/json`, which will fail and make this bug visible. The fix and whether to include it in this PR is a mentor decision.

---

### Work Item 4: JavaScript Tests in CI (#3457)

**Current state:**
- 16 Jasmine 1.3 spec files in `ajaxschedulingmodule/spec/`
- Only [DirectorySpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/DirectorySpec.js) even has an HTML runner (which is also not in CI)
- The remaining 15 specs have never been executed anywhere

**Technical challenge:**  
Jasmine 1.3 uses a deprecated async API (`runs()`, `waits()`) removed in Jasmine 2.x and absent from Jest. The ESP JavaScript also uses no module system — all files define globals via [prototype.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/prototype.js). Jest expects CommonJS or ESM exports.

**My approach (Jest + jsdom):**

*Phase 1 — infrastructure:*
1. Add `package.json` with `jest` and `jest-environment-jsdom`
2. Write a module-wrapper shim: load the source file into a `<script>`-like context in jsdom, expose the global classes, then require them from the test
3. Add a CI step to [.github/workflows/tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml):
   ```yaml
   - name: Set up Node.js 20
     uses: actions/setup-node@v4
     with:
       node-version: 20
   - name: Install JS dependencies
     run: npm ci
   - name: Run JS unit tests
     run: npm test
   ```

*Phase 2 — test migration (prioritized by size/importance):*

| Spec File | Lines | Approach |
|-----------|-------|----------|
| [MatrixSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/MatrixSpec.js) | 8550 bytes (largest) | Rewrite `runs()/waits()` → `async/await` |
| [SectionsSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/SectionsSpec.js) | 9544 bytes | Rewrite async API |
| [CellSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/CellSpec.js) | 6146 bytes | Rewrite async API |
| [ApiClientSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/ApiClientSpec.js) | 5630 bytes | Rewrite async API; mock `XMLHttpRequest` |
| [DirectorySpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/DirectorySpec.js) | 3656 bytes | Already semi-working; clean up |
| Remaining 11 | < 3KB each | Rewrite or mark as follow-up |

**Coverage goal:** At minimum `MatrixSpec`, `SectionsSpec`, `CellSpec`, and `ApiClientSpec` migrated and passing in CI (these cover the core scheduling logic). Remaining specs as time allows.

---

### Work Item 5: Test Infrastructure Improvements

**5a. Switch expensive [setUp()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#880-900) to [setUpTestData()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72)**

`ProgramFrameworkTest.setUp()` creates a full program environment on every test method, making the suite slow. The [jsondatamodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py) tests already solve this by using Django's [setUpTestData()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) (called once per class, wrapped in a transaction savepoint). I will apply this pattern to the new test classes I write, and document it.

**5b. Improve pytest test discovery for `modules/tests/`**

Add `testpaths` to [pytest.ini](file:///home/dewolf/OpenSource/esp/devsite/esp/pytest.ini) so that `modules/tests/*.py` files are auto-discovered without requiring a manual [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) import:

```ini
testpaths = esp
```

Combined with [conftest.py](file:///home/dewolf/OpenSource/esp/devsite/esp/conftest.py) adjustments, this eliminates the silent-skip problem.

**5c. Codecov threshold configuration**

Add to [codecov.yml](file:///home/dewolf/OpenSource/esp/devsite/codecov.yml):
```yaml
coverage:
  status:
    patch:
      default:
        target: 80%
        threshold: 2%
```

This fails new PRs if they introduce more than 2 percentage points of coverage regression on changed files.

**5d. Documentation: `docs/dev/testing.md`**

A guide covering:
- How to run the test suite locally and in Docker
- The `ProgramFrameworkTest` / [setUpTestData](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) pattern
- How to register new module test files
- How to run JavaScript tests (`npm test`)
- How to run Selenium tests
- Testing patterns: mocking the thread-local request for [SchedulingCheckRunner](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#108-857)

---

## Timeline

**Community Bonding Period (May 1 — May 26, 2026)**
- Get development environment running in Docker
- Read all mentor-linked issues and open PRs
- Post a "How I'll track my progress" blog-style update on the mailing list
- Verify open PRs related to this project; align with mentors to avoid duplication
- Submit first micro-PR: fix the [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) import for [studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py)

| Week | Dates | Deliverable |
|------|-------|------------|
| **1** | May 27 – Jun 2 | Fix [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py); add `test_save_priorities_success` and `test_studentreg2phase_requires_login`; open PR |
| **2** | Jun 3 – Jun 9 | Add `ThreadLocals` test helper; write `test_teachers_teaching_two_classes_same_time` and `test_no_conflict_not_reported` |
| **3** | Jun 10 – Jun 16 | Write `test_multiple_classes_same_resource_same_time`, `test_room_capacity_mismatch`, `test_classes_wrong_length` |
| **4** | Jun 17 – Jun 23 | Write `test_unapproved_scheduled_classes`, `test_teachers_unavailable`, `test_incompletely_scheduled_classes` |
| **5** | Jun 24 – Jun 30 | Write `test_lunch_blocks_no_lunch_classes`, `test_hungry_teachers_no_crash`; fix `unicode()` bug; open PR for all scheduling tests |
| **6** | Jul 1 – Jul 7 | **Midterm evaluation** — all Python test PRs open/merged; start autocomplete view-layer tests |
| **7** | Jul 8 – Jul 14 | Write autocomplete `limit`, `ajax_func` routing, response format, and [prog](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#50-54) edge-case tests; surface content-type bug |
| **8** | Jul 15 – Jul 21 | JS setup: add `package.json`, write module-wrapper shim, port [DirectorySpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/DirectorySpec.js) to Jest |
| **9** | Jul 22 – Jul 28 | Port [MatrixSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/MatrixSpec.js) (largest, most important): rewrite `runs()/waits()` to `async/await` |
| **10** | Jul 29 – Aug 4 | Port [SectionsSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/SectionsSpec.js) and [CellSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/CellSpec.js) |
| **11** | Aug 5 – Aug 11 | Port [ApiClientSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/ApiClientSpec.js); add CI step to [tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml); confirm green build |
| **12** | Aug 12 – Aug 18 | Apply [setUpTestData](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) pattern to new test classes; add Codecov threshold config; write `docs/dev/testing.md` |
| **13** | Aug 19 – Aug 25 | Buffer: address review feedback, fix any flaky tests, clean up PRs |

**Final Evaluation:** Aug 25, 2026

---

## Deliverables Summary

| Deliverable | Type | PR Target |
|-------------|------|-----------|
| Fix [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) for [studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) | Bug fix | Week 1 |
| 2 new tests for [StudentRegTwoPhase](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#56-561) | Unit tests | Week 1 |
| 9–10 new tests for [SchedulingCheckRunner](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#108-857) | Unit tests | Week 5 |
| Fix [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) `unicode()` crash | Bug fix | Week 5 |
| 4 new tests for autocomplete view layer | Unit tests | Week 7 |
| `package.json` + Jest module shim | Infrastructure | Week 8 |
| Jasmine → Jest migration (4 spec files) | JS tests | Weeks 8–11 |
| CI `npm test` step in [tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml) | CI | Week 11 |
| [setUpTestData](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) pattern applied | Refactor | Week 12 |
| Codecov threshold in [codecov.yml](file:///home/dewolf/OpenSource/esp/devsite/codecov.yml) | Config | Week 12 |
| `docs/dev/testing.md` | Documentation | Week 12 |

**Minimum coverage increase expected:** The scheduling check module goes from ~5% to >65% coverage. The [studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) module (currently 0% in CI) becomes fully represented.

---

## Why I Will Succeed

**I have already done the research.** Most proposals are written from the issue description alone. I spent time reading the actual source files, grepping for patterns, tracing function call chains, and cross-checking claims before writing a single line of this proposal. The bugs I found (the `unicode()` crash, the missing [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) import) are real, verifiable, and fixable.

**I understand the test infrastructure.** I know that [SchedulingCheckRunner](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#108-857) requires `ThreadLocals().process_request(request)` in test setup. I know that `ProgramFrameworkTest.setUp()` is expensive and that [setUpTestData()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) is the right solution. I know the difference between what the tests in [users/tests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py) cover vs. what [users/tests_autocomplete.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests_autocomplete.py) covers for the autocomplete feature.

**My timeline is grounded in file sizes and complexity.** I prioritized [MatrixSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/MatrixSpec.js) and [SectionsSpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/SectionsSpec.js) (the two largest, most complex spec files) for JS migration because that's where the most value is. I allocated more time to the scheduling module (3 weeks) than to autocomplete (1 week) because I've read both handlers and know the scheduling module is significantly more complex.

**I have a buffer.** Week 13 is fully reserved for review feedback and unexpected issues.

---

## Communication Plan

- **Daily:** Commit progress to a public fork with descriptive commit messages
- **Weekly:** Post a brief update to the ESP dev mailing list or GitHub discussion
- **Blocking issues:** Message mentor on GitHub within 24 hours rather than losing 3 days
- **PRs:** Each work item as a separate PR; no giant single-PR dumps
- **Availability:** My university exams are in [MONTH] — I will communicate this to mentors during community bonding and front-load work if needed

---

## Prior Contributions to ESP-Website

[If you have made any PRs already, list them here. Even a small documentation fix or a tiny bug report goes a long way. If you haven't yet, submit one BEFORE the proposal deadline — ideally the [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) fix described in Finding 1 above. That single commit is stronger than paragraphs of text.]

---

## References (Files I Read)

The following files were read directly during proposal research — these are not guesses:

| File | Key Finding |
|------|-------------|
| [esp/program/modules/tests/__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/__init__.py) | [studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) missing from imports |
| `esp/program/modules/handlers/schedulingcheckmodule.py:368` | `unicode()` Python 2 crash |
| `esp/program/modules/handlers/schedulingcheckmodule.py:118` | `get_current_request()` in constructor |
| `esp/db/views.py:68` | `content_type='javascript/javascript'` non-standard |
| `esp/db/views.py:18` | `co_varnames` bytecode inspection for access control |
| [esp/public/media/scripts/jasmine/SpecRunner.html](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/jasmine/SpecRunner.html) | Only includes [DirectorySpec.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/spec/DirectorySpec.js), not all 16 specs |
| [deploy/ci/script](file:///home/dewolf/OpenSource/esp/devsite/deploy/ci/script) | `pytest -n auto`, no `npm test` step |
| [.github/workflows/tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml) | Python 3.7 only, no Node.js setup |
| `esp/users/tests.py:796–870` | [AjaxAutocompleteViewTest](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#796-871) — 4 tests already exist |
| [esp/program/modules/tests/studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) | 29 tests, none running in CI |

---

*Proposal word count: ~2,000 words (excluding tables and code blocks)*  
*Submitted for Google Summer of Code 2026*
