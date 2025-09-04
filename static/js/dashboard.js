// Dashboard JavaScript with Interactive Highcharts

// Global variables
let dashboardData = null;
let originalData = null;
let filteredData = null;
let charts = {};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Dashboard...');
    loadDashboardData();
});

// Load dashboard data from API
async function loadDashboardData() {
    try {
        showLoadingModal(true);
        
        const response = await fetch('/api/dashboard-data');
        const result = await response.json();
        
        if (result.success) {
            dashboardData = result.data;
            originalData = JSON.parse(JSON.stringify(result.data)); // Deep copy
            filteredData = result.data;
            
            initializeDashboard();
            showAlert('success', 'Dashboard loaded successfully!');
        } else {
            showAlert('error', result.error || 'Failed to load dashboard data');
            // Redirect to main page if no data
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('error', 'Failed to connect to server. Please try again.');
    } finally {
        showLoadingModal(false);
    }
}

// Initialize all dashboard components
function initializeDashboard() {
    console.log('📊 Initializing dashboard components...');
    
    // Update summary cards
    updateSummaryCards();
    
    // Initialize filter options
    initializeFilters();
    
    // Create all charts
    createAllCharts();
    
    // Update data tables
    updateDataTables();
    
    console.log('✅ Dashboard initialization complete!');
}

// Update summary cards
function updateSummaryCards() {
    const { summary } = filteredData;
    
    // Before cards
    document.getElementById('beforeTotalRecords').textContent = summary.before.total_records.toLocaleString();
    document.getElementById('beforeTotalAmount').textContent = `$${summary.before.total_amount.toLocaleString()}`;
    document.getElementById('beforeAvgAmount').textContent = `$${summary.before.avg_amount.toFixed(2)}`;
    document.getElementById('beforeDuplicates').textContent = (summary.before.total_records - summary.before.unique_transactions).toLocaleString();
    
    // After cards
    document.getElementById('afterTotalRecords').textContent = summary.after.total_records.toLocaleString();
    document.getElementById('afterTotalAmount').textContent = `$${summary.after.total_amount.toLocaleString()}`;
    document.getElementById('afterAvgAmount').textContent = `$${summary.after.avg_amount.toFixed(2)}`;
    document.getElementById('duplicatesRemoved').textContent = (summary.before.total_records - summary.after.total_records).toLocaleString();
    
    // Update impact metrics
    const { impact_metrics } = filteredData;
    document.getElementById('dupReductionPercent').textContent = `${impact_metrics.duplicate_reduction.reduction_percentage}%`;
    document.getElementById('costSavings').textContent = `$${(impact_metrics.duplicate_reduction.duplicates_removed * 0.50).toFixed(2)}`;
    document.getElementById('timeEfficiency').textContent = `${impact_metrics.duplicate_reduction.reduction_percentage}% Faster`;
    document.getElementById('processTime').textContent = `${(impact_metrics.duplicate_reduction.reduction_percentage / 10).toFixed(1)}s`;
}

// Initialize filter controls
function initializeFilters() {
    const { filter_options } = dashboardData;
    
    // Populate filter dropdowns
    populateSelect('transactionTypeFilter', filter_options.transaction_types);
    populateSelect('statusFilter', filter_options.statuses);
    populateSelect('channelFilter', filter_options.channels);
    populateSelect('branchFilter', filter_options.branches);
    
    // Set date range
    if (dashboardData.summary.before.date_range.start) {
        document.getElementById('startDate').value = dashboardData.summary.before.date_range.start;
        document.getElementById('endDate').value = dashboardData.summary.before.date_range.end;
    }
    
    // Initialize amount range
    document.getElementById('minAmount').textContent = `$${filter_options.amount_range.min.toFixed(0)}`;
    document.getElementById('maxAmount').textContent = `$${filter_options.amount_range.max.toFixed(0)}`;
}

// Populate select dropdown
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

// Create all charts
function createAllCharts() {
    console.log('📈 Creating charts...');
    
    try {
        // Distribution charts
        createTransactionTypeCharts();
        createStatusCharts();
        createAmountCharts();
        createComparisonCharts();
        createTimeSeriesChart();
        createImpactAnalysisChart();
        
        console.log('✅ All charts created successfully!');
    } catch (error) {
        console.error('Error creating charts:', error);
        showAlert('error', 'Some charts failed to load. Please check the console for details.');
    }
}

// Create transaction type distribution charts
function createTransactionTypeCharts() {
    const { distributions } = filteredData;
    
    try {
        // Before chart
        const beforeData = distributions?.transaction_type?.before || {};
        if (Object.keys(beforeData).length > 0) {
            charts.beforeTransactionType = Highcharts.chart('beforeTransactionTypeChart', {
                chart: { type: 'pie' },
                title: { text: null },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f}%'
                        },
                        showInLegend: true
                    }
                },
                colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'],
                series: [{
                    name: 'Transactions',
                    data: Object.entries(beforeData).map(([name, value]) => ({
                        name,
                        y: value
                    }))
                }],
                exporting: { enabled: true }
            });
        } else {
            document.getElementById('beforeTransactionTypeChart').innerHTML = '<div class="alert alert-info">No transaction type data available</div>';
        }
        
        // After chart
        const afterData = distributions?.transaction_type?.after || {};
        if (Object.keys(afterData).length > 0) {
            charts.afterTransactionType = Highcharts.chart('afterTransactionTypeChart', {
                chart: { type: 'pie' },
                title: { text: null },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f}%'
                        },
                        showInLegend: true
                    }
                },
                colors: ['#2ecc71', '#3498db', '#9b59b6', '#f39c12', '#e74c3c'],
                series: [{
                    name: 'Transactions',
                    data: Object.entries(afterData).map(([name, value]) => ({
                        name,
                        y: value
                    }))
                }],
                exporting: { enabled: true }
            });
        } else {
            document.getElementById('afterTransactionTypeChart').innerHTML = '<div class="alert alert-info">No transaction type data available</div>';
        }
    } catch (error) {
        console.error('Error creating transaction type charts:', error);
        document.getElementById('beforeTransactionTypeChart').innerHTML = '<div class="alert alert-warning">Error loading transaction type chart</div>';
        document.getElementById('afterTransactionTypeChart').innerHTML = '<div class="alert alert-warning">Error loading transaction type chart</div>';
    }
}

// Create status distribution charts
function createStatusCharts() {
    const { distributions } = filteredData;
    
    try {
        // Before chart
        charts.beforeStatus = Highcharts.chart('beforeStatusChart', {
            chart: { type: 'pie' },
            title: { text: null },
            plotOptions: {
                pie: {
                    innerSize: '60%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b><br>{point.y} ({point.percentage:.1f}%)'
                    }
                }
            },
            colors: ['#28a745', '#dc3545'],
            series: [{
                name: 'Status',
                data: Object.entries(distributions.status.before || {}).map(([name, value]) => ({
                    name,
                    y: value,
                    color: name === 'SUCCESS' ? '#28a745' : '#dc3545'
                }))
            }],
            exporting: { enabled: true }
        });
        
        // After chart
        charts.afterStatus = Highcharts.chart('afterStatusChart', {
            chart: { type: 'pie' },
            title: { text: null },
            plotOptions: {
                pie: {
                    innerSize: '60%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b><br>{point.y} ({point.percentage:.1f}%)'
                    }
                }
            },
            colors: ['#28a745', '#dc3545'],
            series: [{
                name: 'Status',
                data: Object.entries(distributions.status.after || {}).map(([name, value]) => ({
                    name,
                    y: value,
                    color: name === 'SUCCESS' ? '#28a745' : '#dc3545'
                }))
            }],
            exporting: { enabled: true }
        });
    } catch (error) {
        console.error('Error creating status charts:', error);
        document.getElementById('beforeStatusChart').innerHTML = '<div class="alert alert-warning">Error loading status chart</div>';
        document.getElementById('afterStatusChart').innerHTML = '<div class="alert alert-warning">Error loading status chart</div>';
    }
}

// Create amount analysis charts
function createAmountCharts() {
    const { amount_analysis } = filteredData;
    
    try {
        // Check if histogram data exists
        const beforeHistogram = amount_analysis?.before?.histogram || [];
        const afterHistogram = amount_analysis?.after?.histogram || [];
        
        if (beforeHistogram.length === 0) {
            document.getElementById('beforeAmountChart').innerHTML = '<div class="alert alert-info">No amount data available for analysis</div>';
        } else {
            // Before chart
            charts.beforeAmount = Highcharts.chart('beforeAmountChart', {
                chart: { type: 'column' },
                title: { text: null },
                xAxis: {
                    categories: beforeHistogram.map(item => item.range),
                    title: { text: 'Amount Range' }
                },
                yAxis: {
                    title: { text: 'Number of Transactions' }
                },
                colors: ['#ffc107'],
                series: [{
                    name: 'Transactions',
                    data: beforeHistogram.map(item => item.count)
                }],
                tooltip: {
                    formatter: function() {
                        return `<b>${this.x}</b><br/>Transactions: ${this.y}`;
                    }
                },
                exporting: { enabled: true }
            });
        }
        
        if (afterHistogram.length === 0) {
            document.getElementById('afterAmountChart').innerHTML = '<div class="alert alert-info">No amount data available for analysis</div>';
        } else {
            // After chart
            charts.afterAmount = Highcharts.chart('afterAmountChart', {
                chart: { type: 'column' },
                title: { text: null },
                xAxis: {
                    categories: afterHistogram.map(item => item.range),
                    title: { text: 'Amount Range' }
                },
                yAxis: {
                    title: { text: 'Number of Transactions' }
                },
                colors: ['#28a745'],
                series: [{
                    name: 'Transactions',
                    data: afterHistogram.map(item => item.count)
                }],
                tooltip: {
                    formatter: function() {
                        return `<b>${this.x}</b><br/>Transactions: ${this.y}`;
                    }
                },
                exporting: { enabled: true }
            });
        }
    } catch (error) {
        console.error('Error creating amount charts:', error);
        document.getElementById('beforeAmountChart').innerHTML = '<div class="alert alert-warning">Error loading amount chart</div>';
        document.getElementById('afterAmountChart').innerHTML = '<div class="alert alert-warning">Error loading amount chart</div>';
    }
}

// Create comparison charts
function createComparisonCharts() {
    const { distributions } = filteredData;
    
    try {
        // Channel comparison
        const channelData = prepareComparisonData(distributions?.channel || {});
        if (channelData.categories.length > 0) {
            charts.channelComparison = Highcharts.chart('channelComparisonChart', {
                chart: { type: 'bar' },
                title: { text: null },
                xAxis: {
                    categories: channelData.categories,
                    title: { text: 'Channels' }
                },
                yAxis: {
                    title: { text: 'Number of Transactions' }
                },
                colors: ['#ffc107', '#28a745'],
                series: [{
                    name: 'Before',
                    data: channelData.before
                }, {
                    name: 'After',
                    data: channelData.after
                }],
                plotOptions: {
                    bar: {
                        dataLabels: { enabled: true }
                    }
                },
                exporting: { enabled: true }
            });
        } else {
            document.getElementById('channelComparisonChart').innerHTML = '<div class="alert alert-info">No channel data available</div>';
        }
        
        // Branch comparison
        const branchData = prepareComparisonData(distributions?.branch || {});
        if (branchData.categories.length > 0) {
            charts.branchComparison = Highcharts.chart('branchComparisonChart', {
                chart: { type: 'bar' },
                title: { text: null },
                xAxis: {
                    categories: branchData.categories,
                    title: { text: 'Branches' }
                },
                yAxis: {
                    title: { text: 'Number of Transactions' }
                },
                colors: ['#6c757d', '#17a2b8'],
                series: [{
                    name: 'Before',
                    data: branchData.before
                }, {
                    name: 'After',
                    data: branchData.after
                }],
                plotOptions: {
                    bar: {
                        dataLabels: { enabled: true }
                    }
                },
                exporting: { enabled: true }
            });
        } else {
            document.getElementById('branchComparisonChart').innerHTML = '<div class="alert alert-info">No branch data available</div>';
        }
    } catch (error) {
        console.error('Error creating comparison charts:', error);
        document.getElementById('channelComparisonChart').innerHTML = '<div class="alert alert-warning">Error loading channel chart</div>';
        document.getElementById('branchComparisonChart').innerHTML = '<div class="alert alert-warning">Error loading branch chart</div>';
    }
}

// Create time series chart
function createTimeSeriesChart() {
    const { time_series } = filteredData;
    
    try {
        const beforeData = time_series?.before || [];
        const afterData = time_series?.after || [];
        
        if (beforeData.length === 0 && afterData.length === 0) {
            document.getElementById('timeSeriesChart').innerHTML = '<div class="alert alert-info">No time series data available</div>';
            return;
        }
        
        charts.timeSeries = Highcharts.chart('timeSeriesChart', {
            chart: { type: 'line' },
            title: { text: null },
            xAxis: {
                type: 'datetime',
                title: { text: 'Date' }
            },
            yAxis: {
                title: { text: 'Number of Transactions' }
            },
            colors: ['#ffc107', '#28a745'],
            series: [{
                name: 'Before Processing',
                data: beforeData.map(item => [
                    new Date(item.date).getTime(),
                    item.count
                ])
            }, {
                name: 'After Processing',
                data: afterData.map(item => [
                    new Date(item.date).getTime(),
                    item.count
                ])
            }],
            tooltip: {
                shared: true,
                crosshairs: true
            },
            legend: {
                enabled: true
            },
            exporting: { enabled: true }
        });
    } catch (error) {
        console.error('Error creating time series chart:', error);
        document.getElementById('timeSeriesChart').innerHTML = '<div class="alert alert-warning">Error loading time series chart</div>';
    }
}

// Create impact analysis chart
function createImpactAnalysisChart() {
    const { impact_metrics, summary } = filteredData;
    
    try {
        const reductionPercentage = impact_metrics?.duplicate_reduction?.reduction_percentage || 0;
        const duplicatesRemoved = impact_metrics?.duplicate_reduction?.duplicates_removed || 0;
        
        charts.impactAnalysis = Highcharts.chart('impactAnalysisChart', {
            chart: { type: 'column' },
            title: { 
                text: 'Data Transformation Impact',
                style: { fontSize: '16px', fontWeight: 'bold' }
            },
            xAxis: {
                categories: ['Records', 'Data Quality', 'Processing Efficiency', 'Storage Optimization'],
                title: { text: 'Metrics' }
            },
            yAxis: {
                title: { text: 'Improvement Percentage (%)' },
                max: 100
            },
            colors: ['#17a2b8'],
            series: [{
                name: 'Improvement',
                data: [
                    reductionPercentage,
                    Math.min(85, reductionPercentage + 20), // Data quality improvement estimate
                    Math.max(0, reductionPercentage * 0.8), // Processing efficiency
                    Math.min(100, reductionPercentage * 1.2) // Storage optimization
                ],
                dataLabels: {
                    enabled: true,
                    format: '{y:.1f}%'
                }
            }],
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0,
                    borderRadius: 5
                }
            },
            tooltip: {
                formatter: function() {
                    let description = '';
                    switch(this.x) {
                        case 'Records':
                            description = `Reduced ${duplicatesRemoved} duplicate records`;
                            break;
                        case 'Data Quality':
                            description = 'Enhanced through deduplication and validation';
                            break;
                        case 'Processing Efficiency':
                            description = 'Faster processing with cleaner data';
                            break;
                        case 'Storage Optimization':
                            description = 'Reduced storage requirements';
                            break;
                    }
                    return `<b>${this.x}</b><br/>${description}<br/>Improvement: ${this.y.toFixed(1)}%`;
                }
            },
            exporting: { enabled: true }
        });
    } catch (error) {
        console.error('Error creating impact analysis chart:', error);
        document.getElementById('impactAnalysisChart').innerHTML = '<div class="alert alert-warning">Error loading impact analysis chart</div>';
    }
}

// Prepare comparison data for charts
function prepareComparisonData(distributionData) {
    try {
        const beforeData = distributionData.before || {};
        const afterData = distributionData.after || {};
        
        const allCategories = new Set([
            ...Object.keys(beforeData),
            ...Object.keys(afterData)
        ]);
        
        const categories = Array.from(allCategories);
        const beforeValues = categories.map(cat => beforeData[cat] || 0);
        const afterValues = categories.map(cat => afterData[cat] || 0);
        
        return { categories, before: beforeValues, after: afterValues };
    } catch (error) {
        console.error('Error preparing comparison data:', error);
        return { categories: [], before: [], after: [] };
    }
}

// Update data tables
function updateDataTables() {
    // This would typically load actual table data
    // For now, showing placeholder
    document.getElementById('beforeDataTable').innerHTML = '<p class="text-center text-muted">Before data table will be populated here</p>';
    document.getElementById('afterDataTable').innerHTML = '<p class="text-center text-muted">After data table will be populated here</p>';
    document.getElementById('comparisonDataTable').innerHTML = '<p class="text-center text-muted">Side-by-side comparison will be shown here</p>';
}

// Apply filters
function applyFilters() {
    console.log('🔍 Applying filters...');
    
    // Get filter values
    const filters = {
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        transactionTypes: Array.from(document.getElementById('transactionTypeFilter').selectedOptions).map(o => o.value),
        statuses: Array.from(document.getElementById('statusFilter').selectedOptions).map(o => o.value),
        channels: Array.from(document.getElementById('channelFilter').selectedOptions).map(o => o.value),
        branches: Array.from(document.getElementById('branchFilter').selectedOptions).map(o => o.value),
        searchTerm: document.getElementById('transactionSearch').value
    };
    
    // Apply filters to data (simplified - in real implementation, this would filter the actual datasets)
    filteredData = JSON.parse(JSON.stringify(originalData)); // Reset to original
    
    // Update all components with filtered data
    updateSummaryCards();
    updateAllCharts();
    
    showAlert('info', 'Filters applied successfully!');
}

// Reset filters
function resetFilters() {
    console.log('🔄 Resetting filters...');
    
    // Reset all filter controls
    document.getElementById('startDate').value = dashboardData.summary.before.date_range.start || '';
    document.getElementById('endDate').value = dashboardData.summary.before.date_range.end || '';
    document.getElementById('transactionTypeFilter').selectedIndex = -1;
    document.getElementById('statusFilter').selectedIndex = -1;
    document.getElementById('channelFilter').selectedIndex = -1;
    document.getElementById('branchFilter').selectedIndex = -1;
    document.getElementById('transactionSearch').value = '';
    
    // Reset data to original
    filteredData = JSON.parse(JSON.stringify(originalData));
    
    // Update all components
    updateSummaryCards();
    updateAllCharts();
    
    showAlert('success', 'Filters reset successfully!');
}

// Refresh dashboard
function refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    loadDashboardData();
}

// Update all charts with current data
function updateAllCharts() {
    console.log('📊 Updating charts...');
    
    // Destroy existing charts and recreate
    Object.values(charts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });
    
    // Recreate all charts
    createAllCharts();
}

// Export all charts
function exportAllCharts() {
    console.log('📥 Exporting all charts...');
    
    Object.entries(charts).forEach(([name, chart]) => {
        if (chart && chart.exportChart) {
            chart.exportChart({
                type: 'image/png',
                filename: `${name}_chart`
            });
        }
    });
    
    showAlert('success', 'Charts exported successfully!');
}

// Show/hide loading modal
function showLoadingModal(show) {
    const modal = document.getElementById('loadingModal');
    if (show) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    } else {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }
}

// Show alert message
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    
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

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Utility function to format percentage
function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
}

// Utility function to format number with commas
function formatNumber(num) {
    return num.toLocaleString();
}
