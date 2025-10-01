// types/index.ts
export interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_group: number;
  created_at: string;
  updated_at: string;
}

export interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
}

export interface AbsenceType {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
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