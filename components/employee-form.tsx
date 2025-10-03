// components/employee-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Building, Users } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_group: number;
  company_id?: string;
  department_id?: string | null;
}

interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
  is_active: boolean;
}

interface Department {
  id: string;
  name: string;
  company_id: string;
  is_active: boolean;
}

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  employee?: Employee | null;
  workGroups: WorkGroup[];
  companies?: Company[];
  departments?: Department[];
}

export function EmployeeForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  employee, 
  workGroups, 
  companies = [], 
  departments = [] 
}: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    work_group: 1,
    company_id: '',
    department_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [filteredWorkGroups, setFilteredWorkGroups] = useState<WorkGroup[]>([]);

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        work_group: employee.work_group,
        company_id: employee.company_id || '',
        department_id: employee.department_id || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        work_group: 1,
        company_id: companies.length > 0 ? companies[0].id : '',
        department_id: ''
      });
    }
    setErrors({});
  }, [employee, isOpen, companies]);

  // Filter departments and work groups when company changes
  useEffect(() => {
    if (formData.company_id) {
      const companyDepartments = departments.filter(dept => dept.company_id === formData.company_id);
      const companyWorkGroups = workGroups.filter(group => group.company_id === formData.company_id);
      
      setFilteredDepartments(companyDepartments);
      setFilteredWorkGroups(companyWorkGroups);

      // Reset department if it doesn't belong to selected company
      if (formData.department_id) {
        const currentDepartment = departments.find(dept => dept.id === formData.department_id);
        if (!currentDepartment || currentDepartment.company_id !== formData.company_id) {
          setFormData(prev => ({ ...prev, department_id: '' }));
        }
      }

      // Reset work group if it doesn't belong to selected company
      if (formData.work_group) {
        const currentWorkGroup = workGroups.find(group => group.id === formData.work_group);
        if (!currentWorkGroup || currentWorkGroup.company_id !== formData.company_id) {
          setFormData(prev => ({ 
            ...prev, 
            work_group: companyWorkGroups.length > 0 ? companyWorkGroups[0].id : 1 
          }));
        }
      }
    } else {
      setFilteredDepartments([]);
      setFilteredWorkGroups(workGroups);
    }
  }, [formData.company_id, departments, workGroups]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Ime je obavezno';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Prezime je obavezno';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email je obavezan';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email nije validan';
    }

    if (!formData.work_group) {
      newErrors.work_group = 'Radna grupa je obavezna';
    }

    if (companies.length > 0 && !formData.company_id) {
      newErrors.company_id = 'Kompanija je obavezna';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const employeeData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        work_group: formData.work_group,
        updated_at: new Date().toISOString()
      };

      // Add company and department if companies are available
      if (companies.length > 0) {
        employeeData.company_id = formData.company_id;
        employeeData.department_id = formData.department_id || null;
      }

      if (employee) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id);

        if (error) throw error;
      } else {
        // Create new employee
        const { error } = await supabase
          .from('employees')
          .insert({
            ...employeeData,
            user_id: null
          });

        if (error) {
          // Fallback with dummy UUID
          const { error: fallbackError } = await supabase
            .from('employees')
            .insert({
              ...employeeData,
              user_id: '00000000-0000-0000-0000-000000000000'
            });

          if (fallbackError) throw fallbackError;
        }
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      
      if (error.message.includes('user_id') && error.message.includes('null')) {
        setErrors({ 
          submit: 'Greška: user_id je obavezan. Molimo kontaktirajte administratora da popravi shemu baze.' 
        });
      } else {
        setErrors({ submit: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'work_group' ? parseInt(value) : value
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {employee ? 'Uredi zaposlenog' : 'Dodaj zaposlenog'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
          <div className="space-y-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ime *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Unesite ime"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prezime *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Unesite prezime"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="unesite@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Company Field - only show if companies are available */}
            {companies.length > 0 && (
              <div>
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  Kompanija *
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.company_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Odaberite kompaniju</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>
                )}
              </div>
            )}

            {/* Department Field - only show if companies are available */}
            {companies.length > 0 && (
              <div>
                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Služba
                </label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  disabled={!formData.company_id}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.department_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${!formData.company_id ? 'bg-gray-100 text-gray-500' : ''}`}
                >
                  <option value="">Odaberite službu</option>
                  {filteredDepartments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="work_group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Radna grupa *
              </label>
              <select
                id="work_group"
                name="work_group"
                value={formData.work_group}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.work_group ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {(companies.length > 0 ? filteredWorkGroups : workGroups).map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.start_time} - {group.end_time})
                  </option>
                ))}
              </select>
              {errors.work_group && (
                <p className="mt-1 text-sm text-red-600">{errors.work_group}</p>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Otkaži
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Čuvanje...' : employee ? 'Sačuvaj' : 'Dodaj'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}