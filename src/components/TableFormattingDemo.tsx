import React from 'react';
import MarkdownWithMath from './MarkdownWithMath';

const TableFormattingDemo: React.FC = () => {
  const sampleTables = `
## Chemical Data Table

| Substance | 'n' (equivalents/mole) | 1 N Solution = ? M |
|-----------|------------------------|-------------------|
| HCl       | 1                      | 1 M               |
| H₂SO₄     | 2                      | 0.5 M             |
| NaOH      | 1                      | 1 M               |
| Ca(OH)₂   | 2                      | 0.5 M             |
| FeCl₃     | 3                      | 1/3 M             |

## Comparison Table

| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Speed   | Fast     | Medium   | Slow     |
| Cost    | High     | Medium   | Low      |
| Quality | Excellent| Good     | Fair     |

## Data Analysis Table

| Measurement | Value | Unit | Error |
|-------------|-------|------|-------|
| Length      | 25.4  | cm   | ±0.1  |
| Mass        | 150.2 | g    | ±0.5  |
| Temperature | 23.5  | °C   | ±0.2  |
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Table Formatting Demo - Transparent with White Borders
      </h1>
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-6 shadow-lg">
        <MarkdownWithMath content={sampleTables} />
      </div>
    </div>
  );
};

export default TableFormattingDemo;
