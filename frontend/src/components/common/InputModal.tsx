import { useState } from 'react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
}

export default function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  console.log('[InputModal] Render - isOpen:', isOpen, 'title:', title);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <p className="mb-3">{message}</p>
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={handleClose}>
              {cancelText}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!value.trim()}
            >
              {submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
