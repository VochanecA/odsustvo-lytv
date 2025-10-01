// app/dashboard/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus,Eye, Search, Edit, Trash2, Users, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { EmployeeForm } from '@/components/employee-form';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import { supabase } from '../../../lib/supabase';

import Link from 'next/link';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_group: number;
  created_at: string;
}

interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [employeesResponse, groupsResponse] = await Promise.all([
        supabase.from('employees').select('*').order('created_at', { ascending: false }),
        supabase.from('work_groups').select('*')
      ]);

      if (employeesResponse.error) throw employeesResponse.error;
      if (groupsResponse.error) throw groupsResponse.error;

      setEmployees(employeesResponse.data || []);
      setWorkGroups(groupsResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      await fetchData();
      setIsDeleteOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      setError('Greška pri brisanju zaposlenog');
    }
  };

  const handleFormSubmit = async () => {
    await fetchData();
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalEmployees = employees.length;
  const filteredCount = filteredEmployees.length;
  const workGroupCount = workGroups.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Učitavanje...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Greška pri učitavanju podataka</div>
          <div className="text-gray-600 dark:text-gray-400 mb-4">{error}</div>
          <Button onClick={fetchData}>Pokušaj ponovo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Zaposleni
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upravljanje podacima zaposlenih
          </p>
        </div>
        <Button onClick={handleAddEmployee}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj zaposlenog
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmployees}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Ukupno zaposlenih</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Filter className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Rezultata pretrage</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {workGroupCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Radnih grupa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Pretraži zaposlene po imenu, prezimenu ili emailu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Nema rezultata pretrage' : 'Nema zaposlenih'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? 'Pokušajte sa drugim pojmom za pretragu' 
                : 'Dodajte prvog zaposlenog da biste počeli'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAddEmployee}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj zaposlenog
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ime i prezime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Radna grupa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Datum dodavanja
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredEmployees.map((employee) => {
                  const workGroup = workGroups.find(g => g.id === employee.work_group);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.first_name} {employee.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {employee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {workGroup ? workGroup.name : `Grupa ${employee.work_group}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {workGroup && `${workGroup.start_time} - ${workGroup.end_time}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(employee.created_at).toLocaleDateString('hr-HR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
<Button
  variant="outline"
  size="sm"
>
  <Link href={`/dashboard/employees/${employee.id}`}>
    <Eye className="h-4 w-4" />
  </Link>
</Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Form Popup */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleFormSubmit}
        employee={editingEmployee}
        workGroups={workGroups}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedEmployee(null);
        }}
        onConfirm={confirmDelete}
        title="Obriši zaposlenog"
        message={`Da li ste sigurni da želite obrisati zaposlenog ${selectedEmployee?.first_name} ${selectedEmployee?.last_name}? Ova akcija se ne može poništiti.`}
      />
    </div>
  );
}