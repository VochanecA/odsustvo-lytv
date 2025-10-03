// components/ui/absence-popup.tsx
'use client';

import { X, Trash2, Save } from 'lucide-react';
import { Button } from './button'; // Koristite relativni import
import { useState, useEffect } from 'react';

// Definišite lokalni interfejs za ovu komponentu
interface AbsenceType {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  company_id?: string; // Opciono, ako postoji
}

interface AbsencePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (absenceTypeId: string | null) => void;
  absenceTypes: AbsenceType[];
  employeeName: string;
  date: string;
  existingAbsenceType?: string | null;
}

export function AbsencePopup({
  isOpen,
  onClose,
  onSelect,
  absenceTypes,
  employeeName,
  date,
  existingAbsenceType,
}: AbsencePopupProps) {
  const [selectedType, setSelectedType] = useState<string | null>(existingAbsenceType || null);

  useEffect(() => {
    console.log('Popup opened with existingAbsenceType:', existingAbsenceType);
    setSelectedType(existingAbsenceType || null);
  }, [isOpen, existingAbsenceType]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSelect(selectedType);
  };

  const handleDelete = () => {
    onSelect(null);
  };

  const currentAbsence = existingAbsenceType 
    ? absenceTypes.find(type => type.id === existingAbsenceType)
    : null;

  // If there's an existing absence and user selects null, that's a deletion (change)
  // If there's no existing absence and user selects null, that's no change
  // Otherwise, check if the selected type differs from existing
  const hasChanges = existingAbsenceType 
    ? selectedType !== existingAbsenceType  // Has existing: any change counts
    : selectedType !== null;                 // No existing: only selecting a type counts

  console.log('Current absence:', currentAbsence);
  console.log('Has changes:', hasChanges);
  console.log('Selected type:', selectedType);
  console.log('Existing type:', existingAbsenceType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {existingAbsenceType ? 'Uredi odsustvo' : 'Dodaj odsustvo'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          <p><strong>Zaposleni:</strong> {employeeName}</p>
          <p><strong>Datum:</strong> {new Date(date + 'T00:00:00').toLocaleDateString('hr-HR')}</p>
          {currentAbsence && (
            <div className="flex items-center mt-2">
              <strong>Trenutno odsustvo:</strong>
              <div
                className="w-3 h-3 rounded-full ml-2 mr-1"
                style={{ backgroundColor: currentAbsence.color }}
              />
              <span>{currentAbsence.name}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Odaberite vrstu odsustva:
          </label>
          {absenceTypes.map(type => (
            <button
              key={type.id}
              type="button"
              className={`w-full flex items-center p-3 rounded-md border transition-colors ${
                selectedType === type.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: type.color }}
              />
              <span className="text-left flex-1">
                {type.name}
              </span>
              {selectedType === type.id && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
          
          {/* Only show "Bez odsustva" option if there's an existing absence to remove */}
          {existingAbsenceType && (
            <div className="pt-2">
              <button
                type="button"
                className={`w-full flex items-center p-3 rounded-md border transition-colors ${
                  selectedType === null
                    ? 'border-gray-400 bg-gray-100 dark:bg-gray-700'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedType(null)}
              >
                <div className="w-4 h-4 rounded-full mr-3 bg-gray-400" />
                <span className="text-left flex-1">Bez odsustva (radni dan)</span>
                {selectedType === null && (
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {/* Show delete button only when there's an existing absence */}
          {existingAbsenceType && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Obriši
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className={existingAbsenceType ? "flex-1" : "w-full"}
          >
            <Save className="h-4 w-4 mr-2" />
            Snimi
          </Button>
        </div>

        {/* Debug info - remove in production */}
        <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
          <p><strong>Debug info:</strong></p>
          <p>Existing: {existingAbsenceType || 'null'}</p>
          <p>Selected: {selectedType || 'null'}</p>
          <p>Has changes: {hasChanges ? 'YES' : 'NO'}</p>
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <p>
            <strong>Napomena:</strong> Odabir &quot;Bez odsustva&quot; će obrisati postojeće odsustvo za ovaj dan.
          </p>
        </div>
      </div>
    </div>
  );
}