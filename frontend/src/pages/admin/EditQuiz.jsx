import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import AdminHeader from '../../components/AdminHeader';
import { Upload, Image, Video, X, Save, Trash2, AlertCircle, CheckCircle2, FileText, ArrowLeft } from 'lucide-react';
import MediaPreview from '../../components/MediaPreview';
import FileUploadSection from '../../components/Partials/FileUploadSection';
import LoadingScreen from '../../components/Partials/Loading';
import ErrorAlert from '../../components/Partials/ErrorAlert';
import KinematicActionsSection from '../../components/Quiz/KinematicActions';

const EditQuiz = () => {
  const backendUrl = import.meta.env.VITE_BACKENDURL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaMap, setMediaMap] = useState({}); // { [qIndex]: { imageName, videoName, optionImages: [], optionVideos: [] } }
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentOptions, setCurrentOptions] = useState([{ text: '', isCorrect: false, impact: '', mitigation: '' }]);

  const addOption = () => {
    if (currentOptions.length < 5) {
      setCurrentOptions([...currentOptions, { text: '', isCorrect: false, impact: '', mitigation: '' }]);
    }
  };

  const removeOption = (index) => {
    if (currentOptions.length > 1) {
      const newOptions = [...currentOptions];
      newOptions.splice(index, 1);
      setCurrentOptions(newOptions);
    }
  };

  const handleNewOptionChange = (index, field, value) => {
    const newOptions = [...currentOptions];

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

    setCurrentOptions(newOptions);
  };

  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      setError('Question text is required');
      return;
    }

    if (!currentOptions.some(option => option.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }

    if (currentOptions.some(option => !option.text || !option.impact || !option.mitigation)) {
      setError('All options must have text, impact, and mitigation filled out');
      return;
    }

    setQuestions([...questions, {
      text: currentQuestion,
      options: [...currentOptions]
    }]);
    setCurrentQuestion('');
    setCurrentOptions([{ text: '', isCorrect: false, impact: '', mitigation: '' }]);
    setError(null);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/quizzes/${id}`);
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

  const handleFileChange = (qIndex, type, file, optIndex = null) => {
    setMediaMap(prev => {
      const updated = { ...prev };
      if (!updated[qIndex]) updated[qIndex] = { optionImages: [], optionVideos: [] };
      if (type === 'questionImage') {
        updated[qIndex].imageFile = file;
        updated[qIndex].imageName = file.name;
      } else if (type === 'questionVideo') {
        updated[qIndex].videoFile = file;
        updated[qIndex].videoName = file.name;
      } else if (type === 'optionImage') {
        updated[qIndex].optionImages[optIndex] = file;
        if (!updated[qIndex].optionImageNames) updated[qIndex].optionImageNames = [];
        updated[qIndex].optionImageNames[optIndex] = file.name;
      } else if (type === 'optionVideo') {
        updated[qIndex].optionVideos[optIndex] = file;
        if (!updated[qIndex].optionVideoNames) updated[qIndex].optionVideoNames = [];
        updated[qIndex].optionVideoNames[optIndex] = file.name;
      }
      return updated;
    });
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex][field] = value;
    if (field === 'isCorrect' && value === true) {
      // Ensure only one is correct
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex
      }));
    }
    setQuestions(updated);
  };

  const handleSave = async () => {
  if (!title || !description) {
    setError('Title and description are required');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);

  const preparedQuestions = questions.map((q, qIndex) => {
    const media = mediaMap[qIndex] || {};

    return {
      _id: q._id, // Preserve question ID
      text: q.text,
      imageName: media.imageName || q.imageName,
      videoName: media.videoName || q.videoName,
      options: q.options.map((opt, oIndex) => ({
        _id: opt._id, // Preserve option ID
        text: opt.text,
        isCorrect: opt.isCorrect,
        impact: opt.impact,
        justification: opt.justification,
        score: opt.score,
        imageName: media.optionImageNames?.[oIndex],
        videoName: media.optionVideoNames?.[oIndex]
      })),
      kinematicActions: (q.kinematicActions || []).map(action => ({
        _id: action._id, // Preserve kinematicAction ID
        action: action.action,
        description: action.description
      }))
    };
  });

  formData.append('questions', JSON.stringify(preparedQuestions));

  // Append files
  Object.values(mediaMap).forEach(media => {
    if (media.imageFile) formData.append('questionMedia', media.imageFile);
    if (media.videoFile) formData.append('questionMedia', media.videoFile);
    media.optionImages?.forEach(file => file && formData.append('optionMedia', file));
    media.optionVideos?.forEach(file => file && formData.append('optionMedia', file));
  });

  try {
    setSaving(true);
    await axios.put(`${backendUrl}/api/quizzes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setSaving(false);
    navigate('/admin');
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to update quiz');
    setSaving(false);
  }
};


  const handleDelete = async () => {
    const confirm = window.confirm('Are you sure you want to delete this Scenario?');
    if (!confirm) return;
    try {
      await axios.delete(`${backendUrl}/api/quizzes/${id}`);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AdminHeader />
        <ErrorAlert title='Error' error={error} />
      </div>
    );
  }

  const handleKinematicChange = (qIndex, updatedActions) => {
    const updated = [...questions];
    updated[qIndex].kinematicActions = updatedActions;
    setQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex, newText) => {
    const updated = [...questions];
    updated[qIndex].text = newText;
    setQuestions(updated);
  };


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
              <h1 className="text-3xl font-bold text-gray-900">Edit Scenario</h1>
              <p className="text-gray-600 mt-1">Modify your Scenario content and settings</p>
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

          {/* Delete Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <Trash2 size={18} />
              Delete Scenario
            </button>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-row justify-between w-full">
                <div className="flex flex-col gap-3 mb-6 w-full">
                  <div className="flex items-start gap-4">
                    {/* Question number badge */}
                    <div className="w-8 h-8 mt-2 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-700">{qIndex + 1}</span>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1">
                      <textarea
                        value={q.text}
                        onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter question text..."
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="flex flex-row">
                    {q.imageUrl && (
                      <MediaPreview filepath={q.imageUrl} />
                    )}
                    {q.videoUrl && (
                      <MediaPreview filepath={q.videoUrl} />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Question Media */}
              <div className="mb-6 space-y-4">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <FileText size={16} />
                  Situation Media
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <FileUploadSection
                    label="Upload Situation Image"
                    file={mediaMap[qIndex]?.imageFile}
                    existingMedia={q.imageName}
                    onChange={e => handleFileChange(qIndex, 'questionImage', e.target.files[0])}
                    icon={Image}
                    accept="image/png, image/jpeg, image/jpg"
                  />
                  <FileUploadSection
                    label="Upload Situation Video"
                    file={mediaMap[qIndex]?.videoFile}
                    existingMedia={q.videoName}
                    onChange={e => handleFileChange(qIndex, 'questionVideo', e.target.files[0])}
                    icon={Video}
                    accept="video/mp4, video/mov, video/avi, video/quicktime"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Options</h4>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className={`border-2 rounded-xl p-6 transition-all ${opt.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <button
                        onClick={() => handleOptionChange(qIndex, oIndex, 'isCorrect', true)}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${opt.isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-400'
                          }`}
                      >
                        {opt.isCorrect && <CheckCircle2 size={12} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Option ${oIndex + 1} text...`}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                        <textarea
                          value={opt.impact}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, 'impact', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Describe the impact..."
                          rows="2"
                        />
                      </div>
                      <div className="grid lg:grid-cols-4 grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                          <input
                            type="number"
                            value={opt.score}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, 'score', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Assign Priority Score..."
                          />
                        </div>
                      </div>
                      {opt.isCorrect &&
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                          <textarea
                            value={opt.justification}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, 'justification', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Mitigation strategy..."
                            rows="2"
                          />
                        </div>
                      }
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FileUploadSection
                        label="Option Image"
                        file={mediaMap[qIndex]?.optionImages?.[oIndex]}
                        existingMedia={opt.imageName}
                        onChange={e => handleFileChange(qIndex, 'optionImage', e.target.files[0], oIndex)}
                        icon={Image}
                        accept="image/png, image/jpeg, image/jpg"
                      />
                      <FileUploadSection
                        label="Option Video"
                        file={mediaMap[qIndex]?.optionVideos?.[oIndex]}
                        existingMedia={opt.videoName}
                        onChange={e => handleFileChange(qIndex, 'optionVideo', e.target.files[0], oIndex)}
                        icon={Video}
                        accept="video/mp4, video/mov, video/avi, video/quicktime"
                      />

                      {opt.imageUrl && (
                        <div className="md:col-span-2 mt-4 flex gap-4">
                          {opt.imageUrl && (
                            <div className="w-32 h-32 border rounded overflow-hidden">
                              <MediaPreview filepath={opt.imageUrl} />
                            </div>
                          )}
                        </div>
                      )}
                      {opt.videoUrl && (
                        <div className="md:col-span-2 mt-4 flex gap-4">
                          {opt.videoUrl && (
                            <div className="w-32 h-32 border rounded overflow-hidden">
                              <MediaPreview filepath={opt.videoUrl} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <KinematicActionsSection
                initialActions={q.kinematicActions || []}
                onChange={(updatedActions) => handleKinematicChange(qIndex, updatedActions)}
              />

            </div>
          ))}
        </div>



        {/* Submit Button */}
        < div className="flex justify-end" >
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-lg font-semibold shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving Scenario...
              </>
            ) : (
              <>
                <Save size={20} />
                Update Scenario
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default EditQuiz;