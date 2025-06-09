import React, { useState } from 'react';
import { Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const ResponseStats = ({ questionText, options }) => {
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [expandedOptions, setExpandedOptions] = useState(new Set());
    
    const chartColors = [
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#ec4899', // Pink
        '#84cc16'  // Lime
    ];
    
    // Build statistics and response mapping
    const statistics = {};
    const responsesByOption = {};
    const totalResponses = options.reduce((sum, option) => sum + (option.selectedCount || 0), 0);
    
    options.forEach(option => {
        statistics[option.optionId] = option.selectedCount;
        responsesByOption[option.optionId] = option.users.map(user => ({
            userName: user.name,
            email: user.email,
            timestamp: user.timestamp
        }));
    });
    
    const toggleExpand = (optionId) => {
        const newExpanded = new Set(expandedOptions);
        if (newExpanded.has(optionId)) {
            newExpanded.delete(optionId);
        } else {
            newExpanded.add(optionId);
        }
        setExpandedOptions(newExpanded);
    };
    
    return (
        <div className="bg-white rounded-xl shadow-md p-4 mt-8">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-4 leading-tight">
                            {questionText}
                        </h1>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Users size={16} />
                            <span className="text-sm font-medium">{totalResponses} responses</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => setSelectedFilter(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedFilter === null
                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/25'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    All Responses
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs">
                        {totalResponses}
                    </span>
                </button>
                {options.map((option, index) => (
                    <button
                        key={option.optionId}
                        onClick={() => setSelectedFilter(option.optionId)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedFilter === option.optionId
                                ? 'text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                        style={selectedFilter === option.optionId ? {
                            backgroundColor: chartColors[index % chartColors.length],
                            boxShadow: `0 10px 25px -5px ${chartColors[index % chartColors.length]}40`
                        } : {}}
                    >
                        Option {String.fromCharCode(65 + index)}
                        <span className={`ml-2 px-2 py-0.5 rounded-md text-xs ${
                            selectedFilter === option.optionId 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                            {option.selectedCount || 0}
                        </span>
                    </button>
                ))}
            </div>
            
            {/* Response Details */}
            <div className="space-y-4">
                {options
                    .filter(option => selectedFilter === null || option.optionId === selectedFilter)
                    .map((option, index) => {
                        const isExpanded = expandedOptions.has(option.optionId);
                        const responseCount = option.selectedCount || 0;
                        return (
                            <div key={option.optionId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div 
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                                            />
                                            <div>
                                                <p className="text-lg font-medium text-gray-900 mb-1">
                                                    {option.optionText}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                                                </p>
                                            </div>
                                        </div>
                                        {responseCount > 0 && (
                                            <button
                                                onClick={() => toggleExpand(option.optionId)}
                                                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp size={20} className="text-gray-400" />
                                                ) : (
                                                    <ChevronDown size={20} className="text-gray-400" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Expanded User List */}
                                    {isExpanded && responseCount > 0 && (
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <div className="space-y-4">
                                                {responsesByOption[option.optionId]?.map((response, rIndex) => (
                                                    <div key={rIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {response.userName.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{response.userName}</p>
                                                                <p className="text-sm text-gray-500">{response.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <Clock size={14} />
                                                            <span className="text-sm">
                                                                {new Date(response.timestamp).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default ResponseStats;