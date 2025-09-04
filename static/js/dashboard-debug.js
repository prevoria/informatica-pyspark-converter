// Dashboard Debug Helper
// Add this to help identify chart loading issues

// Debug function to test chart creation
function debugChartCreation() {
    console.log('🔧 Debug: Testing chart creation...');
    
    // Test if Highcharts is loaded
    if (typeof Highcharts === 'undefined') {
        console.error('❌ Highcharts not loaded!');
        return false;
    } else {
        console.log('✅ Highcharts loaded successfully');
    }
    
    // Test if data is available
    if (!dashboardData) {
        console.error('❌ Dashboard data not loaded!');
        return false;
    } else {
        console.log('✅ Dashboard data available');
        console.log('📊 Data structure:', Object.keys(dashboardData));
    }
    
    // Test each chart container
    const chartContainers = [
        'beforeTransactionTypeChart',
        'afterTransactionTypeChart',
        'beforeStatusChart',
        'afterStatusChart',
        'beforeAmountChart',
        'afterAmountChart',
        'channelComparisonChart',
        'branchComparisonChart',
        'timeSeriesChart',
        'impactAnalysisChart'
    ];
    
    chartContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            console.log(`✅ Container found: ${containerId}`);
        } else {
            console.error(`❌ Container missing: ${containerId}`);
        }
    });
    
    return true;
}

// Test individual chart creation
function testChart(chartType) {
    console.log(`🧪 Testing ${chartType} chart creation...`);
    
    try {
        switch(chartType) {
            case 'transaction_type':
                createTransactionTypeCharts();
                break;
            case 'status':
                createStatusCharts();
                break;
            case 'amount':
                createAmountCharts();
                break;
            case 'comparison':
                createComparisonCharts();
                break;
            case 'time_series':
                createTimeSeriesChart();
                break;
            case 'impact':
                createImpactAnalysisChart();
                break;
            default:
                console.error('Unknown chart type:', chartType);
        }
    } catch (error) {
        console.error(`❌ Error creating ${chartType} chart:`, error);
    }
}

// Add debug info to console
function showDebugInfo() {
    console.log('🔍 Dashboard Debug Information');
    console.log('=' * 40);
    console.log('Highcharts version:', Highcharts.version);
    console.log('Dashboard data keys:', Object.keys(dashboardData || {}));
    console.log('Filtered data keys:', Object.keys(filteredData || {}));
    console.log('Charts created:', Object.keys(charts));
    
    // Show data samples
    if (dashboardData) {
        console.log('📊 Sample data:');
        console.log('- Summary before:', dashboardData.summary?.before);
        console.log('- Summary after:', dashboardData.summary?.after);
        console.log('- Transaction types:', dashboardData.distributions?.transaction_type);
        console.log('- Impact metrics:', dashboardData.impact_metrics);
    }
}

// Add to global scope for browser console access
window.debugChartCreation = debugChartCreation;
window.testChart = testChart;
window.showDebugInfo = showDebugInfo;
