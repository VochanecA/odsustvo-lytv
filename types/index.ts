// types/index.ts

// Osnovni interfejsi za kompanije i službe
export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Prošireni interfejsi sa podrškom za više kompanija
export interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_group: number;
  company_id: string; // NOVO
  department_id?: string; // NOVO
  created_at: string;
  updated_at: string;
}

export interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
  company_id: string; // NOVO
}

export interface AbsenceType {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  company_id: string; // NOVO
}

export interface AbsenceRecord {
  id: string;
  employee_id: string;
  absence_type_id: string;
  date: string;
  hours: number;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

export interface AbsenceRequest {
  id: string;
  employee_id: string;
  absence_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

// Dodatni interfejsi za radne sate (ako već nemate)
export interface WorkHours {
  id: string;
  employee_id: string;
  work_date: string;
  hours_input: string;
  hours_worked: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyHoursSummary {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  total_normal_hours: number;
  total_redistribution_hours: number;
  total_overtime_hours: number;
  created_at: string;
  updated_at: string;
}

// Helper interfejsi za prikaz podataka
export interface EmployeeWithDetails extends Employee {
  company?: Company;
  department?: Department;
  work_group_details?: WorkGroup;
}

export interface DepartmentWithCompany extends Department {
  company?: Company;
}

// Tipovi za forme
export interface CreateCompanyFormData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CreateDepartmentFormData {
  company_id: string;
  name: string;
  description?: string;
}

export interface UpdateEmployeeFormData {
  first_name?: string;
  last_name?: string;
  email?: string;
  work_group?: number;
  company_id?: string;
  department_id?: string | null;
}

// Filter tipovi
export interface CompanyFilter {
  is_active?: boolean;
}

export interface DepartmentFilter {
  company_id?: string;
  is_active?: boolean;
}

export interface EmployeeFilter {
  company_id?: string;
  department_id?: string;
  is_active?: boolean;
}