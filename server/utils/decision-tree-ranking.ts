interface ApplicantData {
  scholarship_application_id: string;
  custom_form_response: Array<{ label: string; value: any }>;
  student?: {
    student_id: string;
    full_name: string;
    gender?: string;
    date_of_birth: string;
    contact_number: string;
  };
}

interface ScholarshipData {
  criteria: string[];
  custom_form_fields?: Array<{
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;
  type?: 'merit_based' | 'skill_based';
}

interface RankedApplicant extends ApplicantData {
  rank: number;
  score: number;
  evaluationDetails: {
    criteriaMatches: number;
    criteriaTotal: number;
    formCompleteness: number;
    bonusPoints: number;
    explanation: string[];
  };
}

/**
 * Decision Tree Node for evaluating applicants
 */
class DecisionNode {
  condition: (applicant: ApplicantData, scholarship: ScholarshipData) => number;
  weight: number;
  description: string;

  constructor(
    condition: (applicant: ApplicantData, scholarship: ScholarshipData) => number,
    weight: number,
    description: string
  ) {
    this.condition = condition;
    this.weight = weight;
    this.description = description;
  }
}

/**
 * Extract numeric value from various formats
 */
function extractNumericValue(value: any): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Try to extract number from string (e.g., "3.5", "85%", "Grade: A")
    const match = value.match(/(\d+\.?\d*)/);
    if (match) return parseFloat(match[1]);
  }
  return null;
}

/**
 * Check if a value matches a criterion (fuzzy matching)
 */
function matchesCriterion(value: any, criterion: string): boolean {
  if (!value) return false;
  
  const valueStr = String(value).toLowerCase();
  const criterionLower = criterion.toLowerCase();
  
  // Direct match
  if (valueStr.includes(criterionLower) || criterionLower.includes(valueStr)) {
    return true;
  }
  
  // Check for keyword matches
  const criterionKeywords = criterionLower.split(/\s+/);
  const matches = criterionKeywords.filter(keyword => 
    keyword.length > 3 && valueStr.includes(keyword)
  );
  
  return matches.length >= Math.ceil(criterionKeywords.length * 0.5);
}

/**
 * Calculate form completeness score
 */
function calculateFormCompleteness(
  applicant: ApplicantData,
  scholarship: ScholarshipData
): number {
  if (!scholarship.custom_form_fields || scholarship.custom_form_fields.length === 0) {
    return 1.0; // No form fields means 100% complete
  }

  const responses = applicant.custom_form_response || [];
  const responseMap = new Map(
    responses.map(r => [r.label.toLowerCase(), r.value])
  );

  let completedFields = 0;
  let totalFields = 0;

  scholarship.custom_form_fields.forEach(field => {
    totalFields++;
    const response = responseMap.get(field.label.toLowerCase());
    
    if (response !== null && response !== undefined && response !== '') {
      if (Array.isArray(response) && response.length > 0) {
        completedFields++;
      } else if (!Array.isArray(response)) {
        completedFields++;
      }
    }
  });

  return totalFields > 0 ? completedFields / totalFields : 0;
}

/**
 * Build decision tree nodes for evaluation
 */
function buildDecisionTree(): DecisionNode[] {
  return [
    // Criteria matching node (highest weight)
    new DecisionNode(
      (applicant, scholarship) => {
        const criteria = scholarship.criteria || [];
        if (criteria.length === 0) return 1.0;

        const responses = applicant.custom_form_response || [];
        const responseMap = new Map(
          responses.map(r => [r.label.toLowerCase(), r.value])
        );

        let matches = 0;
        criteria.forEach(criterion => {
          // Check if any response matches this criterion
          let matched = false;
          responseMap.forEach((value, label) => {
            if (matchesCriterion(value, criterion) || matchesCriterion(label, criterion)) {
              matched = true;
            }
          });
          if (matched) matches++;
        });

        return matches / criteria.length;
      },
      0.4, // 40% weight
      'Criteria Matching'
    ),

    // Form completeness node
    new DecisionNode(
      (applicant, scholarship) => calculateFormCompleteness(applicant, scholarship),
      0.2, // 20% weight
      'Form Completeness'
    ),

    // GPA/GWA evaluation node (for merit-based)
    new DecisionNode(
      (applicant, scholarship) => {
        if (scholarship.type !== 'merit_based') return 0.5; // Neutral for non-merit

        const responses = applicant.custom_form_response || [];
        let bestScore = 0;
        let foundGrade = false;

        responses.forEach(response => {
          const label = response.label.toLowerCase();
          const value = response.value;

          // Look for GPA/GWA-related fields
          if (label.includes('gpa') || label.includes('grade') || label.includes('average') || label.includes('gwa') || label.includes('general weighted average')) {
            const numValue = extractNumericValue(value);
            if (numValue !== null) {
              foundGrade = true;
              let normalizedScore = 0;
              
              // Check if it's a percentage (typically > 50 and <= 100)
              if (numValue > 50 && numValue <= 100) {
                // Percentage system: higher is better (85% = 0.85 score)
                normalizedScore = numValue / 100;
              } 
              // Check if it's GWA system (1.0-5.0 scale where 1.0 is best, 5.0 is worst)
              else if (numValue >= 1.0 && numValue <= 5.0) {
                // GWA system: invert the scale (1.0 = best, 5.0 = worst)
                // Formula: score = (5.0 - gwa) / 4.0
                // Example: 1.0 -> (5-1)/4 = 1.0, 3.0 -> (5-3)/4 = 0.5, 5.0 -> (5-5)/4 = 0.0
                normalizedScore = (5.0 - numValue) / 4.0;
              }
              // Check if it's traditional GPA (0.0-4.0 scale where 4.0 is best)
              else if (numValue >= 0.0 && numValue <= 4.0) {
                // Traditional GPA: higher is better (4.0 = 1.0 score)
                normalizedScore = numValue / 4.0;
              }
              
              // Keep the best score found
              bestScore = Math.max(bestScore, normalizedScore);
            }
          }
        });

        if (!foundGrade) return 0.5; // Neutral if no grade found
        return bestScore; // Already normalized to 0-1 scale
      },
      0.25, // 25% weight
      'Academic Performance'
    ),

    // Response quality node (length and detail)
    new DecisionNode(
      (applicant, scholarship) => {
        const responses = applicant.custom_form_response || [];
        let totalLength = 0;
        let responseCount = 0;

        responses.forEach(response => {
          if (response.value && typeof response.value === 'string') {
            totalLength += response.value.length;
            responseCount++;
          } else if (Array.isArray(response.value)) {
            response.value.forEach(item => {
              if (typeof item === 'string') {
                totalLength += item.length;
              }
            });
            if (response.value.length > 0) responseCount++;
          }
        });

        if (responseCount === 0) return 0;
        
        const avgLength = totalLength / responseCount;
        // Normalize: 0-50 chars = 0-0.5, 50-200 chars = 0.5-0.8, 200+ = 0.8-1.0
        if (avgLength < 50) return avgLength / 100;
        if (avgLength < 200) return 0.5 + (avgLength - 50) / 500;
        return Math.min(0.8 + (avgLength - 200) / 1000, 1.0);
      },
      0.15, // 15% weight
      'Response Quality'
    ),
  ];
}

/**
 * Rank applicants using Decision Tree algorithm
 */
export function rankApplicants(
  applicants: ApplicantData[],
  scholarship: ScholarshipData
): RankedApplicant[] {
  if (!applicants || applicants.length === 0) {
    return [];
  }

  const decisionTree = buildDecisionTree();

  const ranked: RankedApplicant[] = applicants.map(applicant => {
    let totalScore = 0;
    const explanations: string[] = [];
    let criteriaMatches = 0;
    let criteriaTotal = scholarship.criteria?.length || 0;

    // Calculate criteria matches
    if (criteriaTotal > 0) {
      const responses = applicant.custom_form_response || [];
      const responseMap = new Map(
        responses.map(r => [r.label.toLowerCase(), r.value])
      );

      scholarship.criteria?.forEach(criterion => {
        let matched = false;
        responseMap.forEach((value, label) => {
          if (matchesCriterion(value, criterion) || matchesCriterion(label, criterion)) {
            matched = true;
          }
        });
        if (matched) criteriaMatches++;
      });
    }

    // Evaluate through decision tree
    decisionTree.forEach(node => {
      const nodeScore = node.condition(applicant, scholarship);
      const weightedScore = nodeScore * node.weight;
      totalScore += weightedScore;

      // Generate explanation
      if (nodeScore > 0.7) {
        explanations.push(`✓ ${node.description}: Excellent (${(nodeScore * 100).toFixed(0)}%)`);
      } else if (nodeScore > 0.5) {
        explanations.push(`○ ${node.description}: Good (${(nodeScore * 100).toFixed(0)}%)`);
      } else if (nodeScore > 0.3) {
        explanations.push(`△ ${node.description}: Fair (${(nodeScore * 100).toFixed(0)}%)`);
      } else {
        explanations.push(`✗ ${node.description}: Needs Improvement (${(nodeScore * 100).toFixed(0)}%)`);
      }
    });

    // Calculate bonus points for exceptional cases
    let bonusPoints = 0;
    const formCompleteness = calculateFormCompleteness(applicant, scholarship);
    
    if (formCompleteness === 1.0) {
      bonusPoints += 0.05;
      explanations.push('+ Bonus: Complete application form');
    }

    if (criteriaMatches === criteriaTotal && criteriaTotal > 0) {
      bonusPoints += 0.05;
      explanations.push('+ Bonus: Meets all criteria');
    }

    totalScore = Math.min(totalScore + bonusPoints, 1.0); // Cap at 1.0

    return {
      ...applicant,
      score: totalScore,
      evaluationDetails: {
        criteriaMatches,
        criteriaTotal,
        formCompleteness,
        bonusPoints,
        explanation: explanations,
      },
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by score (descending) and assign ranks
  ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tie-breaker: more criteria matches
    if (b.evaluationDetails.criteriaMatches !== a.evaluationDetails.criteriaMatches) {
      return b.evaluationDetails.criteriaMatches - a.evaluationDetails.criteriaMatches;
    }
    // Final tie-breaker: better form completeness
    return b.evaluationDetails.formCompleteness - a.evaluationDetails.formCompleteness;
  });

  // Assign ranks (handle ties)
  ranked.forEach((applicant, index) => {
    if (index > 0 && ranked[index - 1].score === applicant.score) {
      // Same rank as previous if score is equal
      applicant.rank = ranked[index - 1].rank;
    } else {
      applicant.rank = index + 1;
    }
  });

  return ranked;
}

