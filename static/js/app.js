// Informatica to PySpark Workflow UI JavaScript

// Global variables
let businessLogicData = null;
let uploadedFileInfo = null;
let executionResults = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const executeBtn = document.getElementById('executeBtn');
const alertContainer = document.getElementById('alertContainer');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Informatica to PySpark Workflow UI');
    
    loadBusinessLogic();
    setupEventListeners();
    setupDragAndDrop();
});

// Load business logic configuration
async function loadBusinessLogic() {
    try {
        showSpinner('businessLogicContainer');
        
        const response = await fetch('/api/business-logic');
        const data = await response.json();
        
        if (data.success) {
            businessLogicData = data.data;
            displayBusinessLogic(data.data);
            updatePySparkStatus(data.pyspark_available);
            createWorkflowDiagram(data.data.steps);
        } else {
            showAlert('error', 'Failed to load business logic: ' + data.error);
        }
    } catch (error) {
        console.error('Error loading business logic:', error);
        showAlert('error', 'Failed to connect to server. Please check if the Flask app is running.');
    }
}

// Display business logic in the UI
function displayBusinessLogic(data) {
    const container = document.getElementById('businessLogicContainer');
    
    let html = `
        <div class="mb-4">
            <h6 class="text-primary mb-3">${data.workflow_name}</h6>
            <p class="text-muted">${data.description}</p>
        </div>
        
        <div class="mb-4">
            <h6 class="text-muted mb-3">
                <i class="fas fa-list-ol me-2"></i>Transformation Steps
            </h6>
    `;
    
    data.steps.forEach(step => {
        const typeColor = getStepTypeColor(step.transformation_type);
        html += `
            <div class="step-item fade-in">
                <div class="d-flex align-items-start">
                    <div class="step-number">${step.step}</div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">${step.name}</h6>
                            <span class="badge ${typeColor} step-type-badge">${step.transformation_type}</span>
                        </div>
                        <p class="text-muted mb-2">${step.description}</p>
                        <small class="text-secondary">${step.details}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        
        <div class="mb-3">
            <h6 class="text-muted mb-3">
                <i class="fas fa-cogs me-2"></i>Configuration
            </h6>
    `;
    
    Object.entries(data.configuration).forEach(([key, value]) => {
        html += `
            <div class="config-item">
                <div class="config-key">${formatConfigKey(key)}</div>
                <div class="config-value">${formatConfigValue(value)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Get color for step type badge
function getStepTypeColor(type) {
    const colors = {
        'Source': 'bg-success',
        'Expression': 'bg-warning text-dark',
        'Sorter': 'bg-info',
        'Aggregator': 'bg-danger',
        'Target': 'bg-primary'
    };
    return colors[type] || 'bg-secondary';
}

// Format configuration key
function formatConfigKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format configuration value
function formatConfigValue(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return String(value);
}

// Create workflow diagram
function createWorkflowDiagram(steps) {
    const container = document.getElementById('workflowDiagram');
    
    let html = '<div class="workflow-flow">';
    
    steps.forEach((step, index) => {
        const stepClass = step.transformation_type.toLowerCase();
        html += `
            <div class="workflow-step ${stepClass}" title="${step.description}">
                <i class="fas ${getStepIcon(step.transformation_type)} me-2"></i>
                ${step.name}
            </div>
        `;
        
        if (index < steps.length - 1) {
            html += '<i class="fas fa-arrow-right workflow-arrow"></i>';
        }
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Get icon for step type
function getStepIcon(type) {
    const icons = {
        'Source': 'fa-database',
        'Expression': 'fa-calculator',
        'Sorter': 'fa-sort',
        'Aggregator': 'fa-compress-arrows-alt',
        'Target': 'fa-save'
    };
    return icons[type] || 'fa-cog';
}

// Setup event listeners
function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', () => fileInput.click());
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle file select
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle file upload
async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showAlert('error', 'Please select a CSV file.');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) { // 16MB limit
        showAlert('error', 'File size must be less than 16MB.');
        return;
    }
    
    try {
        showSpinner('uploadArea');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            uploadedFileInfo = data.file_info;
            displayFileInfo(data.file_info);
            enableExecuteButton();
            showAlert('success', data.message);
        } else {
            showAlert('error', 'Upload failed: ' + data.error);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('error', 'Upload failed. Please try again.');
    } finally {
        resetUploadArea();
    }
}

// Display file information
function displayFileInfo(fileInfo) {
    const container = document.getElementById('fileInfoContent');
    const section = document.getElementById('fileInfoSection');
    
    let html = `
        <div class="file-info-item">
            <div class="file-info-label">File Name:</div>
            <div>${fileInfo.filename}</div>
        </div>
        <div class="file-info-item">
            <div class="file-info-label">Total Rows:</div>
            <div>${fileInfo.total_rows.toLocaleString()}</div>
        </div>
        <div class="file-info-item">
            <div class="file-info-label">File Size:</div>
            <div>${formatFileSize(fileInfo.file_size)}</div>
        </div>
        <div class="file-info-item">
            <div class="file-info-label">Columns (${fileInfo.columns.length}):</div>
            <div class="mt-2">
                ${fileInfo.columns.map(col => `<span class="badge bg-light text-dark me-1 mb-1">${col}</span>`).join('')}
            </div>
        </div>
    `;
    
    if (fileInfo.sample_data && fileInfo.sample_data.length > 0) {
        html += `
            <div class="file-info-item">
                <div class="file-info-label mb-2">Sample Data:</div>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                ${fileInfo.columns.map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${fileInfo.sample_data.slice(0, 3).map(row => 
                                `<tr>${fileInfo.columns.map(col => 
                                    `<td class="text-truncate-custom" title="${row[col] || ''}">${row[col] || ''}</td>`
                                ).join('')}</tr>`
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    section.style.display = 'block';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Enable execute button
function enableExecuteButton() {
    executeBtn.disabled = false;
    executeBtn.classList.add('pulse');
}

// Execute workflow
async function executeWorkflow() {
    if (!uploadedFileInfo) {
        showAlert('error', 'Please upload a test data file first.');
        return;
    }
    
    try {
        executeBtn.disabled = true;
        executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Executing...';
        
        showExecutionStatus();
        
        const response = await fetch('/api/execute', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            executionResults = data.results;
            displayExecutionResults(data.results);
            showAlert('success', data.message);
        } else {
            showAlert('error', 'Execution failed: ' + data.error);
        }
    } catch (error) {
        console.error('Execution error:', error);
        showAlert('error', 'Execution failed. Please try again.');
    } finally {
        executeBtn.disabled = false;
        executeBtn.innerHTML = '<i class="fas fa-play me-2"></i>Run Workflow';
        executeBtn.classList.remove('pulse');
    }
}

// Show execution status
function showExecutionStatus() {
    const container = document.getElementById('executionContent');
    const section = document.getElementById('executionStatus');
    
    const steps = [
        'Reading source data...',
        'Applying transformations...',
        'Sorting and deduplicating...',
        'Aggregating data...',
        'Preparing results...'
    ];
    
    let html = '';
    steps.forEach((step, index) => {
        html += `
            <div class="execution-item">
                <div class="execution-icon">
                    <i class="fas fa-spinner fa-spin status-info"></i>
                </div>
                <div class="execution-text">${step}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    section.style.display = 'block';
}

// Display execution results
function displayExecutionResults(results) {
    const container = document.getElementById('resultsContent');
    const section = document.getElementById('resultsSection');
    
    let html = `
        <div class="mb-3">
            <div class="row">
                <div class="col-md-3">
                    <div class="text-center p-3 bg-primary text-white rounded">
                        <h4>${results.total_records}</h4>
                        <small>Total Records</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-info text-white rounded">
                        <h4>${results.columns.length}</h4>
                        <small>Columns</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-success text-white rounded">
                        <h4>${results.data.length}</h4>
                        <small>Displayed Rows</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-warning text-dark rounded">
                        <h6>${results.execution_method}</h6>
                        <small>Processing Engine</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (results.data && results.data.length > 0) {
        html += `
            <div class="results-table">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            ${results.columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${results.data.map(row => 
                            `<tr>${results.columns.map(col => 
                                `<td class="text-truncate-custom" title="${row[col] || ''}">${row[col] || ''}</td>`
                            ).join('')}</tr>`
                        ).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        if (results.total_records > results.data.length) {
            html += `
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Showing first ${results.data.length} rows of ${results.total_records} total records.
                    <a href="#" onclick="downloadResults()" class="alert-link">Download full results</a>.
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
}

// Open dashboard
function openDashboard() {
    if (!executionResults) {
        showAlert('error', 'No results available. Please execute the workflow first.');
        return;
    }
    
    // Open dashboard in new tab
    window.open('/dashboard', '_blank');
}

// Download results
async function downloadResults() {
    if (!executionResults) {
        showAlert('error', 'No results available to download.');
        return;
    }
    
    try {
        const response = await fetch('/api/download-results');
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workflow_results_${new Date().getTime()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('success', 'Results downloaded successfully.');
        } else {
            showAlert('error', 'Failed to download results.');
        }
    } catch (error) {
        console.error('Download error:', error);
        showAlert('error', 'Failed to download results.');
    }
}

// Reset workflow
async function resetWorkflow() {
    try {
        const response = await fetch('/api/reset');
        const data = await response.json();
        
        if (data.success) {
            // Reset UI state
            uploadedFileInfo = null;
            executionResults = null;
            
            // Reset UI elements
            document.getElementById('fileInfoSection').style.display = 'none';
            document.getElementById('executionStatus').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'none';
            
            executeBtn.disabled = true;
            executeBtn.classList.remove('pulse');
            
            resetUploadArea();
            fileInput.value = '';
            
            showAlert('success', data.message);
        } else {
            showAlert('error', 'Reset failed: ' + data.error);
        }
    } catch (error) {
        console.error('Reset error:', error);
        showAlert('error', 'Reset failed. Please try again.');
    }
}

// Reset upload area
function resetUploadArea() {
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
        <p class="text-muted">Drag & drop your CSV file here or click to browse</p>
        <button class="btn btn-outline-primary" onclick="document.getElementById('fileInput').click()">
            Choose File
        </button>
    `;
}

// Show alert
function showAlert(type, message) {
    const alertTypes = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-triangle',
        'warning': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertTypes[type]} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="fas ${icons[type]} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Show spinner
function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="spinner-container">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

// Update PySpark status
function updatePySparkStatus(available) {
    const statusElement = document.getElementById('pysparkStatus');
    if (available) {
        statusElement.innerHTML = '<span class="text-success">PySpark Available</span>';
    } else {
        statusElement.innerHTML = '<span class="text-warning">Demo Mode (PySpark Not Available)</span>';
    }
}
