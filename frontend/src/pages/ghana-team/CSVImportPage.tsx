import { useState } from 'react';
import { getAllItems, updateItem } from '../../services/airtable';
import type { Item, ShipmentStatus } from '../../types/index';

interface CSVRow {
  trackingNumber: string;
  status?: ShipmentStatus;
  containerNumber?: string;
  rowNumber: number;
}

interface ImportResult {
  trackingNumber: string;
  success: boolean;
  message: string;
  rowNumber: number;
}

export default function CSVImportPage() {
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setCSVFile(file);
      parseCSV(file);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        alert('CSV file is empty');
        return;
      }

      // Parse header
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const trackingIndex = header.findIndex((h) => h.includes('tracking'));
      const statusIndex = header.findIndex((h) => h.includes('status'));
      const containerIndex = header.findIndex((h) => h.includes('container'));

      if (trackingIndex === -1) {
        alert('CSV must have a "tracking" column');
        return;
      }

      // Parse data rows
      const data: CSVRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const trackingNumber = values[trackingIndex];

        if (!trackingNumber) continue;

        const row: CSVRow = {
          trackingNumber,
          rowNumber: i + 1,
        };

        // Parse status if present
        if (statusIndex !== -1 && values[statusIndex]) {
          const statusValue = values[statusIndex].toLowerCase().replace(/\s+/g, '_');
          const validStatuses: ShipmentStatus[] = [
            'china_warehouse',
            'in_transit',
            'arrived_ghana',
            'ready_for_pickup',
            'delivered',
            'picked_up',
          ];

          if (validStatuses.includes(statusValue as ShipmentStatus)) {
            row.status = statusValue as ShipmentStatus;
          }
        }

        // Parse container number if present
        if (containerIndex !== -1 && values[containerIndex]) {
          row.containerNumber = values[containerIndex];
        }

        data.push(row);
      }

      setCSVData(data);
      console.log('Parsed CSV data:', data);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      alert('No data to import');
      return;
    }

    if (!window.confirm(`Import ${csvData.length} tracking updates?`)) {
      return;
    }

    setImporting(true);
    setResults([]);
    setShowResults(true);

    try {
      // Get all items to match tracking numbers
      const allItems = await getAllItems();
      const itemMap = new Map<string, Item>();
      allItems.forEach((item) => {
        itemMap.set(item.trackingNumber.toLowerCase(), item);
      });

      const importResults: ImportResult[] = [];

      // Process each CSV row
      for (const row of csvData) {
        const item = itemMap.get(row.trackingNumber.toLowerCase());

        if (!item) {
          importResults.push({
            trackingNumber: row.trackingNumber,
            success: false,
            message: 'Tracking number not found in system',
            rowNumber: row.rowNumber,
          });
          continue;
        }

        try {
          const updateData: Partial<Item> = {};

          if (row.status) {
            updateData.status = row.status;
          }

          if (row.containerNumber) {
            updateData.containerNumber = row.containerNumber;
          }

          if (Object.keys(updateData).length === 0) {
            importResults.push({
              trackingNumber: row.trackingNumber,
              success: false,
              message: 'No update fields found (need status or container)',
              rowNumber: row.rowNumber,
            });
            continue;
          }

          await updateItem(item.id, updateData);

          const updates = [];
          if (updateData.status) updates.push(`status: ${updateData.status}`);
          if (updateData.containerNumber) updates.push(`container: ${updateData.containerNumber}`);

          importResults.push({
            trackingNumber: row.trackingNumber,
            success: true,
            message: `Updated ${updates.join(', ')}`,
            rowNumber: row.rowNumber,
          });
        } catch (error) {
          importResults.push({
            trackingNumber: row.trackingNumber,
            success: false,
            message: `Update failed: ${error}`,
            rowNumber: row.rowNumber,
          });
        }
      }

      setResults(importResults);

      const successCount = importResults.filter((r) => r.success).length;
      const failureCount = importResults.filter((r) => !r.success).length;

      alert(
        `Import complete!\n✅ ${successCount} successful\n❌ ${failureCount} failed`
      );
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setCSVFile(null);
    setCSVData([]);
    setResults([]);
    setShowResults(false);
  };

  const downloadTemplate = () => {
    const template = `tracking_number,status,container_number
TRACK001,in_transit,CONT-2024-001
TRACK002,arrived_ghana,CONT-2024-001
TRACK003,ready_for_pickup,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return (
    <div className="d-flex flex-column flex-column-fluid">
      <div id="kt_app_toolbar" className="app-toolbar py-3 py-lg-6">
        <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
          <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
            <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
              CSV Import - Tracking Updates
            </h1>
            <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
              <li className="breadcrumb-item text-muted">Ghana Team</li>
              <li className="breadcrumb-item">
                <span className="bullet bg-gray-500 w-5px h-2px"></span>
              </li>
              <li className="breadcrumb-item text-muted">CSV Import</li>
            </ul>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-light-info" onClick={downloadTemplate}>
              <i className="bi bi-download me-2"></i>
              Download Template
            </button>
          </div>
        </div>
      </div>

      <div id="kt_app_content" className="app-content flex-column-fluid">
        <div id="kt_app_content_container" className="app-container container-xxl">
          {/* Instructions */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                How to Use CSV Import
              </h3>
            </div>
            <div className="card-body">
              <div className="row g-5">
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="symbol symbol-circle symbol-50px me-3 bg-light-primary">
                      <span className="symbol-label fs-2 fw-bold text-primary">1</span>
                    </div>
                    <div>
                      <h5 className="mb-2">Download Template</h5>
                      <p className="text-muted fs-7">
                        Click "Download Template" to get the CSV format with example data
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="symbol symbol-circle symbol-50px me-3 bg-light-success">
                      <span className="symbol-label fs-2 fw-bold text-success">2</span>
                    </div>
                    <div>
                      <h5 className="mb-2">Fill Your Data</h5>
                      <p className="text-muted fs-7">
                        Add tracking numbers and status updates. Valid statuses: in_transit, arrived_ghana, ready_for_pickup, delivered
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="symbol symbol-circle symbol-50px me-3 bg-light-warning">
                      <span className="symbol-label fs-2 fw-bold text-warning">3</span>
                    </div>
                    <div>
                      <h5 className="mb-2">Upload & Import</h5>
                      <p className="text-muted fs-7">
                        Upload your CSV file and click "Import" to update all tracking statuses
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-light-info mt-5 d-flex align-items-center">
                <i className="bi bi-lightbulb fs-2x me-3"></i>
                <div>
                  <div className="fw-bold">CSV Format Requirements:</div>
                  <ul className="mb-0 mt-2">
                    <li>Must include "tracking_number" column (required)</li>
                    <li>Optional: "status" column (in_transit, arrived_ghana, ready_for_pickup, delivered, picked_up)</li>
                    <li>Optional: "container_number" column</li>
                    <li>File must be saved as .csv format</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="card mb-5">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-file-earmark-arrow-up me-2 text-success"></i>
                Upload CSV File
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8 mx-auto">
                  <div className="text-center mb-5">
                    <input
                      type="file"
                      id="csvFileInput"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="d-none"
                    />
                    <label
                      htmlFor="csvFileInput"
                      className="btn btn-lg btn-light-primary w-100"
                      style={{ cursor: 'pointer', minHeight: '100px' }}
                    >
                      <div className="d-flex flex-column align-items-center">
                        <i className="bi bi-cloud-upload fs-3x mb-3"></i>
                        <span className="fs-5 fw-bold">
                          {csvFile ? csvFile.name : 'Click to select CSV file'}
                        </span>
                        {csvFile && (
                          <span className="text-muted fs-7 mt-2">
                            {csvData.length} rows ready to import
                          </span>
                        )}
                      </div>
                    </label>
                  </div>

                  {csvFile && csvData.length > 0 && (
                    <div className="d-flex gap-3 justify-content-center">
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handleImport}
                        disabled={importing}
                      >
                        {importing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Importing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-upload me-2"></i>
                            Import {csvData.length} Updates
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-light btn-lg"
                        onClick={handleClear}
                        disabled={importing}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Data */}
          {csvData.length > 0 && !showResults && (
            <div className="card mb-5">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="bi bi-eye me-2 text-info"></i>
                  Preview Data ({csvData.length} rows)
                </h3>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-300 gy-4">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th>Row #</th>
                        <th>Tracking Number</th>
                        <th>Status</th>
                        <th>Container Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 20).map((row, index) => (
                        <tr key={index}>
                          <td>{row.rowNumber}</td>
                          <td className="fw-bold">{row.trackingNumber}</td>
                          <td>
                            {row.status ? (
                              <span className="badge badge-light-info">
                                {row.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {row.containerNumber ? (
                              <span className="badge badge-light">{row.containerNumber}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 20 && (
                    <div className="text-center text-muted mt-3">
                      Showing first 20 of {csvData.length} rows
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Import Results */}
          {showResults && results.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="bi bi-clipboard-check me-2 text-success"></i>
                  Import Results
                </h3>
                <div className="card-toolbar">
                  <span className="badge badge-light-success me-2">
                    {successCount} success
                  </span>
                  <span className="badge badge-light-danger">
                    {failureCount} failed
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-row-bordered table-row-gray-300 gy-4">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th>Row #</th>
                        <th>Tracking Number</th>
                        <th>Status</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td>{result.rowNumber}</td>
                          <td className="fw-bold">{result.trackingNumber}</td>
                          <td>
                            {result.success ? (
                              <span className="badge badge-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Success
                              </span>
                            ) : (
                              <span className="badge badge-danger">
                                <i className="bi bi-x-circle me-1"></i>
                                Failed
                              </span>
                            )}
                          </td>
                          <td className={result.success ? 'text-success' : 'text-danger'}>
                            {result.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-center mt-5">
                  <button className="btn btn-primary" onClick={handleClear}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Import Another File
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
