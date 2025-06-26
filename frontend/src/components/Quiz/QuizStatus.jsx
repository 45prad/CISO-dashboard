import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Mail, Trophy, Calendar } from 'lucide-react';
import axios from 'axios';

const QuizStatusDashboard = ({ quizId }) => {
    const backendUrl = import.meta.env.VITE_BACKENDURL;
    const [quizData, setQuizData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Make API call to fetch quiz assignment status
                const response = await axios.get(`${backendUrl}/api/quizzes/quiz/${quizId}/assigned-status`);

                const data = await response.data;
                setQuizData(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch quiz data:', err);
                setError('Failed to fetch quiz data. Using sample data.');
                // Fallback to sample data
                // setQuizData(sampleData);
                setLoading(false);
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 60000); // 1 minute = 60000 ms

        return () => clearInterval(intervalId);
    }, [quizId, backendUrl]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not submitted';
        return new Date(dateString).toLocaleString();
    };

    const getStatusIcon = (submitted) => {
        return submitted ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
            <XCircle className="w-5 h-5 text-red-500" />
        );
    };

    const getStatusBadge = (submitted) => {
        return submitted ? (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Submitted
            </span>
        ) : (
            <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Pending
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading quiz data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    const submittedCount = quizData.filter(user => user.submitted).length;
    const totalCount = quizData.length;

    return (
        <div className="mb-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Submitted</p>
                                <p className="text-2xl font-bold text-gray-900">{submittedCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-orange-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCount - submittedCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {submittedCount > 0
                                        ? (quizData.filter(u => u.submitted).reduce((acc, u) => acc + u.score, 0) / submittedCount).toFixed(1)
                                        : '0'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Delegate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quizData.map((student, index) => (
                                <tr key={student.userId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-gray-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {student.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getStatusIcon(student.submitted)}
                                            <div className="ml-2">
                                                {getStatusBadge(student.submitted)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                                            <span className={`text-sm font-medium ${student.submitted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {student.submitted ? student.score : '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            {formatDate(student.submittedAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QuizStatusDashboard;