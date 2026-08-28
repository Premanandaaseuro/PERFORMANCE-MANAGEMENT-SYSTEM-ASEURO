export interface KpiRatingScore {
  weightage: number;
  rating?: number;
}

export function calculateWeightedOverallScore(ratings: KpiRatingScore[]): number {
  if (!ratings || ratings.length === 0) return 0;
  let totalWeightedScore = 0;
  let totalWeightage = 0;

  for (const item of ratings) {
    if (item.rating !== undefined && item.rating !== null) {
      totalWeightedScore += (item.rating * item.weightage);
      totalWeightage += item.weightage;
    }
  }

  if (totalWeightage === 0) return 0;
  return Number((totalWeightedScore / totalWeightage).toFixed(2));
}

export function derivePerformanceGrade(score: number): string {
  if (score >= 4.5) return 'Outstanding Performance';
  if (score >= 4.0) return 'Excellent Performance';
  if (score >= 3.0) return 'Good Performance';
  if (score >= 2.0) return 'Needs Improvement';
  return 'Unsatisfactory Performance';
}
