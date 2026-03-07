export type TransferStatus = 'transfer' | 'partial' | 'lost';

export interface Course {
  code: string;
  name: string;
  creditHours: number;
  grade?: string;
}

export interface TransferResult {
  course: Course;
  status: TransferStatus;
  equivalentCourse?: string;
  dollarValue: number;
  explanation: string;
  recommendation: string;
}

export interface AnalysisState {
  fromUniversity: string;
  toUniversity: string;
  courses: Course[];
  results: TransferResult[];
  totalCreditHours: number;
  lostCreditHours: number;
  partialCreditHours: number;
  transferCreditHours: number;
  totalDollarLoss: number;
}

export type AppStep = 'upload' | 'analyzing' | 'results';
