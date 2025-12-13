import { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import { uploadBulkImages } from '../../services/cloudinary';
import { createItem } from '../../services/airtable';
import { useToast } from '../../context/ToastContext';

interface UploadedImage {
  file: File;
  preview: string;
  cloudinaryUrl?: string;
  isUploaded: boolean;
  uploadProgress: number;
}

export default function ReceivingPage() {
  const { showToast } = useToast();
  const [receivingDate, setReceivingDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    // Create preview images immediately
    const newImages: UploadedImage[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isUploaded: false,
      uploadProgress: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
    setIsUploading(true);

    try {
      // Upload to Cloudinary immediately
      const results = await uploadBulkImages(
        files,
        receivingDate,
        (fileIndex, progress) => {
          setImages((prev) => {
            const newImages = [...prev];
            // Find the newly added images (last N items)
            const startIndex = prev.length - files.length;
            const targetIndex = startIndex + fileIndex;
            if (targetIndex >= 0 && targetIndex < newImages.length) {
              newImages[targetIndex].uploadProgress = progress.percentage;
            }
            return newImages;
          });
        }
      );

      // Update images with Cloudinary URLs
      setImages((prev) => {
        const newImages = [...prev];
        const startIndex = newImages.length - files.length;
        results.forEach((result, index) => {
          const targetIndex = startIndex + index;
          if (targetIndex >= 0 && targetIndex < newImages.length) {
            newImages[targetIndex].cloudinaryUrl = result.secure_url;
            newImages[targetIndex].isUploaded = true;
            newImages[targetIndex].uploadProgress = 100;
          }
        });
        return newImages;
      });

      // Create placeholder items in Airtable with photos for Ghana team
      // IMPORTANT: Group photos in PAIRS (2 angles of same product) to avoid double pricing
      // Create ONE item per 2 photos instead of ONE item per photo
      const itemCount = Math.ceil(results.length / 2);

      for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        const photoIndex1 = itemIndex * 2;
        const photoIndex2 = photoIndex1 + 1;

        // Collect photos for this item (1 or 2 photos)
        const itemPhotos = [];
        if (photoIndex1 < results.length) {
          itemPhotos.push({ url: results[photoIndex1].secure_url, order: 0 });
        }
        if (photoIndex2 < results.length) {
          itemPhotos.push({ url: results[photoIndex2].secure_url, order: 1 });
        }

        // Create one item with both photos (no container - admin will assign later)
        await createItem({
          photos: itemPhotos,
          receivingDate: receivingDate,
          status: 'china_warehouse',
          trackingNumber: `TEMP-${Date.now()}-${itemIndex}`, // Temporary tracking number - Admin will update
          // Minimal required fields - Ghana team will add the rest
          length: 0,
          width: 0,
          height: 0,
          dimensionUnit: 'cm',
          cbm: 0,
          shippingMethod: 'sea',
          weight: 0,
          weightUnit: 'kg',
          costUSD: 0,
          costCedis: 0,
          customerId: '', // No customer assigned yet
          isDamaged: false,
          isMissing: false,
        } as any); // Using 'as any' to bypass strict typing for placeholder items
      }

      showToast(
        'success',
        'Upload Successful',
        `${files.length} image${files.length > 1 ? 's' : ''} uploaded! Created ${itemCount} item${itemCount > 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('error', 'Upload Failed', 'Upload failed. Please try again.');

      // Remove the failed uploads
      setImages((prev) => {
        const newImages = [...prev];
        return newImages.filter((img) => img.isUploaded || !files.includes(img.file));
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!window.confirm('Remove this image?')) return;

    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadedCount = images.filter((img) => img.isUploaded).length;

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Upload Item Photos
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">China Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Photo Upload</li>
            </ul>
          </div>

          {images.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-light-success fs-6">
                {uploadedCount} / {images.length} uploaded
              </span>
            </div>
          )}
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">

          {/* Instructions Card */}
          <div className="card mb-5 bg-light-info">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle fs-2x text-info me-4"></i>
                <div>
                  <h4 className="mb-2 text-info">China Team - Photo Upload Only</h4>
                  <p className="mb-0 text-gray-700">
                    <strong>Workflow:</strong> Upload photos of received items only.
                    Admins will handle all container assignments and packaging.
                    Ghana team will add detailed information (tracking numbers, dimensions, costs, customer assignment).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Receiving Date */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">Step 1: Set Receiving Date</h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label required">Receiving Date</label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    value={receivingDate}
                    onChange={(e) => setReceivingDate(e.target.value)}
                  />
                  <div className="form-text">
                    Date when items arrived at China warehouse
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Upload Photos */}
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

              <div className="alert alert-light-primary mt-4 d-flex align-items-center">
                <i className="bi bi-lightbulb fs-2x me-3"></i>
                <div>
                  <div className="fw-bold mb-1">Tips for better photos:</div>
                  <ul className="mb-0">
                    <li>Take clear photos showing the full item</li>
                    <li>Include any tracking numbers or labels visible on packages</li>
                    <li>You can upload multiple images at once</li>
                    <li>Photos will automatically upload to Cloudinary</li>
                  </ul>
                </div>
              </div>

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

          {/* Step 3: Uploaded Images Grid */}
          {images.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Uploaded Images ({uploadedCount} of {images.length})
                </h3>
              </div>
              <div className="card-body">
                <div className="row g-5">
                  {images.map((image, index) => (
                    <div key={index} className="col-md-3 col-sm-6">
                      <div className="card card-flush h-100">
                        <div className="card-body p-2">
                          <div className="position-relative">
                            <img
                              src={image.preview}
                              alt={`Upload ${index + 1}`}
                              className="w-100 rounded"
                              style={{ height: '200px', objectFit: 'cover' }}
                            />

                            {/* Upload Progress */}
                            {!image.isUploaded && image.uploadProgress > 0 && (
                              <div
                                className="position-absolute bottom-0 start-0 w-100 bg-light"
                                style={{ height: '6px' }}
                              >
                                <div
                                  className="bg-success h-100"
                                  style={{ width: `${image.uploadProgress}%` }}
                                ></div>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="position-absolute top-0 end-0 m-2">
                              {image.isUploaded ? (
                                <span className="badge badge-success">
                                  <i className="bi bi-check-circle"></i> Uploaded
                                </span>
                              ) : (
                                <span className="badge badge-warning">
                                  <i className="bi bi-clock"></i> Uploading...
                                </span>
                              )}
                            </div>

                            {/* Remove Button */}
                            {image.isUploaded && (
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

                          <div className="mt-2">
                            <div className="text-muted fs-7 text-center">
                              {image.file.name.substring(0, 25)}
                              {image.file.name.length > 25 ? '...' : ''}
                            </div>
                            {image.isUploaded && (
                              <div className="text-center mt-1">
                                <span className="badge badge-light-success">
                                  Ready for Ghana Team
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {uploadedCount === images.length && images.length > 0 && (
                  <div className="alert alert-success mt-5 d-flex align-items-center">
                    <i className="bi bi-check-circle fs-2x me-3"></i>
                    <div>
                      <div className="fw-bold">All photos uploaded successfully!</div>
                      <div className="text-muted">
                        The Ghana team can now view these photos and add item details in their Tagging portal.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
