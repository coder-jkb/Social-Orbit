/**
 * SOCIAL ORBIT
 * A Relativistic Relationship Visualizer
 * 
 * Main application component that orchestrates all sub-components.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UserPlus, Layers } from 'lucide-react';

// Components
import {
  VaultGate,
  GraphCanvas,
  PanelHeader,
  FriendDetail,
  AddFriendForm,
  BulkImportForm,
  SettingsModal,
  OnboardingModal
} from './components';

// Services
import { analyzeFriend, analyzeFriendsBulk } from './services';

// Utils
import secureStorage from './utils/secureStorage';

// Constants
import { ICON_MAP, DEFAULT_ICON, DEFAULT_COLOR } from './constants';

// Default form state
const EMPTY_FORM = {
  name: '',
  gender: 'Non-binary',
  age: '',
  description: '',
  x: 50,
  y: 50,
  icon: 'User',
  summary: '',
  reasoning: ''
};

// Default bulk list item
const createBulkItem = () => ({
  id: Date.now(),
  name: '',
  gender: 'Non-binary',
  age: '',
  description: ''
});

export default function SocialOrbit() {
  // ==================== VAULT STATE ====================
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // ==================== DATA STATE ====================
  const [friends, setFriends] = useState([]);
  const [userPersona, setUserPersona] = useState(null);
  const [apiKey, setApiKey] = useState(''); // Memory only!
  const [useMockMode, setUseMockMode] = useState(false);

  // ==================== UI STATE ====================
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [manualMode, setManualMode] = useState(false);

  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [bulkList, setBulkList] = useState([createBulkItem()]);

  // ==================== LAYOUT STATE ====================
  const [splitRatio, setSplitRatio] = useState(60);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef(null);

  // ==================== VAULT HANDLERS ====================
  const handleVaultUnlock = useCallback(() => {
    setIsVaultUnlocked(true);
  }, []);

  const handleDataLoaded = useCallback((data) => {
    setFriends(data.friends || []);
    setUserPersona(data.persona || null);
    setFormData(data.formData || EMPTY_FORM);
    setUseMockMode(data.mockMode ?? false);
    setApiKey(data.apiKey || '');
    setInitialDataLoaded(true);
  }, []);

  const handleLockVault = useCallback(() => {
    secureStorage.lock();
    setIsVaultUnlocked(false);
    setInitialDataLoaded(false);
    setFriends([]);
    setUserPersona(null);
    setApiKey('');
    setUseMockMode(false);
  }, []);

  // ==================== EFFECTS ====================
  
  // Show onboarding if no persona
  useEffect(() => {
    if (initialDataLoaded && !userPersona) {
      setShowOnboarding(true);
    }
  }, [initialDataLoaded, userPersona]);

  // Save friends to encrypted storage
  useEffect(() => {
    if (!isVaultUnlocked || !initialDataLoaded) return;
    secureStorage.setItem('friends', friends).catch(console.error);
  }, [friends, isVaultUnlocked, initialDataLoaded]);

  // Save form data to encrypted storage
  useEffect(() => {
    if (!isVaultUnlocked || !initialDataLoaded) return;
    secureStorage.setItem('formData', formData).catch(console.error);
  }, [formData, isVaultUnlocked, initialDataLoaded]);

  // Save mock mode to encrypted storage
  useEffect(() => {
    if (!isVaultUnlocked || !initialDataLoaded) return;
    secureStorage.setItem('mockMode', useMockMode).catch(console.error);
  }, [useMockMode, isVaultUnlocked, initialDataLoaded]);

  // Resizing logic
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setSplitRatio(Math.min(Math.max(newRatio, 20), 80));
    };

    const handleGlobalMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isResizing]);

  // ==================== PERSONA HANDLERS ====================
  
  const handlePersonaSubmit = useCallback(async (persona) => {
    setUserPersona(persona);
    if (isVaultUnlocked) {
      await secureStorage.setItem('persona', persona);
    }
    setShowOnboarding(false);
  }, [isVaultUnlocked]);

  // ==================== SETTINGS HANDLERS ====================
  
  const handleApiKeySave = useCallback(() => {
    secureStorage.setApiKey(apiKey);
    setShowSettings(false);
  }, [apiKey]);

  const handleClearApiKey = useCallback(() => {
    setApiKey('');
    secureStorage.clearApiKey();
  }, []);

  // ==================== FRIEND HANDLERS ====================
  
  const startEdit = useCallback((friend) => {
    setActiveTab('single');
    setFormData({
      name: friend.name,
      gender: friend.gender,
      age: friend.age,
      description: friend.description
    });
    setEditingId(friend.id);
    setSelectedFriend(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
  }, []);

  const deleteFriend = useCallback((id) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
    setSelectedFriend(null);
  }, []);

  const updateFriendIcon = useCallback((newIcon) => {
    if (!selectedFriend) return;
    const updated = { ...selectedFriend, icon: newIcon };
    setFriends((prev) => prev.map((f) => (f.id === selectedFriend.id ? updated : f)));
    setSelectedFriend(updated);
  }, [selectedFriend]);

  const updateFriendColor = useCallback((newColor) => {
    if (!selectedFriend) return;
    const updated = { ...selectedFriend, color: newColor };
    setFriends((prev) => prev.map((f) => (f.id === selectedFriend.id ? updated : f)));
    setSelectedFriend(updated);
  }, [selectedFriend]);

  // ==================== ANALYSIS HANDLERS ====================
  
  const analyzeAndAddFriend = useCallback(async () => {
    if (!formData.name || !formData.description) return;
    setLoading(true);

    try {
      const analysis = await analyzeFriend({
        apiKey,
        userPersona,
        friendData: formData,
        useMockMode
      });

      // Validate icon
      if (!ICON_MAP[analysis.icon]) {
        analysis.icon = DEFAULT_ICON;
      }

      if (editingId) {
        // Update existing friend
        const oldFriend = friends.find((f) => f.id === editingId);
        const colorToUse = oldFriend?.color || DEFAULT_COLOR;
        setFriends((prev) =>
          prev.map((f) =>
            f.id === editingId
              ? { ...f, ...formData, ...analysis, color: colorToUse, id: Date.now() }
              : f
          )
        );
        setEditingId(null);
      } else {
        // Add new friend
        setFriends((prev) => [
          ...prev,
          { id: Date.now(), ...formData, ...analysis, color: DEFAULT_COLOR }
        ]);
      }

      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error(error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, apiKey, userPersona, useMockMode, editingId, friends]);

  const addManualFriend = useCallback(() => {
    if (!formData.name) return;
    
    const newFriend = {
      id: Date.now(),
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      description: formData.description || '',
      x: Math.min(Math.max(Number(formData.x ?? 0), 0), 100),
      y: Math.min(Math.max(Number(formData.y ?? 0), 0), 100),
      icon: ICON_MAP[formData.icon] ? formData.icon : DEFAULT_ICON,
      summary: formData.summary || 'Manual entry',
      reasoning: formData.reasoning || 'Added without AI',
      color: DEFAULT_COLOR
    };
    
    setFriends((prev) => [...prev, newFriend]);
    setFormData(EMPTY_FORM);
  }, [formData]);

  const analyzeBulkFriends = useCallback(async () => {
    const validItems = bulkList.filter(
      (item) => item.name?.trim() && item.description?.trim()
    );
    if (validItems.length === 0) return;

    setLoading(true);

    try {
      const results = await analyzeFriendsBulk({
        apiKey,
        userPersona,
        friendsList: validItems,
        useMockMode
      });

      const processedFriends = results.map((f) => ({
        id: Date.now() + Math.random(),
        ...f,
        color: DEFAULT_COLOR,
        icon: ICON_MAP[f.icon] ? f.icon : DEFAULT_ICON
      }));

      setFriends((prev) => [...prev, ...processedFriends]);
      setBulkList([createBulkItem()]);
    } catch (error) {
      console.error(error);
      alert(`Bulk Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [bulkList, apiKey, userPersona, useMockMode]);

  // ==================== RENDER ====================

  // Show vault gate if not unlocked
  if (!isVaultUnlocked || !initialDataLoaded) {
    return (
      <VaultGate
        onUnlock={handleVaultUnlock}
        onDataLoaded={handleDataLoaded}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-row"
    >
      {/* Custom scrollbar styles */}
      <style>{`
        .modern-scrollbar { scrollbar-width: thin; scrollbar-color: #475569 #1e293b; }
        .modern-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .modern-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
        .modern-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 4px; border: 2px solid #1e293b; }
      `}</style>

      {/* ==================== LEFT: Graph Canvas ==================== */}
      <GraphCanvas
        friends={friends}
        selectedFriend={selectedFriend}
        onSelectFriend={setSelectedFriend}
        onUpdateFriends={setFriends}
        onEditPersona={() => setShowOnboarding(true)}
        width={isCollapsed ? 100 : splitRatio}
      />

      {/* ==================== RESIZER ==================== */}
      <div
        className="w-2 bg-slate-900 border-l border-r border-slate-800 cursor-col-resize hover:bg-purple-500/20 transition-colors flex items-center justify-center relative z-30"
        onMouseDown={() => setIsResizing(true)}
      >
        <div
          className="absolute bg-slate-800 rounded-full p-1 cursor-pointer hover:bg-purple-500 hover:text-white text-slate-400 z-40"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <span className="block w-3 h-3">‹</span>
          ) : (
            <span className="block w-3 h-3">›</span>
          )}
        </div>
      </div>

      {/* ==================== RIGHT: Control Panel ==================== */}
      {!isCollapsed && (
        <div
          className="bg-slate-900 border-l border-slate-800 flex flex-col h-screen z-20 shadow-2xl overflow-hidden"
          style={{ width: `${100 - splitRatio}%` }}
        >
          {/* Panel Header */}
          <PanelHeader
            showApiKeyWarning={!apiKey && !useMockMode}
            onEditPersona={() => setShowOnboarding(true)}
            onOpenSettings={() => setShowSettings(true)}
            onLockVault={handleLockVault}
          />

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 modern-scrollbar">
            {selectedFriend ? (
              // Friend Detail View
              <FriendDetail
                friend={selectedFriend}
                onClose={() => setSelectedFriend(null)}
                onEdit={() => startEdit(selectedFriend)}
                onDelete={() => deleteFriend(selectedFriend.id)}
                onUpdateIcon={updateFriendIcon}
                onUpdateColor={updateFriendColor}
              />
            ) : (
              // Add Friend Forms
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-slate-700 mb-4">
                  <button
                    onClick={() => setActiveTab('single')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                      activeTab === 'single'
                        ? 'text-purple-400 border-purple-500 bg-slate-800/30'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/20'
                    }`}
                  >
                    <UserPlus size={16} /> Single Add
                  </button>
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                      activeTab === 'bulk'
                        ? 'text-purple-400 border-purple-500 bg-slate-800/30'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/20'
                    }`}
                  >
                    <Layers size={16} /> Bulk Import
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'single' ? (
                  <AddFriendForm
                    formData={formData}
                    onFormChange={setFormData}
                    isEditing={!!editingId}
                    onCancelEdit={cancelEdit}
                    manualMode={manualMode}
                    onToggleManualMode={() => setManualMode(!manualMode)}
                    loading={loading}
                    onAnalyze={analyzeAndAddFriend}
                    onManualAdd={addManualFriend}
                  />
                ) : (
                  <BulkImportForm
                    bulkList={bulkList}
                    onUpdateList={setBulkList}
                    loading={loading}
                    onAnalyze={analyzeBulkFriends}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            useMockMode={useMockMode}
            onMockModeChange={setUseMockMode}
            onSave={handleApiKeySave}
            onClearApiKey={handleClearApiKey}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            userPersona={userPersona}
            onSubmit={handlePersonaSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
