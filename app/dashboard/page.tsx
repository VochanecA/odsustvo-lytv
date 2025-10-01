// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '../../components/ui/calendar';
import { AbsencePopup } from '../../components/ui/absence-popup';
import { Button } from '../../components/ui/button';
import { Plus, Download, Filter, Users, Calendar as CalendarIcon, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_group: number;
}

interface AbsenceRecord {
  id: string;
  employee_id: string;
  absence_type_id: string;
  date: string;
  hours: number;
  status: string;
}

interface AbsenceType {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
}

interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
}

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
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [existingAbsenceType, setExistingAbsenceType] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [employeesResponse, groupsResponse, recordsResponse, typesResponse] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('work_groups').select('*'),
        supabase.from('absence_records').select('*'),
        supabase.from('absence_types').select('*').eq('is_active', true)
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

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
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
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Pretraži zaposlene po imenu, prezimenu, emailu ili radnoj grupi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Prikazano {filteredEmployees.length} od {employees.length} zaposlenih
          </div>
        )}
      </div>

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