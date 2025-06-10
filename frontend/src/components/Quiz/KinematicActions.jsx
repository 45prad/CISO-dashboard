import React, { useState } from 'react';
import { Zap, Trash2, PlusCircle } from 'lucide-react';

const KinematicActionsSection = ({ initialActions = [], onChange }) => {
  const [currentKinematicActions, setCurrentKinematicActions] = useState(
    initialActions.length ? initialActions : [{ action: '', description: '' }]
  );

  const addKinematicAction = () => {
    if (currentKinematicActions.length < 10) {
      const updated = [...currentKinematicActions, { action: '', description: '' }];
      setCurrentKinematicActions(updated);
      onChange && onChange(updated);
    }
  };

  const removeKinematicAction = (index) => {
    if (currentKinematicActions.length > 1) {
      const updated = [...currentKinematicActions];
      updated.splice(index, 1);
      setCurrentKinematicActions(updated);
      onChange && onChange(updated);
    }
  };

  const handleKinematicActionChange = (index, field, value) => {
    const updated = [...currentKinematicActions];
    updated[index][field] = value;
    setCurrentKinematicActions(updated);
    onChange && onChange(updated);
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Zap className="mr-2 text-blue-600" size={20} />
        Kinematic Actions
      </h3>
      <div className="space-y-4">
        {currentKinematicActions.map((ka, i) => (
          <div key={i} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Action</label>
                  <input
                    type="text"
                    value={ka.action}
                    onChange={(e) => handleKinematicActionChange(i, 'action', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter kinematic action..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Description</label>
                  <textarea
                    value={ka.description}
                    onChange={(e) => handleKinematicActionChange(i, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Describe the action..."
                    rows="2"
                  />
                </div>
              </div>
              {currentKinematicActions.length > 1 && (
                <button
                  onClick={() => removeKinematicAction(i)}
                  className="text-red-500 hover:text-red-700 p-1 mt-6"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addKinematicAction}
        disabled={currentKinematicActions.length >= 10}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <PlusCircle size={16} />
        Add Kinematic Action
      </button>
    </div>
  );
};

export default KinematicActionsSection;
