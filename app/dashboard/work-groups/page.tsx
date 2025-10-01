// app/dashboard/work-groups/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Users, Save, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { DeleteConfirmation } from '../../../components/delete-confirmation';
import { supabase } from '../../../lib/supabase';

interface WorkGroup {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  has_rest_day: boolean;
}

export default function WorkGroupsPage() {
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WorkGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<WorkGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '07:00',
    end_time: '15:00',
    has_rest_day: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('work_groups')
        .select('*')
        .order('id');

      if (error) throw error;
      setWorkGroups(data || []);
    } catch (error: any) {
      console.error('Error fetching work groups:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      start_time: '07:00',
      end_time: '15:00',
      has_rest_day: false
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleEditGroup = (group: WorkGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      start_time: group.start_time,
      end_time: group.end_time,
      has_rest_day: group.has_rest_day
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleDeleteGroup = (group: WorkGroup) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('work_groups')
        .delete()
        .eq('id', selectedGroup.id);

      if (error) throw error;

      await fetchData();
      setIsDeleteOpen(false);
      setSelectedGroup(null);
    } catch (error: any) {
      console.error('Error deleting work group:', error);
      setError('Greška pri brisanju radne grupe');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Naziv je obavezan';
    }

    if (!formData.start_time) {
      errors.start_time = 'Početno vrijeme je obavezno';
    }

    if (!formData.end_time) {
      errors.end_time = 'Završno vrijeme je obavezno';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      
      if (end <= start) {
        errors.end_time = 'Završno vrijeme mora biti nakon početnog vremena';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingGroup) {
        // Update existing group
        const { error } = await supabase
          .from('work_groups')
          .update({
            name: formData.name,
            start_time: formData.start_time,
            end_time: formData.end_time,
            has_rest_day: formData.has_rest_day
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
      } else {
        // Create new group - we need to get the next ID
        const maxId = workGroups.reduce((max, group) => Math.max(max, group.id), 0);
        const { error } = await supabase
          .from('work_groups')
          .insert({
            id: maxId + 1,
            name: formData.name,
            start_time: formData.start_time,
            end_time: formData.end_time,
            has_rest_day: formData.has_rest_day
          });

        if (error) throw error;
      }

      await fetchData();
      setIsFormOpen(false);
      setEditingGroup(null);
    } catch (error: any) {
      console.error('Error saving work group:', error);
      setFormErrors({ submit: error.message });
    }
  };

  const calculateWorkHours = (startTime: string, endTime: string): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotal = startHour + startMinute / 60;
    const endTotal = endHour + endMinute / 60;
    const hours = endTotal - startTotal;
    
    return hours.toFixed(1);
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
            Radne Grupe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upravljanje radnim vremenom i rasporedima
          </p>
        </div>
        <Button onClick={handleAddGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj radnu grupu
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {workGroups.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Radnih grupa</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {workGroups.filter(g => !g.has_rest_day).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Standardnih grupa</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {workGroups.filter(g => g.has_rest_day).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Grupa sa odmorma</div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Groups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {workGroups.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nema radnih grupa
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Dodajte prvu radnu grupu da biste definisali radno vrijeme
            </p>
            <Button onClick={handleAddGroup}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj radnu grupu
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Naziv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Radno Vrijeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Radni Sati
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Odmor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {workGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {group.start_time} - {group.end_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {calculateWorkHours(group.start_time, group.end_time)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        group.has_rest_day 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {group.has_rest_day ? 'Da' : 'Ne'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Work Group Form Popup */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingGroup ? 'Uredi radnu grupu' : 'Dodaj radnu grupu'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Naziv grupe *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Unesite naziv grupe"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Početak *
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        formErrors.start_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {formErrors.start_time && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.start_time}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kraj *
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        formErrors.end_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {formErrors.end_time && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.end_time}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="has_rest_day"
                    checked={formData.has_rest_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, has_rest_day: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="has_rest_day" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Grupa ima odmor narednog dana
                  </label>
                </div>

                {formData.start_time && formData.end_time && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Ukupno radnih sati:</strong> {calculateWorkHours(formData.start_time, formData.end_time)}h
                    </div>
                  </div>
                )}

                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formErrors.submit}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1"
                >
                  Otkaži
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingGroup ? 'Sačuvaj' : 'Dodaj'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedGroup(null);
        }}
        onConfirm={confirmDelete}
        title="Obriši radnu grupu"
        message={`Da li ste sigurni da želite obrisati radnu grupu "${selectedGroup?.name}"? Ova akcija se ne može poništiti.`}
      />
    </div>
  );
}