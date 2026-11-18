export interface Major {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  allowRegistration: boolean;
  displayOrder: number;
  totalClasses?: number;
  totalStudents?: number;
  totalQuizzes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicClass {
  id: string;
  code: string;
  name: string;
  majorId: string;
  major?: {
    id: string;
    code: string;
    name: string;
  };
  cohort?: string;
  status: "ACTIVE" | "INACTIVE";
  allowRegistration: boolean;
  totalStudents?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentRegistrationPayload {
  fullName: string;
  studentCode: string;
  email: string;
  password: string;
  majorId: string;
  classId?: string | null;
}
