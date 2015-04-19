'use strict';

/*
*  Services for generating Highcharts graphs
*/

var brandPrimary         = '#556270',
    brandPrimaryLight    = '#dee2e6';

angular.module('Clashtools.services')
.factory('dashboardCharts', [
function() {
    return {
        emailsByDay: function(model, callback) {
            var config = initChart();
            var data = [];
            for (var idx=0; idx<model.length; idx++) {
                var temp = new Date(model[idx].date);
                data.push([
                    Date.UTC(temp.getFullYear(), temp.getMonth(), temp.getDate()),
                    model[idx].count
                ]);
            }
            config.series.push({ id: 'emails_by_day', name: 'Emails', type: 'spline', data: data });

            config.xAxis.type = 'datetime';
            config.xAxis.dateTimeLabelFormats = {
                day: '%e. %b'
            };

            config.options.chart.height = 220;

            config.plotOptions.spline = {
                lineWidth: 2,
                marker: {
                    enabled: false,
                    radius: 2
                }
            }

            config.legend.enabled = false;

            callback(config);

        },
        emailsByType: function(model, callback) {
            var config = initChart();

            // Create data series, combine categories less than 3% into "other"
            var totCount = 0;
            for (var i=0; i<model.length; i++) {
                totCount += model[i].count;
            }

            var data = [];
            var otherCount = 0;
            for (var i=0; i<model.length; i++) {
                if (model[i].count / totCount >= .03) {
                    data.push([model[i].type, model[i].count]);
                }
                else {
                    otherCount+= model[i].count;
                }
            }
            if (otherCount > 0) {
                data.push(['Other', otherCount]);
            }

            config.series.push( { id: 'emails_by_type', name: 'Emails by Type', type: 'pie', data: data, innerSize: '50%' } );

            // Chart customization
            config.title.text = null;
            config.options.chart.height = 220;
            config.options.chart.borderWidth = 0;

           // config.legend.layout = "vertical";
           // config.legend.align = "right";
           // config.legend.verticalAlign = "top";
           // config.legend.x = 0;
           // config.legend.y = 40;
           // config.legend.borderWidth = 0;

            config.tooltip = {
                enabled: true,
                pointFormat: '<b>{point.percentage:0.0f}%</b> ({point.y:#,###.0f})'
            };

            config.plotOptions.pie = {
                cursor: 'pointer',
                //showInLegend: true,
                //center: [70, 60],
                dataLabels: {
                    enabled: true,
                    //format: '{point.name:.2f}%',
                    color: brandPrimary,
                    style: {
                        fontSize: '11px'
                    },
                    distance: 10
                }
            };








            callback(config);

        }
    };
}]);
/*
angular.module('SiftrockApp.services')
.factory('b2bModelCharts', [
function () {
    return {
        // B2B Financial model, summary tab, operating capital chart
        operatingCapital: function(scope, callback) {
            var config = initChart();

            // Create data series
            var data = [];
            var curMonth = new Date(scope.start_date);
            var dataMax = 0;

            for (var i=0; i<scope.cashBalance.monthly_amount.length; i++) {
                data.push([Date.UTC(curMonth.getFullYear(), curMonth.getMonth()), scope.cashBalance.monthly_amount[i]]);
                if (scope.cashBalance.monthly_amount[i] > dataMax) {
                    dataMax = scope.cashBalance.monthly_amount[i];
                }
                curMonth.setMonth(curMonth.getMonth() + 1);
            }
            config.series.push({ id: 'cash_balance', name: 'Cash Balance', type: 'spline', data: data, color: '#2790b0' });

            // this will be used for some formatting in the chart
            config.options.extra.dataMax = dataMax;

            // Additional chart configuration
            config.options.chart.height = 320;
            config.xAxis.type = 'datetime';
            config.xAxis.dateTimeLabelFormats = {
                month: '%b %y'
            };

            config.yAxis.labels = {
                style: {
                    color: brandSecondary
                },
                formatter: function() {
                    if (this.chart.options.extra && this.chart.options.extra.dataMax > 1000000) {
                        return '$' + Highcharts.numberFormat(this.value / 1000000, 1) + 'M';
                    }
                    else {
                        return '$' + Highcharts.numberFormat(this.value / 1000, 0) + 'K';
                    }
                }
            }

            config.plotOptions.spline = {
                lineWidth: 2,
                marker: {
                    enabled: false,
                    radius: 2
                }
            }

            config.tooltip = {
                borderWidth: 2,
                formatter: function() {
                    return '<span style="font-size: 14px; font-weight: bold; color: ' + this.series.color + '">' + this.series.name + '</span><br><span style="font-weight: bold;">' + Highcharts.dateFormat('%B %Y', this.x) + '</span><br>$' + Highcharts.numberFormat(this.y, 0);
                }
            }

            callback(config);
        },
        // B2B Financial model, summary tab, expenses and revenue chart
        expensesRevenue: function(scope, callback) {
            var config = initChart();

            // Create data series
            var expenses = [];
            var revenue = [];

            var curMonth = new Date(scope.start_date);
            var dataMax = 0;

            for (var i=0; i<scope.expenseTotal.monthly_amount.length; i++) {
                expenses.push([Date.UTC(curMonth.getFullYear(), curMonth.getMonth()), scope.expenseTotal.monthly_amount[i]]);
                if (scope.expenseTotal.monthly_amount[i] > dataMax) {
                    dataMax = scope.expenseTotal.monthly_amount[i];
                }

                revenue.push([Date.UTC(curMonth.getFullYear(), curMonth.getMonth()), scope.totalMRR[scope.totalMRR.length-1].monthly_amount[i]]);

                curMonth.setMonth(curMonth.getMonth() + 1);
            }
            config.series.push({ id: 'expenses', name: 'Expenses', type: 'spline', data: expenses, color: '#ae4747' });
            config.series.push({ id: 'revenue', name: 'Revenue', type: 'spline', data: revenue, color: '#4eae47' });

            // this will be used for some formatting in the chart
            config.options.extra.dataMax = dataMax;

            // Additional chart configuration
            config.options.chart.height = 320;
            config.xAxis.type = 'datetime';
            config.xAxis.dateTimeLabelFormats = {
                month: '%b %y'
            };

            config.yAxis.labels = {
                style: {
                    color: brandSecondary
                },
                formatter: function() {
                    if (this.chart.options.extra && this.chart.options.extra.dataMax > 1000000) {
                        return '$' + Highcharts.numberFormat(this.value / 1000000, 1) + 'M';
                    }
                    else {
                        return '$' + Highcharts.numberFormat(this.value / 1000, 0) + 'K';
                    }
                }
            }

            config.plotOptions.spline = {
                lineWidth: 2,
                marker: {
                    enabled: false,
                    radius: 2
                }
            }

            config.tooltip = {
                shared: true,
                borderWidth: 2,
                borderColor: brandSecondary,
                useHTML: true,
                formatter: function() {
                    return '<span style="font-size: 14px; font-weight: bold; color: ' + brandSecondary + '">' + Highcharts.dateFormat('%B %Y', this.points[0].x) + '</span><table>' +
                    '<tr><td style="color: ' + this.points[0].series.color + '">' + this.points[0].series.name + '</td><td align="right" style=" padding-left: 10px;"">$' + Highcharts.numberFormat(this.points[0].y, 0) + '</td></tr>' +
                    '<td style="color: ' + this.points[1].series.color + '">' + this.points[1].series.name + '</td><td align="right">$' + Highcharts.numberFormat(this.points[1].y, 0) + '</td></tr>';
                }
            }

            callback(config);
        },
        // B2B Financial model, summary tab, customers by sku chart
        customersBySKU: function(scope, callback) {
            var config = initChart();

            // Create data series
            var dataMax = 0;

            for (var sku=0; sku<scope.totalCustomers.length - 1; sku ++) {
                var curMonth = new Date(scope.start_date);
                var data = [];
                for (var i=0; i<scope.totalCustomers[sku].monthly_amount.length; i++) {
                    data.push([Date.UTC(curMonth.getFullYear(), curMonth.getMonth()), scope.totalCustomers[sku].monthly_amount[i]]);
                    if (scope.totalCustomers[sku].monthly_amount[i] > dataMax) {
                        dataMax = scope.totalCustomers[sku].monthly_amount[i];
                    }
                    curMonth.setMonth(curMonth.getMonth() + 1);
                }
                config.series.push({ id: sku, name: scope.totalCustomers[sku].sub_category, type: 'column', data: data });
            }

            // this will be used for some formatting in the chart
            config.options.extra.dataMax = dataMax;

            // Additional chart configuration
            config.options.chart.height = 320;
            config.xAxis.type = 'datetime';
            config.xAxis.dateTimeLabelFormats = {
                month: '%b %y'
            };

            config.yAxis.labels = {
                style: {
                    color: brandSecondary
                }
            }

            config.plotOptions.column = {
                stacking: 'normal',
                pointPadding: 0,
                borderColor: brandComplementLight
            }

            config.tooltip = {
                shared: true,
                borderWidth: 2,
                borderColor: brandSecondary,
                useHTML: true,
                formatter: function() {
                    var ret = '<span style="font-size: 14px; font-weight: bold; color: ' + brandSecondary + '">' + Highcharts.dateFormat('%B %Y', this.points[0].x) + '</span><table>';
                    for (var s=0; s<this.points.length; s++) {
                        ret += '<tr><td style="color: ' + this.points[s].series.color + ';">' + this.points[s].series.name + '</td><td align="right" style=" padding-left: 10px;">' + Highcharts.numberFormat(this.points[s].y, 0) + '</td></tr>';
                    }
                    ret += '</table>';
                    return ret;
                }
            }

            callback(config);
        },
        // B2B Financial model, summary tab, revenue by chart
        revenueBySKU: function(scope, callback) {
            var config = initChart();

            // Create data series
            var dataMax = 0;

            for (var sku=0; sku<scope.totalMRR.length - 1; sku ++) {
                var curMonth = new Date(scope.start_date);
                var data = [];
                for (var i=0; i<scope.totalMRR[sku].monthly_amount.length; i++) {
                    data.push([Date.UTC(curMonth.getFullYear(), curMonth.getMonth()), scope.totalMRR[sku].monthly_amount[i]]);
                    if (scope.totalMRR[sku].monthly_amount[i] > dataMax) {
                        dataMax = scope.totalMRR[sku].monthly_amount[i];
                    }
                    curMonth.setMonth(curMonth.getMonth() + 1);
                }
                config.series.push({ id: sku, name: scope.totalMRR[sku].sub_category, type: 'column', data: data });
            }

            // this will be used for some formatting in the chart
            config.options.extra.dataMax = dataMax;

            // Additional chart configuration
            config.options.chart.height = 320;
            config.xAxis.type = 'datetime';
            config.xAxis.dateTimeLabelFormats = {
                month: '%b %y'
            };

            config.yAxis.labels = {
                style: {
                    color: brandSecondary
                },
                formatter: function() {
                    if (this.chart.options.extra && this.chart.options.extra.dataMax > 1000000) {
                        return '$' + Highcharts.numberFormat(this.value / 1000000, 1) + 'M';
                    }
                    else {
                        return '$' + Highcharts.numberFormat(this.value / 1000, 0) + 'K';
                    }
                }
            }

            config.plotOptions.column = {
                stacking: 'normal',
                pointPadding: 0,
                borderColor: brandComplementLight
            }

            config.tooltip = {
                shared: true,
                borderWidth: 2,
                borderColor: brandSecondary,
                useHTML: true,
                formatter: function() {
                    var ret = '<span style="font-size: 14px; font-weight: bold; color: ' + brandSecondary + '">' + Highcharts.dateFormat('%B %Y', this.points[0].x) + '</span><table>';
                    for (var s=0; s<this.points.length; s++) {
                        ret += '<tr><td style="color: ' + this.points[s].series.color + ';">' + this.points[s].series.name + '</td><td align="right" style=" padding-left: 10px;">$' + Highcharts.numberFormat(this.points[s].y, 0) + '</td></tr>';
                    }
                    ret += '</table>';
                    return ret;
                }
            }

            callback(config);
        }
    };
}])
.factory('equityCharts', [
function () {
    return {
        // Founder equity, summary tab, starting equity split chart
        equitySummary: function(equity, callback) {
            var config = initChart();

            // Create data series
            var data = [];
            for (var i=0; i<equity.length; i++) {
                data.push([equity[i].name, equity[i].shares]);
            }
            config.series.push( { id: 'equity', name: 'Founder Equity', type: 'pie', data: data} );

            // Chart customization
            config.title.text = null;
            config.options.chart.height = 230;
            config.options.chart.borderWidth = 0;

            config.tooltip = {
                pointFormat: 'Ownership: <b>{point.percentage:.2f}%</b>'
            };

            config.plotOptions.pie = {
                cursor: 'pointer',
                showInLegend: false,
                dataLabels: {
                    enabled: true,
                    color: '#555555',
                    format: '<b>{point.name}</b><br /> {point.percentage:.2f} %'
                }
            };

            callback(config);
        },
        // Founder equity, summary tab, factors and impact chart
        equityImpact:  function(impact, callback) {

            var config = initChart();

            // add data to chart
            config.xAxis.categories = impact.categories;
            for (var i=0; i<impact.founders.length; i++) {
                config.series.push( { id: impact.founders[i].name, name: impact.founders[i].name, data: impact.founders[i].data } );
            }

            // Chart customization
            config.options.chart.type = 'bar';
            config.title.text = null;
            config.options.chart.borderWidth = 0;

            config.yAxis.gridLineWidth = 0;
            config.yAxis.labels.enabled = false;

            config.legend.borderWidth = 0;
            config.legend.itemStyle.fontSize = '9px';

            config.tooltip = {
                shared: true,
                borderWidth: 2,
                borderColor: brandSecondary,
                useHTML: true,
                formatter: function() {
                    // dirty hack to introduce break tags so the tooltip fits within the chart boundaries
                    var result = '';
                    var words = this.points[0].point.desc.split(' ');
                    for (var w=0; w<words.length; w++) {
                        result += words[w] + " ";
                        if ((w + 1) % 7 == 0) {
                            result += "<br />";
                        }
                    }
                    return result;
                }
            }

            callback(config);
        },
        // Founder equity, summary tab, charts for round dilution summary
        roundSummary: function(data, callback) {

            var config = initChart();

            // add data to chart
            config.xAxis.categories = ['Fully diluted equity'];
            config.series = data;

            // Chart customization
            config.options.chart.type = 'bar';
            config.title.text = null;
            config.options.chart.borderWidth = 0;
            config.options.chart.height = 120;
            config.options.chart.spacing = [2,2,8,2];

            config.yAxis.gridLineWidth = 0;
            config.yAxis.labels.enabled = false;
            config.yAxis.reversed = true;

            config.xAxis.labels.enabled = false;
            config.xAxis.lineWidth = 0;

            config.legend.borderWidth = 0;

            config.legend.margin = 5;
            config.legend.itemStyle.fontSize = '9px';

            config.plotOptions.series.stacking = 'percent';
            config.plotOptions.series.pointPadding = 0;
            config.plotOptions.series.groupPadding = 0;

            config.tooltip = {
                enabled: true,
                borderWidth: 2,
                borderColor: brandSecondary,
                pointFormat: 'Equity: <b>{point.percentage:.2f}%</b> <br/>Value: <b>${point.y:#,###.0f}</b>'
            };

            config.plotOptions.bar = {
                dataLabels: {
                    enabled: true,
                    format: '{point.percentage:.0f}%',
                    color: brandComplement,
                    style: {
                        fontSize: '10px'
                    }
                }
            };

            callback(config);
        },
        // Founder equity, equity setup tab, founder equity chart
        founderEquity: function(equity, callback) {

            var config = initChart();

            // Create data series
            var data = [];
            for (var i=0; i<equity.length; i++) {
                data.push([equity[i].name, equity[i].shares]);
            }
            config.series.push( { id: 'equity', name: 'Founder Equity', type: 'pie', data: data} );

            // Chart customization
            config.options.chart.height = 260;

            config.tooltip = {
                pointFormat: 'Shares: <b>{point.y}</b>'
            };

            config.plotOptions.pie = {
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: '#555555',
                    format: '<b>{point.name}</b><br /> {point.percentage:.2f} %'
                }

            };

            callback(config);
        },
        // Founder equity, funding setup tab, equity pie charts for each round of financing
        setupEquity: function(equity, callback) {

            var config = initChart();

            // Create data series
            var data = [];
            for (var i=0; i<equity.length; i++) {
                data.push([equity[i].name, equity[i].value]);
            }
            config.series.push( { id: 'equity', name: 'Founder Equity', type: 'pie', data: data} );

            // Chart customization
            config.title.text = null;
            config.options.chart.height = 180;
            config.options.chart.width = 300;
            config.options.chart.borderWidth = 0;

            config.legend.layout = "vertical";
            config.legend.align = "right";
            config.legend.verticalAlign = "top";
            config.legend.x = 0;
            config.legend.y = 40;
            config.legend.borderWidth = 0;

            config.tooltip = {
                enabled: true,
                pointFormat: 'Ownership: <b>{point.percentage:.2f}%</b> <br/>Value: <b>${point.y:#,###.0f}</b>'
            };

            config.plotOptions.pie = {
                cursor: 'pointer',
                showInLegend: true,
                center: [70, 60],
                dataLabels: {
                    enabled: true,
                    format: '{point.percentage:.2f}%',
                    color: brandComplement,
                    style: {
                        fontSize: '9px'
                    },
                    distance: -24
                }
            };

            callback(config);
        }
    }

}]);
*/

/*
*  Global options - apply to every chart  036564
*/
function initChart() {
    var chartBase = {
        credits: {
            enabled: false
        },
        options: {
            //colors: ["#23ae89", "#2ec1cc", "#2F65AF", "#FF8C4E", "#809EE7", "#CF4647", "#74a79a", "#607848", "#c0a878", "#e1cd25"],
            colors: ['#3e5f9c', '#46b05d', '#d9c357', '#398f8c', '#b84954', '#56b78d', '#feeb8c'],
            //colors: ['#e30019', '#e32d41', '#e35f6e', '#e3828d', '#e3a4ab'],

            chart: {
                animation: true,
                borderWidth: 0,
                borderRadius: 1,
                borderColor: brandPrimaryLight,
                backgroundColor: '#fff',
                style: {
                    fontFamily: 'Roboto, Helvetica Neue, Helvetica, Arial, sans-serif'
                }
            },
            extra: {}
        },
        title: {
            text: null,
            style: {
                color: brandPrimary,
                fontSize: '16px'
            }
        },
        legend: {
            borderColor: brandPrimary,
            itemStyle: {
                color: brandPrimary,
                fontWeight: '400'
            }
        },
        xAxis: {
            //gridLineColor: brandSecondaryLight,
            //gridLineDashStyle: 'dash',
            //gridLineWidth: 1,
            labels: {
                style: {
                    color: brandPrimary
                }
            }
        },
        yAxis: {
            gridLineColor: brandPrimaryLight,
            gridLineWidth: 1,
            //gridLineDashStyle: 'dash',
            title: {
                text: null,
                style: {
                    color: brandPrimary,
                    fontSize: '13px',
                    fontWeight: 'normal'
                }
            },
            labels: {},
            showFirstLabel: false
        },
        plotOptions: {
            series: {
                animation: false
            }
        },
        series: []
    };

    return chartBase;
}
