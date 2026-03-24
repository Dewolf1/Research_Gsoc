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

ESP-Website powers educational programs for thousands of students, but a significant portion of its core Django "Program Modules" lacks automated test coverage. While recent community efforts have added tests for specifically documented areas (like TwoPhaseStudentReg and Scheduling Checks), my direct codebase audit reveals that dozens of complex, high-risk modules remain 100% untested. This proposal outlines a targeted 175-hour plan to write exhaustively rigorous test suites for three highly-critical, fundamentally untested endpoints: [onsiteclasslist.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py) (which handles chaotic program-day registrations), [listgenmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py) (an admin data export tool), and [studentextracosts.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py) (a financial/accounting interface). By securing these core modules and improving general test infrastructure, this project directly advances the goal of a robust, regression-proof ESP-Website.

---

## About Me

**Name:** [YOUR FULL NAME]  
**University:** [YOUR UNIVERSITY]  
**Degree & Year:** [e.g., B.Tech Computer Science, 3rd Year]  
**Programming Languages:** Python, JavaScript, SQL  
**Relevant Experience:**  
[Write 2–3 sentences here. Example: "I have built and maintained test suites for Django web applications. I am highly comfortable with pytest, Django's TestCase, FactoryBoy/fixture management, and mocking complex requests. I have contributed to open-source projects and understand the importance of isolating tests from the database layer where possible."]

**Why this project?**  
Test engineering is often treated as an afterthought, but it is the foundation of a stable open-source project. Before writing this proposal, I studied the recent PRs addressing Issue #3780. Seeing that the community quickly claimed the explicitly listed modules, I ran a comprehensive coverage analysis (`pytest --cov`) on `esp/program/modules/handlers/`. I discovered several highly complex modules with zero test coverage, proving that the need for this GSoC project extends far beyond the original issue description. I want to build these missing safety nets.

---

## Understanding the Problem & Selection of Targets

Many ESP-Website program modules dynamically process JSON, dispatch to accounting controllers, or bypass standard validations to accommodate specific onsite conditions. Without tests, any underlying model change (e.g., changes to `ESPUser` or `ClassSection`) risks silently breaking these controllers.

Because the sub-issues of #3780 (like #3773 and #933) are already under active development by other contributors, I am proposing an expansion that targets **three entirely new, high-value modules** that currently have 0% testing coverage.

### Target 1: [onsiteclasslist.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py) (491 lines / 0% coverage)
This module runs the heavily-trafficked "OnSite Registration" interface used by admins on the day of the program. 
- **The Risk:** It utilizes 10+ custom JSON API views ([catalog_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#96-114), [checkin_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#193-201), [counts_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#202-209)) that heavily rely on Django ORM `.extra()` clauses and `.annotate()`. These raw SQL injections are highly susceptible to breaking during Django version upgrades.
- **The Complexity:** The [update_schedule_json](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#243-324) method performs dangerous, direct enrollement operations while explicitly calculating schedule collisions on the fly. This logic desperately needs regression tests.

### Target 2: [listgenmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py) (488 lines / 0% coverage)
This module generates CSV/HTML exports of user pools based on persistent query filters.
- **The Risk:** [UserAttributeGetter](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#45-276) relies on Python reflection (`dir()`) to dynamically map user attributes (e.g., [get_guardian_cellphone](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#150-154), [get_sibling_name](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#250-256)). If the underlying `StudentInfo` or `SplashInfo` schemas change, this module will silently crash when admins attempt to export lists. 
- **The Complexity:** Testing requires isolating and mocking various user profiles (Teacher, Student, combinations thereof) and asserting the integrity of CSV responses.

### Target 3: [studentextracosts.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py) (360 lines / 0% coverage)
This module orchestrates optional student fees (T-shirts, lunches) and sibling discounts.
- **The Risk:** It interfaces directly with `IndividualAccountingController`. It dynamically constructs HTML forms based on `LineItemType` database configurations. Any regression here could result in students being overcharged or financial records dropping.
- **The Complexity:** Requires synthesizing complex database fixtures containing required/optional/custom-amount line items and asserting state changes in the accounting tables.

---

## Detailed Technical Plan

### Work Item 1: Test Suite for [onsiteclasslist.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py)
**Goal:** 85%+ coverage of the onsite registration endpoints.
1. **Fixture Generation:** Utilize the `ProgramFrameworkTest` base but implement `setUpTestData()` at the class level to avoid recreating the program/users for every API call.
2. **API Endpoint Tests (GETs):**
    - Assert [catalog_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#96-114) returns correct capacities and accurately evaluates `.extra()` SQL clauses.
    - Test [students_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#123-169) search queries (both when `q` is provided and omitted).
    - Test [enrollment_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#115-122), [checkin_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#193-201), and [counts_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#202-209) JSON conformity.
3. **Mutation Endpoint Tests (POSTs):**
    - **[update_schedule_json](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#243-324):** This is the most critical method. I will write tests to assert:
        * Adding a class successfully increments enrollment.
        * Adding a class that conflicts with an existing schedule forces removal of the conflicting class.
        * `override=True` correctly bypasses hard capacities.
    - **[register_student](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#170-192):** Assert that `Record.createBit` runs for 'attended', 'med', 'liab', and 'onsite', and that accounting is marked as paid.

### Work Item 2: Test Suite for [listgenmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py)
**Goal:** 90%+ coverage ensuring robust admin reporting.
1. **Unit Testing [UserAttributeGetter](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#45-276):**
    - Create a matrix test parameterizing all 30+ supported fields (`01_id` through `29_guardian_cellphone`).
    - Setup specific `TeacherProfile` and `StudentProfile` models to ensure [UserAttributeGetter](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#45-276) retrieves the correct data without raising `AttributeError`s for non-applicable fields (e.g., a teacher with no guardian).
2. **Integration Testing [generateList](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#321-404):**
    - Mock a `PersistentQueryFilter`.
    - Inject an `html` output request and verify pagination/rendering.
    - Inject a `csv` output request, capture the HttpResponse, and use Python's `csv` module to assert the headers and field data accurately reflect the requested [ListGenForm](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#277-294) layout.

### Work Item 3: Test Suite for [studentextracosts.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py)
**Goal:** 90%+ coverage securing the programmatic financial interface.
1. **Line Item Permutations:** Create database fixtures for `LineItemType` encompassing:
    - Single boolean costs ([CostItem](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py#50-57))
    - Quantitiative costs ([MultiCostItem](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py#58-67))
    - Dropdown/Select costs ([MultiSelectCostItem](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py#68-80) with and without custom amounts)
2. **Form Rendering Validation:**
    - Perform GET requests to `/learn/ESP/extracosts` and assert the dynamically generated form elements exactly match the database definitions.
3. **Accounting Integrity (POSTs):**
    - Submit varied POST payloads including sibling discounts.
    - Assert that `IndividualAccountingController.apply_preferences()` is successfully invoked and the resulting `Transfer` rows match the expected monetary math.
    - Assert that students who have already paid (`iac.has_paid()`) bounce from the module unless `already_paid_extracosts_allowed` is tagged.

### Work Item 4: Test Infrastructure Improvements
1. **`setUpTestData` Migration:** Across the program module tests I touch (and documenting the process for others), I will eschew the expensive `setUp()` pattern in favor of Django's `setUpTestData()` to massively speed up CI runtime.
2. **Codecov Thresholding:** I will introduce a PR to update `codecov.yml` with a threshold targeting a minimum `fail-under` requirement for new PRs, preventing regression decay.
3. **Documentation:** Produce a developer guide (`docs/dev/testing.md`) articulating how the ESP-Website custom test runner logic works seamlessly with pytest.

---

## Timeline

**Community Bonding Period (May 1 — May 26, 2026)**
- Refine local Docker environment.
- Absorb mentor feedback on the proposed modules.
- Formally document the `setUpTestData` structural approach.

| Week | Target | Deliverables |
|------|--------|--------------|
| **1-2** | `onsiteclasslist` (GETs) | Fixture setup, `API JSON` conformity tests ([catalog_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#96-114), [students_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#123-169), [rooms_status](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#220-227)). |
| **3-4** | `onsiteclasslist` (POSTs) | Collision/overlap testing for [update_schedule_json](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#243-324) and [register_student](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py#170-192). PR Submission. |
| **5-6** | `listgenmodule` (Attributes) | [UserAttributeGetter](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#45-276) isolated unit testing against edge-case User Profiles. |
| **7-8** | `listgenmodule` (Exports) | End-to-end [generateList](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py#321-404) HTML/CSV generation testing. PR Submission. |
| **9-10** | `studentextracosts` | Dynamic `LineItemType` accounting tests. Form logic assertions. PR Submission. |
| **11-12** | Infrastructure | CI Config (`codecov.yml` thresholds), Documentation (`docs/dev/testing.md`). |
| **13** | Wrap-up | Address lingering PR reviews, bug fixes, final project report. |

---

## Why I Will Succeed
- **I am proactive:** I realized the initial issue descriptions were already effectively handled by the community, so I hunted down the hidden, untracked testing debt in the codebase to construct this proposal. 
- **I understand the architecture:** I recognize that [onsiteclasslist.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py) interacts dangerously with `.extra()` SQL injection, and that testing [listgenmodule.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/listgenmodule.py) requires deep assertions on dynamically generated CSV streams.
- **I prioritize safety:** Financial code ([studentextracosts.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/studentextracosts.py)) and registration-day code ([onsiteclasslist.py](file:///home/dewolf/OpenSource/esp/devsite/esp/esp/program/modules/handlers/onsiteclasslist.py)) are the arteries of ESP. My testing focuses on the highest-risk modules where regressions cause real-world organizational damage.

---
*Proposal Size: ~1,100 words. Submitted for Google Summer of Code 2026.*
