# Possible Analyses

The dataset is a binary detection task with known ground truth. Each response is: did the participant detect colorization artifacts (PRESENT) or not (ABSENT)?

---

## 1. Per-Method Detection Rate (primary)

**Question:** Which colorization method is hardest to detect?

```python
df.groupby('method').apply(lambda g: (
    g[g['label']=='fake']['response'].eq('fake').mean()
))
```

Produces hit rate per method. Lower = more convincing. Compare methods pairwise with proportion tests or a logistic mixed-effects model.

---

## 2. Signal Detection Theory (d-prime)

**Question:** Separating sensitivity from response bias.

For each participant (or aggregated per method):

```python
from scipy.stats import norm

def dprime(hits, misses, fas, crs):
    hr = hits / (hits + misses)
    far = fas / (fas + crs)
    # Clip to avoid ±inf
    hr  = max(0.01, min(0.99, hr))
    far = max(0.01, min(0.99, far))
    return norm.ppf(hr) - norm.ppf(far)

# hits  = label=='fake' AND response=='fake'
# misses = label=='fake' AND response=='real'
# false alarms = label=='real' AND response=='fake'
# correct rejections = label=='real' AND response=='real'
```

d' = 0 → chance; d' = 1 → moderate sensitivity; d' ≥ 2 → strong.  
Criterion c = −0.5 × (z_HR + z_FAR) tells you response bias (positive = conservative, negative = liberal).

**Important:** The 20/80 real/fake base rate (10 gt + 40 colorized per session) must be noted when interpreting criterion. These counts are fixed by the sampling scheme.

---

## 3. Response Time Analysis

**Question:** Do faster responses indicate more automatic (vs deliberative) detection?

```python
import seaborn as sns
sns.boxplot(data=df, x='method', y='response_time_ms', hue='correct')
```

Hypotheses:
- Correct rejections of hard-to-detect fakes may be slower (more deliberation)
- Easy artifacts (some methods) may produce fast, confident PRESENT responses
- Compare median RT for correct vs incorrect per method with Mann-Whitney U

---

## 4. Expertise Effect

**Question:** Do experts outperform novices?

```python
df.groupby(['expertise', 'method'])['correct'].mean().unstack()
```

Run a 2-way ANOVA or mixed-effects logistic regression:
```
correct ~ expertise * method + (1|session_id)
```
Use `pymer4` (R-style) or `statsmodels` MixedLM.

---

## 5. Colorblindness Effect

**Question:** Does colorblindness affect artifact detection?

```python
df.groupby(['cb_redgreen', 'method'])['correct'].mean()
```

Red-green colorblindness may reduce sensitivity to chromatic artifacts from some methods. Compare d' between `normal` and `deficient` groups with independent-samples t-test or Bayesian comparison (if n is small).

---

## 6. Variant Comparison (ortho vs standard)

**Question:** Are orthogonal colorizations harder to detect?

```python
df[df['label']=='fake'].groupby(['method','variant'])['correct'].mean()
```

Within each method, compare detection rates for `ortho` vs `standard`. Paired within method to control for method-level difficulty.

---

## 7. Dataset Difficulty

**Question:** Do COCO / ImageNet / Instance images differ in detection difficulty?

```python
df[df['label']=='fake'].groupby(['dataset','method'])['correct'].mean().unstack()
```

---

## 8. Learning / Fatigue Effects

**Question:** Does performance change over the course of the session?

```python
df['trial_bin'] = pd.cut(df['trial_index'], bins=5, labels=['1-10','11-20','21-30','31-40','41-50'])
df.groupby('trial_bin')['correct'].mean()
```

Plot accuracy across bins. Rising = learning (calibration to task). Falling = fatigue.

---

## 9. Per-Image Difficulty

**Question:** Which specific images are consistently detected / missed?

```python
img_stats = df.groupby('image_id').agg(
    n=('correct','count'),
    accuracy=('correct','mean'),
    method=('method','first'),
    dataset=('dataset','first'),
).sort_values('accuracy')
```

Top easiest (always detected) and hardest (never detected) images. Useful for understanding method-specific failure modes.

---

## 10. Inter-Rater Agreement

**Question:** Do participants agree with each other on specific images?

For images seen by multiple participants, compute Fleiss' kappa or just pairwise agreement rate. High agreement on specific images = consistent perceptual signal, not noise.

---

## Suggested Analysis Pipeline (Python)

```python
import pandas as pd
from scipy.stats import norm, mannwhitneyu

# Long-format CSV (one row per trial) — best for analysis
# Download from: /api/results/csv?key=colorturingtest2025
df = pd.read_csv('colorization_results.csv')

# Filter completed sessions only (reached trial 49)
complete_ids = df.groupby('session_id')['trial_index'].max()
complete_ids = complete_ids[complete_ids >= 49].index
df = df[df['session_id'].isin(complete_ids)]

# Base rate check — should be ~20% real, 80% fake
print(df['label'].value_counts(normalize=True))

# Per-method detection rate (fake images only)
fakes = df[df['label'] == 'fake']
print(fakes.groupby('method')['correct'].mean().sort_values())

# Overall accuracy
print("Overall accuracy:", df['correct'].mean())

# Participants with email (for follow-up)
emails = df[['session_id','email']].drop_duplicates()
print(emails[emails['email'] != ''])
```

---

## Recommended Libraries

| Task | Library |
|---|---|
| Data wrangling | `pandas` |
| Statistical tests | `scipy.stats`, `pingouin` |
| Mixed-effects models | `statsmodels`, `pymer4` |
| Signal detection | `sdtpy` or manual (formula above) |
| Visualization | `matplotlib`, `seaborn` |
| Reporting | `jupyter` notebooks |
