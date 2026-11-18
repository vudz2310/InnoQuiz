export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  fullName?: string;
  studentCode?: string;
  majorId?: string;
  classId?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentCode?: string;
  avatar?: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "USER" | string;
  status?: string;
  majorId?: string | null;
  classId?: string | null;
  major?: {
    id: string;
    code: string;
    name: string;
  } | null;
  academicClass?: {
    id: string;
    code: string;
    name: string;
    cohort?: string;
  } | null;
  createdAt?: string;
}

export type login = LoginPayload;
export type register = RegisterPayload;
