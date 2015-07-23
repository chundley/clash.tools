'use strict';

/*
*  Services for generating Highcharts graphs
*/

var brandPrimary         = '#556270',
    brandPrimaryLight    = '#dee2e6';

angular.module('Clashtools.services')
.factory('resultsCharts', [
function() {
    return {
        attacksByStars: function(model, callback) {
            var config = initChart();
            config.options.chart.type = 'bar';
            config.options.chart.borderColor = '#a9b5bf';
            config.options.chart.borderWidth = 1;

            var data = [];
            config.xAxis.categories = [];
            for (var idx=model.length-1; idx>=0; idx--) {
                data.push([
                    idx.toString(),
                    model[idx]
                ]);
                config.xAxis.categories.push(idx + '*');
            }

            config.series.push({ id: 'attacks_by_stars', name: 'Stars', data: data });

            config.series[0].dataLabels = {
                enabled: true,
                align: 'right',
                color: '#ffffff',
                x: -2,
                y: -2,
                style: { fontSize: 18 }
            };

            config.options.chart.backgroundColor = '#ffffff';

            config.plotOptions.bar = {
                colorByPoint: true,
                colors: ['#488921', '#EFAC2A', '#EF371B', '#900D05'],
                pointWidth: 30,
                size: '100%'
            };

            config.yAxis.labels.enabled = false;
            config.yAxis.gridLineWidth = 0;


            config.xAxis.labels.enabled = true;
            config.xAxis.labels.style = { fontSize: '16' };

            //config.xAxis.title = { text: 'Stars', style: { fontSize: '13px'} };
            config.xAxis.tickWidth = 0;

            config.options.chart.height = 170;
            //config.options.chart.width = 350;

/*            config.plotOptions.spline = {
                lineWidth: 2,
                marker: {
                    enabled: false,
                    radius: 2
                }
            }*/

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
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
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
