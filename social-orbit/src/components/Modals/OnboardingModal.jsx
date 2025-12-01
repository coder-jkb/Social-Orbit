/**
 * OnboardingModal Component
 * User persona setup/edit dialog
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Heart, MessageCircle } from 'lucide-react';

/**
 * OnboardingModal - Persona setup dialog
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close the modal (only if persona exists)
 * @param {Object|null} props.userPersona - Current persona data
 * @param {Function} props.onSubmit - Submit persona form
 */
export default function OnboardingModal({
  isOpen,
  onClose,
  userPersona,
  onSubmit
}) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const persona = {
      introvert: data.get('introvert'),
      values: data.get('values'),
      bio: data.get('bio'),
    };
    onSubmit(persona);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">Define Coordinates (0,0)</h2>
            <p className="text-slate-400 text-sm mt-1">
              To understand your friends, we first need to understand <b>YOU</b>.
            </p>
          </div>
          {/* Close button only visible if user data exists (Edit Mode) */}
          {userPersona && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto modern-scrollbar">
          <form id="personaForm" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                <User size={16} /> Are you Introverted or Extroverted?
              </label>
              <select
                name="introvert"
                defaultValue={userPersona?.introvert || 'Ambivert'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
              >
                <option>Very Introverted (I need lots of alone time)</option>
                <option>Introverted</option>
                <option>Ambivert</option>
                <option>Extroverted</option>
                <option>Very Extroverted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                <Heart size={16} /> What do you value most in friends?
              </label>
              <input
                name="values"
                defaultValue={userPersona?.values || ''}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                <MessageCircle size={16} /> Anything else about you?
              </label>
              <textarea
                name="bio"
                defaultValue={userPersona?.bio || ''}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white modern-scrollbar"
                required
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
          <button
            type="submit"
            form="personaForm"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl font-bold shadow-lg transform transition hover:scale-[1.02]"
          >
            Calibrate My Center (0,0)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

