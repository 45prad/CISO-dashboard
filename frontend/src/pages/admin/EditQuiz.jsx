import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, X, Save, ArrowLeft, Trash2 } from 'lucide-react';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import AuthContext from '../../context/AuthContext';

const EditQuiz = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState([{ text: '', isCorrect: false, impact: '', mitigation: '' }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes/${id}`);
        setQuiz(data);
        setTitle(data.title);
        setDescription(data.description);
        setQuestions(data.questions);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch quiz');
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [id]);
  
  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, { text: '', isCorrect: false, impact: '', mitigation: '' }]);
    }
  };
  
  const removeOption = (index) => {
    if (options.length > 1) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };
  
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    
    if (field === 'isCorrect') {
      // If making this option correct, make all others incorrect
      newOptions.forEach((option, i) => {
        if (i === index) {
          option.isCorrect = true;
        } else {
          option.isCorrect = false;
        }
      });
    } else {
      newOptions[index][field] = value;
    }
    
    setOptions(newOptions);
  };
  
  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      setError('Question text is required');
      return;
    }
    
    if (!options.some(option => option.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }
    
    if (options.some(option => !option.text || !option.impact || !option.mitigation)) {
      setError('All options must have text, impact, and mitigation filled out');
      return;
    }
    
    setQuestions([...questions, { text: currentQuestion, options: [...options] }]);
    setCurrentQuestion('');
    setOptions([{ text: '', isCorrect: false, impact: '', mitigation: '' }]);
    setError(null);
  };
  
  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };
  
  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    
    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }
    
    try {
      setSaving(true);
      
      await axios.put(`${backendUrl}/api/quizzes/${id}`, {
        title,
        description,
        questions
      });
      
      setSaving(false);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quiz');
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      await axios.delete(`${backendUrl}/api/quizzes/${id}`);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/admin')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
              <p className="text-gray-600 mt-1">Update Scenario details and Situations</p>
            </div>
          </div>
          
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center py-2 px-4 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} className="mr-2" />
              Delete Scenario
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Confirm delete?</span>
              <button
                onClick={handleDelete}
                className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Scenario Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Scenario title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Scenario description"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Situations</h2>
          
          {questions.length > 0 && (
            <div className="mb-6 space-y-4">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">
                      {qIndex + 1}. {question.text}
                    </h3>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <ul className="mt-2 space-y-2">
                    {question.options.map((option, oIndex) => (
                      <li key={oIndex} className="flex items-center">
                        <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                          option.isCorrect ? 'bg-green-500' : 'bg-gray-300'
                        }`}></span>
                        <span>{option.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="font-medium mb-3">Add New Situations</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Situations Text
                </label>
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Situation"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Options
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={options.length >= 5}
                    className={`text-sm flex items-center ${
                      options.length >= 5 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <PlusCircle size={16} className="mr-1" />
                    Add Option
                  </button>
                </div>
                
                {options.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={option.isCorrect}
                          onChange={() => handleOptionChange(index, 'isCorrect', true)}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Correct Answer
                        </label>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 1}
                        className={`text-red-500 hover:text-red-700 ${
                          options.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Option text"
                        />
                      </div>
                      
                      <div>
                        <textarea
                          value={option.impact}
                          onChange={(e) => handleOptionChange(index, 'impact', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Impact explanation"
                        ></textarea>
                      </div>
                      
                      <div>
                        <textarea
                          value={option.mitigation}
                          onChange={(e) => handleOptionChange(index, 'mitigation', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Mitigation recommendation"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Add Situation
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default EditQuiz;