# SafeData Pipeline: Risk Assessment Complete Guide

## Table of Contents
1. [What is Risk Assessment?](#what-is-risk-assessment)
2. [Types of Privacy Attacks](#types-of-privacy-attacks)
3. [Risk Metrics Explained](#risk-metrics-explained)
4. [Calculating Risk Manually](#calculating-risk-manually)
5. [Risk Thresholds & Interpretation](#risk-thresholds--interpretation)
6. [Your Dataset Risk Analysis](#your-dataset-risk-analysis)
7. [Mitigation Strategies](#mitigation-strategies)
8. [Real-World Examples](#real-world-examples)
9. [Quick Reference Charts](#quick-reference-charts)

---

## What is Risk Assessment?

### Definition
Risk Assessment is a **mathematical evaluation** of how vulnerable your dataset is to **re-identification attacks**. It simulates an attacker trying to identify individuals in your published data using background knowledge.

### The Core Question
**"How easily can someone figure out who each person in this dataset is?"**

### Why It Matters
- **Legal compliance**: GDPR, HIPAA, India Privacy Act require risk assessment
- **Data security**: Know vulnerabilities before publishing
- **Privacy protection**: Understand what attackers can do
- **Decision making**: Choose appropriate protection techniques

---

## Types of Privacy Attacks

### 1. Identity Disclosure Attack (Re-Identification)

**What it is:** Attacker identifies which record belongs to which individual.

**How it works:**
```
Public Data:        External Knowledge:     Attacker Deduction:
Age: 28             "My friend is 28"       
Gender: Female      "She works in tech"     → Must be this record!
Job: Software Dev   "She's in Bangalore"
State: Bangalore
```

**Your Data Vulnerability:** 20 unique records = high risk (100%)

**Example Attack:**
- Attacker has census data showing all Bangalore software developers
- Your dataset has Age + Job + State
- Attacker matches: "28-year-old female software dev in Bangalore"
- **Result:** Attacker identifies the person!

---

### 2. Attribute Disclosure Attack

**What it is:** Attacker infers sensitive attributes even without identifying the person.

**Example:**
```
Dataset (after removing names):
All records with Age: 28, Gender: Female, Job: Doctor
→ All have Diagnosis: Cancer

Attacker: "If you're a 28-year-old female doctor, you have cancer"
Result: Attribute disclosed even if person not identified!
```

**Why it happens:**
- K-anonymity alone doesn't prevent this
- All people in a group might have same sensitive value
- L-diversity specifically protects against this

---

### 3. Inference Attack

**What it is:** Attacker combines multiple datasets to infer sensitive information.

**Example:**
```
Your anonymized dataset:
- Age: 35, Income: $200,000, State: Delhi

Public voter registry:
- Shows all high-income professionals in Delhi

Attacker: "This is likely person X (only high-income professional in Delhi)"
Attacker then links to medical database: "Person X has heart disease"
```

---

### 4. Linkage Attack

**What it is:** Attacker links anonymized data with public datasets to re-identify.

**Most Common Scenario:**
```
Step 1: Attacker gets your anonymized healthcare data
Step 2: Attacker gets public census/voting data
Step 3: Attacker matches on Age + Gender + State
Step 4: Creates unique identifier → Links records
Step 5: Now attacker knows sensitive health info about real people
```

**Your 20-record dataset:** Extremely vulnerable (all 20 records are unique by Age+Gender+State)

---

### 5. Membership Inference Attack

**What it is:** Attacker figures out if a specific person is in the dataset.

**Example:**
```
Attacker: "Is person X in this healthcare dataset?"
Method: Look for Age: 28, Gender: Female, State: Bangalore
Result: "Yes, person X is definitely in this dataset"
```

**Privacy Risk:** Even if attributes aren't disclosed, knowing someone is in a health dataset is sensitive!

---

## Risk Metrics Explained

### 1. Re-Identification Risk (Re-ID Risk)

#### What It Measures
**Probability that an attacker can identify at least one person in your dataset.**

#### Formula
```
Re-ID Risk = Number of Records that Can Be Uniquely Identified
             ─────────────────────────────────────────────────
                           Total Records

Re-ID Risk = 1 - (1 - P_individual)^n

Where P_individual = Probability of identifying one person
      n = Number of records
```

#### Simple Version for Your Data
```
Unique Records / Total Records

Example: Your Large Dataset
20 unique records / 20 total records = 100% re-ID risk
```

#### Interpretation

| Risk Level | Percentage | Meaning | Safe? |
|-----------|-----------|---------|-------|
| **Very Low** | 0-5% | Almost impossible to identify anyone | ✓ Yes |
| **Low** | 5-20% | Hard to identify, but possible | ✓ Mostly |
| **Medium** | 20-50% | Fair chance of identification | ✗ Risky |
| **High** | 50-95% | Likely to identify someone | ✗ No |
| **Very High** | 95-100% | Definitely identify people | ✗ Unacceptable |

#### Your Dataset
```
Large Dataset: 100% Re-ID Risk
↓
Interpretation: Attacker can definitely identify all 20 people
↓
Why: All records are completely unique by quasi-identifiers
```

---

### 2. Success Rate (K-Anonymity Specific)

#### What It Measures
**Percentage of records that meet the k-anonymity protection level.**

#### Formula
```
Success Rate = Records in Groups of Size ≥ k
               ──────────────────────────────
               Total Records
```

#### Example: K=3 Threshold
```
Your 20 records grouped by Age+Gender+State:
- Group 1: 2 records (size < 3) → Violates k=3
- Group 2: 2 records (size < 3) → Violates k=3
- Group 3: 3 records (size = 3) → OK ✓
- Group 4: 1 record (size < 3) → Violates k=3
- ... (total 10 groups)

Success Rate = 2 groups / 10 total groups = 20%
→ Only 20% of records are protected!
```

#### Interpretation
- Success Rate = 100% → All records protected, excellent!
- Success Rate = 70% → Most protected, acceptable
- Success Rate = 50% → Half protected, risky
- Success Rate < 30% → Most unprotected, unacceptable

---

### 3. Privacy Risk per Equivalence Class

#### What It Measures
**Risk of identifying someone within each group of identical records.**

#### Formula
```
Risk per Group = 1 / (Number of People in Group)

Example:
- Group of 2 identical people: Risk = 1/2 = 50% per person
- Group of 5 identical people: Risk = 1/5 = 20% per person
- Group of 1 person (unique): Risk = 1/1 = 100% per person
```

#### Interpretation
```
Group Size 1: Risk = 100% (unique person, easily identified)
Group Size 2: Risk = 50% (50-50 chance)
Group Size 3: Risk = 33% (1 in 3 chance)
Group Size 5: Risk = 20% (1 in 5 chance)
Group Size 10: Risk = 10% (1 in 10 chance)
```

---

### 4. Uniqueness (Unique Records)

#### What It Measures
**Number of records that are completely unique by quasi-identifiers.**

#### Formula
```
Unique Records = Count of Distinct Combinations of Quasi-Identifiers
```

#### Example
```
Your Large Dataset (20 records):
Age | Gender | State
28  | F      | Karnataka
35  | M      | Delhi
42  | F      | Maharashtra
... (each combination appears only once)

Unique Records = 20 (all records are different!)
Re-ID Risk = 100%
```

#### Interpretation
- Unique Records = 0 → Great! All groups have duplicates
- Unique Records < 10% → Good, mostly grouped
- Unique Records > 50% → Concerning, many unique records
- Unique Records = 100% → Critical! All records are unique

---

### 5. Average Group Size (K-Anonymity Specific)

#### What It Measures
**Average number of identical records per group.**

#### Formula
```
Average Group Size = Total Records / Number of Groups

Example: 20 records in 10 groups
20 / 10 = Average group size of 2
```

#### Interpretation
- Avg Group Size = 1 → All unique (worst case)
- Avg Group Size = 2 → K-anonymity with k=2 just barely possible
- Avg Group Size = 5 → K-anonymity with k=5 achievable
- Avg Group Size = 10+ → Good protection possible

#### Relationship to K-Anonymity
```
Desired K Value ≤ Average Group Size

Example:
If Avg Group Size = 2.5, you can achieve K=2 but NOT K=3
```

---

### 6. Equivalence Classes

#### What It Measures
**Number of distinct groups created by quasi-identifiers.**

#### Formula
```
Equivalence Classes = Number of Distinct Combinations of QI

Example: Your data with QI = {Age, Gender, State}
28, F, Karnataka  → Class 1
35, M, Delhi      → Class 2
42, F, Maharashtra → Class 3
28, F, Karnataka  → Same as Class 1 (same group)
...
Total: 20 classes (one for each unique combination)
```

#### Interpretation
- More classes = More unique combinations = Higher re-ID risk
- Fewer classes = More people grouped together = Lower re-ID risk

**Rule of Thumb:**
```
Risk ≈ 1 / (Total Records / Number of Classes)

Your data: 20 / 20 = Risk 1 / 1 = 100%
If you generalized to 10 classes: 20 / 10 = Risk 1 / 2 = 50%
```

---

## Calculating Risk Manually

### Step-by-Step Manual Calculation

#### Example: Small Dataset

**Step 1: Identify Quasi-Identifiers**
```
QI = {Age, Gender, State}
```

**Step 2: Create Equivalence Classes**
```
Record | Age | Gender | State       | Class
1      | 28  | F      | Karnataka   | A
2      | 28  | F      | Karnataka   | A (same as 1)
3      | 35  | M      | Delhi       | B
4      | 42  | F      | Maharashtra | C
5      | 35  | M      | Delhi       | B (same as 3)

Classes: A, B, C (3 total)
```

**Step 3: Count Records per Class**
```
Class A: 2 records
Class B: 2 records
Class C: 1 record
```

**Step 4: Calculate Risk per Person**
```
Class A (2 people): Risk = 1/2 = 50% per person
Class B (2 people): Risk = 1/2 = 50% per person
Class C (1 person): Risk = 1/1 = 100% per person
```

**Step 5: Calculate Overall Re-ID Risk**
```
Method 1 (Simple):
Total Unique = Records in groups of 1 = 1 record
Re-ID Risk = 1/5 = 20%

Method 2 (Weighted Average):
Risk = (1×100% + 2×50% + 2×50%) / 5 = 5/5 = 100%
(Someone can definitely be identified: the unique person)
```

---

### Real Calculation from Your Large Dataset

**Given:**
- 20 records total
- 20 unique Age + Gender + State combinations
- 0 records grouped

**Calculation:**

```
Number of Classes: 20
Average Group Size: 20/20 = 1
Records per Class: 1 record each

Risk per Class: 1/1 = 100% for every record
Overall Re-ID Risk: 100%

Interpretation:
Every single person in your dataset can be uniquely identified!
```

---

## Risk Thresholds & Interpretation

### NIST Guidelines (USA)
```
Re-ID Risk < 0.04 (4%)    → Low Risk ✓
Re-ID Risk 0.04-0.10      → Medium Risk ⚠
Re-ID Risk > 0.10 (10%)   → High Risk ✗
```

### GDPR Guidelines (Europe)
```
Re-ID Risk < 0.05 (5%)    → Anonymized (legally safe) ✓
Re-ID Risk ≥ 0.05         → Not anonymized (needs consent) ✗
```

### India Privacy Standards
```
Re-ID Risk < 0.05         → Safe ✓
Re-ID Risk 0.05-0.20      → Needs Protection ⚠
Re-ID Risk > 0.20         → High Risk ✗
```

### Academic Standards
```
K-Anonymity K ≥ 3-5       → Baseline Protection
K ≥ 10-20                 → Strong Protection
K ≥ 50+                   → Very Strong Protection
```

---

## Your Dataset Risk Analysis

### Large Dataset (5_LargeDataset.csv): 20 Records

**Baseline Risk Assessment:**

```
Total Records: 20
Unique Records: 20
Number of Classes: 20
Average Group Size: 1.0

Quasi-Identifiers: {Age, Gender, State}
Re-ID Risk: 100%

Status: CRITICAL - All records are uniquely identifiable
```

**What This Means:**

1. **Every person can be identified** by their Age + Gender + State combination
2. **100% success rate for attacker** if they have external knowledge
3. **Not safe for publication** in current form
4. **Needs protection** before release

**Attack Scenario:**

```
Attacker has census data showing:
- All people aged 28-32 in Tamil Nadu
- All people aged 35-40 in Karnataka
- etc.

For each person in census, attacker:
1. Finds matching Age + Gender + State in your data
2. Looks up that person's salary/disease/income
3. Knows that person's sensitive information

Success Rate: 100% (all 20 people identified)
```

---

### Risk with Different Protection Levels

**If you apply K=2 Anonymity:**
```
Before: 20 classes, Re-ID Risk = 100%
After:  ~10 classes, Re-ID Risk = 50%
Success Rate: Maybe 40-50% (some unprotected)
```

**If you apply K=3 Anonymity:**
```
Before: 20 classes, Re-ID Risk = 100%
After:  ~7 classes, Re-ID Risk = 33%
Success Rate: Maybe 10-20% (most unprotected with only 20 records)
```

**If you apply Differential Privacy (ε=1.0):**
```
Before: 100% risk
After:  ~30-40% risk
No data deleted, but noise added
All records still in dataset
```

**If you apply Synthetic Data:**
```
Before: Real data with 100% risk
After:  Artificial data, 0% risk (no real people)
Data structure: Statistically similar
Utility: Good (85-95%)
```

---

## Mitigation Strategies

### Strategy 1: Increase Group Size (K-Anonymity)

**How:**
```
Current: 20 unique records
Target: Groups of at least 2-3

Method: Generalize quasi-identifiers
- Age: 28 → 25-30
- State: "Karnataka" (too specific, keep as-is)
- Add aggregation: Group by region instead of exact state
```

**Result:**
```
Before: 20 classes, 100% risk
After:  10 classes, 50% risk (with K=2)
```

**Pros:**
- Simple to implement
- Preserves original data

**Cons:**
- Information loss (30-40%)
- May not be strong enough

---

### Strategy 2: Remove Quasi-Identifiers

**How:**
```
Remove or heavily generalize:
- Age: Instead of exact age, use age brackets
- State: Instead of exact state, use region
- Occupation: Very specific, remove entirely
```

**Result:**
```
Better grouping → Lower re-ID risk
But: May lose data utility
```

**Trade-off:**
- Privacy: Better ✓
- Utility: Worse ✗

---

### Strategy 3: Use Differential Privacy

**How:**
```
Add calibrated noise to each attribute
Age: 28 ± noise = maybe 27, 29, or 30
```

**Result:**
```
Before: 100% risk, no noise
After:  30-40% risk, small noise added
All records retained, just slightly inaccurate
```

**Advantages:**
- No records deleted
- Data utility high (80-90%)
- Proven mathematical privacy

**Disadvantages:**
- Slightly inaccurate values
- More complex to understand

---

### Strategy 4: Create Synthetic Data

**How:**
```
Learn patterns from original 20 people
Generate 20 new synthetic people
Publish only synthetic data
```

**Result:**
```
Original data: Not published, stays private
Synthetic data: Looks similar, but no real people
Risk: 0% (no real individuals exposed)
```

**Advantages:**
- Perfect privacy (0% risk)
- Good data utility (85-95%)
- No real people in output

**Disadvantages:**
- More complex to generate
- Slightly different from original

---

## Real-World Examples

### Example 1: Netflix Prize De-anonymization

**The Attack:**
```
Dataset: Anonymous movie ratings (Netflix released)
External Knowledge: Movie ratings from IMDB

Attacker Method:
1. Get person's IMDB public ratings
2. Match to Netflix dataset using rating patterns
3. Identify person in "anonymous" dataset
4. See their private movie watching patterns

Result: Re-identified people despite anonymization!
Re-ID Risk: Initial claim 100% anonymous
Actual: Multiple people successfully identified
```

**Lesson:** Quasi-identifiers are powerful! Even "anonymous" data isn't safe.

---

### Example 2: AOL Search Logs

**The Attack:**
```
Dataset: Anonymized search queries (numbers instead of names)
External Knowledge: Public AOL user profiles

Attacker Method:
1. Person #12345 searched for "heart disease", "medications", etc.
2. Find person who publicly mentioned health issues
3. Match search patterns
4. Identify the person and their health concerns

Result: Publicly identified multiple people
One person: #12345 turned out to be a real nurse whose health concerns were exposed
```

**Lesson:** Search patterns + external knowledge = re-identification

---

### Example 3: Massachusetts Hospital Data

**The Attack:**
```
Dataset: De-identified medical records (removed name, address)
External Knowledge: Voter registration, public records

Attacker Method:
1. Voter record: "Jane, born 1/1/1960, female, Cambridge"
2. Hospital data: "Female, DOB 1/1/1960, Cambridge, diagnosed with diabetes"
3. Very few females with that DOB in Cambridge
4. Match + identify = Success

Result: Successfully re-identified multiple patients
And: Could see their diagnoses, treatments, medications

Attacker: "Just the governor of Massachusetts!"
```

**Lesson:** Combination of demographic data = re-identification risk

---

## Quick Reference Charts

### Risk Assessment Decision Tree

```
START: Do you have your dataset?
  ↓
[STEP 1] Identify Quasi-Identifiers (QI)
  ├─ Ask: What attributes could identify someone?
  ├─ Examples: Age, Gender, State, Job, Income
  └─ List all QI in your data
  ↓
[STEP 2] Count Unique Combinations
  ├─ How many distinct Age+Gender+State combos exist?
  ├─ If all unique → Re-ID Risk = 100%
  └─ If some duplicates → Risk = 1 / (avg group size)
  ↓
[STEP 3] Evaluate Risk Level
  ├─ Is Re-ID Risk > 20%? → HIGH RISK ✗
  ├─ Is Re-ID Risk 5-20%? → MEDIUM RISK ⚠
  └─ Is Re-ID Risk < 5%? → LOW RISK ✓
  ↓
[STEP 4] Choose Protection
  ├─ High Risk → Use Strong Technique (Diff Privacy, Synthetic)
  ├─ Medium Risk → Use Moderate Technique (K-Anonymity, L-Diversity)
  └─ Low Risk → Minimal technique or publish as-is
  ↓
[STEP 5] Verify & Publish
  ├─ Recompute risk with protection applied
  ├─ Confirm risk is acceptable
  └─ Publish protected data
```

---

### When to Use Each Risk Metric

| Metric | When to Use | Example Question |
|--------|------------|-----------------|
| **Re-ID Risk** | Always first | "Can people be identified?" |
| **Unique Records** | To understand problem | "How many unique people?" |
| **Equivalence Classes** | For K-Anonymity | "How many groups exist?" |
| **Avg Group Size** | To plan protection | "What K-value can we achieve?" |
| **Success Rate** | After applying K-Anonymity | "Are people protected?" |
| **Privacy Risk per Class** | Detailed analysis | "What's worst case risk?" |

---

### Risk vs Protection Level

```
100% Risk
  │
  │ Original Unprotected Data ████████████████████
  │ (Your Large Dataset: 20 unique records)
  │
  │ After K=2 Anonymity     ██████████ ~50%
  │ (Some grouping applied)
  │
  │ After K=3 Anonymity     ████████ ~33%
  │ (Better grouping, but limited by 20 records)
  │
  │ After L=3 Diversity     ███████ ~25%
  │ (Protects sensitive attributes)
  │
  │ After Diff Privacy ε=1  ███ ~10-15%
  │ (Noise added, strong protection)
  │
  │ After Synthetic Data    ▐ ~0-5%
  │ (No real people, perfect privacy)
  │
0% Risk
```

---

### Checklist: Is Your Risk Assessment Complete?

- [ ] Identified all quasi-identifiers in your data
- [ ] Counted total records
- [ ] Counted unique records (by QI combination)
- [ ] Calculated re-ID risk percentage
- [ ] Counted equivalence classes
- [ ] Calculated average group size
- [ ] Identified at-risk records (unique ones)
- [ ] Compared risk to compliance standards
- [ ] Determined protection strategy
- [ ] Verified risk reduction after protection

---

## Summary: What You Need to Know

### Three Key Numbers for Your Data

**1. Total Records:** 20
```
How many people are in your dataset?
Answer: 20
```

**2. Unique Records:** 20
```
How many different Age+Gender+State combinations?
Answer: All 20 (everyone is unique!)
```

**3. Re-ID Risk:** 100%
```
What's the probability of identifying someone?
Answer: Certain (100% - guaranteed identification)
```

### The Risk Story

```
Your data has 20 people
Each person is completely unique
An attacker with external knowledge (census, voter rolls)
Can match every single person
And see their sensitive attributes
Risk: CRITICAL - Needs protection
```

### The Solution Story

```
Apply protection (e.g., Differential Privacy ε=1.0)
Risk drops to 30-40%
Data utility remains at 80-90%
Safe to publish
```

---

## Questions to Ask ChatGPT

1. **"What's the difference between anonymity and privacy?"**
2. **"Can de-identified data be re-identified?"** (Yes, examples: Netflix, AOL)
3. **"Why is k-anonymity alone not enough?"** (Homogeneity attack)
4. **"What's a re-identification attack in plain English?"**
5. **"How do attackers use external data to identify people?"**
6. **"What's the difference between risk assessment and risk mitigation?"**
7. **"Why can't I just remove names and call it anonymized?"**
8. **"What are quasi-identifiers and why do they matter?"**
9. **"How much re-identification risk is acceptable?"**
10. **"What happens if I don't do risk assessment before publishing?"**

---

## Key Takeaways

1. **Risk Assessment = Measure vulnerability before protection**
2. **Your Large Dataset = 100% re-ID risk (critical!)**
3. **Everyone has unique Age+Gender+State = Easy to identify**
4. **Quasi-identifiers are powerful** (combination matters more than individual)
5. **External knowledge = Real threat** (attacker can match with census/voting data)
6. **Protection is necessary** (K-Anonymity, Differential Privacy, or Synthetic Data)
7. **Privacy-Utility trade-off is real** (more privacy = less utility)
8. **Compliance matters** (GDPR < 5%, NIST < 4%, India < 5%)

---

## Mathematical Resources

### Key Formulas Summary

**Re-ID Risk:**
```
Risk = 1 / (Avg Group Size)
or
Risk = Unique Records / Total Records
```

**Average Group Size:**
```
Avg Size = Total Records / Number of Classes
```

**Equivalence Class Risk:**
```
Risk_class = 1 / (Records in Class)
```

**K-Anonymity Requirement:**
```
All Classes must have size ≥ K
```

**Differential Privacy Privacy Loss:**
```
ε = privacy loss parameter (lower = more private)
Higher ε = more utility, less privacy
```

---

## Glossary: Common Terms

| Term | Definition |
|------|-----------|
| **Re-Identification** | Successfully identifying which record belongs to which person |
| **Quasi-Identifier** | Attribute that could help identify someone (Age, Gender, State) |
| **Equivalence Class** | Group of identical records by quasi-identifiers |
| **De-identification** | Removing or hiding identifying information |
| **Anonymization** | Making data impossible to link to individuals |
| **Privacy Attack** | Method to breach privacy protections |
| **External Knowledge** | Information attacker already has (census, voting records) |
| **Linkage Attack** | Matching anonymous data to other datasets |
| **Homogeneity Attack** | Exploiting that all records in group have same sensitive value |
| **Utility** | How useful the data is for analysis |
| **Privacy-Utility Trade-off** | Balancing protection with data usefulness |

