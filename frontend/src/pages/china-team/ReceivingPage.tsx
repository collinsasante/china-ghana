import { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import ItemFormModal from '../../components/china-team/ItemFormModal';
import { uploadBulkImages, getThumbnailUrl } from '../../services/cloudinary';
import { createItem } from '../../services/airtable';
import type { Item } from '../../types/index';

interface UploadedImage {
  file: File;
  preview: string;
  cloudinaryUrl?: string;
  isUploaded: boolean;
  hasItemData: boolean;
  itemId?: string;
  uploadProgress: number;
}

export default function ReceivingPage() {
  const [receivingDate, setReceivingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isUploaded: false,
      hasItemData: false,
      uploadProgress: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleUploadToCloudinary = async () => {
    if (images.length === 0) {
      alert('Please select images to upload');
      return;
    }

    setIsUploading(true);

    try {
      const filesToUpload = images.filter((img) => !img.isUploaded).map((img) => img.file);

      const results = await uploadBulkImages(
        filesToUpload,
        receivingDate,
        (fileIndex, progress) => {
          setImages((prev) => {
            const newImages = [...prev];
            const uploadingIndex = prev.findIndex((img) => !img.isUploaded);
            if (uploadingIndex !== -1 && uploadingIndex + fileIndex < prev.length) {
              newImages[uploadingIndex + fileIndex].uploadProgress = progress.percentage;
            }
            return newImages;
          });
        }
      );

      // Update images with Cloudinary URLs
      setImages((prev) => {
        const newImages = [...prev];
        let resultIndex = 0;
        for (let i = 0; i < newImages.length; i++) {
          if (!newImages[i].isUploaded) {
            newImages[i].cloudinaryUrl = results[resultIndex].secure_url;
            newImages[i].isUploaded = true;
            newImages[i].uploadProgress = 100;
            resultIndex++;
          }
        }
        return newImages;
      });

      alert('Images uploaded successfully! Now click each image to add item details.');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageClick = (image: UploadedImage) => {
    if (!image.isUploaded) {
      alert('Please upload images to Cloudinary first');
      return;
    }

    if (image.hasItemData) {
      alert('Item data already added for this image');
      return;
    }

    setSelectedImage(image);
    setShowItemModal(true);
  };

  const handleItemSubmit = async (itemData: Partial<Item>) => {
    try {
      const newItem = await createItem(itemData as Omit<Item, 'id'>);

      // Mark image as having item data
      setImages((prev) =>
        prev.map((img) =>
          img === selectedImage
            ? { ...img, hasItemData: true, itemId: newItem.id }
            : img
        )
      );

      alert(`Item created successfully! Tracking: ${itemData.trackingNumber}`);
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const completedCount = images.filter((img) => img.hasItemData).length;
  const uploadedCount = images.filter((img) => img.isUploaded).length;

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Item Receiving
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">China Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Receiving</li>
            </ul>
          </div>

          {images.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-light-primary fs-6">
                {uploadedCount} / {images.length} uploaded
              </span>
              <span className="badge badge-light-success fs-6">
                {completedCount} / {images.length} completed
              </span>
            </div>
          )}
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Step 1: Receiving Information */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">Step 1: Receiving Information</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-12">
                  <label className="form-label required">Receiving Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={receivingDate}
                    onChange={(e) => setReceivingDate(e.target.value)}
                  />
                  <div className="form-text">
                    Date when items are scanned and received in China warehouse
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Upload Images */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">Step 2: Upload Item Photos</h3>
            </div>
            <div className="card-body">
              <FileUpload
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple={true}
                maxSize={10}
                disabled={isUploading}
              />

              {images.length > 0 && !isUploading && uploadedCount < images.length && (
                <div className="mt-5 text-center">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleUploadToCloudinary}
                  >
                    <i className="bi bi-cloud-upload me-2"></i>
                    Upload {images.length - uploadedCount} Images to Cloudinary
                  </button>
                </div>
              )}

              {isUploading && (
                <div className="alert alert-info mt-5">
                  <div className="d-flex align-items-center">
                    <span className="spinner-border spinner-border-sm me-3"></span>
                    <span>Uploading images to Cloudinary...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Image Grid */}
          {images.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Step 3: Add Item Details (Click each image)
                </h3>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {images.map((image, index) => (
                    <div key={index} className="col-md-3 col-sm-6">
                      <div
                        className={`card card-flush h-100 cursor-pointer ${
                          image.hasItemData ? 'border-success border-2' : ''
                        }`}
                        onClick={() => handleImageClick(image)}
                      >
                        <div className="card-body p-2">
                          <div className="position-relative">
                            <img
                              src={image.preview}
                              alt={`Upload ${index + 1}`}
                              className="w-100 rounded"
                              style={{ height: '150px', objectFit: 'cover' }}
                            />

                            {/* Upload Progress */}
                            {!image.isUploaded && image.uploadProgress > 0 && (
                              <div
                                className="position-absolute bottom-0 start-0 w-100 bg-primary"
                                style={{ height: '4px' }}
                              >
                                <div
                                  className="bg-success h-100"
                                  style={{ width: `${image.uploadProgress}%` }}
                                ></div>
                              </div>
                            )}

                            {/* Status Badges */}
                            <div className="position-absolute top-0 end-0 m-2">
                              {image.hasItemData && (
                                <span className="badge badge-success">
                                  <i className="bi bi-check-circle"></i> Complete
                                </span>
                              )}
                              {image.isUploaded && !image.hasItemData && (
                                <span className="badge badge-warning">
                                  <i className="bi bi-exclamation-circle"></i> Add Details
                                </span>
                              )}
                              {!image.isUploaded && (
                                <span className="badge badge-secondary">
                                  <i className="bi bi-clock"></i> Pending
                                </span>
                              )}
                            </div>

                            {/* Remove Button */}
                            {!image.hasItemData && (
                              <button
                                className="btn btn-sm btn-icon btn-danger position-absolute top-0 start-0 m-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(index);
                                }}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            )}
                          </div>

                          <div className="mt-2 text-center">
                            <small className="text-muted">
                              {image.file.name.substring(0, 20)}
                              {image.file.name.length > 20 ? '...' : ''}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Form Modal */}
      {selectedImage && (
        <ItemFormModal
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setSelectedImage(null);
          }}
          onSubmit={handleItemSubmit}
          imageUrl={selectedImage.cloudinaryUrl || selectedImage.preview}
          receivingDate={receivingDate}
        />
      )}
    </div>
  );
}
