'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CourseRegistrationModalProps {
  userId: string;
  onClose: () => void;
}

export function CourseRegistrationModal({ userId, onClose }: CourseRegistrationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleYes = async () => {
    setLoading(true);
    try {
      // Save to database that user has completed registration
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          course_registration_completed: true,
          course_registration_confirmed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to save preference:', error);
        // Fall back to localStorage if database fails
        localStorage.setItem(`course_registration_${userId}`, 'completed');
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving registration status:', err);
      localStorage.setItem(`course_registration_${userId}`, 'completed');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleNo = () => {
    // Just close the modal, will show again next time
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleNo}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Course Registration</h2>
          <p className="text-blue-100 text-sm mt-2">Quick check before you continue</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center text-lg mb-6">
            Have you completed your <span className="font-semibold text-blue-600">course registration</span> for this semester?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleYes}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'Saving...' : 'Yes, I have registered'}
            </button>
            
            <button
              onClick={handleNo}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              <X className="w-5 h-5" />
              Not yet
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            If you select &quot;Yes&quot;, we won&apos;t ask you again this semester.
          </p>
        </div>
      </div>
    </div>
  );
}
