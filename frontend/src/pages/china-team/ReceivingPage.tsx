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
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
    showToast('info', 'Image Removed', 'The image has been removed from the upload list');
  };

  const uploadedCount = images.filter((img) => img.isUploaded).length;

  return (
    <>
      {/* Toolbar */}
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          {/* Page title */}
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              Upload Item Photos
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">
                <a href="/china/receiving" className="text-muted text-hover-primary">China Team</a>
              </li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">Photo Upload</li>
            </ul>
          </div>
          {/* end Page title */}

          {/* Actions */}
          {images.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-light-success fs-6">
                {uploadedCount} / {images.length} uploaded
              </span>
            </div>
          )}
          {/* end Actions */}
        </div>
      </div>
      {/* end Toolbar */}

      {/* Content */}
      <div id="kt_app_content" className="app-content flex-column-fluid">

        {/* Content container */}
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Form */}
          <form id="kt_ecommerce_add_product_form" className="form d-flex flex-column flex-lg-row">
            {/* Aside column */}
            <div className="d-flex flex-column gap-7 gap-lg-10 w-100 w-lg-300px mb-7 me-lg-10">
              {/* Receiving Date */}
              <div className="card card-flush py-4">
                {/* Card header */}
                <div className="card-header">
                  <div className="card-title">
                    <h2>Receiving Date</h2>
                  </div>
                </div>
                {/* end Card header */}

                {/* Card body */}
                <div className="card-body pt-0">
                  {/* Date Input */}
                  <label className="form-label required">Date Received</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={receivingDate}
                    onChange={(e) => setReceivingDate(e.target.value)}
                  />
                  {/* end Date Input */}

                  {/* Description */}
                  <div className="text-muted fs-7">
                    Date when items arrived at China warehouse
                  </div>
                  {/* end Description */}
                </div>
                {/* end Card body */}
              </div>
              {/* end Receiving Date */}

              {/* Upload Status */}
              {images.length > 0 && (
                <div className="card card-flush py-4">
                  {/* Card header */}
                  <div className="card-header">
                    <div className="card-title">
                      <h2>Upload Progress</h2>
                    </div>
                    <div className="card-toolbar">
                      <div className={`rounded-circle ${uploadedCount === images.length ? 'bg-success' : 'bg-warning'} w-15px h-15px`}></div>
                    </div>
                  </div>
                  {/* end Card header */}

                  {/* Card body */}
                  <div className="card-body pt-0">
                    <div className="fs-6 fw-bold mb-2">
                      {uploadedCount} of {images.length} uploaded
                    </div>
                    <div className="progress h-6px">
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${(uploadedCount / images.length) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-muted fs-7 mt-2">
                      {uploadedCount === images.length
                        ? 'All photos uploaded successfully!'
                        : 'Upload in progress...'}
                    </div>
                  </div>
                  {/* end Card body */}
                </div>
              )}
              {/* end Upload Status */}
            </div>
            {/* end Aside column */}

            {/* Main column */}
            <div className="d-flex flex-column flex-row-fluid gap-7 gap-lg-10">
              {/* Media Upload */}
              <div className="card card-flush py-4">
                {/* Card header */}
                <div className="card-header">
                  <div className="card-title">
                    <h2>Media</h2>
                  </div>
                </div>
                {/* end Card header */}

                {/* Card body */}
                <div className="card-body pt-0">
                  {/* File Upload */}
                  <div className="fv-row mb-2">
                    <FileUpload
                      onFilesSelected={handleFilesSelected}
                      accept="image/*"
                      multiple={true}
                      maxSize={10}
                      disabled={isUploading}
                    />
                  </div>
                  {/* end File Upload */}

                  {/* Description */}
                  <div className="text-muted fs-7">
                    Upload item photos from the China warehouse. You can select multiple images at once.
                  </div>
                  {/* end Description */}

                  {/* Tips */}
                  <div className="notice d-flex bg-light-primary rounded border-primary border border-dashed p-6 mt-6">
                    <i className="ki-duotone ki-information fs-2tx text-primary me-4">
                      <span className="path1"></span>
                      <span className="path2"></span>
                      <span className="path3"></span>
                    </i>
                    <div className="d-flex flex-stack flex-grow-1">
                      <div className="fw-semibold">
                        <h4 className="text-gray-900 fw-bold">Photo Upload Tips</h4>
                        <div className="fs-6 text-gray-700">
                          • Take clear photos showing the full item<br />
                          • Include any tracking numbers or labels visible on packages<br />
                          • Upload 2 photos per item (front and back views recommended)
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end Tips */}

                  {/* Upload Status */}
                  {isUploading && (
                    <div className="alert alert-info d-flex align-items-center mt-5">
                      <i className="ki-duotone ki-shield-tick fs-2hx text-info me-4">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                      <div className="d-flex flex-column">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        <span>Uploading images to Cloudinary...</span>
                      </div>
                    </div>
                  )}
                  {/* end Upload Status */}
                </div>
                {/* end Card body */}
              </div>
              {/* end Media Upload */}

              {/* Uploaded Images Gallery */}
              {images.length > 0 && (
                <div className="card card-flush py-4">
                  {/* Card header */}
                  <div className="card-header">
                    <div className="card-title">
                      <h2>Uploaded Images</h2>
                      <span className="text-muted ms-3 fs-7">({uploadedCount} of {images.length})</span>
                    </div>
                  </div>
                  {/* end Card header */}

                  {/* Card body */}
                  <div className="card-body pt-0">
                    <div className="row g-6 g-xl-9">
                      {images.map((image, index) => (
                        <div key={index} className="col-md-6 col-lg-4 col-xl-3">
                          {/* Image card */}
                          <div className="card h-100 card-flush border-0 shadow-sm">
                            <div className="card-body p-0">
                              <div className="position-relative overflow-hidden rounded">
                                <img
                                  src={image.preview}
                                  alt={`Upload ${index + 1}`}
                                  className="w-100"
                                  style={{ height: '200px', objectFit: 'cover' }}
                                />

                                {/* Upload Progress Bar */}
                                {!image.isUploaded && image.uploadProgress > 0 && (
                                  <div className="position-absolute bottom-0 start-0 w-100">
                                    <div className="progress h-4px">
                                      <div
                                        className="progress-bar bg-success"
                                        role="progressbar"
                                        style={{ width: `${image.uploadProgress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                {/* Status Badge */}
                                <div className="position-absolute top-0 end-0 m-3">
                                  {image.isUploaded ? (
                                    <span className="badge badge-success">
                                      <i className="ki-duotone ki-check-circle fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                      </i>
                                      Uploaded
                                    </span>
                                  ) : (
                                    <span className="badge badge-warning">
                                      <i className="ki-duotone ki-time fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                      </i>
                                      Uploading...
                                    </span>
                                  )}
                                </div>

                                {/* Remove Button */}
                                {image.isUploaded && (
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-active-color-primary position-absolute top-0 start-0 m-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImage(index);
                                    }}
                                  >
                                    <i className="ki-duotone ki-cross fs-2">
                                      <span className="path1"></span>
                                      <span className="path2"></span>
                                    </i>
                                  </button>
                                )}
                              </div>

                              {/* Image info */}
                              <div className="p-4">
                                <div className="text-gray-800 fw-bold fs-7 text-center text-truncate">
                                  {image.file.name}
                                </div>
                                {image.isUploaded && (
                                  <div className="text-center mt-2">
                                    <span className="badge badge-light-success">
                                      Ready for Ghana Team
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* end Image info */}
                            </div>
                          </div>
                          {/* end Image card */}
                        </div>
                      ))}
                    </div>

                    {/* Success Notice */}
                    {uploadedCount === images.length && images.length > 0 && (
                      <div className="notice d-flex bg-light-success rounded border-success border border-dashed p-6 mt-6">
                        <i className="ki-duotone ki-check-circle fs-2tx text-success me-4">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                        <div className="d-flex flex-stack flex-grow-1">
                          <div className="fw-semibold">
                            <h4 className="text-gray-900 fw-bold">All Photos Uploaded Successfully!</h4>
                            <div className="fs-6 text-gray-700">
                              The Ghana team can now view these photos and add item details in their Tagging portal.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* end Success Notice */}
                  </div>
                  {/* end Card body */}
                </div>
              )}
              {/* end Uploaded Images Gallery */}
            </div>
            {/* end Main column */}
          </form>
          {/* end Form */}
        </div>
        {/* end Content container */}
      </div>
      {/* end Content */}
    </>
  );
}
