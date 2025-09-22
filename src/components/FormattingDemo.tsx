import React from 'react';
import MarkdownWithMath from './MarkdownWithMath';

const FormattingDemo: React.FC = () => {
  const demoContent = `
# Normality in Chemistry

Normality is a measure of concentration that expresses the number of gram equivalent weights of solute per liter of solution. It differs from Molarity, which expresses the number of moles per liter.

[KEY_CONCEPT]

**Key Concept:** Normality depends on how a substance reacts and is calculated differently for acids, bases, salts, and redox reactions.

[EXAMPLE]

**Example:** For H₂SO₄ (sulfuric acid), the molecular weight is 98 g/mol, with two replaceable H⁺ ions. The equivalent weight calculation is: 98/2 = 49 g/equivalent.

## 1. Equivalent Weight

The equivalent weight depends on the type of reaction:

### Acids
- **Formula:** \`Equivalent weight = (Molecular weight) / (Number of replaceable H⁺ ions)\`
- **Example:** HCl has molecular weight 36.5 g/mol with 1 replaceable H⁺ ion
- **Calculation:** 36.5/1 = 36.5 g/equivalent

### Bases
- **Formula:** \`Equivalent weight = (Molecular weight) / (Number of replaceable OH⁻ ions)\`
- **Example:** NaOH has molecular weight 40 g/mol with 1 replaceable OH⁻ ion
- **Calculation:** 40/1 = 40 g/equivalent

[FORMULA]

**Formula:** The normality calculation is straightforward once equivalent weight is known:

$$N = \\frac{\\text{Number of equivalent weights of solute}}{\\text{Liters of solution}}$$

[IMPORTANT]

**Important:** Normality is particularly useful in titrations and reactions involving variable stoichiometry, but it's less commonly used in modern chemistry compared to molarity.

## 2. Relationship to Molarity

Normality (N) is related to Molarity (M) by a factor 'n':

$$N = M \\times n$$

Where 'n' is the number of equivalents per mole.

### Examples:
- **Monoprotic acid (HCl):** n = 1, so N = M
- **Diprotic acid (H₂SO₄):** n = 2, so N = 2M
- **Base (NaOH):** n = 1, so N = M

[WARNING]

**Warning:** Normality depends on the specific reaction, making molarity a more fundamental and universally applicable concentration unit.

## 3. Practical Applications

Normality is particularly useful in:

1. **Titrations:** Simplifies calculations in acid-base and redox titrations
2. **Variable stoichiometry:** When exact number of electrons or protons isn't fixed
3. **Direct stoichiometry:** At equivalence point: N_acid × V_acid = N_base × V_base
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Enhanced Formatting Demo
        </h2>
        <MarkdownWithMath content={demoContent} role="model" />
      </div>
    </div>
  );
};

export default FormattingDemo;
