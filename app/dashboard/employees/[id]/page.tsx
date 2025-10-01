// app/dashboard/employees/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, ArrowLeft, Calendar, FileText, Users, Clock, PieChart } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { supabase } from '../../../../lib/supabase';

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

interface SummaryData {
  total: { [key: string]: number };
  byMonth: { [key: string]: { [key: string]: number } };
  byYear: { [key: string]: { [key: string]: number } };
}

export default function EmployeeSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workGroup, setWorkGroup] = useState<WorkGroup | null>(null);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ total: {}, byMonth: {}, byYear: {} });
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [employeeResponse, recordsResponse, typesResponse, groupsResponse] = await Promise.all([
        supabase.from('employees').select('*').eq('id', employeeId).single(),
        supabase.from('absence_records').select('*').eq('employee_id', employeeId).eq('status', 'approved'),
        supabase.from('absence_types').select('*').eq('is_active', true),
        supabase.from('work_groups').select('*')
      ]);

      if (employeeResponse.error) throw employeeResponse.error;
      if (recordsResponse.error) throw recordsResponse.error;
      if (typesResponse.error) throw typesResponse.error;
      if (groupsResponse.error) throw groupsResponse.error;

      setEmployee(employeeResponse.data);
      setAbsenceRecords(recordsResponse.data || []);
      setAbsenceTypes(typesResponse.data || []);
      
      // Find work group
      const employeeWorkGroup = groupsResponse.data?.find(g => g.id === employeeResponse.data.work_group);
      setWorkGroup(employeeWorkGroup || null);

      // Calculate summary
      calculateSummary(recordsResponse.data || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (records: AbsenceRecord[]) => {
    const total: { [key: string]: number } = {};
    const byMonth: { [key: string]: { [key: string]: number } } = {};
    const byYear: { [key: string]: { [key: string]: number } } = {};

    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = String(date.getFullYear());

      // Total
      total[record.absence_type_id] = (total[record.absence_type_id] || 0) + record.hours;

      // By month
      if (!byMonth[monthKey]) byMonth[monthKey] = {};
      byMonth[monthKey][record.absence_type_id] = (byMonth[monthKey][record.absence_type_id] || 0) + record.hours;

      // By year
      if (!byYear[yearKey]) byYear[yearKey] = {};
      byYear[yearKey][record.absence_type_id] = (byYear[yearKey][record.absence_type_id] || 0) + record.hours;
    });

    setSummary({ total, byMonth, byYear });
  };

  const getCurrentPeriodData = () => {
    const currentYear = selectedDate.getFullYear();
    const currentMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const monthKey = `${currentYear}-${currentMonth}`;
    const yearKey = String(currentYear);

    switch (selectedPeriod) {
      case 'month':
        return summary.byMonth[monthKey] || {};
      case 'year':
        return summary.byYear[yearKey] || {};
      case 'all':
        return summary.total;
      default:
        return {};
    }
  };

  const getPeriodLabel = () => {
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' });
    
    switch (selectedPeriod) {
      case 'month':
        return currentMonth;
      case 'year':
        return currentYear.toString();
      case 'all':
        return 'Sve vrijeme';
      default:
        return '';
    }
  };

  const exportToPDF = () => {
    // Basic PDF export implementation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Izveštaj za ${employee?.first_name} ${employee?.last_name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>Izveštaj odsustava - ${employee?.first_name} ${employee?.last_name}</h1>
            <p>Period: ${getPeriodLabel()}</p>
            <table>
              <thead>
                <tr>
                  <th>Vrsta odsustva</th>
                  <th>Ukupno sati</th>
                  <th>Ukupno dana</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(getCurrentPeriodData()).map(([typeId, hours]) => {
                  const type = absenceTypes.find(t => t.id === typeId);
                  const days = (hours / 8).toFixed(1);
                  return `
                    <tr>
                      <td>${type?.name || typeId}</td>
                      <td>${hours}h</td>
                      <td>${days}d</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <p>Generisano: ${new Date().toLocaleDateString('hr-HR')}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToExcel = () => {
    // Basic CSV export (can be enhanced with proper Excel library)
    const data = Object.entries(getCurrentPeriodData()).map(([typeId, hours]) => {
      const type = absenceTypes.find(t => t.id === typeId);
      const days = (hours / 8).toFixed(1);
      return {
        'Vrsta odsustva': type?.name || typeId,
        'Ukupno sati': hours,
        'Ukupno dana': days
      };
    });

    const headers = ['Vrsta odsustva', 'Ukupno sati', 'Ukupno dana'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [row['Vrsta odsustva'], row['Ukupno sati'], row['Ukupno dana']].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `izvestaj_${employee?.first_name}_${employee?.last_name}_${getPeriodLabel()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Učitavanje...</div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            {error || 'Zaposleni nije pronađen'}
          </div>
          <Button onClick={() => router.push('/dashboard/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na listu zaposlenih
          </Button>
        </div>
      </div>
    );
  }

  const currentData = getCurrentPeriodData();
  const totalHours = Object.values(currentData).reduce((sum, hours) => sum + hours, 0);
  const totalDays = (totalHours / 8).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detaljni pregled odsustava i statistika
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Zaposleni</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {employee.first_name} {employee.last_name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Radna Grupa</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {workGroup?.name || `Grupa ${employee.work_group}`}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {workGroup ? `${workGroup.start_time} - ${workGroup.end_time}` : 'Nepoznato radno vrijeme'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <PieChart className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Ukupno odsustava</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {totalDays}d
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {totalHours}h u {Object.keys(currentData).length} kategorija
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pregled za period: <span className="text-blue-600">{getPeriodLabel()}</span>
            </h3>
          </div>
          <div className="flex space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'year' | 'all')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="month">Mjesec</option>
              <option value="year">Godina</option>
              <option value="all">Sve vrijeme</option>
            </select>
            
            {selectedPeriod !== 'all' && (
              <input
                type={selectedPeriod === 'month' ? 'month' : 'number'}
                value={selectedPeriod === 'month' 
                  ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
                  : selectedDate.getFullYear()
                }
                onChange={(e) => {
                  if (selectedPeriod === 'month') {
                    const [year, month] = e.target.value.split('-');
                    setSelectedDate(new Date(parseInt(year), parseInt(month) - 1));
                  } else {
                    setSelectedDate(new Date(parseInt(e.target.value), 0));
                  }
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            )}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vrsta odsustva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Boja
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ukupno sati
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ukupno dana
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Procenat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {Object.entries(currentData).map(([typeId, hours]) => {
                const type = absenceTypes.find(t => t.id === typeId);
                const days = (hours / 8).toFixed(1);
                const percentage = totalHours > 0 ? ((hours / totalHours) * 100).toFixed(1) : '0';
                
                return (
                  <tr key={typeId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {type?.name || typeId}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ({typeId})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type && (
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: type.color }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                      {hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                      {days}d
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  UKUPNO
                </td>
                <td className="px-6 py-4 whitespace-nowrap"></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {totalHours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {totalDays}d
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mjesečni pregled ({selectedDate.getFullYear()})
          </h3>
<div className="space-y-3">
  {Object.entries(summary.byMonth)
    .filter(([monthKey]) => monthKey.startsWith(selectedDate.getFullYear().toString()))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('sr-Latn-RS', { 
        month: 'long',
        year: 'numeric'
      });
      const totalMonthHours = Object.values(data).reduce((sum, hours) => sum + hours, 0);
      
      return (
        <div key={monthKey} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <span className="text-sm text-gray-900 dark:text-white">{monthName}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {(totalMonthHours / 8).toFixed(1)}d
          </span>
        </div>
      );
    })}
</div>

        </div>

        {/* Yearly Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Godišnji pregled
          </h3>
          <div className="space-y-3">
            {Object.entries(summary.byYear)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, data]) => {
                const totalYearHours = Object.values(data).reduce((sum, hours) => sum + hours, 0);
                
                return (
                  <div key={year} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-900 dark:text-white">{year}. godina</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {(totalYearHours / 8).toFixed(1)}d
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}