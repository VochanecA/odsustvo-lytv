// app/components/calendar.tsx
'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarProps {
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  absenceRecords: Array<{
    employeeId: string;
    date: string;
    absenceTypeId: string;
  }>;
  onDateClick: (employeeId: string, date: Date) => void;
}

export function Calendar({ employees, absenceRecords, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getAbsenceForEmployee = (employeeId: string, date: Date) => {
    return absenceRecords.find(
      record => 
        record.employeeId === employeeId && 
        isSameDay(new Date(record.date), date)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <Button variant="outline" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row with dates */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div className="w-48 flex-shrink-0 p-2 font-semibold text-gray-900 dark:text-white">
              Zaposleni
            </div>
            {monthDays.map(day => (
              <div
                key={day.toISOString()}
                className={cn(
                  'w-12 flex-shrink-0 p-2 text-center text-sm border-r border-gray-200 dark:border-gray-700',
                  !isSameMonth(day, currentDate) && 'text-gray-400 dark:text-gray-600'
                )}
              >
                {format(day, 'd')}
              </div>
            ))}
          </div>

          {/* Employee rows */}
          {employees.map(employee => (
            <div
              key={employee.id}
              className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              <div className="w-48 flex-shrink-0 p-2 text-sm text-gray-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </div>
              
              {monthDays.map(day => {
                const absence = getAbsenceForEmployee(employee.id, day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'w-12 flex-shrink-0 p-2 text-center text-xs border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                      !isSameMonth(day, currentDate) && 'bg-gray-50 dark:bg-gray-900'
                    )}
                    onClick={() => onDateClick(employee.id, day)}
                  >
                    {absence && (
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full mx-auto flex items-center justify-center text-white text-xs font-bold',
                          {
                            'bg-green-500': absence.absenceTypeId === 'V',
                            'bg-purple-500': absence.absenceTypeId === 'S',
                            'bg-red-500': absence.absenceTypeId === 'B',
                            'bg-gray-500': absence.absenceTypeId === 'D',
                            'bg-yellow-500': absence.absenceTypeId === 'C',
                          }
                        )}
                      >
                        {absence.absenceTypeId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}