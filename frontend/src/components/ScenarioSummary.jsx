import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, CheckCircle, BarChart2 } from 'lucide-react';

const ScenarioSummary = ({ summaryData, labeledSummaryData }) => {
    if (!summaryData || summaryData.length === 0) return null;

    // Calculate statistics
    const totalResponses = summaryData.reduce((sum, item) => sum + item.count, 0);
    const mostSelected = [...labeledSummaryData].sort((a, b) => b.count - a.count)[0];
    const maxCount = Math.max(...labeledSummaryData.map(item => item.count), 1);

    // Custom tick formatter to shorten long labels
    const formatXAxisTick = (value) => {
        const maxLength = 15;
        return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium mb-4">Scenario Statistics</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 rounded-lg p-4"
                    >
                        <div className="flex items-center mb-2">
                            <Users className="text-blue-600 mr-2" size={20} />
                            <h4 className="text-sm font-medium text-blue-800">Total Responses</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                            {totalResponses}
                        </p>
                    </div>

                    <div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-green-50 rounded-lg p-4"
                    >
                        <div className="flex items-center mb-2">
                            <TrendingUp className="text-green-600 mr-2" size={20} />
                            <h4 className="text-sm font-medium text-green-800">Most Selected</h4>
                        </div>
                        <p className="text-2xl font-bold text-green-900 line-clamp-1">
                            {mostSelected?.shortLabel || 'N/A'}
                        </p>
                    </div>

                    <div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-purple-50 rounded-lg p-4"
                    >
                        <div className="flex items-center mb-2">
                            <CheckCircle className="text-purple-600 mr-2" size={20} />
                            <h4 className="text-sm font-medium text-purple-800">Best Fit Decison</h4>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                            {labeledSummaryData.find(item => item.count === maxCount)?.shortLabel || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
                        <BarChart2 className="mr-2" size={20} /> Response Distribution
                    </h3>

                    {/* Bar Chart */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={labeledSummaryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="shortLabel"
                                    tick={{ fontSize: 14, fill: '#555' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 14, fill: '#555' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 border border-gray-300 rounded shadow text-sm">
                                                    <p className="font-semibold">{payload[0].payload.optionText}</p>
                                                    <p className="text-gray-600">Selected Count: {payload[0].value}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="count"
                                    fill="#6366F1"
                                    name="Selected Count"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>


                    {/* Label Mapping - Only show if we have short labels */}
                    {labeledSummaryData[0]?.shortLabel && (
                        <div className="mt-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                                {labeledSummaryData.map((item) => (
                                    <div
                                        key={item.shortLabel}
                                        className="bg-gray-50 p-2 rounded border border-gray-200"
                                    >
                                        <span className="font-semibold text-indigo-600">{item.shortLabel}:</span>
                                        <span className="ml-1 line-clamp-3" title={item.optionText}>{item.optionText}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-gray-500 text-sm mt-4 text-center">
                        Distribution of answers selected by all participants
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScenarioSummary;