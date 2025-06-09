import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, X, Save, ArrowLeft, Upload, Trash2, CheckCircle, AlertCircle, Image, Video } from 'lucide-react';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import AuthContext from '../../context/AuthContext';

const CreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [currentQuestionMedia, setCurrentQuestionMedia] = useState({ imageFile: null, videoFile: null });
  const [options, setOptions] = useState([
    { text: '', isCorrect: false, impact: '', mitigation: '', score: 0, justification: '', imageFile: null, videoFile: null }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKENDURL;

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, {
        text: '', isCorrect: false, impact: '', mitigation: '', justification: '',
        imageFile: null, videoFile: null
      }]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      const updated = [...options];
      updated.splice(index, 1);
      setOptions(updated);
    }
  };

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    if (field === 'isCorrect') {
      updated.forEach((opt, i) => {
        updated[i].isCorrect = i === index;
      });
    } else {
      updated[index][field] = value;
    }
    setOptions(updated);
  };

  const handleOptionFileChange = (index, type, file) => {
    const updated = [...options];
    updated[index][type] = file;
    setOptions(updated);
  };

  const addQuestion = () => {
    if (!currentQuestionText.trim()) {
      return setError('Question is required');
    }
    if (!options.some(o => o.isCorrect)) {
      return setError('One option must be correct');
    }

    const newQuestion = {
      text: currentQuestionText,
      imageFile: currentQuestionMedia.imageFile,
      videoFile: currentQuestionMedia.videoFile,
      options: options.map(opt => ({ ...opt }))
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestionText('');
    setCurrentQuestionMedia({ imageFile: null, videoFile: null });
    setOptions([{ text: '', isCorrect: false, impact: '', mitigation: '', justification: '', imageFile: null, videoFile: null }]);
    setError(null);
  };

  const removeQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return setError('Title and description required');
    }
    if (questions.length === 0) {
      return setError('Add at least one question');
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      const payloadQuestions = questions.map((q, qIndex) => {
        const qObj = {
          text: q.text,
          imageName: q.imageFile ? `question-${qIndex}-${q.imageFile.name}` : null,
          videoName: q.videoFile ? `question-${qIndex}-${q.videoFile.name}` : null,
          options: q.options.map((opt, oIndex) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            impact: opt.impact,
            mitigation: opt.mitigation,
            justification: opt.justification,
            score: opt.score,
            imageName: opt.imageFile ? `option-${qIndex}-${oIndex}-${opt.imageFile.name}` : null,
            videoName: opt.videoFile ? `option-${qIndex}-${oIndex}-${opt.videoFile.name}` : null,
          }))
        };

        if (q.imageFile) {
          formData.append('questionMedia', new File([q.imageFile], qObj.imageName, { type: q.imageFile.type }));
        }
        if (q.videoFile) {
          formData.append('questionMedia', new File([q.videoFile], qObj.videoName, { type: q.videoFile.type }));
        }

        q.options.forEach((opt, oIndex) => {
          if (opt.imageFile) {
            formData.append('optionMedia', new File([opt.imageFile], `option-${qIndex}-${oIndex}-${opt.imageFile.name}`, { type: opt.imageFile.type }));
          }
          if (opt.videoFile) {
            formData.append('optionMedia', new File([opt.videoFile], `option-${qIndex}-${oIndex}-${opt.videoFile.name}`, { type: opt.videoFile.type }));
          }
        });

        return qObj;
      });

      formData.append('questions', JSON.stringify(payloadQuestions));

      const res = await axios.post(`${backendUrl}/api/quizzes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      });

      setLoading(false);
      navigate('/admin');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Submission failed');
    }
  };

  const FileUploadSection = ({ label, file, onChange, icon: Icon }) => (
    <div className="relative">
      <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 cursor-pointer transition-colors">
        <Icon size={20} className="text-gray-500" />
        <span className="text-sm text-gray-600">{label}</span>
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, video/mp4, video/mov, video/avi, video/quicktime"
          onChange={onChange}
          className="hidden"
        />
      </label>
      {file && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center justify-between">
          <span className="text-sm text-green-700 truncate">{file.name}</span>
          <button
            onClick={() => onChange({ target: { files: [null] } })}
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Scenario</h1>
              <p className="text-gray-600 mt-1">Design engaging Scenarioes with multimedia support</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <AlertCircle className="text-red-400 mr-3 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scenario Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Scenario Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter Scenario title..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Describe your Scenario..."
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Situation Builder */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <PlusCircle className="mr-3 text-blue-600" size={24} />
            Add Situation
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Situation Text</label>
              <textarea
                value={currentQuestionText}
                onChange={(e) => setCurrentQuestionText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Type your Situation here..."
                rows="3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FileUploadSection
                label="Upload Situation Image"
                file={currentQuestionMedia.imageFile}
                onChange={(e) => setCurrentQuestionMedia({ ...currentQuestionMedia, imageFile: e.target.files[0] })}
                icon={Image}
              />
              <FileUploadSection
                label="Upload Situation Video"
                file={currentQuestionMedia.videoFile}
                onChange={(e) => setCurrentQuestionMedia({ ...currentQuestionMedia, videoFile: e.target.files[0] })}
                icon={Video}
              />
            </div>

            {/* Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Options</h3>
              <div className="space-y-4">
                {options.map((opt, i) => (
                  <div key={i} className={`border-2 rounded-xl p-6 transition-all ${opt.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        onClick={() => handleOptionChange(i, 'isCorrect', true)}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${opt.isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-400'
                          }`}
                      >
                        {opt.isCorrect && <CheckCircle size={12} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Option ${i + 1} text...`}
                        />
                      </div>
                      {options.length > 1 && (
                        <button
                          onClick={() => removeOption(i)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                        <textarea
                          value={opt.impact}
                          onChange={(e) => handleOptionChange(i, 'impact', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Describe the impact..."
                          rows="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation</label>
                        <textarea
                          value={opt.mitigation}
                          onChange={(e) => handleOptionChange(i, 'mitigation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Mitigation strategy..."
                          rows="2"
                        />
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-4 grid-cols-1 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                        <input
                          type="number"
                          value={opt.score}
                          onChange={(e) => handleOptionChange(i, 'score', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Assign Priority Score..."
                        />
                      </div>
                    </div>

                    {opt.isCorrect && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-green-700 mb-1">Justification (Correct Answer)</label>
                        <textarea
                          value={opt.justification}
                          onChange={(e) => handleOptionChange(i, 'justification', e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-green-50"
                          placeholder="Explain why this is the correct ..."
                          rows="2"
                        />
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <FileUploadSection
                        label="Option Image"
                        file={opt.imageFile}
                        onChange={(e) => handleOptionFileChange(i, 'imageFile', e.target.files[0])}
                        icon={Image}
                      />
                      <FileUploadSection
                        label="Option Video"
                        file={opt.videoFile}
                        onChange={(e) => handleOptionFileChange(i, 'videoFile', e.target.files[0])}
                        icon={Video}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={addOption}
                  disabled={options.length >= 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <PlusCircle size={16} />
                  Add Option
                </button>
                <button
                  onClick={addQuestion}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Add Situation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Situations Preview ({questions.length})</h3>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {i + 1}. {q.text}
                    </h4>
                    <button
                      onClick={() => removeQuestion(i)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {q.options.map((o, j) => (
                      <div key={j} className={`p-3 rounded-lg flex items-center gap-2 ${o.isCorrect ? 'bg-green-100 border border-green-300' : 'bg-gray-50 border border-gray-200'
                        }`}>
                        <div className={`w-3 h-3 rounded-full ${o.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">{o.text}</span>
                        {o.isCorrect && <CheckCircle size={16} className="text-green-600 ml-auto" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-lg font-semibold shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving Scenario...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Scenario
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;