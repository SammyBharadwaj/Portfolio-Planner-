import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Send, Check, Plus, ExternalLink, Link2, Sparkles, Briefcase, ChevronLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PortfolioData, Highlight } from "../App";

interface PortfolioDrawerProps {
  onClose: () => void;
  selectedText: string;
  onClearSelection: () => void;
  portfolioData: PortfolioData;
  onJobDescriptionChange: (hasJob: boolean) => void;
  highlights: Highlight[];
  selectedRole: string;
  onRoleChange: (role: string) => void;
  onHoverSuggestion: (id: number | null) => void;
  completedSuggestions: number[];
  onToggleComplete: (ids: number[]) => void;
  dismissedSuggestions: number[];
  onDismissSuggestion: (ids: number[]) => void;
  currentRewriteIndex: { [key: number]: number };
  onRewriteIndexChange: (indices: { [key: number]: number }) => void;
  onAcceptRewrite: (highlightId: number, rewriteText: string, originalText: string) => void;
}

interface Scores {
  impact: number;
  positioning: number;
  completeness: number;
}

const ROLE_OPTIONS = [
  "College Grad",
  "Junior Designer",
  "Mid-Level",
  "Senior",
  "Manager",
  "Leader"
];

export function PortfolioDrawer({ 
  onClose, 
  selectedText, 
  onClearSelection, 
  portfolioData, 
  onJobDescriptionChange,
  highlights,
  selectedRole,
  onRoleChange,
  onHoverSuggestion,
  completedSuggestions,
  onToggleComplete,
  dismissedSuggestions,
  onDismissSuggestion,
  currentRewriteIndex,
  onRewriteIndexChange,
  onAcceptRewrite
}: PortfolioDrawerProps) {
  const [isContentStructureOpen, setIsContentStructureOpen] = useState(false);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isJobDescriptionOpen, setIsJobDescriptionOpen] = useState(false);
  
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', text: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasJobDescription, setHasJobDescription] = useState(false);
  
  // Base scores that vary by role
  const getRoleBaseScores = (role: string): Scores => {
    switch(role) {
      case "College Grad":
        return { impact: 35, positioning: 25, completeness: 40 };
      case "Junior Designer":
        return { impact: 45, positioning: 30, completeness: 50 };
      case "Mid-Level":
        return { impact: 55, positioning: 35, completeness: 58 };
      case "Senior":
        return { impact: 62, positioning: 38, completeness: 55 };
      case "Manager":
        return { impact: 70, positioning: 55, completeness: 68 };
      case "Leader":
        return { impact: 75, positioning: 65, completeness: 72 };
      default:
        return { impact: 62, positioning: 38, completeness: 55 };
    }
  };

  // Get role-specific improvement tips for Impact
  const getImpactTips = (role: string) => {
    const isJuniorLevel = ["College Grad", "Junior Designer"].includes(role);
    const isLeaderLevel = ["Manager", "Leader"].includes(role);

    if (isJuniorLevel) {
      return [
        "Describe what you learned and how you contributed",
        "Include user feedback or positive outcomes",
        "Show your design process and thinking",
        "Mention tools and methods you used effectively"
      ];
    } else if (isLeaderLevel) {
      return [
        "Add specific ROI metrics (e.g., 'increased revenue by $2M')",
        "Describe business outcomes and strategic impact",
        "Include stakeholder testimonials and executive buy-in",
        "Show how your decisions influenced company direction"
      ];
    } else {
      return [
        "Add specific metrics (e.g., 'increased engagement by 45%')",
        "Describe business outcomes and user impact",
        "Include user feedback and validation data",
        "Show before/after comparisons with measurable results"
      ];
    }
  };

  // Get role-specific improvement tips for Positioning
  const getPositioningTips = (role: string) => {
    const isJuniorLevel = ["College Grad", "Junior Designer"].includes(role);
    const isLeaderLevel = ["Manager", "Leader"].includes(role);

    if (isJuniorLevel) {
      return [
        "Highlight your eagerness to learn and grow",
        "Showcase your design fundamentals and process",
        "Mention relevant coursework or certifications",
        "Emphasize collaboration and adaptability"
      ];
    } else if (isLeaderLevel) {
      return [
        "Articulate your strategic vision and design philosophy",
        "Highlight team building and mentorship experience",
        "Showcase thought leadership (talks, articles, patents)",
        "Demonstrate influence on organizational design culture"
      ];
    } else {
      return [
        "Clarify your unique value proposition and specialty",
        "Highlight specialized skills and domain expertise",
        "Define your target industry or niche clearly",
        "Showcase awards, recognition, and peer validation"
      ];
    }
  };

  // Job-specific scores (higher when tailored)
  const jobScores: Scores = {
    impact: 78,
    positioning: 65,
    completeness: 72
  };

  const [currentScores, setCurrentScores] = useState<Scores>(getRoleBaseScores(selectedRole));

  // Update scores when role changes
  useEffect(() => {
    if (!hasJobDescription) {
      const targetScores = getRoleBaseScores(selectedRole);
      setCurrentScores(targetScores);
    }
  }, [selectedRole, hasJobDescription]);

  // Animate score transitions
  useEffect(() => {
    const targetScores = hasJobDescription ? jobScores : getRoleBaseScores(selectedRole);
    
    const animateScores = () => {
      setCurrentScores(prev => ({
        impact: Math.round(prev.impact + (targetScores.impact - prev.impact) * 0.1),
        positioning: Math.round(prev.positioning + (targetScores.positioning - prev.positioning) * 0.1),
        completeness: Math.round(prev.completeness + (targetScores.completeness - prev.completeness) * 0.1)
      }));
    };

    const interval = setInterval(animateScores, 50);
    
    setTimeout(() => {
      clearInterval(interval);
      setCurrentScores(targetScores);
    }, 500);

    return () => clearInterval(interval);
  }, [hasJobDescription, selectedRole]);

  const handlePanelClick = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const context = hasJobDescription 
        ? "Based on the job description analysis and your portfolio" 
        : `Based on your portfolio for a ${selectedRole} role`;
      
      setChatMessages([...chatMessages, 
        { role: 'user', text: chatInput },
        { role: 'ai', text: `${context}, I'd recommend focusing on quantifiable results and specific outcomes from your projects. ${hasJobDescription ? 'The role particularly values data-driven design decisions.' : ''}` }
      ]);
      setChatInput("");
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    onClearSelection();
    setChatMessages([...chatMessages, 
      { role: 'ai', text: `Applied suggestion: "${suggestion}" to your selected text.` }
    ]);
  };

  const handleAnalyzeJobDescription = () => {
    if (jobDescriptionUrl.trim()) {
      setIsAnalyzing(true);
      // Simulate analysis
      setTimeout(() => {
        setHasJobDescription(true);
        onJobDescriptionChange(true);
        setIsAnalyzing(false);
        setChatMessages([
          { role: 'ai', text: `I've analyzed the job description and compared it to your portfolio. Here's what I found:\n\n✓ The role emphasizes cross-functional collaboration and data-driven design decisions\n✓ Your portfolio shows strong design systems experience\n✗ Consider adding more quantitative results (e.g., "increased user engagement by 45%")\n✗ Highlight team collaboration stories more prominently\n\nYour scores have been updated to reflect alignment with this specific role.` }
        ]);
      }, 1500);
    } else {
      setHasJobDescription(false);
      onJobDescriptionChange(false);
      setChatMessages([]);
    }
  };

  const handleClearJobDescription = () => {
    setJobDescriptionUrl("");
    setHasJobDescription(false);
    onJobDescriptionChange(false);
    setChatMessages([]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'from-emerald-500/70 to-emerald-400/60';
    if (score >= 60) return 'from-yellow-400 to-yellow-300';
    return 'from-orange-400 to-orange-300';
  };

  const getTargetScore = () => {
    switch(selectedRole) {
      case "College Grad": return 65;
      case "Junior Designer": return 70;
      case "Mid-Level": return 75;
      case "Senior": return 85;
      case "Manager": return 88;
      case "Leader": return 90;
      default: return 85;
    }
  };

  const weakHighlights = highlights.filter(h => h.type === 'weak');

  const handleToggleComplete = (id: number) => {
    if (completedSuggestions.includes(id)) {
      onToggleComplete(completedSuggestions.filter(i => i !== id));
    } else {
      onToggleComplete([...completedSuggestions, id]);
    }
  };

  const handleDismiss = (id: number) => {
    onDismissSuggestion([...dismissedSuggestions, id]);
  };

  const handleNextRewrite = (highlightId: number, totalRewrites: number) => {
    const current = currentRewriteIndex[highlightId] || 0;
    const next = (current + 1) % totalRewrites;
    onRewriteIndexChange({ ...currentRewriteIndex, [highlightId]: next });
  };

  const handlePrevRewrite = (highlightId: number, totalRewrites: number) => {
    const current = currentRewriteIndex[highlightId] || 0;
    const prev = current === 0 ? totalRewrites - 1 : current - 1;
    onRewriteIndexChange({ ...currentRewriteIndex, [highlightId]: prev });
  };

  const getCurrentRewrite = (highlight: Highlight): string | null => {
    if (!highlight.rewrites || highlight.rewrites.length === 0) return null;
    const index = currentRewriteIndex[highlight.id] || 0;
    return highlight.rewrites[index];
  };

  // Get motivational summary based on role
  const getMotivationalSummary = (type: 'impact' | 'positioning' | 'completeness', role: string) => {
    const isJuniorLevel = ["College Grad", "Junior Designer"].includes(role);
    const isLeaderLevel = ["Manager", "Leader"].includes(role);

    if (type === 'impact') {
      if (isJuniorLevel) {
        return {
          summary: "Show what you've learned and the value you bring through your contributions and growth.",
          quote: "\"Every project is a learning opportunity - showcase your journey and curiosity.\""
        };
      } else if (isLeaderLevel) {
        return {
          summary: "Demonstrate strategic thinking and business outcomes that moved the needle for the organization.",
          quote: "\"Great leaders translate design decisions into business value and measurable results.\""
        };
      }
      return {
        summary: "Quantify your impact with metrics that prove your designs made a real difference.",
        quote: "\"Numbers tell the story - let your results speak louder than your job title.\""
      };
    } else if (type === 'positioning') {
      if (isJuniorLevel) {
        return {
          summary: "Highlight your foundation, eagerness to learn, and collaborative spirit.",
          quote: "\"Your potential and passion matter more than years of experience.\""
        };
      } else if (isLeaderLevel) {
        return {
          summary: "Articulate your vision, philosophy, and how you elevate teams and organizational culture.",
          quote: "\"Leadership is about influence, not authority - show how you've shaped the future.\""
        };
      }
      return {
        summary: "Define your unique value and the specialized expertise that sets you apart.",
        quote: "\"Be so good they can't ignore you - own your niche with confidence.\""
      };
    } else {
      return {
        summary: "Tell the full story with rich case studies, process details, and comprehensive documentation.",
        quote: "\"A complete portfolio answers questions before they're asked.\""
      };
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] z-50 p-4">
      {/* Darker Liquid Glass container */}
      <div 
        className="h-full backdrop-blur-3xl shadow-2xl border border-white/20 rounded-[32px] overflow-hidden"
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-7 py-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white text-[28px] leading-tight tracking-tight" style={{ fontWeight: 600 }}>
                Portfolio AI Assistant
              </h1>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-sm active:scale-95"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Role Selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-white/70" />
                <label className="text-white/70 text-sm">Target Role Level</label>
              </div>
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 text-white border border-white/20 rounded-[14px] focus:outline-none focus:border-white/40 transition-all text-sm backdrop-blur-xl hover:bg-black/50 cursor-pointer"
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role} value={role} className="bg-black text-white">
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-7 space-y-6">
              {/* Job Description Analysis Section - Collapsed by default */}
              <Collapsible open={isJobDescriptionOpen} onOpenChange={setIsJobDescriptionOpen}>
                <div className="bg-black/40 backdrop-blur-xl rounded-[20px] border border-white/20 overflow-hidden" style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}>
                  <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-white/90" />
                      <span className="text-white">Job Description</span>
                      {hasJobDescription && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      )}
                    </div>
                    {isJobDescriptionOpen ? (
                      <ChevronDown className="w-5 h-5 text-white/80" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/80" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 py-4 border-t border-white/10 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={jobDescriptionUrl}
                          onChange={(e) => setJobDescriptionUrl(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeJobDescription()}
                          placeholder="Paste job description URL..."
                          className="flex-1 px-4 py-3 bg-white/10 text-white placeholder:text-white/40 border border-white/20 rounded-[14px] focus:outline-none focus:border-white/40 transition-all text-sm backdrop-blur-xl hover:bg-white/15"
                        />
                        {jobDescriptionUrl && !hasJobDescription && (
                          <button
                            onClick={handleAnalyzeJobDescription}
                            disabled={isAnalyzing}
                            className="px-5 py-3 bg-white hover:bg-white/90 text-black rounded-[14px] transition-all flex items-center gap-2 text-sm disabled:opacity-50 shadow-lg active:scale-95"
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Analyzing
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Analyze
                              </>
                            )}
                          </button>
                        )}
                        {hasJobDescription && (
                          <button
                            onClick={handleClearJobDescription}
                            className="px-5 py-3 bg-white/15 hover:bg-white/25 text-white rounded-[14px] transition-all text-sm backdrop-blur-xl active:scale-95"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      
                      {/* Analysis Mode Indicator */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${hasJobDescription ? 'bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/30'} transition-all`} />
                        <span className="text-white/60">
                          {hasJobDescription 
                            ? 'Analyzing against job description' 
                            : `Using general AI for ${selectedRole} role`}
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Numbered Feedback Cards */}
              {weakHighlights.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-white text-lg">AI Suggestions</h2>
                  {weakHighlights.map(highlight => {
                    const currentRewrite = getCurrentRewrite(highlight);
                    const rewriteIdx = currentRewriteIndex[highlight.id] || 0;
                    const totalRewrites = highlight.rewrites?.length || 0;
                    const isCompleted = completedSuggestions.includes(highlight.id);

                    return (
                      <div 
                        key={highlight.id}
                        className="bg-black/40 backdrop-blur-xl rounded-[18px] p-5 border border-red-400/30 hover:border-red-400/50 hover:bg-black/50 transition-all relative group"
                        style={{
                          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                        data-suggestion-id={highlight.id}
                        onMouseEnter={() => onHoverSuggestion(highlight.id)}
                        onMouseLeave={() => onHoverSuggestion(null)}
                      >
                        {/* Close button */}
                        <button
                          onClick={() => handleDismiss(highlight.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleComplete(highlight.id)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-emerald-600/80 border-emerald-600/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                : 'border-white/40 hover:border-white/60'
                            }`}>
                              {isCompleted && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>

                          {/* Number badge */}
                          <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-lg">
                            {highlight.id}
                          </div>
                          
                          <div className="flex-1">
                            <p className={`text-white/90 text-sm mb-2 transition-all ${isCompleted ? 'line-through opacity-60' : ''}`}>
                              <span className="text-red-300">"{highlight.text}"</span>
                            </p>
                            <p className={`text-white/70 text-sm mb-3 transition-all ${isCompleted ? 'opacity-60' : ''}`}>
                              {highlight.suggestion}
                            </p>

                            {/* Rewrites Section */}
                            {currentRewrite && totalRewrites > 0 && !isCompleted && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                {/* Navigation header */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white/50 text-xs">Suggested rewrite:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white/50 text-xs">
                                      {rewriteIdx + 1} of {totalRewrites}
                                    </span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handlePrevRewrite(highlight.id, totalRewrites)}
                                        className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5 text-white" />
                                      </button>
                                      <button
                                        onClick={() => handleNextRewrite(highlight.id, totalRewrites)}
                                        className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Rewrite text */}
                                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3 mb-2">
                                  <p className="text-emerald-200/90 text-sm leading-relaxed">
                                    "{currentRewrite}"
                                  </p>
                                </div>

                                {/* Accept button */}
                                <button
                                  onClick={() => onAcceptRewrite(highlight.id, currentRewrite, highlight.text)}
                                  className="w-full px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600/90 text-white rounded-lg transition-all text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
                                >
                                  <Check className="w-4 h-4" />
                                  Accept Change
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Portfolio Effectiveness Section */}
              <div className="space-y-4">
                <h2 className="text-white text-lg">Portfolio Effectiveness</h2>
                
                {/* Progress bars with darker liquid glass containers */}
                <div className="space-y-3">
                  {/* Impact */}
                  <button 
                    onClick={() => handlePanelClick('impact')}
                    className="w-full bg-black/40 backdrop-blur-xl rounded-[20px] p-5 border border-white/20 hover:bg-black/50 transition-all text-left active:scale-[0.98]"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white text-sm">Impact</span>
                      <span className={`text-sm transition-all ${hasJobDescription && currentScores.impact > getRoleBaseScores(selectedRole).impact ? 'text-emerald-400/80' : 'text-white/80'}`}>
                        {currentScores.impact}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${getScoreColor(currentScores.impact)} rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]`}
                        style={{ width: `${currentScores.impact}%` }}
                      />
                    </div>
                    {expandedPanel === 'impact' && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <p className="text-white/90 text-sm leading-relaxed">
                          {getMotivationalSummary('impact', selectedRole).summary}
                        </p>
                        <p className="text-white/60 text-sm italic leading-relaxed pl-4 border-l-2 border-white/20">
                          {getMotivationalSummary('impact', selectedRole).quote}
                        </p>
                      </div>
                    )}
                  </button>

                  {/* Positioning */}
                  <button 
                    onClick={() => handlePanelClick('positioning')}
                    className="w-full bg-black/40 backdrop-blur-xl rounded-[20px] p-5 border border-white/20 hover:bg-black/50 transition-all text-left active:scale-[0.98]"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white text-sm">Positioning</span>
                      <span className={`text-sm transition-all ${hasJobDescription && currentScores.positioning > getRoleBaseScores(selectedRole).positioning ? 'text-emerald-400/80' : 'text-white/80'}`}>
                        {currentScores.positioning}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${getScoreColor(currentScores.positioning)} rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]`}
                        style={{ width: `${currentScores.positioning}%` }}
                      />
                    </div>
                    {expandedPanel === 'positioning' && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <p className="text-white/90 text-sm leading-relaxed">
                          {getMotivationalSummary('positioning', selectedRole).summary}
                        </p>
                        <p className="text-white/60 text-sm italic leading-relaxed pl-4 border-l-2 border-white/20">
                          {getMotivationalSummary('positioning', selectedRole).quote}
                        </p>
                      </div>
                    )}
                  </button>

                  {/* Completeness */}
                  <button 
                    onClick={() => handlePanelClick('completeness')}
                    className="w-full bg-black/40 backdrop-blur-xl rounded-[20px] p-5 border border-white/20 hover:bg-black/50 transition-all text-left active:scale-[0.98]"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white text-sm">Completeness</span>
                      <span className={`text-sm transition-all ${hasJobDescription && currentScores.completeness > getRoleBaseScores(selectedRole).completeness ? 'text-emerald-400/80' : 'text-white/80'}`}>
                        {currentScores.completeness}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${getScoreColor(currentScores.completeness)} rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(255,255,255,0.3)]`}
                        style={{ width: `${currentScores.completeness}%` }}
                      />
                    </div>
                    {expandedPanel === 'completeness' && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <p className="text-white/90 text-sm leading-relaxed">
                          {getMotivationalSummary('completeness', selectedRole).summary}
                        </p>
                        <p className="text-white/60 text-sm italic leading-relaxed pl-4 border-l-2 border-white/20">
                          {getMotivationalSummary('completeness', selectedRole).quote}
                        </p>
                      </div>
                    )}
                  </button>
                </div>

                <p className="text-white/60 text-sm">
                  {hasJobDescription 
                    ? 'Target for this role: 85%' 
                    : `Target for ${selectedRole} roles: ${getTargetScore()}%`}
                </p>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-3">
                {/* Content Structure */}
                <Collapsible open={isContentStructureOpen} onOpenChange={setIsContentStructureOpen}>
                  <div className="bg-black/40 backdrop-blur-xl rounded-[20px] border border-white/20 overflow-hidden" style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                      <span className="text-white">Content Structure</span>
                      {isContentStructureOpen ? (
                        <ChevronDown className="w-5 h-5 text-white/80" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/80" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 py-4 border-t border-white/10 space-y-3">
                        <div>
                          <p className="text-white text-sm mb-2">✓ What to Include:</p>
                          <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
                            <li>Clear project titles and descriptions</li>
                            <li>Your specific role and contributions</li>
                            <li>Problem statement and context</li>
                            <li>Solution approach and methodology</li>
                            <li>Results and measurable outcomes</li>
                            <li>Visual examples (screenshots, mockups)</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm mb-2">✗ What to Avoid:</p>
                          <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
                            <li>Vague or generic descriptions</li>
                            <li>Too much technical jargon</li>
                            <li>Listing features without context</li>
                            <li>Missing team collaboration details</li>
                            <li>No clear narrative or story</li>
                          </ul>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Project Selection */}
                <Collapsible open={isProjectSelectionOpen} onOpenChange={setIsProjectSelectionOpen}>
                  <div className="bg-black/40 backdrop-blur-xl rounded-[20px] border border-white/20 overflow-hidden" style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                      <span className="text-white">Project Selection</span>
                      {isProjectSelectionOpen ? (
                        <ChevronDown className="w-5 h-5 text-white/80" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/80" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 py-4 border-t border-white/10">
                        <p className="text-white/70 text-sm mb-2">
                          Choose 3-5 projects that best demonstrate your capabilities
                        </p>
                        <ul className="text-white/70 text-sm space-y-1.5 list-disc list-inside">
                          <li>Show variety in problem-solving</li>
                          <li>Include recent work (last 2-3 years)</li>
                          <li>Highlight different skills and methodologies</li>
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Inspiration Mood Board */}
                <Collapsible open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                  <div className="bg-black/40 backdrop-blur-xl rounded-[20px] border border-white/20 overflow-hidden" style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-white/90" />
                        <span className="text-white">Inspiration Board</span>
                      </div>
                      {isTemplatesOpen ? (
                        <ChevronDown className="w-5 h-5 text-white/80" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/80" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 py-4 border-t border-white/10">
                        {/* Mood board grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Inspiration Card 1 */}
                          <div className="relative group aspect-square rounded-[12px] overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs truncate">Case Study Format</p>
                              <p className="text-white/60 text-[10px]">Behance</p>
                            </div>
                            <a href="#" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </a>
                          </div>

                          {/* Inspiration Card 2 */}
                          <div className="relative group aspect-square rounded-[12px] overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs truncate">UX Portfolio</p>
                              <p className="text-white/60 text-[10px]">NN Group</p>
                            </div>
                            <a href="#" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </a>
                          </div>

                          {/* Inspiration Card 3 */}
                          <div className="relative group aspect-square rounded-[12px] overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer bg-gradient-to-br from-orange-500/20 to-red-500/20">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs truncate">Design Systems</p>
                              <p className="text-white/60 text-[10px]">Figma</p>
                            </div>
                            <a href="#" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </a>
                          </div>

                          {/* Inspiration Card 4 */}
                          <div className="relative group aspect-square rounded-[12px] overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs truncate">Impact Metrics</p>
                              <p className="text-white/60 text-[10px]">Dribbble</p>
                            </div>
                            <a href="#" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </a>
                          </div>
                        </div>

                        {/* Add Inspiration Button */}
                        <button className="w-full bg-white/5 hover:bg-white/10 rounded-[14px] py-3 border border-white/20 border-dashed flex items-center justify-center gap-2 transition-all backdrop-blur-xl active:scale-[0.98]">
                          <Plus className="w-4 h-4 text-white/80" />
                          <span className="text-white/80 text-sm">Add Inspiration</span>
                        </button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </div>

              {/* AI Writing Coach Section */}
              <div className="space-y-3">
                <h2 className="text-white text-lg">AI Writing Coach</h2>
                
                {selectedText ? (
                  <div className="space-y-3">
                    {/* Selected Text Display */}
                    <div className="bg-black/40 backdrop-blur-xl rounded-[18px] p-4 border border-white/30" style={{
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                    }}>
                      <p className="text-white/50 text-xs mb-2">Selected text:</p>
                      <p className="text-white text-sm italic leading-relaxed">"{selectedText}"</p>
                    </div>

                    {/* AI Suggestions */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-white/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <div className="w-5 h-5 rounded-full bg-black" />
                      </div>
                      
                      <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[18px] p-5 border border-white/20" style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}>
                        <p className="text-white text-sm leading-relaxed mb-3">
                          Here are some ways to improve this text:
                        </p>
                        <div className="space-y-2">
                          <button 
                            onClick={() => handleApplySuggestion("Add specific metrics and numbers")}
                            className="w-full text-left text-white/90 text-sm hover:text-white hover:underline transition-all"
                          >
                            → Add specific metrics and numbers
                          </button>
                          <button 
                            onClick={() => handleApplySuggestion("Include the business impact")}
                            className="w-full text-left text-white/90 text-sm hover:text-white hover:underline transition-all"
                          >
                            → Include the business impact
                          </button>
                          <button 
                            onClick={() => handleApplySuggestion("Clarify your specific role")}
                            className="w-full text-left text-white/90 text-sm hover:text-white hover:underline transition-all"
                          >
                            → Clarify your specific role
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-white/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <div className="w-5 h-5 rounded-full bg-black" />
                    </div>
                    
                    <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[18px] p-5 border border-white/20" style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}>
                      <p className="text-white text-sm leading-relaxed">
                        Highlight any text in your portfolio to get AI-powered suggestions for improvement.
                      </p>
                    </div>
                  </div>
                )}
              </div>



              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-white text-lg">Chat History</h2>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'ai' && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-white/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <div className="w-5 h-5 rounded-full bg-black" />
                        </div>
                      )}
                      <div className={`flex-1 backdrop-blur-xl rounded-[18px] p-5 border max-w-[80%] ${
                        msg.role === 'user' 
                          ? 'bg-white/20 border-white/30' 
                          : 'bg-black/40 border-white/20'
                      }`} style={{
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}>
                        <p className="text-white text-sm leading-relaxed whitespace-pre-line">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Input Section - Fixed at bottom */}
          <div className="p-6 border-t border-white/10" style={{
            background: 'linear-gradient(to top, rgba(10, 10, 10, 0.98), transparent)'
          }}>
            <div className="mb-3">
              <p className="text-white/60 text-xs">Ask me anything about your portfolio</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[20px] border border-white/20 overflow-hidden hover:border-white/30 transition-all" style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about structure, impact, or examples..."
                  className="w-full px-5 py-4 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
              <button 
                onClick={handleSendMessage}
                className="w-14 h-14 bg-white hover:bg-white/90 rounded-[20px] flex items-center justify-center transition-all flex-shrink-0 shadow-lg active:scale-95"
              >
                <Send className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
