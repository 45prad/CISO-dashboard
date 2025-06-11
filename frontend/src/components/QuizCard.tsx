import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle, Play, Pause } from 'lucide-react';

interface QuizCardProps {
  quiz: {
    _id: string;
    title: string;
    description: string;
    isActive: boolean;
    questionCount: number;
    createdAt: string;
  };
  hasAttempted?: boolean;
  userView?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, hasAttempted = false, userView = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 h-full flex flex-col">
      <div className="p-5 flex flex-col justify-between h-full">
        <div>
          {/* Title and Status */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{quiz.title}</h3>
            {quiz.isActive ? (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                <Play size={12} className="mr-1" />
                Active
              </span>
            ) : (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full flex items-center">
                <Pause size={12} className="mr-1" />
                Inactive
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>

          {/* Meta Info */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Clock size={16} className="mr-1" />
            <span>{quiz.questionCount} Situations</span>
            {hasAttempted && (
              <span className="ml-4 flex items-center text-green-600">
                <CheckCircle size={16} className="mr-1" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div>
          {userView ? (
            <Link
              to={hasAttempted ? `/quiz/${quiz._id}/result` : `/quiz/${quiz._id}`}
              className={`flex items-center justify-center w-full py-2 px-4 rounded ${
                hasAttempted
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : quiz.isActive
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              } transition-colors`}
              onClick={(e) => !quiz.isActive && !hasAttempted && e.preventDefault()}
            >
              {hasAttempted ? 'View Results' : quiz.isActive ? 'Engage' : 'Scenario Not Active'}
              {(hasAttempted || quiz.isActive) && <ArrowRight size={18} className="ml-1" />}
            </Link>
          ) : (
            <div className="flex space-x-2">
              <Link
                to={`/admin/quiz/${quiz._id}/edit`}
                className="flex-1 flex items-center justify-center py-2 px-4 text-white rounded hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: '#00174D' }}
              >
                Edit
              </Link>
              <Link
                to={`/admin/quiz/${quiz._id}/monitor`}
                className="flex-1 flex items-center justify-center py-2 px-4 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                Monitor
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
