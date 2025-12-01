/**
 * VAULT GATE COMPONENT
 * Handles the secure unlock flow before showing the main app
 * 
 * Flow:
 * 1. First time: User sets up a PIN/passphrase
 * 2. Returning: User enters PIN to unlock
 * 3. Migration: Imports old localStorage data on first setup
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Unlock, Eye, EyeOff, AlertTriangle, 
  Key, RefreshCw, Trash2, Download, Info, HelpCircle
} from 'lucide-react';
import secureStorage, { migrateFromLocalStorage, clearOldLocalStorage } from '../utils/secureStorage';

export default function VaultGate({ onUnlock, onDataLoaded }) {
  const [state, setState] = useState('checking'); // 'checking' | 'setup' | 'unlock' | 'unlocked'
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasOldData, setHasOldData] = useState(false);
  const [migrationData, setMigrationData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check vault status on mount
  useEffect(() => {
    checkVaultStatus();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const exists = await secureStorage.vaultExists();
      
      // Check for old localStorage data to migrate
      const oldData = localStorage.getItem('socialOrbit_friends') || 
                      localStorage.getItem('socialOrbit_persona');
      setHasOldData(!!oldData);
      
      if (oldData) {
        const { data, apiKey } = await migrateFromLocalStorage();
        setMigrationData({ data, apiKey });
      }
      
      setState(exists ? 'unlock' : 'setup');
    } catch (e) {
      console.error('Vault check error:', e);
      setState('setup');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (passphrase.length < 4) {
      setError('Passphrase must be at least 4 characters');
      return;
    }
    
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await secureStorage.initializeVault(passphrase);
      
      // Migrate old data if exists
      if (migrationData) {
        for (const [key, value] of Object.entries(migrationData.data)) {
          await secureStorage.setItem(key, value);
        }
        
        // Store API key in memory only (don't persist!)
        if (migrationData.apiKey) {
          secureStorage.setApiKey(migrationData.apiKey);
        }
        
        // Clear old insecure storage
        clearOldLocalStorage();
      }
      
      setState('unlocked');
      onUnlock();
      loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await secureStorage.unlock(passphrase);
      setState('unlocked');
      onUnlock();
      loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const friends = await secureStorage.getItem('friends') || [];
      const persona = await secureStorage.getItem('persona') || null;
      const formData = await secureStorage.getItem('formData') || null;
      const mockMode = await secureStorage.getItem('mockMode') ?? false;
      const apiKey = await secureStorage.getApiKey() || ''; // Now async with expiry check
      
      onDataLoaded({ friends, persona, formData, mockMode, apiKey });
    } catch (e) {
      console.error('Load data error:', e);
    }
  };

  const handleDestroyVault = async () => {
    if (window.confirm('⚠️ This will PERMANENTLY DELETE all your data. This cannot be undone. Are you sure?')) {
      if (window.confirm('Really? All your friends data will be gone forever!')) {
        await secureStorage.destroyVault();
        setPassphrase('');
        setConfirmPassphrase('');
        setState('setup');
        setMigrationData(null);
        setHasOldData(false);
      }
    }
  };

  const handleExportData = async () => {
    try {
      // Need to be unlocked first
      if (!secureStorage.isUnlocked) {
        await secureStorage.unlock(passphrase);
      }
      
      const data = await secureStorage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `social-orbit-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Export failed: ' + e.message);
    }
  };

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-block mb-4"
          >
            <img 
              src={`${import.meta.env.BASE_URL}social-orbit-logo.png`}
              alt="Social Orbit" 
              className="w-24 h-24 mx-auto drop-shadow-2xl"
            />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Social Orbit
          </h1>
          <p className="text-slate-400 mt-2">
            {state === 'setup' ? 'Secure Your Data' : 'Welcome Back'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Migration Notice */}
          {state === 'setup' && hasOldData && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-yellow-200 font-medium text-sm">Data Migration</p>
                  <p className="text-yellow-200/70 text-xs mt-1">
                    We found existing data stored insecurely. It will be encrypted after you set up your passphrase.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={state === 'setup' ? handleSetup : handleUnlock} className="p-6 space-y-5">
            {/* Info Box */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-xs text-slate-400 space-y-1">
                  {state === 'setup' ? (
                    <>
                      <p>Your data will be encrypted using <span className="text-purple-400 font-medium">AES-256</span> encryption.</p>
                      <p>⚠️ <span className="text-yellow-400">Remember your passphrase!</span> There's no recovery if forgotten.</p>
                    </>
                  ) : (
                    <p>Enter your passphrase to decrypt your relationship data.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Passphrase Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {state === 'setup' ? 'Create Passphrase' : 'Enter Passphrase'}
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder={state === 'setup' ? 'Min 4 characters' : '••••••••'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pr-12 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassphrase ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Passphrase (Setup only) */}
            {state === 'setup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Passphrase
                </label>
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Type again to confirm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2"
                >
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passphrase || (state === 'setup' && !confirmPassphrase)}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {state === 'setup' ? 'Securing...' : 'Unlocking...'}
                </>
              ) : (
                <>
                  {state === 'setup' ? <Lock size={18} /> : <Unlock size={18} />}
                  {state === 'setup' ? 'Create Secure Vault' : 'Unlock Vault'}
                </>
              )}
            </button>
          </form>

          {/* Forgot Passphrase - Always visible on unlock screen */}
          {state === 'unlock' && (
            <div className="border-t border-slate-800 p-4 space-y-3">
              {/* Forgot passphrase link - prominently displayed */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-slate-400 hover:text-purple-400 transition-colors flex items-center justify-center gap-2 w-full"
              >
                <HelpCircle size={14} />
                Forgot your passphrase?
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    {/* Explanation */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-xs text-orange-300">
                        <b>No recovery possible</b> - your data is encrypted and can't be decrypted without the passphrase.
                        You can <b>reset and start fresh</b> below.
                      </p>
                    </div>

                    {/* Export if they remember */}
                    <button
                      onClick={handleExportData}
                      disabled={!passphrase}
                      className="w-full py-2 text-xs border border-slate-700 text-slate-400 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download size={14} />
                      Export Backup (if you remember passphrase)
                    </button>
                    
                    {/* Reset / Start Fresh */}
                    <button
                      onClick={handleDestroyVault}
                      className="w-full py-2.5 text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                      <RefreshCw size={14} />
                      Reset & Create New Vault
                    </button>
                    <p className="text-[10px] text-slate-600 text-center">
                      This deletes all data and lets you set a new passphrase
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-slate-600 mt-4">
          🔒 All data encrypted locally • Never sent to servers
        </p>
      </motion.div>
    </div>
  );
}

