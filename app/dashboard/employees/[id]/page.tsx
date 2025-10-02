// app/dashboard/employees/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, ArrowLeft, Calendar, FileText, Users, Clock, PieChart, Printer } from 'lucide-react';
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

interface WorkHours {
  id: string;
  employee_id: string;
  work_date: string;
  hours_input: string;
  hours_worked: number;
  created_at: string;
  updated_at: string;
}

interface MonthlyHoursSummary {
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

interface SummaryData {
  total: { [key: string]: number };
  byMonth: { [key: string]: { [key: string]: number } };
  byYear: { [key: string]: { [key: string]: number } };
  workHours: {
    daily: WorkHours[];
    monthlySummary?: MonthlyHoursSummary;
  };
}

interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface EmployeeMonthlySummary {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_normal_hours: number;
  total_redistribution_hours: number;
  total_overtime_hours: number;
  total_hours: number;
}

export default function EmployeeSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [workGroup, setWorkGroup] = useState<WorkGroup | null>(null);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [workHours, setWorkHours] = useState<WorkHours[]>([]);
  const [monthlyHoursSummary, setMonthlyHoursSummary] = useState<MonthlyHoursSummary | null>(null);
  const [summary, setSummary] = useState<SummaryData>({ 
    total: {}, 
    byMonth: {}, 
    byYear: {},
    workHours: {
      daily: []
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWorkHoursForm, setShowWorkHoursForm] = useState(false);
  const [selectedWorkDate, setSelectedWorkDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [workHoursInput, setWorkHoursInput] = useState('');
  const [submittingWorkHours, setSubmittingWorkHours] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [employeeId]);

  const validateTimeFormat = (timeString: string): boolean => {
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  };

  const fetchData = async (): Promise<void> => {
    try {
      setError(null);
      
      const [
        employeeResponse, 
        recordsResponse, 
        typesResponse, 
        groupsResponse,
        workHoursResponse,
        monthlySummaryResponse
      ] = await Promise.all([
        supabase.from('employees').select('*').eq('id', employeeId).single(),
        supabase.from('absence_records').select('*').eq('employee_id', employeeId).eq('status', 'approved'),
        supabase.from('absence_types').select('*').eq('is_active', true),
        supabase.from('work_groups').select('*'),
        supabase
          .from('work_hours')
          .select('*')
          .eq('employee_id', employeeId)
          .order('work_date', { ascending: false }),
        supabase
          .from('monthly_hours_summary')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('year', new Date().getFullYear())
          .eq('month', new Date().getMonth() + 1)
          .single()
      ]);

      if (employeeResponse.error) throw employeeResponse.error;
      if (recordsResponse.error) throw recordsResponse.error;
      if (typesResponse.error) throw typesResponse.error;
      if (groupsResponse.error) throw groupsResponse.error;

      setEmployee(employeeResponse.data);
      setAbsenceRecords(recordsResponse.data || []);
      setAbsenceTypes(typesResponse.data || []);
      
      const employeeWorkGroup = groupsResponse.data?.find(
        (g: WorkGroup) => g.id === employeeResponse.data.work_group
      );
      setWorkGroup(employeeWorkGroup || null);

      setWorkHours(workHoursResponse.data || []);
      setMonthlyHoursSummary(monthlySummaryResponse.data || null);

      calculateSummary(recordsResponse.data || []);

    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (records: AbsenceRecord[]): void => {
    const total: { [key: string]: number } = {};
    const byMonth: { [key: string]: { [key: string]: number } } = {};
    const byYear: { [key: string]: { [key: string]: number } } = {};

    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = String(date.getFullYear());

      total[record.absence_type_id] = (total[record.absence_type_id] || 0) + record.hours;

      if (!byMonth[monthKey]) byMonth[monthKey] = {};
      byMonth[monthKey][record.absence_type_id] = (byMonth[monthKey][record.absence_type_id] || 0) + record.hours;

      if (!byYear[yearKey]) byYear[yearKey] = {};
      byYear[yearKey][record.absence_type_id] = (byYear[yearKey][record.absence_type_id] || 0) + record.hours;
    });

    setSummary({ total, byMonth, byYear, workHours: { daily: workHours } });
  };

  const getCurrentPeriodData = (): { [key: string]: number } => {
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

  const getPeriodLabel = (): string => {
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.toLocaleDateString('sr-Latn', { month: 'long', year: 'numeric' });

    switch (selectedPeriod) {
      case 'month':
        return currentMonth;
      case 'year':
        return currentYear.toString();
      case 'all':
        return 'Sve vreme';
      default:
        return '';
    }
  };

  const handleSubmitWorkHours = async (): Promise<void> => {
    if (!workHoursInput || !selectedWorkDate) return;

    // Validacija formata
    if (!validateTimeFormat(workHoursInput)) {
      setError('Neispravan format vremena. Koristite format HH:MM (npr. 08:30)');
      return;
    }

    try {
      setSubmittingWorkHours(true);
      setError(null);
      
      console.log('Submitting work hours:', {
        employee_id: employeeId,
        work_date: selectedWorkDate,
        hours_input: workHoursInput
      });

      const { data, error } = await supabase
        .from('work_hours')
        .upsert({
          employee_id: employeeId,
          work_date: selectedWorkDate,
          hours_input: workHoursInput
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Successfully submitted work hours:', data);

      setWorkHours(prev => {
        const filtered = prev.filter(wh => wh.work_date !== selectedWorkDate);
        return [data, ...filtered];
      });

      setWorkHoursInput('');
      setShowWorkHoursForm(false);
      
      // Refetch monthly summary
      const currentDate = new Date();
      const { data: summaryData, error: summaryError } = await supabase
        .from('monthly_hours_summary')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', currentDate.getFullYear())
        .eq('month', currentDate.getMonth() + 1)
        .single();

      if (summaryError) {
        console.error('Error fetching monthly summary:', summaryError);
      } else {
        setMonthlyHoursSummary(summaryData);
      }

    } catch (error: unknown) {
      console.error('Full error object:', error);
      
      if (error instanceof Error) {
        setError(`Greška pri unosu sati: ${error.message}`);
      } else {
        const supabaseError = error as SupabaseError;
        const errorMessage = supabaseError?.message || supabaseError?.details || supabaseError?.hint || 'Nepoznata greška';
        setError(`Greška pri unosu sati: ${errorMessage}`);
      }
    } finally {
      setSubmittingWorkHours(false);
    }
  };

  const getWorkHoursForDate = (date: string): string => {
    const record = workHours.find(wh => wh.work_date === date);
    return record?.hours_input || '';
  };

  const generateEmployeeMonthlyPDF = async (): Promise<void> => {
    try {
      setGeneratingPDF(true);
      
      const currentYear = selectedDate.getFullYear();
      const currentMonth = selectedDate.getMonth() + 1;
      const monthName = selectedDate.toLocaleDateString('sr-Latn', { month: 'long', year: 'numeric' });

      // Fetch detailed monthly data
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_hours_summary')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      if (monthlyError) {
        console.error('Error fetching monthly data:', monthlyError);
        setError('Greška pri preuzimanju podataka za PDF');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Ne mogu otvoriti prozor za štampanje');
        return;
      }

      const totalHours = (monthlyData?.total_normal_hours || 0) + 
                        (monthlyData?.total_redistribution_hours || 0) + 
                        (monthlyData?.total_overtime_hours || 0);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Izveštaj radnih sati - ${employee?.first_name} ${employee?.last_name}</title>
            <style>
              body { 
                font-family: 'DejaVu Sans', Arial, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.4;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              h1 { 
                color: #2c5aa0; 
                margin: 0;
                font-size: 24px;
              }
              h2 {
                color: #666;
                margin: 10px 0;
                font-size: 18px;
                font-weight: normal;
              }
              .employee-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin: 25px 0;
              }
              .summary-card {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .summary-card.normal { border-top: 4px solid #3b82f6; }
              .summary-card.redistribution { border-top: 4px solid #f59e0b; }
              .summary-card.overtime { border-top: 4px solid #ef4444; }
              .summary-card.total { border-top: 4px solid #10b981; }
              .summary-value {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
              }
              .summary-label {
                font-size: 14px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 25px 0;
                background: white;
              }
              th {
                background-color: #2c5aa0;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
              }
              td {
                padding: 12px;
                border-bottom: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              .no-data {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 40px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MJESEČNI IZVEŠTAJ RADNIH SATI</h1>
              <h2>Period: ${monthName}</h2>
            </div>

            <div class="employee-info">
              <strong>Zaposleni:</strong> ${employee?.first_name} ${employee?.last_name}<br>
              <strong>Email:</strong> ${employee?.email}<br>
              <strong>Radna grupa:</strong> ${workGroup?.name || 'Nepoznato'}
            </div>

            ${monthlyData ? `
              <div class="summary-grid">
                <div class="summary-card normal">
                  <div class="summary-label">Normalni sati</div>
                  <div class="summary-value">${monthlyData.total_normal_hours.toFixed(1)}h</div>
                </div>
                <div class="summary-card redistribution">
                  <div class="summary-label">Preraspodjela</div>
                  <div class="summary-value">${monthlyData.total_redistribution_hours.toFixed(1)}h</div>
                </div>
                <div class="summary-card overtime">
                  <div class="summary-label">Prekovremeni</div>
                  <div class="summary-value">${monthlyData.total_overtime_hours.toFixed(1)}h</div>
                </div>
                <div class="summary-card total">
                  <div class="summary-label">Ukupno sati</div>
                  <div class="summary-value">${totalHours.toFixed(1)}h</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Vrsta sati</th>
                    <th>Broj sati</th>
                    <th>Procenat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Normalni radni sati</td>
                    <td>${monthlyData.total_normal_hours.toFixed(1)}h</td>
                    <td>${totalHours > 0 ? ((monthlyData.total_normal_hours / totalHours) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td>Sati za preraspodjelu</td>
                    <td>${monthlyData.total_redistribution_hours.toFixed(1)}h</td>
                    <td>${totalHours > 0 ? ((monthlyData.total_redistribution_hours / totalHours) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td>Prekovremeni sati</td>
                    <td>${monthlyData.total_overtime_hours.toFixed(1)}h</td>
                    <td>${totalHours > 0 ? ((monthlyData.total_overtime_hours / totalHours) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr style="background-color: #e8f4fd; font-weight: bold;">
                    <td>UKUPNO</td>
                    <td>${totalHours.toFixed(1)}h</td>
                    <td>100%</td>
                  </tr>
                </tbody>
              </table>
            ` : `
              <div class="no-data">
                Nema podataka o radnim satima za odabrani period
              </div>
            `}

            <div class="footer">
              Generisano: ${new Date().toLocaleDateString('sr-Latn-RS')} u ${new Date().toLocaleTimeString('sr-Latn-RS')}<br>
              Sistem za evidenciju radnog vremena
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      setError('Greška pri generisanju PDF izveštaja');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateAllEmployeesPDF = async (): Promise<void> => {
    try {
      setGeneratingPDF(true);
      
      const currentYear = selectedDate.getFullYear();
      const currentMonth = selectedDate.getMonth() + 1;
      const monthName = selectedDate.toLocaleDateString('sr-Latn', { month: 'long', year: 'numeric' });

      // Fetch all employees monthly summaries
      const { data: monthlySummaries, error: summariesError } = await supabase
        .from('monthly_hours_summary')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            email
          )
        `)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .order('employees(first_name)');

      if (summariesError) {
        console.error('Error fetching all employees data:', summariesError);
        setError('Greška pri preuzimanju podataka za PDF');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Ne mogu otvoriti prozor za štampanje');
        return;
      }

      const employeeSummaries: EmployeeMonthlySummary[] = (monthlySummaries || []).map((summary: any) => ({
        employee_id: summary.employee_id,
        first_name: summary.employees?.first_name || 'Nepoznato',
        last_name: summary.employees?.last_name || 'Nepoznato',
        email: summary.employees?.email || 'Nepoznato',
        total_normal_hours: summary.total_normal_hours,
        total_redistribution_hours: summary.total_redistribution_hours,
        total_overtime_hours: summary.total_overtime_hours,
        total_hours: summary.total_normal_hours + summary.total_redistribution_hours + summary.total_overtime_hours
      }));

      // Calculate totals
      const totals = employeeSummaries.reduce((acc, emp) => ({
        normal: acc.normal + emp.total_normal_hours,
        redistribution: acc.redistribution + emp.total_redistribution_hours,
        overtime: acc.overtime + emp.total_overtime_hours,
        total: acc.total + emp.total_hours
      }), { normal: 0, redistribution: 0, overtime: 0, total: 0 });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Izveštaj radnih sati - Svi zaposleni</title>
            <style>
              body { 
                font-family: 'DejaVu Sans', Arial, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.4;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              h1 { 
                color: #2c5aa0; 
                margin: 0;
                font-size: 24px;
              }
              h2 {
                color: #666;
                margin: 10px 0;
                font-size: 18px;
                font-weight: normal;
              }
              .period-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                text-align: center;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 25px 0;
                background: white;
                font-size: 12px;
              }
              th {
                background-color: #2c5aa0;
                color: white;
                padding: 10px;
                text-align: left;
                font-weight: 600;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .total-row {
                background-color: #e8f4fd !important;
                font-weight: bold;
                border-top: 2px solid #2c5aa0;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                color: #666;
                font-size: 11px;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              .no-data {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 40px;
              }
              .summary-totals {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                margin: 20px 0;
              }
              .total-card {
                background: white;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                text-align: center;
              }
              .total-value {
                font-size: 18px;
                font-weight: bold;
                margin: 5px 0;
              }
              .total-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MJESEČNI IZVEŠTAJ RADNIH SATI - SVI ZAPOSLENI</h1>
              <h2>Period: ${monthName}</h2>
            </div>

            <div class="period-info">
              <strong>Broj zaposlenih sa podacima:</strong> ${employeeSummaries.length}<br>
              <strong>Ukupan broj sati:</strong> ${totals.total.toFixed(1)}h
            </div>

            ${employeeSummaries.length > 0 ? `
              <div class="summary-totals">
                <div class="total-card">
                  <div class="total-label">Normalni sati</div>
                  <div class="total-value">${totals.normal.toFixed(1)}h</div>
                </div>
                <div class="total-card">
                  <div class="total-label">Preraspodjela</div>
                  <div class="total-value">${totals.redistribution.toFixed(1)}h</div>
                </div>
                <div class="total-card">
                  <div class="total-label">Prekovremeni</div>
                  <div class="total-value">${totals.overtime.toFixed(1)}h</div>
                </div>
                <div class="total-card">
                  <div class="total-label">Ukupno sati</div>
                  <div class="total-value">${totals.total.toFixed(1)}h</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Ime i prezime</th>
                    <th>Email</th>
                    <th>Normalni sati</th>
                    <th>Preraspodjela</th>
                    <th>Prekovremeni</th>
                    <th>Ukupno sati</th>
                  </tr>
                </thead>
                <tbody>
                  ${employeeSummaries.map(emp => `
                    <tr>
                      <td>${emp.first_name} ${emp.last_name}</td>
                      <td>${emp.email}</td>
                      <td>${emp.total_normal_hours.toFixed(1)}h</td>
                      <td>${emp.total_redistribution_hours.toFixed(1)}h</td>
                      <td>${emp.total_overtime_hours.toFixed(1)}h</td>
                      <td><strong>${emp.total_hours.toFixed(1)}h</strong></td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="2"><strong>UKUPNO</strong></td>
                    <td><strong>${totals.normal.toFixed(1)}h</strong></td>
                    <td><strong>${totals.redistribution.toFixed(1)}h</strong></td>
                    <td><strong>${totals.overtime.toFixed(1)}h</strong></td>
                    <td><strong>${totals.total.toFixed(1)}h</strong></td>
                  </tr>
                </tbody>
              </table>
            ` : `
              <div class="no-data">
                Nema podataka o radnim satima za odabrani period
              </div>
            `}

            <div class="footer">
              Generisano: ${new Date().toLocaleDateString('sr-Latn-RS')} u ${new Date().toLocaleTimeString('sr-Latn-RS')}<br>
              Sistem za evidenciju radnog vremena • Ukupno zaposlenih: ${employeeSummaries.length}
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

    } catch (error: unknown) {
      console.error('Error generating all employees PDF:', error);
      setError('Greška pri generisanju PDF izveštaja za sve zaposlene');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const exportToPDF = (): void => {
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

  const exportToExcel = (): void => {
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
          <Button 
            onClick={generateEmployeeMonthlyPDF}
            disabled={generatingPDF}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            {generatingPDF ? 'Generiše se...' : 'PDF Izveštaj'}
          </Button>
          <Button 
            onClick={generateAllEmployeesPDF}
            disabled={generatingPDF}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            {generatingPDF ? 'Generiše se...' : 'Svi zaposleni'}
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF Odsustva
          </Button>
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Radni sati (mjesec)</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {monthlyHoursSummary ? (
                  <>
                    {(
                      monthlyHoursSummary.total_normal_hours +
                      monthlyHoursSummary.total_redistribution_hours +
                      monthlyHoursSummary.total_overtime_hours
                    ).toFixed(1)}h
                  </>
                ) : (
                  '0h'
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {monthlyHoursSummary ? (
                  <>
                    {monthlyHoursSummary.total_normal_hours.toFixed(1)}N +{' '}
                    {monthlyHoursSummary.total_redistribution_hours.toFixed(1)}P +{' '}
                    {monthlyHoursSummary.total_overtime_hours.toFixed(1)}O
                  </>
                ) : (
                  'Nema podataka'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Hours Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Radni sati
          </h3>
          <Button 
            onClick={() => setShowWorkHoursForm(!showWorkHoursForm)}
            variant="outline"
          >
            <Clock className="h-4 w-4 mr-2" />
            {showWorkHoursForm ? 'Zatvori' : 'Dodaj radne sate'}
          </Button>
        </div>

        {/* Work Hours Form */}
        {showWorkHoursForm && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={selectedWorkDate}
                  onChange={(e) => setSelectedWorkDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Radni sati
                </label>
                <input
                  type="text"
                  value={workHoursInput}
                  onChange={(e) => setWorkHoursInput(e.target.value)}
                  placeholder="08:30"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: HH:MM (npr. 08:30, 07:45)
                </p>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSubmitWorkHours}
                  disabled={!workHoursInput || submittingWorkHours}
                  className="w-full"
                >
                  {submittingWorkHours ? 'Snima se...' : 'Sačuvaj'}
                </Button>
              </div>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Monthly Work Hours Summary */}
        {monthlyHoursSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-sm text-blue-600 dark:text-blue-400">Normalni sati</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {monthlyHoursSummary.total_normal_hours.toFixed(1)}h
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Preraspodjela</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {monthlyHoursSummary.total_redistribution_hours.toFixed(1)}h
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-sm text-red-600 dark:text-red-400">Prekovremeni</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {monthlyHoursSummary.total_overtime_hours.toFixed(1)}h
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-sm text-green-600 dark:text-green-400">Ukupno</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {(
                  monthlyHoursSummary.total_normal_hours +
                  monthlyHoursSummary.total_redistribution_hours +
                  monthlyHoursSummary.total_overtime_hours
                ).toFixed(1)}h
              </div>
            </div>
          </div>
        )}

        {/* Recent Work Hours */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Nedavni unosi
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Datum
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Radni sati
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Decimalno
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {workHours.slice(0, 10).map((wh) => (
                  <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {new Date(wh.work_date).toLocaleDateString('sr-Latn-RS')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {wh.hours_input}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {wh.hours_worked.toFixed(2)}h
                    </td>
                  </tr>
                ))}
                {workHours.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nema unesenih radnih sati
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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