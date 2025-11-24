import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export default function FileUpload({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  maxSize = 10,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    validateAndSelectFiles(files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndSelectFiles(files);
    }
  };

  const validateAndSelectFiles = (files: File[]) => {
    // Filter by file type
    const validFiles = files.filter((file) => {
      if (accept === 'image/*') {
        return file.type.startsWith('image/');
      }
      return true;
    });

    // Filter by file size
    const maxBytes = maxSize * 1024 * 1024;
    const sizeValidFiles = validFiles.filter((file) => file.size <= maxBytes);

    if (sizeValidFiles.length < validFiles.length) {
      alert(`Some files were too large. Maximum size is ${maxSize}MB`);
    }

    if (sizeValidFiles.length > 0) {
      onFilesSelected(sizeValidFiles);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-primary bg-primary bg-opacity-10'
          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-column align-items-center justify-content-center">
        <i className="bi bi-cloud-upload fs-3x text-primary mb-4"></i>

        <h4 className="text-gray-700 mb-2">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </h4>

        <p className="text-gray-500 mb-3">or click to browse</p>

        <p className="text-gray-400 fs-7">
          {multiple ? 'Multiple files supported' : 'Single file only'} • Max {maxSize}MB per file
        </p>

        {accept === 'image/*' && (
          <p className="text-gray-400 fs-8 mt-2">
            Accepted formats: JPG, PNG, JPEG, WebP, HEIC
          </p>
        )}
      </div>
    </div>
  );
}
