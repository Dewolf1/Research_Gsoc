# GSoC 2026 — Regression Tests Expansion: Deep Research Notes

> These are research findings from a direct audit of the local ESP-Website codebase.
> Use this to write an accurate, well-researched GSoC proposal.

---

## 1. Architecture of the Test Suite

The project uses **pytest + pytest-django** (not `manage.py test`), as seen in:
- [esp/pytest.ini](file:///home/dewolf/OpenSource/esp/devsite/esp/pytest.ini) — sets `DJANGO_SETTINGS_MODULE`, defines test discovery rules
- [deploy/ci/script](file:///home/dewolf/OpenSource/esp/devsite/deploy/ci/script) — runs: `pytest -n auto --cov=. --cov-report=xml`
- [deploy/ci/before_script](file:///home/dewolf/OpenSource/esp/devsite/deploy/ci/before_script) — applies CI [local_settings.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/local_settings.py)

**Test discovery rules in [pytest.ini](file:///home/dewolf/OpenSource/esp/devsite/esp/pytest.ini):**
```
python_files = tests.py test_*.py *_tests.py
python_classes = Test* *Test
python_functions = test_*
```

**Module tests are organized in a package:**
[esp/program/modules/tests/__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/__init__.py) — explicitly imports all test classes that should be discovered.

> ⚠️ **Ambiguity #1**: Files in `modules/tests/` that are NOT imported in [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) are silently skipped. This is a non-standard pattern that misleads contributors.

**CI Workflow:** [.github/workflows/tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml)
- Runs on Python 3.7 only (pinned)
- Uses PostgreSQL 14 + memcached as services
- Uploads Codecov XML coverage
- **No JavaScript test step** — 100% Python-only

---

## 2. Issue #933 — TwoPhaseStudentReg Tests

### What exists
[esp/program/modules/tests/studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) — **573 lines**, 20 test methods across one class ([StudentRegTwoPhaseTest](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#17-573)).

### 🔴 Critical gap: NOT imported in [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py)
```python
# This line does NOT exist in __init__.py:
from esp.program.modules.tests.studentregtwophase import StudentRegTwoPhaseTest
```
**This means the entire 573-line test file never runs in CI.** This is the most important bug to fix first.

### Remaining coverage gaps in the handler ([studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py), 561 lines)

| View/Method | Tested | Notes |
|---|---|---|
| [studentreg2phase](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#91-180) (GET) | ✅ | [test_main_page_loads](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#79-89) |
| [confirm_registration](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#445-537) (POST, success) | ✅ | [test_confirm_success](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#106-133) |
| [confirm_registration](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#445-537) (GET) | ✅ | [test_confirm_get_redirects](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#93-102) |
| [mark_classes_interested](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#272-328) (POST, success) | ✅ | |
| [mark_classes_interested](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#272-328) (bad JSON) | ✅ | |
| [save_priorities](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#361-444) (bad JSON) | ✅ | |
| **[save_priorities](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#361-444) (success path)** | ❌ | No happy-path test; complex logic with `StudentRegistration` create/update |
| **Unauthenticated access** | ❌ | No test that non-logged-in users are redirected |
| **[view_classes](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#197-235) category filter** | ⚠️ | Only checks context key exists, not actual categories |
| **[send_confirmation_email](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#538-557)** | ⚠️ | Only checked via [test_confirm_success](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#106-133), not isolated |

### Proposal angle
Fix the [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) import first. Then add `test_save_priorities_success` with a real timeslot and assert `StudentRegistration` objects are created with correct `relationship`/[section](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py#47-53).

---

## 3. Issue #3773 — Scheduling Checks Module Tests

### What exists
[esp/program/modules/tests/schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py) — **198 lines**, 6 test methods. **All 6 test only [moderator_movement_dependency_loops](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#795-857).**

### Handler size: [schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py) is 857 lines with ~20 diagnostic methods.

### Coverage map

| Diagnostic | Tested? | Notes |
|---|---|---|
| [moderator_movement_dependency_loops](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#795-857) | ✅ ×6 | All 6 existing tests |
| [lunch_blocks_setup](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#243-249) | ❌ | |
| [incompletely_scheduled_classes](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#250-262) | ❌ | |
| [inconsistent_rooms_and_times](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#263-274) | ❌ | |
| [room_capacity_mismatch](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#342-352) | ❌ | |
| [classes_wrong_length](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#286-295) | ❌ | |
| [unapproved_scheduled_classes](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#296-303) | ❌ | |
| [teachers_teaching_two_classes_same_time](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#304-327) | ❌ | |
| [multiple_classes_same_resource_same_time](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#328-341) | ❌ | |
| [teachers_unavailable](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#558-567) | ❌ | |
| [teachers_who_like_running](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#568-595) | ❌ | |
| [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) | ❌ | See bug below |
| [inflexible_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#664-690) | ❌ | |
| `classes_by_category/grade` | ❌ | |
| `capacity_by_category/grade` | ❌ | |
| [admins_teaching_per_timeblock](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#464-488) | ❌ | |
| [no_overlap_classes](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#597-621) | ❌ | |
| [special_classroom_types](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#622-659) | ❌ | |
| [wrong_classroom_type](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#554-557) | ❌ | |
| [classes_missing_resources](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#527-530) | ❌ | |

### 🔴 Bug found: [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) uses Python 2 syntax

**[schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py), line 368:**
```python
classes = str1.join([unicode(c) for c in classes])
```
`unicode()` does not exist in Python 3. This method **crashes at runtime**. A test for this method would have caught the bug immediately.

### 🔴 Complexity: `SchedulingCheckRunner.__init__` requires an active HTTP request
The constructor calls `get_current_request()` (line 118), which reads from a thread-local. In existing tests, this is set up by:
```python
request = RequestFactory().get('/manage/.../scheduling_checks')
ThreadLocals().process_request(request)
```
This is not well-documented. Contributors need to follow this pattern exactly, or tests will fail with a confusing `AttributeError`.

### Proposal angle
- Fix [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) (`unicode` → [str](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#445-537)) as part of the PR — shows you understand the code deeply
- Add ~9 new test methods covering the diagnostic categories above
- Emphasize the `ThreadLocals` setup as a documented testing pattern

---

## 4. Issue #599 — Dashboard JSON Interface Tests

### Status: ✅ Fully addressed
[esp/program/modules/tests/jsondatamodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py) — **383 lines**, 15+ test methods (merged via PR #4196). Covers:
- [testStudentStats](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#135-150), [testTeacherStats](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#151-166), [testGradesStats](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#167-214)
- [testStatsResponseStructure](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#233-250), [testVitalsSection](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#251-260), [testClassNums](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#261-273)
- [testCategoriesSection](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#274-286), [testAccountingSection](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#287-299), [testStatsRequiresAdmin](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#300-311)
- [testClasses](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#215-228), [testClassSubjectsFields](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#312-320), [testClassSubjectsSectionsAreLists](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#321-334)
- [testClassSubjectsCatalogMode](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#358-368), [testClassSubjectsGradeRange](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#369-382)

**Nothing left to do for this issue.** Proposal should acknowledge this and move on.

---

## 5. Issue #794 — Tests for editclass/makeaclass view

### Status: ✅ Fully addressed
[esp/program/modules/tests/test_class_creation.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/test_class_creation.py) — **25KB**, 20 tests across 5 classes (merged via PR #4292).

**Nothing left to do.** Registering the test classes in [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) is already done (lines 62–68).

---

## 6. Issue #1452 — Ajax Autocomplete Tests

### What actually exists (two separate files)

**File 1: [esp/users/tests_autocomplete.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests_autocomplete.py)** (89 lines)
- Tests `ESPUser.ajax_autocomplete()` **model method only**
- 4 tests: first name search, last name search, grade filter, last-name range filter

**File 2: [esp/users/tests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py) lines 796–870** — [AjaxAutocompleteViewTest](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#796-871)
- Tests the **HTTP view** at `/admin/ajax_autocomplete/`
- 4 tests: requires login, returns 400 on malformed input, non-staff can query allowed model (K12School), staff can query restricted model (ESPUser)

> ⚠️ **Inconsistency**: Two separate test files for the same feature, in two different apps. The view-test file tests mostly **authorization**, not the **search correctness** at the view layer.

### 🔴 Bug found: Non-standard content type
**[esp/db/views.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/db/views.py), line 68:**
```python
return HttpResponse(content, content_type='javascript/javascript')
```
The correct content type should be `application/json`. `javascript/javascript` is not a recognized MIME type. This may cause frontend issues in strict environments. A test checking the response `Content-Type` header would reveal this.

### 🔴 Code smell: fragile capability check in [autocomplete_wrapper](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/db/views.py#14-22)
**[esp/db/views.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/db/views.py), line 18:**
```python
if 'allow_non_staff' in function.__func__.__code__.co_varnames:
```
This inspects Python bytecode to check if a method accepts an `allow_non_staff` argument. This is brittle — it breaks if a function is wrapped by a decorator that changes `__code__`. A test verifying the non-staff access behavior for each model class would guard against this.

### What's still missing at the view level (for a complete test)
- Response format: confirm `result` key structure and `ajax_str` formatting (e.g., `Springfield Academy (3)`)
- Limit parameter: confirm `limit=2` caps output
- `ajax_func` parameter: confirm custom function routing works (e.g., `ajax_autocomplete_student` vs `ajax_autocomplete_teacher`)
- Edge case: [prog](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#50-54) param with invalid ID returns results (not a 500)
- The [content_type](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py#50-54) bug should be filed as a separate issue or fixed as part of this work

### PR #5087 (open, by @anujpundir999)
A PR was filed last week adding autocomplete tests — you should **not duplicate** this work but should reference it and argue for additional coverage.

---

## 7. Issue #3460 — Selenium Tests

### Status: ✅ Fully addressed (PR #4339 merged)
[esp/seltests/seltests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/seltests/seltests.py) uses `StaticLiveServerTestCase` with headless Firefox.
Tests are properly skipped when Firefox is not available (`@unittest.skipUnless(shutil.which('firefox')...)`).

**Nothing left to do.**

---

## 8. Issue #3457 — JS Unit Tests in CI

### Current state
- **16 Jasmine 1.3 spec files** in `esp/public/media/scripts/ajaxschedulingmodule/spec/`
- Run via a browser-based `SpecRunner.html` — **not in CI at all**
- The CI [deploy/ci/script](file:///home/dewolf/OpenSource/esp/devsite/deploy/ci/script) runs **only Python pytest**, zero JS

### 🔴 Major incompatibility: Jasmine 1.x vs Jest
The existing specs use **Jasmine 1.3 async API**:
```javascript
// DirectorySpec.js line 46:
runs(function(){ d.render(); d.render(); });
waits(0);
runs(function(){ expect(d.el.children().length).toEqual(1); });
```
`runs()` and `waits()` were **removed in Jasmine 2.x** and do not exist in Jest at all. Migrating to Jest requires rewriting async tests using `async/await` or [done](file:///home/dewolf/OpenSource/esp/devsite/.docker-setup-done) callbacks.

### 🔴 Module system mismatch
The ESP JS code uses **no module system** (global variables via `window`/[prototype.js](file:///home/dewolf/OpenSource/esp/devsite/esp/public/media/scripts/ajaxschedulingmodule/prototype.js)). Jest expects CommonJS or ESM modules. Running ESP's `Directory.js` in Jest without a module wrapper will fail because `Directory` is never exported.

### Approaches to evaluate in the proposal

| Approach | Pros | Cons |
|---|---|---|
| **Jest + jsdom** (as in PR #4903) | Modern, fast, good CI integration | Requires rewriting all `runs()/waits()` calls and wrapping globals |
| **Puppeteer/Playwright** | Can run actual browser, no rewrite of tests needed | Slower, more infrastructure |
| **Jasmine 2.x migration** | Minimal rewrite | Still browser-dependent for DOM globals |
| **Write new Jest tests from scratch** | Cleanest approach | Time-consuming |

### PR #4903 (open, by @haneefa96) 
Migrates `Directory.js` and `TableRow` to Jest. Tests pass with `npm test`. However, it only covers 2 of ~15 modules in the scheduler. The proposal should describe a **systematic plan** to cover all modules.

### What the CI change would look like
Add to [.github/workflows/tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml):
```yaml
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
- name: Install JS dependencies
  run: npm ci
- name: Run JS tests
  run: npm test
```

---

## 9. Issue #3977 — Tests for Email Relay (sub-issue of #3780)

> **⚠️ Gap in research**: No file named `emailrelay*` or `email_relay*` exists in the local codebase. PR #3990 was mentioned in the issue comments. This sub-issue may reference `esp/dbmail/` or another module. **Investigate further** before including in proposal.

---

## 10. Cross-Cutting Ambiguities & Inconsistencies

### A. Test registration pattern is fragile
Module tests in `esp/program/modules/tests/` must be manually imported in [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py). There's no automatic discovery. This means new test files are silently ignored until someone edits [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py). 

**Proposal improvement:** Suggest switching the test discovery to include the full `modules/tests/` directory as a pytest path, removing the manual import requirement.

### B. CI pins Python 3.7 only
[tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml) line 38: `python-version: [3.7]`. Modern Python is 3.12+. Tests that would catch deprecation warnings on newer Python are never run. The proposal should mention adding Python 3.11/3.12 to the CI matrix as a stretch goal.

### C. Codecov reports coverage but no enforced threshold
[codecov.yml](file:///home/dewolf/OpenSource/esp/devsite/codecov.yml) exists but the content (102 bytes) likely has no coverage threshold set. The proposal should recommend adding a coverage gate (e.g., fail if coverage drops by >2% on changed files).

### D. `ProgramFrameworkTest.setUp()` is expensive
The base test class creates a full program, multiple users/rooms/classes, and runs several DB operations in every [setUp()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#148-155). This makes the test suite slow. The [jsondatamodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py) tests (PR #4196) already solved this using [setUpTestData()](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) at the class level — this pattern should be documented and propagated to new test classes.

### E. [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) Python 2 regression
[schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py) line 368: `unicode(c)` crashes in Python 3. This is a **pre-existing bug** that was never caught because the method was never tested. Your proposal should emphasize that writing tests would have caught this.

### F. Duplicate test effort for autocomplete
[tests_autocomplete.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests_autocomplete.py) (model method) and [AjaxAutocompleteViewTest](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py#796-871) in [tests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py) (view) exist in different files in different apps (`users/` vs. being in the `modules/tests/` package). New contributors don't know which file to extend. The proposal should recommend consolidating these.

---

## 11. Proposal-Specific Recommendations

### Priority order for 175-hour project

| Week | Work Item | Hours |
|------|-----------|-------|
| 1 | Community bonding, set up Docker dev env, read codebase | 10 |
| 2 | Fix [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) import for TwoPhase tests; add [save_priorities](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentregtwophase.py#361-444) happy-path test | 15 |
| 3-5 | Expand [schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py) tests (9 diagnostic methods); fix [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382) bug | 30 |
| 6-7 | Expand autocomplete coverage: response format, limit, `ajax_func` routing, content-type bug | 20 |
| 8-9 | JS/Jest migration: add `package.json`, wrap 3–5 key JS modules, update CI [tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml) | 25 |
| 10 | New selenium tests for student registration flow | 15 |
| 11 | Codecov threshold config; switch to [setUpTestData](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/jsondatamodule.py#53-72) for expensive tests | 15 |
| 12 | Documentation: `docs/dev/testing.md` — patterns, examples, how-to-run | 15 |
| 13 | Buffer, PR reviews, community feedback | 10 |
| **Total** | | **155 h (leaves 20h buffer)** |

### What mentors care about (based on issue comments)
- Mentors (Miles, Will) are very responsive on GitHub and merge PRs quickly
- They explicitly said "browse codecov to find what's missing" — do this in your proposal
- They care about **not duplicating existing work** — reference what's already merged
- The project uses `ProgramFrameworkTest` heavily — show you understand this base class

### Strong proposal hooks
1. **I found a Python 2 regression bug** (`unicode()` in [hungry_teachers](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#353-382)) that would have been caught if tests existed — this directly demonstrates the value of the project
2. **I found that 573 lines of tests never run** because of a missing [__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/__init__.py) import — a quick fix with high impact
3. **I mapped the full diagnostic coverage** of [SchedulingCheckRunner](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py#108-857) — shows systematic thinking
4. The JS migration requires careful design because of module system incompatibilities — mention the `runs()/waits()` API issue shows you read the actual code

---

## 12. Files to Reference in Proposal

| File | Why |
|------|-----|
| [esp/program/modules/handlers/schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/schedulingcheckmodule.py) | 857-line handler, ~5% covered |
| [esp/program/modules/tests/schedulingcheckmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/schedulingcheckmodule.py) | Existing tests to expand |
| [esp/program/modules/tests/__init__.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/__init__.py) | Registration pattern, showing TwoPhase gap |
| [esp/program/modules/tests/studentregtwophase.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/tests/studentregtwophase.py) | 573 lines not running in CI |
| [esp/db/views.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/db/views.py) | [ajax_autocomplete](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/db/views.py#23-69) view — content-type bug + `co_varnames` smell |
| [esp/users/tests.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/users/tests.py) lines 796–870 | Existing autocomplete view tests |
| [deploy/ci/script](file:///home/dewolf/OpenSource/esp/devsite/deploy/ci/script) | `pytest -n auto --cov=. --cov-report=xml` — no JS |
| [.github/workflows/tests.yml](file:///home/dewolf/OpenSource/esp/devsite/.github/workflows/tests.yml) | CI workflow — Python 3.7 only, no `npm test` step |
| `esp/public/media/scripts/ajaxschedulingmodule/spec/` | 16 Jasmine 1.3 spec files |
| `app.codecov.io` | Coverage report to reference in proposal |

