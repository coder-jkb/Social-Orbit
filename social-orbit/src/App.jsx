import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Plus, Settings, Info, X, Heart, MessageCircle, Sparkles, Trash2, 
  ZoomIn, ZoomOut, Move, AlertTriangle, Key as KeyIcon, Save, Edit, ChevronDown, 
  Grid, GripVertical, ChevronRight, ChevronLeft, Palette, HelpCircle, Layers, UserPlus,
  // Emote Icons
  Zap, Ghost, Skull, Anchor, Briefcase, Coffee, Music, Gamepad2, 
  BookOpen, Rocket, Flame, Star, Sun, Moon, Cloud, Umbrella, Award, Shield, Sword
} from 'lucide-react';

/**
 * SOCIAL ORBIT
 * A Relativistic Relationship Visualizer
 */

// Mapping string names to actual components for the AI to select
const ICON_MAP = {
  Heart, Zap, Ghost, Skull, Anchor, Briefcase, Coffee, Music, Gamepad2, 
  BookOpen, Rocket, Flame, Star, Sun, Moon, Cloud, Umbrella, Award, Shield, Sword,
  User // Fallback
};

const ICON_KEYS = Object.keys(ICON_MAP).join(', ');

const SYSTEM_PROMPT = `
You are a Relationship Cartographer. Your goal is to analyze a text description of a friendship and plot it on a 2D graph relative to the User (who is at 0,0).

**The Scale (0 to 100):**
* **X-Axis (Emotional Distance):** 0 is a soulmate. 100 is a stranger.
* **Y-Axis (Interaction Gap):** 0 is daily contact. 100 is no contact (years).

**Task:**
Analyze the description. Output **ONLY** a valid JSON object:
{
  "x": (integer 0-100),
  "y": (integer 0-100),
  "icon": (Select ONE string from this list that matches the vibe: [${ICON_KEYS}]),
  "summary": (5-word summary),
  "reasoning": (short sentence explaining score)
}
`;

const BULK_SYSTEM_PROMPT = `
You are a Relationship Cartographer.
Task: Analyze the provided list of friends.
Output **ONLY** a valid JSON ARRAY of objects. Do not include markdown formatting.
The output array must match the order of the input list.
Each object in the array must follow this schema:
{
  "name": "Name from input",
  "gender": "Gender from input",
  "age": "Age from input",
  "description": "Original description",
  "x": (integer 0-100, Emotional Distance),
  "y": (integer 0-100, Interaction Gap),
  "icon": (Select ONE string: [${ICON_KEYS}]),
  "summary": (5-word summary),
  "reasoning": (short sentence)
}
`;

// --- Mock Data Generator ---
const generateMockAnalysis = () => {
  const x = Math.floor(Math.random() * 90);
  const y = Math.floor(Math.random() * 90);
  const icons = Object.keys(ICON_MAP);
  return {
    x,
    y,
    icon: icons[Math.floor(Math.random() * icons.length)],
    summary: "Simulated Analysis (Mock Mode)",
    reasoning: "Random coordinates generated because Mock Mode is active."
  };
};

const COLORS = [
  "#ffffff", "#f87171", "#fb923c", "#fbbf24", "#a3e635", 
  "#34d399", "#22d3ee", "#818cf8", "#c084fc", "#f472b6"
];

// --- Robust JSON Parsing Helpers ---
// Some model responses may include extra commentary after a valid JSON block.
// These helpers attempt to extract the first valid JSON object/array.
function extractFirstJsonObject(raw) {
  if (!raw) throw new Error("Empty AI response");
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  // Attempt direct parse
  try { return JSON.parse(cleaned); } catch (e) { /* swallow to attempt fallback parsing */ }
  let depth = 0; let start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        try { return JSON.parse(candidate); } catch (e) { /* continue scanning */ }
      }
    }
  }
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) {
    const candidate = cleaned.slice(0, lastBrace + 1);
    try { return JSON.parse(candidate); } catch (e) { /* final trim attempt failed */ }
  }
  throw new Error("Failed to parse AI JSON object");
}

function extractFirstJsonArray(raw) {
  if (!raw) throw new Error("Empty AI response");
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { const v = JSON.parse(cleaned); if (Array.isArray(v)) return v; } catch (e) { /* fallback to scan */ }
  let depth = 0; let start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '[') { if (depth === 0) start = i; depth++; }
    else if (ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        try { const v = JSON.parse(candidate); if (Array.isArray(v)) return v; } catch (e) { /* continue scanning */ }
      }
    }
  }
  const lastBracket = cleaned.lastIndexOf(']');
  if (lastBracket !== -1) {
    const candidate = cleaned.slice(0, lastBracket + 1);
    try { const v = JSON.parse(candidate); if (Array.isArray(v)) return v; } catch (e) { /* last attempt failed */ }
  }
  throw new Error("Failed to parse AI JSON array");
}

export default function SocialOrbit() {
  // --- State ---
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('socialOrbit_friends');
    return saved ? JSON.parse(saved) : [];
  });

  const [userPersona, setUserPersona] = useState(() => {
    const saved = localStorage.getItem('socialOrbit_persona');
    return saved ? JSON.parse(saved) : null;
  });

  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('socialOrbit_apiKey') || '';
  });

  const [useMockMode, setUseMockMode] = useState(() => {
    const saved = localStorage.getItem('socialOrbit_mockMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clusterMenu, setClusterMenu] = useState(null); // { items: [], x, y }
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Add Tab State
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [manualMode, setManualMode] = useState(false); // toggle manual add within Single
  const [showGrid, setShowGrid] = useState(true); // dim gray grid
  const [showInsights, setShowInsights] = useState(true); // zone watermark overlays
  
  // Bulk Input State (Structured List)
  const [bulkList, setBulkList] = useState([
    { id: Date.now(), name: '', gender: 'Non-binary', age: '', description: '' }
  ]);

  // Layout State
  const [splitRatio, setSplitRatio] = useState(60); // Percentage width of left panel
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Graph Viewport & Drag State
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const dragInfo = useRef({ 
    isDragging: false, 
    type: null, // 'view' or 'node'
    targetId: null,
    startX: 0, 
    startY: 0,
    hasMoved: false
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('socialOrbit_formData');
    return saved ? JSON.parse(saved) : {
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
  });

  useEffect(() => {
    if (!userPersona) setShowOnboarding(true);
  }, [userPersona]);

  useEffect(() => {
    localStorage.setItem('socialOrbit_friends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('socialOrbit_formData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('socialOrbit_mockMode', JSON.stringify(useMockMode));
  }, [useMockMode]);

  // --- Resizing Logic ---
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setSplitRatio(Math.min(Math.max(newRatio, 20), 80)); // Clamp between 20% and 80%
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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // --- Graph Interaction Handlers (Unified) ---
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(view.scale + scaleAmount, 0.5), 4);
    setView(prev => ({ ...prev, scale: newScale }));
  };

  const handleGraphMouseDown = (e) => {
    // Default to view drag unless stopped by node
    dragInfo.current = {
      isDragging: true,
      type: 'view',
      targetId: null,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    };
    setClusterMenu(null);
  };

  const handleNodeMouseDown = (e, friendId) => {
    e.stopPropagation(); // Stop graph drag
    dragInfo.current = {
      isDragging: true,
      type: 'node',
      targetId: friendId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    };
    setClusterMenu(null);
  };

  const handleMouseMove = (e) => {
    if (!dragInfo.current.isDragging) return;

    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;

    // Threshold to distinguish click vs drag
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragInfo.current.hasMoved = true;
    }

    if (dragInfo.current.type === 'view') {
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    } else if (dragInfo.current.type === 'node' && dragInfo.current.hasMoved) {
      // Convert pixel delta to percentage delta
      if (graphRef.current) {
        const rect = graphRef.current.getBoundingClientRect();
        const percentDx = (dx / view.scale / rect.width) * 100;
        const percentDy = (dy / view.scale / rect.height) * 100;

        setFriends(prev => prev.map(f => {
          if (f.id === dragInfo.current.targetId) {
            return {
              ...f,
              x: Math.min(Math.max(f.x + percentDx, 0), 100),
              y: Math.min(Math.max(f.y + percentDy, 0), 100)
            };
          }
          return f;
        }));
        
        // Update selected friend reference if dragging the selected one
        if (selectedFriend?.id === dragInfo.current.targetId) {
           setSelectedFriend(prev => ({
             ...prev,
             x: Math.min(Math.max(prev.x + percentDx, 0), 100),
             y: Math.min(Math.max(prev.y + percentDy, 0), 100)
           }));
        }
      }
    }

    // Update last pos for next frame
    dragInfo.current.startX = e.clientX;
    dragInfo.current.startY = e.clientY;
  };

  const handleMouseUp = () => {
    const { isDragging, hasMoved, type, targetId } = dragInfo.current;
    
    if (isDragging && !hasMoved && type === 'node') {
      // It was a click on a node
      const clickedFriend = friends.find(f => f.id === targetId);
      if (clickedFriend) handleNodeClick(clickedFriend);
    }

    dragInfo.current.isDragging = false;
  };

  const resetView = () => setView({ x: 0, y: 0, scale: 1 });

  // Stable gradient: percentage stops with slight adaptive outer edge to avoid full black fill
  const gradientStyle = () => {
    // Use farthest-corner so 100% maps exactly to the visible (100,100) diagonal corner.
    // Remove previous dynamic overshoot that pushed black beyond intended relationship space.
    return {
      background: `radial-gradient(farthest-corner at 0 0,
        #ffffff 0%,
        #f8fafc 4%,
        #e2e8f0 8%,
        #c084fc 14%,
        #a855f7 22%,
        #3b82f6 40%,
        #1e3a8a 58%,
        #0f172a 72%,
        #000000 100%)`,
      opacity: 0.9
    };
  };

  // --- Node Click Logic (Cluster Detection) ---
  const handleNodeClick = (clickedFriend) => {
    // Check for overlapping friends (distance threshold ~3%)
    const neighbors = friends.filter(f => {
      const dx = f.x - clickedFriend.x;
      const dy = f.y - clickedFriend.y;
      return Math.sqrt(dx * dx + dy * dy) < 3;
    });

    if (neighbors.length > 1) {
      setClusterMenu({ 
        items: neighbors, 
        x: clickedFriend.x, 
        y: clickedFriend.y 
      });
      setSelectedFriend(null);
    } else {
      setSelectedFriend(clickedFriend);
      setClusterMenu(null);
    }
  };

  // --- Handlers ---
  const handlePersonaSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const persona = {
      introvert: data.get('introvert'),
      values: data.get('values'),
      bio: data.get('bio'),
    };
    setUserPersona(persona);
    localStorage.setItem('socialOrbit_persona', JSON.stringify(persona));
    setShowOnboarding(false);
  };

  const handleApiKeySave = (key) => {
    setApiKey(key);
    localStorage.setItem('socialOrbit_apiKey', key);
    setShowSettings(false);
  };

  const startEdit = (friend) => {
    setActiveTab('single'); // Switch to single mode for editing
    setFormData({
      name: friend.name,
      gender: friend.gender,
      age: friend.age,
      description: friend.description
    });
    setEditingId(friend.id);
    setSelectedFriend(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', gender: 'Non-binary', age: '', description: '', x: 50, y: 50, icon: 'User', summary: '', reasoning: '' });
  };

  const updateFriendIcon = (newIcon) => {
    if (!selectedFriend) return;
    const updated = { ...selectedFriend, icon: newIcon };
    setFriends(friends.map(f => f.id === selectedFriend.id ? updated : f));
    setSelectedFriend(updated);
    setShowIconPicker(false);
  };

  const updateFriendColor = (newColor) => {
    if (!selectedFriend) return;
    const updated = { ...selectedFriend, color: newColor };
    setFriends(friends.map(f => f.id === selectedFriend.id ? updated : f));
    setSelectedFriend(updated);
    setShowColorPicker(false);
  };

  // --- Bulk List Handlers ---
  const addBulkItem = () => {
    setBulkList([...bulkList, { id: Date.now(), name: '', gender: 'Non-binary', age: '', description: '' }]);
  };

  const removeBulkItem = (id) => {
    if (bulkList.length > 1) {
      setBulkList(bulkList.filter(item => item.id !== id));
    } else {
      // If only one item, just reset it instead of removing
      setBulkList([{ id: Date.now(), name: '', gender: 'Non-binary', age: '', description: '' }]);
    }
  };

  const updateBulkItem = (id, field, value) => {
    setBulkList(bulkList.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // --- Analysis Logic ---

  const analyzeAndAddFriend = async () => {
    if (!formData.name || !formData.description) return;
    setLoading(true);

    try {
      let analysis;

      if (useMockMode || !apiKey) {
        await new Promise(r => setTimeout(r, 1000));
        analysis = generateMockAnalysis();
      } else {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href, 
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-haiku",  // "google/gemini-2.0-flash-exp:free",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `My Persona: ${JSON.stringify(userPersona)}\nFriend: ${JSON.stringify(formData)}` }
            ]
          })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("AI returned an empty response. Try again.");

        analysis = extractFirstJsonObject(content);
      }

      if (!ICON_MAP[analysis.icon]) analysis.icon = 'User';

      // Default color if new
      if (!analysis.color) analysis.color = '#ffffff';

      if (editingId) {
        // Find old color to preserve it if not set
        const oldFriend = friends.find(f => f.id === editingId);
        const colorToUse = oldFriend?.color || '#ffffff';
        
        // Replace old friend with new ID to trigger re-render/animation
        setFriends(friends.map(f => f.id === editingId ? { ...f, ...formData, ...analysis, color: colorToUse, id: Date.now() } : f));
        setEditingId(null);
      } else {
        setFriends([...friends, { id: Date.now(), ...formData, ...analysis, color: '#ffffff' }]);
      }

      const emptyForm = { name: '', gender: 'Non-binary', age: '', description: '' };
      setFormData(emptyForm);
      localStorage.setItem('socialOrbit_formData', JSON.stringify(emptyForm));
      
    } catch (error) {
      console.error(error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Manual Add Logic ---
  const addManualFriend = () => {
    if (!formData.name) return;
    const x = Math.min(Math.max(Number(formData.x ?? 0), 0), 100);
    const y = Math.min(Math.max(Number(formData.y ?? 0), 0), 100);
    const icon = ICON_MAP[formData.icon] ? formData.icon : 'User';
    const newFriend = {
      id: Date.now(),
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      description: formData.description || '',
      x,
      y,
      icon,
      summary: formData.summary || 'Manual entry',
      reasoning: formData.reasoning || 'Added without AI',
      color: '#ffffff'
    };
    setFriends([...friends, newFriend]);
    const emptyForm = { name: '', gender: 'Non-binary', age: '', description: '', x: 50, y: 50, icon: 'User', summary: '', reasoning: '' };
    setFormData(emptyForm);
    localStorage.setItem('socialOrbit_formData', JSON.stringify(emptyForm));
  };

  const analyzeBulkFriends = async () => {
    // Filter out empty items
    const validItems = bulkList.filter(item => item.name.trim() && item.description.trim());
    if (validItems.length === 0) return;
    
    setLoading(true);

    try {
      let newFriendsData = [];

      if (useMockMode || !apiKey) {
        await new Promise(r => setTimeout(r, 1500));
        // Generate mock friends for each valid input
        newFriendsData = validItems.map(item => ({
          ...generateMockAnalysis(),
          name: item.name,
          gender: item.gender,
          age: item.age,
          description: item.description
        }));
      } else {
        // Construct structured text prompt from list
        const friendsText = validItems.map((f, i) => 
          `Friend ${i+1}: Name: ${f.name}, Gender: ${f.gender}, Age: ${f.age}. Description: ${f.description}`
        ).join('\n\n');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href, 
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              { role: "system", content: BULK_SYSTEM_PROMPT },
              { role: "user", content: `My Persona: ${JSON.stringify(userPersona)}\n\nFriends List to Analyze:\n${friendsText}` }
            ]
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `API Error: ${response.status}`);
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("AI returned an empty response.");

        newFriendsData = extractFirstJsonArray(content);
      }

      const processedFriends = newFriendsData.map(f => ({
        id: Date.now() + Math.random(), // Unique IDs
        ...f,
        color: '#ffffff', // Default color
        icon: ICON_MAP[f.icon] ? f.icon : 'User' // Validate Icon
      }));

      setFriends([...friends, ...processedFriends]);
      // Reset to a single empty form
      setBulkList([{ id: Date.now(), name: '', gender: 'Non-binary', age: '', description: '' }]);
      
    } catch (error) {
      console.error(error);
      alert(`Bulk Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteFriend = (id) => {
    setFriends(friends.filter(f => f.id !== id));
    setSelectedFriend(null);
  };

  const renderIcon = (iconName, size = 20, color = 'currentColor') => {
    const IconComponent = ICON_MAP[iconName] || User;
    return <IconComponent size={size} fill={color} className="text-slate-900" />;
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-row">
      
      <style>{`
        .modern-scrollbar { scrollbar-width: thin; scrollbar-color: #475569 #1e293b; }
        .modern-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .modern-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
        .modern-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 4px; border: 2px solid #1e293b; }
        .cursor-grab { cursor: grab; }
        .cursor-grabbing { cursor: grabbing; }
      `}</style>

      {/* --- LEFT: Graph Viewport --- */}
      <div 
        className="relative h-screen overflow-hidden bg-slate-950 transition-[width] duration-75 ease-linear"
        style={{ width: isCollapsed ? '100%' : `${splitRatio}%` }}
      >
        <div 
          ref={graphRef}
          className={`absolute inset-0 z-10 cursor-grab active:cursor-grabbing`}
          onWheel={handleWheel}
          onMouseDown={handleGraphMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Transform Layer */}
          <div 
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: 'top left',
              width: '100%',
              height: '100%',
              transition: dragInfo.current.isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className="w-full h-full"
          >
             {/* Background */}
            <div 
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={gradientStyle()}
            />

            {/* Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                {[25,50,75].map(v => (
                  <React.Fragment key={v}>
                    <div style={{ top: `${v}%` }} className="absolute left-0 w-full h-px bg-slate-600/30"></div>
                    <div style={{ left: `${v}%` }} className="absolute top-0 h-full w-px bg-slate-600/30"></div>
                    <div style={{ top: `${v}%`, left: 4 }} className="absolute -translate-y-1 text-[10px] text-slate-500/70 font-mono">{v}</div>
                    <div style={{ left: `${v}%`, top: 4 }} className="absolute -translate-x-1 text-[10px] text-slate-500/70 font-mono">{v}</div>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Insight Zone Overlays */}
            {showInsights && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Inner Circle Zone */}
                <div
                  className="absolute"
                  style={{ left: '0%', top: '0%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="absolute bottom-2 right-2 text-[10px] font-semibold tracking-wide text-black/70">Inner Circle / Family (0-40)</div>
                </div>
                {/* Mid Zone */}
                <div
                  className="absolute"
                  style={{ left: '45%', top: '45%', width: '30%', height: '30%', background: 'rgba(150,100,255,0.30)', border: '1px solid rgba(99,102,241,0.07)' }}
                >
                  <div className="absolute top-2 left-2 text-[10px] font-semibold tracking-wide text-white-500/40">Close → Formal (45-75)</div>
                </div>
                {/* Outer Weak Bonds Zone */}
                <div
                  className="absolute"
                  style={{ left: '80%', top: '80%', width: '20%', height: '20%', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
                >
                  <div className="absolute top-2 left-2 text-[10px] font-semibold tracking-wide text-red-400/80">Weak / Fading (80-100)</div>
                </div>
                {/* Diagonal watermark */}
                <div className="absolute w-[140%] left-0 top-20 rotate-[-25deg] text-center font-bold text-4xl select-none" style={{ opacity: 0.04, transformOrigin: 'left top' }}>
                  <div className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-transparent">RELATIONSHIP GRAVITY FIELD</div>
                </div>
                {/* Dynamic corner markers that scale inversely for readability */}
                <div
                  className="absolute text-[10px] font-semibold text-white/40 select-none"
                  style={{ left: '0%', top: '0%', transform: `translate(4px,4px) scale(${1 / view.scale})`, transformOrigin: 'top left' }}
                >0,0</div>
                <div
                  className="absolute text-[10px] font-semibold text-white/40 select-none"
                  style={{ left: '100%', top: '100%', transform: `translate(-100%,-100%) translate(-4px,-4px) scale(${1 / view.scale})`, transformOrigin: 'bottom right' }}
                >100,100</div>
              </div>
            )}
            
            {/* Friends Nodes */}
            <div className="absolute top-0 left-0 w-full h-full border-l-2 border-t-2 border-white/50 origin-top-left p-12">
               {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute"
                    style={{ left: `${friend.x}%`, top: `${friend.y}%`, zIndex: selectedFriend?.id === friend.id ? 50 : 10 }}
                  >
                    <button
                      onMouseDown={(e) => handleNodeMouseDown(e, friend.id)}
                      className={`group relative transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${selectedFriend?.id === friend.id ? 'scale-125' : 'hover:scale-110'}`}
                    >
                      <div 
                        className={`p-2 rounded-full shadow-lg border-2 backdrop-blur-md flex items-center justify-center transition-colors ${
                          selectedFriend?.id === friend.id 
                            ? 'bg-white border-white' 
                            : 'bg-black/40 border-white/20 hover:bg-black/60'
                        }`}
                        style={{ color: friend.color || '#fff' }}
                      >
                         {renderIcon(friend.icon, 20, friend.color || '#fff')}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-black/50 rounded text-[10px] font-medium text-white whitespace-nowrap backdrop-blur-sm pointer-events-none">
                        {friend.name}
                      </div>
                    </button>
                  </motion.div>
                ))}

                {/* Cluster Menu */}
                {clusterMenu && (
                  <div 
                    className="absolute z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 min-w-[150px] flex flex-col gap-1"
                    style={{ 
                      left: `${clusterMenu.x}%`, 
                      top: `${clusterMenu.y}%`,
                      transform: `translate(10px, -50%) scale(${1/view.scale})` 
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] uppercase text-slate-500 font-bold px-2 py-1">Select Friend</div>
                    {clusterMenu.items.map(item => (
                      <button
                        key={item.id}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedFriend(item); 
                          setClusterMenu(null);
                        }}
                        className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded text-left text-xs text-white"
                      >
                         {renderIcon(item.icon, 14, item.color)}
                         {item.name}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* HUD Controls (simplified: direct toggles) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
           <button onClick={() => setView(v => ({ ...v, scale: Math.min(v.scale + 0.5, 4) }))} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 backdrop-blur"><ZoomIn size={20}/></button>
           <button onClick={() => setView(v => ({ ...v, scale: Math.max(v.scale - 0.5, 0.5) }))} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 backdrop-blur"><ZoomOut size={20}/></button>
           <button onClick={resetView} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 backdrop-blur" title="Reset View"><Move size={20}/></button>
           <button
             onClick={() => setShowGrid(g => !g)}
             title="Toggle Grid"
             className={`p-2 rounded-full text-white backdrop-blur transition-colors ${showGrid ? 'bg-purple-600' : 'bg-slate-800/80 hover:bg-slate-700'}`}
           >
             <Grid size={18}/>
           </button>
           {/* Direct Insight Zones Toggle (restored simpler variant) */}
           <button
             onClick={() => setShowInsights(v => !v)}
             title="Toggle Insight Zones"
             className={`p-2 rounded-full text-white backdrop-blur transition-colors ${showInsights ? 'bg-purple-600' : 'bg-slate-800/80 hover:bg-slate-700'}`}
           >
             <Info size={18}/>
           </button>
        </div>

        {/* Removed static Stranger label; now dynamically rendered within transform layer */}
        <div className="absolute top-4 left-4 z-10 pointer-events-auto">
           <button 
             onClick={() => setShowOnboarding(true)}
             className="bg-white/90 hover:bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
             title="Edit My Persona"
           >
             <User size={16}/>
             ME <span className="text-xs text-slate-500"> (0,0)</span>
           </button>
        </div>
      </div>

      {/* --- RESIZER --- */}
      <div 
        className="w-2 bg-slate-900 border-l border-r border-slate-800 cursor-col-resize hover:bg-purple-500/20 transition-colors flex items-center justify-center relative z-30"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute bg-slate-800 rounded-full p-1 cursor-pointer hover:bg-purple-500 hover:text-white text-slate-400 z-40" onClick={toggleCollapse}>
          {isCollapsed ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </div>
        <GripVertical size={14} className="text-slate-600"/>
      </div>

      {/* --- RIGHT: Control Panel --- */}
      {!isCollapsed && (
      <div 
        className="bg-slate-900 border-l border-slate-800 flex flex-col h-screen z-20 shadow-2xl overflow-hidden"
        style={{ width: `${100 - splitRatio}%` }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex justify-between items-start mb-4">
             <div>
               <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Social Orbit</h1>
               <p className="text-slate-500 text-xs mt-1">Relationship Cartographer</p>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setShowOnboarding(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><User size={20} /></button>
               <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><Settings size={20} /></button>
             </div>
          </div>
          
          {(!apiKey && !useMockMode) && (
            <div onClick={() => setShowSettings(true)} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 cursor-pointer hover:bg-yellow-500/20 transition-colors group">
              <div className="flex items-center gap-2 text-yellow-500 text-sm font-semibold mb-1"><AlertTriangle size={16}/> API Key Missing</div>
              <p className="text-xs text-yellow-200/70">Click to add API Key or enable Mock Mode.</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 modern-scrollbar">
          {selectedFriend ? (
            // DETAIL VIEW
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors group relative"
                        title="Change Icon"
                      >
                        {renderIcon(selectedFriend.icon, 32, selectedFriend.color)}
                        <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-1 border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit size={10} className="text-white"/>
                        </div>
                      </button>
                      <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1.5 bg-slate-900 rounded-lg border border-slate-700 hover:border-purple-500/50 flex justify-center items-center"
                        title="Change Color"
                      >
                        <Palette size={14} style={{ color: selectedFriend.color || '#fff' }}/>
                      </button>
                    </div>
                    
                    {/* Icon Picker Popover */}
                    {showIconPicker && (
                      <div className="absolute top-0 left-full ml-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 grid grid-cols-5 gap-2 max-h-48 overflow-y-auto modern-scrollbar">
                        {ICON_KEYS.split(', ').map(iconKey => (
                          <button
                            key={iconKey}
                            onClick={() => updateFriendIcon(iconKey)}
                            className={`p-2 rounded hover:bg-slate-800 flex items-center justify-center ${selectedFriend.icon === iconKey ? 'bg-purple-500/20' : ''}`}
                          >
                            {renderIcon(iconKey, 16, selectedFriend.color)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Color Picker Popover */}
                    {showColorPicker && (
                      <div className="absolute top-12 left-full ml-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 grid grid-cols-5 gap-2">
                        {COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateFriendColor(color)}
                            className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedFriend.name}</h2>
                    <p className="text-sm text-slate-400">{selectedFriend.gender}, {selectedFriend.age}yo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => startEdit(selectedFriend)} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"><Edit size={18} /></button>
                   <button onClick={() => setSelectedFriend(null)} className="p-2 text-slate-500 hover:text-white rounded-full transition-colors"><X size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 relative">
                <div 
                  className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 relative group cursor-help"
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Emotion</div>
                    <Info size={12} className="text-slate-600"/>
                  </div>
                  <div className="text-xl font-mono text-purple-400">{Math.round(selectedFriend.x)}<span className="text-xs text-slate-600">/100</span></div>
                </div>
                <div 
                  className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 relative group cursor-help"
                  onMouseEnter={() => setShowInfo(true)}
                  onMouseLeave={() => setShowInfo(false)}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time Gap</div>
                    <Info size={12} className="text-slate-600"/>
                  </div>
                  <div className="text-xl font-mono text-blue-400">{Math.round(selectedFriend.y)}<span className="text-xs text-slate-600">/100</span></div>
                </div>

                {/* Info Tooltip Overlay */}
                {showInfo && (
                  <div className="absolute top-full left-0 w-full mt-2 z-50 p-3 bg-black/90 backdrop-blur border border-slate-700 rounded-lg text-xs text-slate-300 shadow-xl">
                    <p className="mb-1"><span className="text-purple-400 font-bold">Emotion (X):</span> 0 = Soulmate, 100 = Stranger.</p>
                    <p><span className="text-blue-400 font-bold">Time (Y):</span> 0 = Daily Contact, 100 = No Contact.</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2"><Sparkles size={14} className="text-yellow-500"/> AI Summary</h3>
                  <p className="text-slate-300 italic text-sm border-l-2 border-yellow-500/50 pl-3">"{selectedFriend.summary}"</p>
                </div>
                <div>
                   <h3 className="text-sm font-semibold text-slate-300 mb-1">Reasoning</h3>
                   <p className="text-xs text-slate-400">{selectedFriend.reasoning}</p>
                </div>
                <details className="group bg-slate-900/30 rounded-lg border border-slate-700/50 open:bg-slate-900/50 transition-all duration-200">
                  <summary className="flex items-center justify-between p-3 cursor-pointer select-none text-sm font-semibold text-slate-300">
                    <div className="flex items-center gap-2"><MessageCircle size={14} className="text-purple-400"/> Original Input</div>
                    <div className="text-slate-500 group-open:rotate-180 transition-transform"><ChevronDown size={16} /></div>
                  </summary>
                  <div className="px-3 pb-3 pt-0">
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto modern-scrollbar">{selectedFriend.description}</p>
                  </div>
                </details>
                <div className="pt-4 border-t border-slate-700">
                  <button onClick={() => deleteFriend(selectedFriend.id)} className="w-full py-2 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 text-sm transition-colors"><Trash2 size={16} /> Remove from Orbit</button>
                </div>
              </div>
            </motion.div>
          ) : (
            // ADD FRIEND FORM (CONTAINER)
            <div className="space-y-6">
              {/* --- TABS --- */}
              <div className="flex border-b border-slate-700 mb-4">
                <button 
                  onClick={() => setActiveTab('single')} 
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'single' ? 'text-purple-400 border-purple-500 bg-slate-800/30' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/20'}`}
                >
                  <UserPlus size={16}/> Single Add
                </button>
                <button 
                  onClick={() => setActiveTab('bulk')} 
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'bulk' ? 'text-purple-400 border-purple-500 bg-slate-800/30' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/20'}`}
                >
                  <Layers size={16}/> Bulk Import
                </button>
              </div>

              {activeTab === 'single' ? (
                // --- SINGLE ADD MODE ---
                <div className="space-y-6">
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 flex justify-between items-center">
                     <div>
                        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                          {editingId ? <Edit size={18} className="text-purple-400"/> : <Plus size={18} className="text-purple-400"/>}
                          {editingId ? "Recalculate Orbit" : "Add to Orbit"}
                        </h2>
                        <p className="text-slate-500 text-xs">{editingId ? "Update details and re-analyze." : "Describe your dynamic."}</p>
                     </div>
                     <div className="flex items-center gap-3">
                       <button onClick={() => setManualMode(!manualMode)} className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800">
                         {manualMode ? 'Manual Mode: On' : 'Manual Mode: Off'}
                       </button>
                       {editingId && <button onClick={cancelEdit} className="text-xs text-red-400 hover:text-red-300 hover:underline">Cancel</button>}
                     </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Sarah"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                        <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none">
                          <option>Male</option><option>Female</option><option>Non-binary</option><option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Age</label>
                        <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="25"/>
                      </div>
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-slate-400 mb-1">Relationship Context</label>
                       <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} maxLength={1500} rows={6} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none modern-scrollbar" placeholder="How did you meet? How often do you talk? Do you share secrets or just memes? Be honest..."/>
                    </div>
                    {manualMode && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">X (0-100) Emotion</label>
                          <input type="number" min={0} max={100} value={formData.x} onChange={(e) => setFormData({...formData, x: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Y (0-100) Time Gap</label>
                          <input type="number" min={0} max={100} value={formData.y} onChange={(e) => setFormData({...formData, y: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Icon</label>
                          <select value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none">
                            {ICON_KEYS.split(', ').map(key => (<option key={key} value={key}>{key}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Summary (optional)</label>
                          <input type="text" value={formData.summary} onChange={(e) => setFormData({...formData, summary: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-400 mb-1">Reasoning (optional)</label>
                          <input type="text" value={formData.reasoning} onChange={(e) => setFormData({...formData, reasoning: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                        </div>
                      </div>
                    )}
                    {!manualMode ? (
                      <button onClick={analyzeAndAddFriend} disabled={loading || !formData.name || !formData.description} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:scale-[1.02]'}`}>
                        {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Calculating...</> : <><Sparkles size={18} /> {editingId ? "Update & Recalculate" : "Analyze & Plot"}</>}
                      </button>
                    ) : (
                      <button onClick={addManualFriend} disabled={!formData.name} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500`}>
                        <Plus size={18} /> Add Without AI
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // --- BULK ADD MODE (Structured List) ---
                <div className="space-y-6">
                  <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                     <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                       <Layers size={18} className="text-purple-400"/> Bulk Import
                     </h2>
                     <p className="text-slate-500 text-xs">Add multiple friends at once to save time.</p>
                  </div>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto modern-scrollbar pr-2">
                    {bulkList.map((item, index) => (
                      <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 relative group">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-semibold text-slate-400">Friend #{index + 1}</h3>
                          {bulkList.length > 1 && (
                            <button 
                              onClick={() => removeBulkItem(item.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={16}/>
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="Name" 
                              value={item.name}
                              onChange={(e) => updateBulkItem(item.id, 'name', e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                            />
                            <select 
                              value={item.gender}
                              onChange={(e) => updateBulkItem(item.id, 'gender', e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none w-24"
                            >
                              <option>Male</option><option>Female</option><option>NB</option><option>Other</option>
                            </select>
                            <input 
                              type="number" 
                              placeholder="Age" 
                              value={item.age}
                              onChange={(e) => updateBulkItem(item.id, 'age', e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none w-16"
                            />
                          </div>
                          <textarea 
                            placeholder="Description..." 
                            value={item.description}
                            onChange={(e) => updateBulkItem(item.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={addBulkItem}
                      className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16}/> Add Another
                    </button>
                    <button 
                      onClick={analyzeBulkFriends} 
                      disabled={loading || bulkList.every(i => !i.name || !i.description)} 
                      className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:scale-[1.02]'}`}
                    >
                      {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</> : <><Sparkles size={18} /> Process All</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* --- MODALS (Settings/Onboarding) --- */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-purple-400" /> Settings</h2><button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X /></button></div>
                <div className="space-y-4">
                  {/* Mock Mode Toggle */}
                  <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${useMockMode ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                        <Sparkles size={18}/>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Use Mock Mode</div>
                        <div className="text-xs text-slate-400">Generate random data without API</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setUseMockMode(!useMockMode)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${useMockMode ? 'bg-purple-600' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${useMockMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div><label className="block text-sm font-medium text-slate-300 mb-2">OpenRouter API Key</label><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-..." className={`w-full bg-slate-950 border rounded-lg p-3 text-white focus:border-purple-500 outline-none ${useMockMode ? 'border-slate-800 text-slate-600 cursor-not-allowed' : 'border-slate-700'}`} disabled={useMockMode}/></div>
                  <div className="bg-slate-800/50 p-3 rounded text-xs text-slate-400 space-y-2"><p className="flex gap-2 items-center"><KeyIcon size={14}/> 1. Go to <b>openrouter.ai</b> and sign up.</p><p className="flex gap-2 items-center"><Plus size={14}/> 2. Create a <b>Free API Key</b>.</p><p className="flex gap-2 items-center"><Save size={14}/> 3. Paste it here and click Save.</p></div>
                  <button onClick={() => handleApiKeySave(apiKey)} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium">Save Settings</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Define Coordinates (0,0)</h2>
                  <p className="text-slate-400 text-sm mt-1">To understand your friends, we first need to understand <b>YOU</b>.</p>
                </div>
                {/* Close button only visible if user data exists (Edit Mode) */}
                {userPersona && (
                  <button onClick={() => setShowOnboarding(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                )}
              </div>
              <div className="p-6 overflow-y-auto modern-scrollbar">
                <form id="personaForm" onSubmit={handlePersonaSubmit} className="space-y-6">
                  <div><label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2"><User size={16}/> Are you Introverted or Extroverted?</label><select name="introvert" defaultValue={userPersona?.introvert || "Ambivert"} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"><option>Very Introverted (I need lots of alone time)</option><option>Introverted</option><option>Ambivert</option><option>Extroverted</option><option>Very Extroverted</option></select></div>
                  <div><label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2"><Heart size={16}/> What do you value most in friends?</label><input name="values" defaultValue={userPersona?.values || ""} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" required /></div>
                  <div><label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-2"><MessageCircle size={16}/> Anything else about you?</label><textarea name="bio" defaultValue={userPersona?.bio || ""} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white modern-scrollbar" required /></div>
                </form>
              </div>
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl"><button type="submit" form="personaForm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl font-bold shadow-lg transform transition hover:scale-[1.02]">Calibrate My Center (0,0)</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}