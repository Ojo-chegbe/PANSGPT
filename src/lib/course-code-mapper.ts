/**
 * Course Code Mapper
 * Maps course codes to course titles and handles course code extraction from queries
 */

// Course code to title mapping - extracted from curriculum
export const COURSE_CODE_MAP: Record<string, { title: string; level: string; semester: string }> = {
  // 200 Level - First Semester
  'PCG 211': { title: 'General Pharmacognosy', level: '200', semester: '1st' },
  'PCH 211': { title: 'Introduction to Pharmaceutical Chemistry', level: '200', semester: '1st' },
  'PMB 211': { title: 'Introduction to Pharmaceutical Microbiology', level: '200', semester: '1st' },
  'PCT 211': { title: 'Introduction to Pharmacy', level: '200', semester: '1st' },
  'ANA 201': { title: 'Basic Anatomy and Neuroanatomy', level: '200', semester: '1st' },
  'BCH 201': { title: 'General Biochemistry', level: '200', semester: '1st' },
  'PHY 201': { title: 'Introductory and Blood Physiology', level: '200', semester: '1st' },
  'PCP 211': { title: 'Health Psychology', level: '200', semester: '1st' },
  
  // 200 Level - Second Semester
  'PCG 212': { title: 'Organized (cellular) and unorganized (acellular) drugs', level: '200', semester: '2nd' },
  'PCH 222': { title: 'Pharmaceutical Organic Chemistry I', level: '200', semester: '2nd' },
  'PIE 222': { title: 'Introduction to Pharmaceutical Technology', level: '200', semester: '2nd' },
  'ANA 202': { title: 'General Embryology, Teratology and Genetic Anatomy', level: '200', semester: '2nd' },
  'BCH 202': { title: 'Introductory Molecular Biology', level: '200', semester: '2nd' },
  'PHY 202': { title: 'Neurophysiology and Special Senses', level: '200', semester: '2nd' },
  
  // 300 Level - First Semester
  'PCG 311': { title: 'Phytochemistry of drugs of natural origin', level: '300', semester: '1st' },
  'PCH 311': { title: 'Pharmaceutical Organic Chemistry II', level: '300', semester: '1st' },
  'PCL 311': { title: 'Introductory Pharmacology', level: '300', semester: '1st' },
  'PCP 311': { title: 'Pathophysiology I', level: '300', semester: '1st' },
  'PMB 311': { title: 'Pharmaceutical Microbiology I', level: '300', semester: '1st' },
  'PCT 331': { title: 'Physical Pharmacy', level: '300', semester: '1st' },
  'PCT 311': { title: 'Formulation of Liquid Dosage Forms', level: '300', semester: '1st' },
  'PCT 332': { title: 'Dispensing I', level: '300', semester: '1st' },
  
  // 300 Level - Second Semester
  'PCG 312': { title: 'Techniques in Phytochemical studies', level: '300', semester: '2nd' },
  'PCH 322': { title: 'Analysis of Pharmaceuticals I', level: '300', semester: '2nd' },
  'PCL 312': { title: 'Autonomic Pharmacology', level: '300', semester: '2nd' },
  'PCL 323': { title: 'Systemic Pharmacology I', level: '300', semester: '2nd' },
  'PCP 322': { title: 'Pathophysiology II', level: '300', semester: '2nd' },
  'PTE 321': { title: 'Formulation of Solid Dosage Forms', level: '300', semester: '2nd' },
  
  // 300 Level - Full Session
  'PPR 331': { title: 'Professional Preparedness & Resilience I', level: '300', semester: 'Both/Total' },
  
  // 400 Level - First Semester
  'PCG 411': { title: 'Nigerian medicinal plants and forensic Pharmacognosy', level: '400', semester: '1st' },
  'PCH 411': { title: 'Pharmaceutical Bioinformatics and Drug Design', level: '400', semester: '1st' },
  'PCH 412': { title: 'Medicinal Chemistry 1', level: '400', semester: '1st' },
  'PCH 423': { title: 'Analysis of Pharmaceuticals II', level: '400', semester: '1st' },
  'PCL 421': { title: 'Systemic Pharmacology II', level: '400', semester: '1st' },
  'PCP 411': { title: 'Introduction to Clinical Pharmacy & Pharmaceutical Care', level: '400', semester: '1st' },
  'PCP 412': { title: 'Introduction to Health Systems & Supply Chain Management', level: '400', semester: '1st' },
  'PMB 411': { title: 'Pharmaceutical Microbiology II', level: '400', semester: '1st' },
  'PCT 421': { title: 'Formulation of Semi-solid and Gaseous Dosage Forms', level: '400', semester: '1st' },
  'PCT 432': { title: 'Dispensing II', level: '400', semester: '1st' },
  
  // 400 Level - Second Semester
  'PCG 412': { title: 'Alternative/complementary and herbal medicines', level: '400', semester: '2nd' },
  'PCL 422': { title: 'Systemic Pharmacology III', level: '400', semester: '2nd' },
  'PCL 423': { title: 'Chemotherapy', level: '400', semester: '2nd' },
  'PCP 423': { title: 'Supply Chain Management of Health Commodities', level: '400', semester: '2nd' },
  'PCP 424': { title: 'Pharmacotherapeutics I', level: '400', semester: '2nd' },
  'PTE 411': { title: 'Industrial Pharmacy', level: '400', semester: '2nd' },
  'PSC 421': { title: 'Pharmacy Management', level: '400', semester: '2nd' },
  
  // 400 Level - Full Session
  'PPR 432': { title: 'Professional Preparedness & Resilience II', level: '400', semester: 'Both/Total' },
  
  // 500 Level - First Semester
  'PCG 511': { title: 'Biogenesis of Drugs of Natural Origin and Special Classes of Natural Products', level: '500', semester: '1st' },
  'PCH 511': { title: 'Radio Pharmacy', level: '500', semester: '1st' },
  'PCL 511': { title: 'Systematic Pharmacology IV (CNS)', level: '500', semester: '1st' },
  'PCP 511': { title: 'Pharmacotherapeutics II', level: '500', semester: '1st' },
  'PCP 512': { title: 'Pharmacoepidemiology', level: '500', semester: '1st' },
  'PCP 533': { title: 'Clinical Pharmacy Clerkship I', level: '500', semester: '1st' },
  'PSC 511': { title: 'Biostatistics & Research Methods', level: '500', semester: '1st' },
  'PCT 511': { title: 'Drug Delivery and Drug Delivery System', level: '500', semester: '1st' },
  
  // 500 Level - Second Semester
  'PCH 522': { title: 'Medicinal Chemistry II', level: '500', semester: '2nd' },
  'PCL 522': { title: 'Biochemical Pharmacology', level: '500', semester: '2nd' },
  'PCL 523': { title: 'Toxicology and Social pharmacology', level: '500', semester: '2nd' },
  'PCP 524': { title: 'Applied and Clinical Pharmacokinetics', level: '500', semester: '2nd' },
  'PSC 522': { title: 'Introduction to Veterinary Pharmacy', level: '500', semester: '2nd' },
  'PSC 523': { title: 'Forensic Pharmacy and Jurisprudence', level: '500', semester: '2nd' },
  'PMB 511': { title: 'Pharmaceutical Microbiology III', level: '500', semester: '2nd' },
  
  // 500 Level - Full Session
  'PPR 533': { title: 'Professional preparedness & Resilience III', level: '500', semester: 'Both/Total' },
  
  // 600 Level - First Semester
  'PCP 632': { title: 'Clinical Pharmacy Clerkship II', level: '600', semester: '1st' },
  'PCP 633': { title: 'Clinical Pharmacy Clerkship III', level: '600', semester: '1st' },
  'PCP 614': { title: 'Drug Information Services', level: '600', semester: '1st' },
  'PCP 616': { title: 'Advance Public Health Pharmacy', level: '600', semester: '1st' },
  'PSC 613': { title: 'Pharmacogenetics & Genomics', level: '600', semester: '1st' },
  'PSC 634': { title: 'Project', level: '600', semester: '1st' },
  
  // 600 Level - Second Semester
  'PCP 621': { title: 'Pharmacoeconomics & Health Economics', level: '600', semester: '2nd' },
  'PCP 625': { title: 'Nutritional Health & Health Promotion', level: '600', semester: '2nd' },
  'PSC 621': { title: 'Pharmaceutical Quality Systems', level: '600', semester: '2nd' },
  'PSC 622': { title: 'Pharmaceutical Marketing', level: '600', semester: '2nd' },
  
  // 600 Level - Full Session
  'PPR 634': { title: 'Professional Preparedness & Resilience H', level: '600', semester: 'Both/Total' },
};

// Course abbreviation to full name mapping
export const COURSE_ABBREVIATIONS: Record<string, string> = {
  'PCG': 'Pharmacognosy',
  'PCH': 'Pharmaceutical Chemistry',
  'PMB': 'Pharmaceutical Microbiology',
  'PCT': 'Pharmacy',
  'PCL': 'Pharmacology',
  'PCP': 'Clinical Pharmacy',
  'PTE': 'Pharmaceutical Technology',
  'PSC': 'Pharmacy Social/Management',
  'PPR': 'Professional Preparedness & Resilience',
  'PIE': 'Pharmaceutical Industrial Engineering',
  'ANA': 'Anatomy',
  'BCH': 'Biochemistry',
  'PHY': 'Physiology',
};

/**
 * Extract course code from a query string
 * Matches patterns like "PCG 211", "PCH311", "PCG-211", etc.
 */
export function extractCourseCode(query: string): string | null {
  // Pattern to match course codes: 2-4 letters, optional space/dash, 3 digits
  const patterns = [
    /([A-Z]{2,4})\s*[-]?\s*(\d{3})/i,  // PCG 211, PCH-311, PCG211
    /([A-Z]{2,4})\s+(\d{3})/i,         // PCG 211 (with space)
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const code = `${match[1].toUpperCase()} ${match[2]}`;
      // Check if it's a valid course code
      if (COURSE_CODE_MAP[code]) {
        return code;
      }
    }
  }
  
  return null;
}

/**
 * Extract course abbreviation from a query string
 * Returns the abbreviation if found (e.g., "PCG", "PCH")
 */
export function extractCourseAbbreviation(query: string): string | null {
  // Look for standalone course abbreviations (2-4 uppercase letters)
  const abbreviationPattern = /\b([A-Z]{2,4})\b/;
  const match = query.match(abbreviationPattern);
  
  if (match) {
    const abbrev = match[1].toUpperCase();
    // Check if it's a known course abbreviation
    if (COURSE_ABBREVIATIONS[abbrev]) {
      return abbrev;
    }
  }
  
  return null;
}

/**
 * Get course title from course code
 */
export function getCourseTitle(courseCode: string): string | null {
  return COURSE_CODE_MAP[courseCode]?.title || null;
}

/**
 * Get all course codes for a given abbreviation
 * e.g., "PCG" returns ["PCG 211", "PCG 212", "PCG 311", ...]
 */
export function getCourseCodesByAbbreviation(abbreviation: string): string[] {
  const abbrev = abbreviation.toUpperCase();
  return Object.keys(COURSE_CODE_MAP).filter(code => 
    code.startsWith(abbrev + ' ')
  );
}

/**
 * Extract course information from a query
 * Returns course code if found, or null
 */
export function extractCourseInfo(query: string): {
  courseCode: string | null;
  abbreviation: string | null;
  title: string | null;
} {
  // First try to extract full course code
  const courseCode = extractCourseCode(query);
  if (courseCode) {
    return {
      courseCode,
      abbreviation: courseCode.split(' ')[0],
      title: getCourseTitle(courseCode),
    };
  }
  
  // If no full code, try abbreviation
  const abbreviation = extractCourseAbbreviation(query);
  if (abbreviation) {
    return {
      courseCode: null,
      abbreviation,
      title: COURSE_ABBREVIATIONS[abbreviation] || null,
    };
  }
  
  return {
    courseCode: null,
    abbreviation: null,
    title: null,
  };
}

