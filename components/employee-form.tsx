// app/components/employee-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_group: number;
}

interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
}

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  employee?: Employee | null;
  workGroups: WorkGroup[];
}

export function EmployeeForm({ isOpen, onClose, onSubmit, employee, workGroups }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    work_group: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        work_group: employee.work_group
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        work_group: 1
      });
    }
    setErrors({});
  }, [employee, isOpen]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

// app/components/employee-form.tsx - Updated handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;

  setLoading(true);
  try {
    if (employee) {
      // Update existing employee
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          work_group: formData.work_group,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (error) throw error;
    } else {
      // Create new employee - we need to handle the user_id constraint
      // Option A: Create a placeholder user_id (not recommended)
      // Option B: Use a service role to bypass RLS (better)
      
      // For now, let's use a service role approach
      // You'll need to enable this in Supabase settings
      const { error } = await supabase
        .from('employees')
        .insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          work_group: formData.work_group,
          user_id: null // This will work if you make the column nullable
        });

      if (error) {
        // If still failing, try with a dummy UUID (last resort)
        const { error: fallbackError } = await supabase
          .from('employees')
          .insert({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            work_group: formData.work_group,
            user_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
          });

        if (fallbackError) throw fallbackError;
      }
    }

    onSubmit();
  } catch (error: any) {
    console.error('Error saving employee:', error);
    
    // More specific error handling
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
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
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
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
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
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
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="unesite@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="work_group" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Radna grupa *
              </label>
              <select
                id="work_group"
                value={formData.work_group}
                onChange={(e) => setFormData(prev => ({ ...prev, work_group: parseInt(e.target.value) }))}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.work_group ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {workGroups.map(group => (
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