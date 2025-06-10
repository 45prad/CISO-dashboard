import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

const FileUploadSection = ({
  label,
  file,
  onChange,
  icon: Icon,
  accept = "image/png, image/jpeg, image/jpg, video/mp4, video/mov, video/avi, video/quicktime",
  existingMedia
}) => (
  <div className="space-y-3">
    <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 group">
      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
        <Icon size={20} className="text-gray-600 group-hover:text-blue-600" />
      </div>
      <div>
        <div className="font-medium text-gray-700">{label}</div>
        <div className="text-sm text-gray-500">Click to upload or drag and drop</div>
      </div>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
    </label>

    {/* Show existing media from database */}
    {existingMedia && (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Current file:</span>
          <span className="text-sm text-blue-700">{existingMedia}</span>
        </div>
      </div>
    )}

    {/* Show new uploaded file */}
    {file && (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">New file:</span>
            <span className="text-sm text-green-700 truncate">{file.name || file}</span>
          </div>
          <button
            onClick={() => onChange({ target: { files: [null] } })}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      </div>
    )}
  </div>
);

export default FileUploadSection;
