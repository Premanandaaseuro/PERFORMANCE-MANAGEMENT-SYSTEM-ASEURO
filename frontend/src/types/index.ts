export type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface AuthUser {
  token: string;
  email: string;
  role: UserRole;
  fullName: string;
  employeeCode: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface Designation {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface ManagerOption {
  id: number;
  fullName: string;
  employeeCode: string;
  email: string;
  designationName: string;
  managerId?: number | null;
  managerName?: string;
}

export interface EmployeeRecord {
  id: number;
  userId?: number;
  employeeCode: string;
  fullName: string;
  name?: string;
  email: string;
  role: UserRole | string;
  departmentId?: number;
  departmentName?: string;
  department?: string;
  designationId?: number;
  designationName?: string;
  designation?: string;
  team?: string;
  managerId: number | null;
  managerName: string;
  joiningDate: string;
  status: string;
  accountStatus?: string;
  createdAt?: string;
  profilePhoto?: string;
}

export interface User {
  token: string;
  tokenType: string;
  email: string;
  name: string;
  role: string;
  profilePhoto?: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  team: string;
  designation: string;
  managerName: string;
  joiningDate: string;
  accountStatus: string;
  status?: string;
  role?: string;
  phone?: string;
  profilePhoto?: string;
}

export interface Kpi {
  kpiId: number;
  kpiName: string;
  description: string;
  weightage: number;
  selfRating: number | null;
  managerRating: number | null;
  hrRating: number | null;
  comments: string | null;
  managerComments?: string | null;
  hrComments?: string | null;
  ratingStatus: 'DRAFT' | 'SUBMITTED' | 'COMPLETED' | 'PENDING';
}

export interface Review {
  reviewerName: string;
  reviewerRole: string;
  comments: string;
  reviewDate: string;
}

export interface PmsAssignment {
  assignmentId: number;
  cycleMonth: string;
  status: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  overallScore: number | null;
  performanceGrade: string | null;
  finalizedDate: string | null;
  employee: Employee;
  kpis: Kpi[];
  reviews: Review[];
}

export interface PmsHistory {
  id: number;
  assignmentId?: number;
  cycleMonth: string;
  finalScore: number;
  grade: string;
  finalizedDate: string;
  filePath: string | null;
}

export interface DashboardData {
  currentCycle: string;
  pmsStatus: string;
  totalKpis: number;
  completedKpis: number;
  completedWeightage: number;
  latestFinalizedScore: number | null;
  latestFinalizedGrade: string | null;
  managerReviewStatus: string;
  hrReviewStatus: string;
  actionRequired: string;
}

// HR Specific Types
export interface KpiMasterItem {
  id: number;
  designation: string;
  kpiName: string;
  description: string;
  weightage: number;
  selfRatingScale?: string;
  managerRatingScale?: string;
  status: string;
}

export interface HrDashboardStats {
  totalEmployees: number;
  totalManagers: number;
  totalDesignations: number;
  completedCycles: number;
  pendingSelfAssessments: number;
  pendingManagerReviews: number;
  pendingHrReviews: number;
}

export interface WorkflowStage {
  step: number;
  title: string;
  status: 'Not Started' | 'In Progress' | 'Pending' | 'Completed' | string;
}

export interface LifecycleKpiDetail {
  kpiId: number;
  kpiName: string;
  description: string;
  weightage: number;
  selfRating: number | null;
  managerRating: number | null;
  hrRating: number | null;
  comments: string | null;
  employeeComments?: string | null;
  managerComments?: string | null;
  hrComments?: string | null;
  ratingStatus: string;
  effectiveScore: number | null;
}

export interface EmployeeLifecycleData {
  employee: Employee;
  hasActiveAssignment: boolean;
  assignmentId?: number;
  cycleMonth?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  submissionDeadline?: string;
  overallScore?: number | null;
  performanceGrade?: string | null;
  finalizedDate?: string | null;
  workflowStages: WorkflowStage[];
  kpis: LifecycleKpiDetail[];
  calculatedScore?: number | null;
  reviews?: Array<{
    reviewerName: string;
    reviewerRole: string;
    comments: string;
    reviewDate: string;
  }>;
  history?: Array<{
    id: number;
    cycleMonth: string;
    finalScore: number;
    grade: string;
    finalizedDate: string;
  }>;
}

export interface RatingCategoryItem {
  category: string;
  count: number;
  percentage: number;
}

export interface HrReportSummary {
  categories: RatingCategoryItem[];
  totalFinalizedRecords: number;
  averageScore: number | null;
}

export interface CreateEmployeePayload {
  name: string;
  employeeCode?: string;
  email: string;
  password: string;
  designation: string;
  department?: string;
  team?: string;
  managerId?: number | null;
  joiningDate?: string;
  role?: string;
}

export interface CreateManagerPayload {
  name: string;
  managerCode?: string;
  email: string;
  password: string;
  designation?: string;
  department?: string;
  team?: string;
  managerId?: number | null;
  joiningDate?: string;
}

// Manager Specific Types
export interface ManagerDashboardData {
  managerName: string;
  currentCycle: string;
  mySelfAssessmentStatus: string;
  employeesAssigned: number;
  pendingEmployeeReviews: number;
  completedEmployeeReviews: number;
  latestFinalizedScore: number | null;
  latestFinalizedGrade: string | null;
  workflowHeading: string;
  workflowStatus: string;
  workflowSubStatus: string;
  activeStep: number;
  actionRequired: string;
}

export interface ManagerEmployeeItem {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  team: string;
  joiningDate: string;
  accountStatus: string;
  assignmentId: number | null;
  cycleMonth: string;
  status: string;
  canReview: boolean;
  overallScore: number | null;
  performanceGrade: string | null;
  kpisCount: number;
  completedKpisCount: number;
  profilePhoto?: string;
}

export interface ManagerKpiReviewDetail {
  kpiId: number;
  kpiName: string;
  description: string;
  weightage: number;
  selfRating: number | null;
  employeeComments: string | null;
  managerRating: number | null;
  managerComments: string | null;
  hrRating?: number | null;
  hrComments?: string | null;
}

export interface ManagerEmployeeReviewData {
  employee: {
    id: number;
    employeeCode: string;
    name: string;
    email: string;
    designation: string;
    department: string;
    managerName: string;
    profilePhoto?: string;
  };
  assignmentId: number;
  cycleMonth: string;
  status: string;
  canReview: boolean;
  isCompleted: boolean;
  overallScore: number | null;
  performanceGrade: string | null;
  kpis: ManagerKpiReviewDetail[];
  selfCalculatedScore: number | null;
  managerCalculatedScore: number | null;
  managerReviewComments: string;
}

export interface ManagerReviewPayload {
  ratings: Array<{
    kpiId: number;
    managerRating: number;
    managerComments?: string;
  }>;
  managerComments?: string;
}

export interface ManagerReportData {
  assignedEmployees: ManagerEmployeeItem[];
  totalAssigned: number;
  selfAssessmentPendingCount: number;
  selfAssessmentCompletedCount: number;
  managerReviewPendingCount: number;
  managerReviewCompletedCount: number;
  finalizedRecordsCount: number;
}
