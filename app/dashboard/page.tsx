// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '../../components/ui/calendar';
import { AbsencePopup } from '../../components/ui/absence-popup';
import { Button } from '../../components/ui/button';
import { Plus, Download, Filter, Users, Calendar as CalendarIcon, Search, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
// Import tipova iz vašeg types/index.ts
import type { Employee, AbsenceRecord, AbsenceType, WorkGroup, Company, Department } from '../../types';

// Helper function to format date to YYYY-MM-DD without timezone issues
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [existingAbsenceType, setExistingAbsenceType] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch departments kada se promijeni kompanija
  useEffect(() => {
    if (selectedCompanyId) {
      fetchDepartmentsByCompany(selectedCompanyId);
    } else {
      setDepartments([]);
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Prvo dobijte sve kompanije
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (companiesError) throw companiesError;

      setCompanies(companiesData || []);

      // Ako postoji samo jedna kompanija, automatski je selektujte
      if (companiesData && companiesData.length === 1) {
        setSelectedCompanyId(companiesData[0].id);
      }

      const [employeesResponse, groupsResponse, recordsResponse, typesResponse] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('work_groups').select('*'),
        supabase.from('absence_records').select('*'),
        // Filtriraj absence_types po aktivnim kompanijama
        supabase.from('absence_types')
          .select('*')
          .eq('is_active', true)
          .in('company_id', companiesData?.map(c => c.id) || [])
      ]);

      if (employeesResponse.error) throw employeesResponse.error;
      if (groupsResponse.error) throw groupsResponse.error;
      if (recordsResponse.error) console.warn('Absence records error:', recordsResponse.error);
      if (typesResponse.error) throw typesResponse.error;

      setEmployees(employeesResponse.data || []);
      setWorkGroups(groupsResponse.data || []);
      setAbsenceRecords(recordsResponse.data || []);
      setAbsenceTypes(typesResponse.data || []);

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

  const handleDateClick = (employeeId: string, date: Date) => {
    setSelectedEmployee(employeeId);
    setSelectedDate(date);
    
    const dateString = formatDateToString(date);
    const existingRecord = absenceRecords.find(record => 
      record.employee_id === employeeId && record.date === dateString
    );
    
    setExistingAbsenceType(existingRecord?.absence_type_id || null);
    setIsPopupOpen(true);
  };

  const handleAbsenceSelect = async (absenceTypeId: string | null) => {
    if (!selectedEmployee || !selectedDate) return;

    try {
      const dateString = formatDateToString(selectedDate);
      
      if (absenceTypeId === null) {
        const { error } = await supabase
          .from('absence_records')
          .delete()
          .eq('employee_id', selectedEmployee)
          .eq('date', dateString);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('absence_records')
          .upsert({
            employee_id: selectedEmployee,
            absence_type_id: absenceTypeId,
            date: dateString,
            hours: 8,
            status: 'approved'
          }, { onConflict: 'employee_id,date' });

        if (error) throw error;
      }

      await fetchData();
      setIsPopupOpen(false);
      setSelectedEmployee(null);
      setSelectedDate(null);
      setExistingAbsenceType(null);
    } catch (error) {
      console.error('Error saving absence:', error);
      setError('Greška pri čuvanju odsustva');
    }
  };

  // Filter employees based on search term and company/department
  const filteredEmployees = employees.filter(employee => {
    // Filter po kompaniji
    if (selectedCompanyId && employee.company_id !== selectedCompanyId) {
      return false;
    }

    // Filter po službi
    if (selectedDepartmentId && employee.department_id !== selectedDepartmentId) {
      return false;
    }

    // Filter po pretrazi
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    const workGroup = workGroups.find(g => g.id === employee.work_group);
    const workGroupName = workGroup ? workGroup.name.toLowerCase() : '';

    return (
      fullName.includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      workGroupName.includes(searchLower) ||
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower)
    );
  });

  // Reset department filter kada se promijeni kompanija
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedDepartmentId(''); // Reset department filter
  };

  // Reset sve filtere
  const resetFilters = () => {
    setSelectedCompanyId('');
    setSelectedDepartmentId('');
    setSearchTerm('');
  };

  // Dobijte ime kompanije za prikaz
  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Nepoznato';
  };

  // Dobijte ime službe za prikaz
  const getDepartmentName = (departmentId: string) => {
    return departments.find(d => d.id === departmentId)?.name || 'Nepoznato';
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

  const employeeName = selectedEmployee 
    ? employees.find(e => e.id === selectedEmployee)?.first_name + ' ' + 
      employees.find(e => e.id === selectedEmployee)?.last_name
    : '';

  if (employees.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Kalendar odsustva
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pregled i upravljanje odsustvima zaposlenih
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Nema zaposlenih
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Trenutno nema zaposlenih u sistemu. Prvo dodajte zaposlene da biste mogli evidentirati odsustva.
          </p>
          <div className="flex justify-center space-x-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj zaposlenog
            </Button>
            <Button variant="outline" onClick={fetchData}>
              Osveži podatke
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Kalendar odsustva
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Pregled i upravljanje odsustvima zaposlenih
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={resetFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Reset filtera
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Izveštaj
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo odsustvo
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kompanija
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
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
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              disabled={!selectedCompanyId}
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

          {/* Search Bar */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pretraga zaposlenih
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Pretraži po imenu, prezimenu, emailu ili radnoj grupi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Filter Status */}
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCompanyId && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Building className="h-3 w-3 mr-1" />
              Kompanija: {getCompanyName(selectedCompanyId)}
            </span>
          )}
          {selectedDepartmentId && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Služba: {getDepartmentName(selectedDepartmentId)}
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Pretraga: &quot;{searchTerm}&quot;
            </span>
          )}
          {(selectedCompanyId || selectedDepartmentId || searchTerm) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              Prikazano: {filteredEmployees.length} od {employees.length}
            </span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-semibold text-gray-900 dark:text-white">{employees.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Ukupno zaposlenih</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-semibold text-gray-900 dark:text-white">{filteredEmployees.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Filtrirano</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-semibold text-gray-900 dark:text-white">{absenceRecords.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Evidentiranih odsustava</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="font-semibold text-gray-900 dark:text-white">{absenceTypes.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Vrsta odsustva</div>
          </div>
        </div>
      </div>

      <Calendar
        employees={filteredEmployees.map(emp => ({
          id: emp.id,
          firstName: emp.first_name,
          lastName: emp.last_name
        }))}
        absenceRecords={absenceRecords.map(record => ({
          employeeId: record.employee_id,
          date: record.date,
          absenceTypeId: record.absence_type_id
        }))}
        onDateClick={handleDateClick}
      />

      <AbsencePopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedEmployee(null);
          setSelectedDate(null);
          setExistingAbsenceType(null);
        }}
        onSelect={handleAbsenceSelect}
        absenceTypes={absenceTypes}
        employeeName={employeeName}
        date={selectedDate ? formatDateToString(selectedDate) : ''}
        existingAbsenceType={existingAbsenceType}
      />
    </div>
  );
}