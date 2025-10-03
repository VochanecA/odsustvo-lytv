// app/dashboard/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Eye, Search, Edit, Trash2, Users, Filter, Building, X, ArrowLeft, ArrowRight } from 'lucide-react';
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
  company_id: string;
  department_id: string | null;
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (companyFilter) {
      fetchDepartmentsByCompany(companyFilter);
    } else {
      setDepartments([]);
      setDepartmentFilter('');
    }
  }, [companyFilter]);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Provjeri prijavljenog korisnika
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw new Error('Greška pri provjeri korisnika: ' + userError.message);
      if (!user) throw new Error('Korisnik nije prijavljen');

      setCurrentUser(user);

      // Provjeri ulogu korisnika
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const currentUserRole = userRoleData?.role || 'user';
      const userIsAdmin = currentUserRole === 'admin';
      
      setUserRole(currentUserRole);
      setIsAdmin(userIsAdmin);

      // Učitaj sve podatke
      const [
        employeesResponse, 
        groupsResponse, 
        companiesResponse, 
        departmentsResponse
      ] = await Promise.all([
        supabase.from('employees').select('*').order('first_name'),
        supabase.from('work_groups').select('*').order('name'),
        supabase.from('companies').select('*').eq('is_active', true).order('name'),
        supabase.from('departments').select('*').eq('is_active', true).order('name')
      ]);

      if (employeesResponse.error) throw employeesResponse.error;
      if (groupsResponse.error) throw groupsResponse.error;
      if (companiesResponse.error) throw companiesResponse.error;
      if (departmentsResponse.error) console.warn('Departments error:', departmentsResponse.error);

      setEmployees(employeesResponse.data || []);
      setWorkGroups(groupsResponse.data || []);
      setCompanies(companiesResponse.data || []);
      setDepartments(departmentsResponse.data || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsByCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const resetFilters = () => {
    setCompanyFilter('');
    setDepartmentFilter('');
    setSearchTerm('');
  };

  // Filter employees based on search term and filters
  const filteredEmployees = employees.filter(employee => {
    // Za obične korisnike, prikaži samo njihov profil
    if (!isAdmin && employee.user_id !== currentUser?.id) {
      return false;
    }

    // Filter po kompaniji
    if (companyFilter && employee.company_id !== companyFilter) {
      return false;
    }

    // Filter po službi
    if (departmentFilter && employee.department_id !== departmentFilter) {
      return false;
    }

    // Filter po pretrazi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.first_name.toLowerCase().includes(searchLower) ||
        employee.last_name.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Nepoznato';
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Nije postavljeno';
    return departments.find(d => d.id === departmentId)?.name || 'Nepoznato';
  };

  const getWorkGroupName = (workGroupId: number) => {
    const workGroup = workGroups.find(g => g.id === workGroupId);
    return workGroup ? workGroup.name : `Grupa ${workGroupId}`;
  };

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
            {isAdmin && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Administratorski pregled
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filteri
            </Button>
          )}
          <Button onClick={handleAddEmployee}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj zaposlenog
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filteri</h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={resetFilters} size="sm">
                <X className="h-4 w-4 mr-1" />
                Resetuj
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(false)} size="sm">
                Zatvori
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kompanija
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Sve kompanije</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Služba
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                disabled={!companyFilter}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Sve službe</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pretraga
              </label>
              <input
                type="text"
                placeholder="Ime, prezime, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filter Status */}
          <div className="mt-3 flex flex-wrap gap-2">
            {isAdmin && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Building className="h-3 w-3 mr-1" />
                Administratorski pristup
              </span>
            )}
            {companyFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Kompanija: {getCompanyName(companyFilter)}
              </span>
            )}
            {departmentFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Služba: {getDepartmentName(departmentFilter)}
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Pretraga: "{searchTerm}"
              </span>
            )}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              Prikazano: {filteredEmployees.length} od {employees.length}
            </span>
            {!isAdmin && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Pregled samo vlastitih podataka
              </span>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {employees.length}
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
                {filteredEmployees.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Filtrirano</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {companies.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Kompanija</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {workGroups.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Radnih grupa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search (Basic) */}
      {!showFilters && (
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
      )}

      {/* Employees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || companyFilter || departmentFilter ? 'Nema rezultata pretrage' : 'Nema zaposlenih'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || companyFilter || departmentFilter 
                ? 'Pokušajte sa drugim filterima ili pojmom za pretragu' 
                : 'Dodajte prvog zaposlenog da biste počeli'
              }
            </p>
            {!(searchTerm || companyFilter || departmentFilter) && (
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
                  {isAdmin && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Kompanija
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Služba
                      </th>
                    </>
                  )}
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
                      {isAdmin && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {getCompanyName(employee.company_id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {getDepartmentName(employee.department_id)}
                            </div>
                          </td>
                        </>
                      )}
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
                          <Button variant="outline" size="sm">
                            <Link href={`/dashboard/employees/${employee.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isAdmin && (
                            <>
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
                            </>
                          )}
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
        companies={companies}
        departments={departments}
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