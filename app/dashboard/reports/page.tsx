// app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, Calendar, Users, Building, Clock, BarChart3, FileText, Eye, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { supabase } from '../../../lib/supabase';

interface ReportData {
  id: string;
  title: string;
  description: string;
  type: 'absence' | 'hours' | 'employee' | 'company';
  columns: string[];
  data: any[];
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id: string;
  department_id: string | null;
  user_id?: string;
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
}

interface Company {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Filter state
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<string>('');

  // Data state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Report state
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);

  // Debug info
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log('🔍 Početak fetchData za reports...');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw new Error('Greška pri provjeri korisnika: ' + userError.message);
      if (!user) throw new Error('Korisnik nije prijavljen');

      console.log('✅ Korisnik prijavljen:', { id: user.id, email: user.email });
      setCurrentUser(user);

      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userIsAdmin = userRoleData?.role === 'admin';
      setIsAdmin(userIsAdmin);
      console.log('🎭 Korisnička uloga:', userRoleData?.role, 'isAdmin:', userIsAdmin);

      // Učitaj sve podatke
      const [
        companiesResponse,
        employeesResponse,
        absenceRecordsResponse,
        absenceTypesResponse,
        departmentsResponse
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('is_active', true).order('name'),
        supabase.from('employees').select('*').order('first_name'),
        supabase.from('absence_records').select('*'),
        supabase.from('absence_types').select('*').eq('is_active', true).order('name'),
        supabase.from('departments').select('*').eq('is_active', true).order('name')
      ]);

      console.log('📊 Rezultati učitavanja:', {
        companies: companiesResponse.data?.length || 0,
        employees: employeesResponse.data?.length || 0,
        absenceRecords: absenceRecordsResponse.data?.length || 0,
        absenceTypes: absenceTypesResponse.data?.length || 0,
        departments: departmentsResponse.data?.length || 0
      });

      // Sačuvaj debug informacije
      setDebugInfo({
        companiesCount: companiesResponse.data?.length || 0,
        employeesCount: employeesResponse.data?.length || 0,
        absenceRecordsCount: absenceRecordsResponse.data?.length || 0,
        absenceTypesCount: absenceTypesResponse.data?.length || 0,
        departmentsCount: departmentsResponse.data?.length || 0,
        userIsAdmin,
        userEmail: user.email
      });

      if (companiesResponse.error) {
        console.error('❌ Companies error:', companiesResponse.error);
      }
      if (employeesResponse.error) {
        console.error('❌ Employees error:', employeesResponse.error);
      }
      if (absenceRecordsResponse.error) {
        console.error('❌ Absence records error:', absenceRecordsResponse.error);
      }
      if (absenceTypesResponse.error) {
        console.error('❌ Absence types error:', absenceTypesResponse.error);
      }
      if (departmentsResponse.error) {
        console.error('❌ Departments error:', departmentsResponse.error);
      }

      setCompanies(companiesResponse.data || []);
      setEmployees(employeesResponse.data || []);
      setAbsenceRecords(absenceRecordsResponse.data || []);
      setAbsenceTypes(absenceTypesResponse.data || []);
      setDepartments(departmentsResponse.data || []);

      // Pronađi employee profil za korisnika
      const userEmployee = employeesResponse.data?.find(emp => emp.user_id === user.id);
      console.log('👤 Employee korisnika:', userEmployee);

      // Set company filter to user's company if not admin
      if (!userIsAdmin && userEmployee) {
        setCompanyFilter(userEmployee.company_id);
        console.log('🎯 Postavljena kompanija filter:', userEmployee.company_id);
      }

    } catch (error: any) {
      console.error('💥 Error fetching data:', error);
      setError('Greška pri učitavanju podataka: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Nepoznato';
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Nepoznato';
  };

  const getAbsenceTypeName = (absenceTypeId: string) => {
    return absenceTypes.find(t => t.id === absenceTypeId)?.name || 'Nepoznato';
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Nije postavljeno';
    return departments.find(d => d.id === departmentId)?.name || 'Nepoznato';
  };

  const generateReport = async (reportType: string) => {
    try {
      setGenerating(true);
      setSelectedReport(reportType);
      setError(null);

      console.log('📈 Generisanje izvještaja:', reportType);
      console.log('📅 Date range:', dateRange);
      console.log('🏢 Company filter:', companyFilter);
      console.log('📊 Ukupno zaposlenih:', employees.length);
      console.log('📋 Ukupno odsustava:', absenceRecords.length);

      const filteredEmployees = isAdmin && companyFilter 
        ? employees.filter(emp => emp.company_id === companyFilter)
        : employees;

      const filteredAbsenceRecords = absenceRecords.filter(record => {
        const recordDate = new Date(record.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        if (companyFilter) {
          const employee = employees.find(emp => emp.id === record.employee_id);
          if (!employee || employee.company_id !== companyFilter) {
            return false;
          }
        }

        return recordDate >= startDate && recordDate <= endDate;
      });

      console.log('🔍 Filtrirani zaposleni:', filteredEmployees.length);
      console.log('🔍 Filtrirana odsustva:', filteredAbsenceRecords.length);

      let reportData: ReportData;

      switch (reportType) {
        case 'absence-summary':
          reportData = await generateAbsenceSummaryReport(filteredEmployees, filteredAbsenceRecords);
          break;
        
        case 'employee-absence':
          reportData = await generateEmployeeAbsenceReport(filteredEmployees, filteredAbsenceRecords);
          break;
        
        case 'absence-by-type':
          reportData = await generateAbsenceByTypeReport(filteredAbsenceRecords);
          break;
        
        case 'monthly-hours':
          reportData = await generateMonthlyHoursReport(filteredEmployees, filteredAbsenceRecords);
          break;
        
        case 'company-overview':
          reportData = await generateCompanyOverviewReport();
          break;
        
        case 'department-summary':
          reportData = await generateDepartmentSummaryReport(filteredEmployees, filteredAbsenceRecords);
          break;
        
        default:
          throw new Error('Nepoznat tip izvještaja');
      }

      console.log('✅ Generisan izvještaj:', reportData);
      setCurrentReport(reportData);

    } catch (error: any) {
      console.error('💥 Error generating report:', error);
      setError('Greška pri generisanju izvještaja: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateAbsenceSummaryReport = async (employees: Employee[], absenceRecords: AbsenceRecord[]): Promise<ReportData> => {
    const companyName = companyFilter ? getCompanyName(companyFilter) : 'Sve kompanije';
    
    const summary = employees.map(employee => {
      const employeeAbsences = absenceRecords.filter(record => record.employee_id === employee.id);
      const totalHours = employeeAbsences.reduce((sum, record) => sum + (record.hours || 0), 0);
      const absenceDays = employeeAbsences.length;

      return {
        employee: `${employee.first_name} ${employee.last_name}`,
        department: getDepartmentName(employee.department_id),
        totalHours,
        absenceDays,
        averageHours: absenceDays > 0 ? (totalHours / absenceDays).toFixed(2) : '0'
      };
    });

    // Sortiraj po broju sati odsustva (silazno)
    summary.sort((a, b) => b.totalHours - a.totalHours);

    return {
      id: 'absence-summary',
      title: `Pregled odsustava - ${companyName}`,
      description: `Ukupan pregled odsustava zaposlenih za period ${dateRange.start} do ${dateRange.end}`,
      type: 'absence',
      columns: ['Zaposleni', 'Služba', 'Ukupno sati', 'Dana odsustva', 'Prosječno sati/dan'],
      data: summary
    };
  };

  const generateEmployeeAbsenceReport = async (employees: Employee[], absenceRecords: AbsenceRecord[]): Promise<ReportData> => {
    const detailedData = [];

    for (const record of absenceRecords) {
      const employee = employees.find(emp => emp.id === record.employee_id);
      if (employee) {
        detailedData.push({
          date: record.date,
          employee: `${employee.first_name} ${employee.last_name}`,
          department: getDepartmentName(employee.department_id),
          absenceType: getAbsenceTypeName(record.absence_type_id),
          hours: record.hours || 8,
          status: record.status
        });
      }
    }

    // Sort by date (silazno - najnoviji prvi)
    detailedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      id: 'employee-absence',
      title: 'Detaljni pregled odsustava',
      description: `Detaljan pregled svih odsustava za period ${dateRange.start} do ${dateRange.end}`,
      type: 'absence',
      columns: ['Datum', 'Zaposleni', 'Služba', 'Vrsta odsustva', 'Sati', 'Status'],
      data: detailedData
    };
  };

  const generateAbsenceByTypeReport = async (absenceRecords: AbsenceRecord[]): Promise<ReportData> => {
    const typeSummary: { [key: string]: { count: number; totalHours: number; employees: Set<string> } } = {};

    absenceRecords.forEach(record => {
      const typeName = getAbsenceTypeName(record.absence_type_id);
      if (!typeSummary[typeName]) {
        typeSummary[typeName] = { count: 0, totalHours: 0, employees: new Set() };
      }
      
      typeSummary[typeName].count++;
      typeSummary[typeName].totalHours += record.hours || 8;
      typeSummary[typeName].employees.add(record.employee_id);
    });

    const data = Object.entries(typeSummary).map(([type, stats]) => ({
      absenceType: type,
      totalCases: stats.count,
      totalHours: stats.totalHours,
      uniqueEmployees: stats.employees.size,
      averageHours: stats.count > 0 ? (stats.totalHours / stats.count).toFixed(2) : '0'
    }));

    // Sortiraj po broju slučajeva (silazno)
    data.sort((a, b) => b.totalCases - a.totalCases);

    return {
      id: 'absence-by-type',
      title: 'Odsustva po vrstama',
      description: `Pregled odsustava grupisanih po vrstama za period ${dateRange.start} do ${dateRange.end}`,
      type: 'absence',
      columns: ['Vrsta odsustva', 'Broj slučajeva', 'Ukupno sati', 'Jedinstvenih zaposlenih', 'Prosječno sati'],
      data: data
    };
  };

  const generateMonthlyHoursReport = async (employees: Employee[], absenceRecords: AbsenceRecord[]): Promise<ReportData> => {
    const monthlyData: { [key: string]: { [employeeId: string]: number } } = {};

    absenceRecords.forEach(record => {
      const monthKey = record.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      
      if (!monthlyData[monthKey][record.employee_id]) {
        monthlyData[monthKey][record.employee_id] = 0;
      }
      
      monthlyData[monthKey][record.employee_id] += record.hours || 8;
    });

    const data = [];
    for (const [month, employeeHours] of Object.entries(monthlyData)) {
      for (const [employeeId, hours] of Object.entries(employeeHours)) {
        const employee = employees.find(emp => emp.id === employeeId);
        if (employee) {
          data.push({
            month: `${month}-01`, // Dodaj dan za bolje sortiranje
            monthDisplay: month,
            employee: `${employee.first_name} ${employee.last_name}`,
            department: getDepartmentName(employee.department_id),
            totalHours: hours,
            workingDays: Math.ceil(hours / 8)
          });
        }
      }
    }

    // Sortiraj po mjesecu (silazno)
    data.sort((a, b) => b.month.localeCompare(a.month));

    // Ukloni privremeno polje za sortiranje
    const finalData = data.map(({ month, ...rest }) => rest);

    return {
      id: 'monthly-hours',
      title: 'Mjesečni sati odsustva',
      description: 'Pregled mjesečnih sati odsustva po zaposlenima',
      type: 'hours',
      columns: ['Mjesec', 'Zaposleni', 'Služba', 'Ukupno sati', 'Radnih dana (8h)'],
      data: finalData
    };
  };

  const generateCompanyOverviewReport = async (): Promise<ReportData> => {
    const companyData = companies.map(company => {
      const companyEmployees = employees.filter(emp => emp.company_id === company.id);
      const companyAbsences = absenceRecords.filter(record => {
        const employee = employees.find(emp => emp.id === record.employee_id);
        return employee?.company_id === company.id;
      });

      const totalAbsenceHours = companyAbsences.reduce((sum, record) => sum + (record.hours || 8), 0);
      const uniqueEmployeesWithAbsence = new Set(companyAbsences.map(record => record.employee_id)).size;

      return {
        company: company.name,
        totalEmployees: companyEmployees.length,
        totalAbsences: companyAbsences.length,
        totalAbsenceHours,
        employeesWithAbsence: uniqueEmployeesWithAbsence,
        absenceRate: companyEmployees.length > 0 ? 
          ((uniqueEmployeesWithAbsence / companyEmployees.length) * 100).toFixed(2) + '%' : '0%'
      };
    });

    // Sortiraj po stopi odsustva (silazno)
    companyData.sort((a, b) => {
      const rateA = parseFloat(a.absenceRate);
      const rateB = parseFloat(b.absenceRate);
      return rateB - rateA;
    });

    return {
      id: 'company-overview',
      title: 'Pregled po kompanijama',
      description: 'Uporedni pregled svih kompanija i njihovih odsustava',
      type: 'company',
      columns: ['Kompanija', 'Ukupno zaposlenih', 'Ukupno odsustava', 'Ukupno sati', 'Zaposlenih sa odsustvom', 'Stopa odsustva'],
      data: companyData
    };
  };

  const generateDepartmentSummaryReport = async (employees: Employee[], absenceRecords: AbsenceRecord[]): Promise<ReportData> => {
    const departmentData: { [key: string]: { employees: string[]; totalAbsences: number; totalHours: number } } = {};

    // Group by department
    employees.forEach(employee => {
      const deptName = getDepartmentName(employee.department_id);
      if (!departmentData[deptName]) {
        departmentData[deptName] = { employees: [], totalAbsences: 0, totalHours: 0 };
      }
      departmentData[deptName].employees.push(`${employee.first_name} ${employee.last_name}`);
    });

    // Calculate absence stats
    absenceRecords.forEach(record => {
      const employee = employees.find(emp => emp.id === record.employee_id);
      if (employee) {
        const deptName = getDepartmentName(employee.department_id);
        if (departmentData[deptName]) {
          departmentData[deptName].totalAbsences++;
          departmentData[deptName].totalHours += record.hours || 8;
        }
      }
    });

    const data = Object.entries(departmentData).map(([department, stats]) => ({
      department,
      totalEmployees: stats.employees.length,
      totalAbsences: stats.totalAbsences,
      totalHours: stats.totalHours,
      averagePerEmployee: stats.employees.length > 0 ? (stats.totalHours / stats.employees.length).toFixed(2) : '0'
    }));

    // Sortiraj po ukupnim satima (silazno)
    data.sort((a, b) => b.totalHours - a.totalHours);

    return {
      id: 'department-summary',
      title: 'Pregled po službama',
      description: `Pregled odsustava po službama za period ${dateRange.start} do ${dateRange.end}`,
      type: 'employee',
      columns: ['Služba', 'Ukupno zaposlenih', 'Ukupno odsustava', 'Ukupno sati', 'Prosječno sati po zaposlenom'],
      data: data
    };
  };

  const exportToCSV = () => {
    if (!currentReport) return;

    const headers = currentReport.columns.join(',');
    const rows = currentReport.data.map(row => 
      currentReport.columns.map(col => {
        const value = getCellValue(row, col);
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentReport.title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Poboljšana funkcija za mapiranje vrijednosti ćelija
  const getCellValue = (row: any, column: string) => {
    switch (column) {
      case 'Zaposleni':
        return row.employee || '';
      case 'Služba':
        return row.department || '';
      case 'Ukupno sati':
        return row.totalHours !== undefined ? row.totalHours : '';
      case 'Dana odsustva':
        return row.absenceDays !== undefined ? row.absenceDays : '';
      case 'Prosječno sati/dan':
        return row.averageHours || '';
      case 'Datum':
        return row.date || '';
      case 'Vrsta odsustva':
        return row.absenceType || '';
      case 'Sati':
        return row.hours !== undefined ? row.hours : '';
      case 'Status':
        return row.status || '';
      case 'Mjesec':
        return row.monthDisplay || row.month || '';
      case 'Radnih dana (8h)':
        return row.workingDays !== undefined ? row.workingDays : '';
      case 'Kompanija':
        return row.company || '';
      case 'Ukupno zaposlenih':
        return row.totalEmployees !== undefined ? row.totalEmployees : '';
      case 'Ukupno odsustava':
        return row.totalAbsences !== undefined ? row.totalAbsences : '';
      case 'Zaposlenih sa odsustvom':
        return row.employeesWithAbsence !== undefined ? row.employeesWithAbsence : '';
      case 'Stopa odsustva':
        return row.absenceRate || '';
      case 'Vrsta odsustva':
        return row.absenceType || '';
      case 'Broj slučajeva':
        return row.totalCases !== undefined ? row.totalCases : '';
      case 'Jedinstvenih zaposlenih':
        return row.uniqueEmployees !== undefined ? row.uniqueEmployees : '';
      case 'Prosječno sati':
        return row.averageHours || '';
      default:
        return row[column] || '';
    }
  };

  const resetFilters = () => {
    setDateRange({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setCompanyFilter('');
    setSelectedReport('');
    setCurrentReport(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Učitavanje podataka za izvještaje...</div>
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
      {/* Debug Info - samo za development */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Informacije o podacima</h4>
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 grid grid-cols-2 md:grid-cols-3 gap-2">
            <div>Korisnik: {debugInfo.userEmail}</div>
            <div>Admin: {debugInfo.userIsAdmin ? 'Da' : 'Ne'}</div>
            <div>Kompanije: {debugInfo.companiesCount}</div>
            <div>Zaposleni: {debugInfo.employeesCount}</div>
            <div>Odsustva: {debugInfo.absenceRecordsCount}</div>
            <div>Vrste odsustva: {debugInfo.absenceTypesCount}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Izvještaji
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generisanje i pregled različitih izvještaja o odsustvima
            {!isAdmin && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Pregled samo vlastitih podataka
              </span>
            )}
          </p>
        </div>
        {currentReport && (
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Izvezi CSV
          </Button>
        )}
      </div>

      {/* Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
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
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {employees.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Zaposlenih</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {absenceRecords.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Odsustava</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {absenceTypes.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Vrsta odsustva</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info poruka za manje podatke */}
      {(employees.length === 0 || absenceRecords.length === 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">Informacija</h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                {employees.length === 0 
                  ? 'Trenutno nema zaposlenih u sistemu. Dodajte zaposlene da biste generisali izvještaje.'
                  : 'Trenutno nema evidentiranih odsustava. Dodajte odsustva da biste generisali izvještaje.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filteri za izvještaje
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period od
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period do
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Company Filter */}
          {isAdmin && (
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
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {companyFilter && `Filtrirano za: ${getCompanyName(companyFilter)}`}
            {!isAdmin && companies.length > 0 && ` (Vaša kompanija: ${getCompanyName(companyFilter)})`}
          </div>
          <Button variant="outline" onClick={resetFilters}>
            Resetuj filtere
          </Button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Absence Summary Report */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Pregled odsustava
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Ukupan pregled odsustava po zaposlenima sa statistikom sati i dana
          </p>
          <Button 
            onClick={() => generateReport('absence-summary')}
            disabled={generating || employees.length === 0}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {generating && selectedReport === 'absence-summary' ? 'Generisanje...' : 'Pregledaj'}
          </Button>
        </div>

        {/* Employee Absence Report */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Detaljna odsustva
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Detaljan pregled svih odsustva po datumima i zaposlenima
          </p>
          <Button 
            onClick={() => generateReport('employee-absence')}
            disabled={generating || absenceRecords.length === 0}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {generating && selectedReport === 'employee-absence' ? 'Generisanje...' : 'Pregledaj'}
          </Button>
        </div>

        {/* Absence by Type Report */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center mb-4">
            <FileText className="h-8 w-8 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Po vrstama
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Analiza odsustava po vrstama (godišnji, bolovanje, itd.)
          </p>
          <Button 
            onClick={() => generateReport('absence-by-type')}
            disabled={generating || absenceRecords.length === 0}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {generating && selectedReport === 'absence-by-type' ? 'Generisanje...' : 'Pregledaj'}
          </Button>
        </div>

        {/* Monthly Hours Report */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-2 border-orange-200 dark:border-orange-800">
          <div className="flex items-center mb-4">
            <Calendar className="h-8 w-8 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Mjesečni sati
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Pregled mjesečnih sati odsustva po zaposlenima
          </p>
          <Button 
            onClick={() => generateReport('monthly-hours')}
            disabled={generating || absenceRecords.length === 0}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {generating && selectedReport === 'monthly-hours' ? 'Generisanje...' : 'Pregledaj'}
          </Button>
        </div>

        {/* Company Overview Report */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center mb-4">
              <Building className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                Pregled kompanija
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Uporedni pregled svih kompanija i stopa odsustva
            </p>
            <Button 
              onClick={() => generateReport('company-overview')}
              disabled={generating || companies.length === 0}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              {generating && selectedReport === 'company-overview' ? 'Generisanje...' : 'Pregledaj'}
            </Button>
          </div>
        )}

        {/* Department Summary Report */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center mb-4">
            <Clock className="h-8 w-8 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
              Po službama
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Pregled odsustava po organizacionim jedinicama
          </p>
          <Button 
            onClick={() => generateReport('department-summary')}
            disabled={generating || employees.length === 0}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {generating && selectedReport === 'department-summary' ? 'Generisanje...' : 'Pregledaj'}
          </Button>
        </div>
      </div>

      {/* Report Display - POBOLJŠANA VERZIJA */}
      {currentReport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentReport.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentReport.description}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Prikazano {currentReport.data.length} rezultata
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>

          {currentReport.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {currentReport.columns.map((column, index) => (
                      <th 
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {currentReport.data.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}
                    >
                      {currentReport.columns.map((column, colIndex) => {
                        const value = getCellValue(row, column);
                        let displayValue = value;
                        
                        // Formatiranje brojeva
                        if (typeof value === 'number') {
                          displayValue = value % 1 === 0 ? value : value.toFixed(2);
                        }

                        return (
                          <td 
                            key={colIndex} 
                            className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600"
                          >
                            {String(displayValue)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                Nema podataka za prikaz
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Pokušajte promijeniti filtere ili odaberite drugačiji period
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}