
function updateprogress(progress) {
    var current_progress = progress;
        $("#dynamic")
        .css("width", current_progress + "%")
        .attr("aria-valuenow", current_progress)
        .text(current_progress + "% Complete");
  };





var tmp = null;
var sum_le_name = null;
var sum_fore_name = null;
var ledata = null;
var proddata = null;
var foredata = null;


$(document).ready(function () {
    $.ajax({
        type: 'GET',
        url: '/getforecastnames',
        async: false
    }).done(function (data) {
        tmp = data[0]['Details'];
    });
    })

//$(document).ready(function () {



    function get_plot() {
        toastr.info("Getting Data...");
        $(".progress").show();
        var prog = 10;
        updateprogress(prog);
        $.ajax({
            data: {
                les: $('#wells_select').val(),
                area_selection: $('#area_selection').val(),
                wedge_selection: $('#wedge_selection').val(),
                s_well_selection: $('#s_well_selection').val(),
                phase_selection: $('#phase_selection').val(),
                forecast_selection: $('#forecast_selection').val()
            },
            type: 'POST',
            url: '/getlevalues/LE'
        })

        .success(function(data){
        toastr.success("LE data loaded")
        prog += 20;
        updateprogress(prog);
        ledata = data;
        })
        .fail(function(){
            toastr.error('LE Error.','What did you do?');
        })
        .then(function(){
        $.when(
            $.ajax({
                data: {
                    in_dates:ledata['dates'],
                    les: $('#wells_select').val(),
                    area_selection: $('#area_selection').val(),
                    wedge_selection: $('#wedge_selection').val(),
                    s_well_selection: $('#s_well_selection').val(),
                    phase_selection: $('#phase_selection').val(),
                    forecast_selection: $('#forecast_selection').val()
                },
                type: 'POST',
                url: '/getlevalues/ACTUAL'
            })
            .done(function(data){
                toastr.success("Production data loaded")
                prog += 40;
                updateprogress(prog)
                proddata = data;
                })
                .fail(function(){
                    toastr.error('Production Error.','What did you do?');
                })
                ,

                $.ajax({
                    data: {
                        in_dates:ledata['dates'],
                        les: $('#wells_select').val(),
                        area_selection: $('#area_selection').val(),
                        wedge_selection: $('#wedge_selection').val(),
                        s_well_selection: $('#s_well_selection').val(),
                        phase_selection: $('#phase_selection').val(),
                        forecast_selection: $('#forecast_selection').val()
                    },
                    type: 'POST',
                    url: '/getlevalues/FORECAST'
                })
                .done(function(data){
                    toastr.success('Forecast Data Loaded')
                    prog += 20;
                    updateprogress(prog)
                    foredata = data;
                    })
                    .fail(function(){
                        toastr.error('Forecast Error.','What did you do?');
                    })



        )})


        $(document).ajaxStop(function () {
            var indata = [];
            indata.push(ledata,proddata,foredata);
            updateprogress(100)

            plot_data(
                indata,
                $('#wells_select').val(),
                $('#area_selection').val(),
                $('#wedge_selection').val(),
                $('#s_well_selection').val(),
                $('#phase_selection').val(),
                $('#forecast_selection').val()
            );
            $(".progress").hide(1500);
        })
};



$('#create_sum').click(function () {
    $('#ModBox').modal('hide')



    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;


    body = {
        "LEName":$('#wells_select').val(),
        "ForecastName": $('#forecast_selection').val(),
        "SummaryName": $('#summary-name').val(),
        "SummaryDate": today,
        "UserName": "Travis Comer"
    }

    fetch('/calculatesummary', {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    }).then(function(){
        document.getElementById("calc_sum").disabled = false;
        toastr.success("Summary successfully created");
    })


});




$('#adjprod').click(function () {

    $.ajax({
        data: {
            les: $('#wells_select').val(),
            fscreen: "main"
        },
        type: 'GET',
        url: '/setleval'
    })


})






$('#summary_sel').click(function () {
    sum_fore_name = $('#forecast_selection').val();
    sum_le_name = $('#wells_select').val();
    $.ajax({
        data: {
            les: $('#wells_select').val(),
            forecast_selection: $('#forecast_selection').val()
        },
        type: 'POST',
        url: '/getsummaryvalues'
    })
        .done(function (data) {
            $(document).ready(function(){
              });
            table_data(
                data
            );
        });
    event.preventDefault();
});






//});




function lematch(x) {
    var les = document.getElementById('wells_select').value;
    for (i in x) {
        if (x[i].LEName == les) {
            var sel = x[i];
        }
    }
    return sel;
}


function subselect(d) {
    var sel_wedge = [];
    var sel_areas = [];
    var sel_wells = [];
    var sel_forecast_wells = [];
    var sel_forecast = [];
    var sel = lematch(d);
    if (sel) {
        var base = "/setleval/";
        var url = base.concat(document.getElementById('wells_select').value);
        document.getElementById('setlevals').action = url;
        document.getElementById("adjprod").disabled = false;
        document.getElementById("plot_sel").disabled = false;
        document.getElementById("calc_sum").disabled = false;
        document.getElementById("summary_sel").disabled = false;
        sel = sel.Details;
        for (x in sel) {
            sel_areas.push(sel[x].Areas);
            sel_wells.push(sel[x].WellName);
            if (sel_wedge.indexOf(sel[x].Wedge) === -1) {
                sel_wedge.push(sel[x].Wedge);
            }
        }
    }
    else {
        document.getElementById("adjprod").disabled = true;
        document.getElementById("plot_sel").disabled = true;
        document.getElementById("calc_sum").disabled = true;
    }
    for (x in tmp) {
        if (sel_wells.includes(tmp[x].WellName) && !(sel_forecast.includes(tmp[x].ForecastName))) {
            sel_forecast.push(tmp[x].ForecastName);
        }
    }
    const map = new Map();
    sel_areas.forEach((item) => map.set(item.join(), item));
    sel_areas = Array.from(map.values());
    sel_areas = [].concat.apply([], sel_areas);
    sel_wedge.sort();
    sel_areas.sort();
    sel_wells.sort();
    sel_forecast.sort();
    sel_wedge.unshift('No Selection');
    sel_areas.unshift('No Selection');
    sel_wells.unshift('No Selection');
    $('#wedge_selection').empty();
    $.each(sel_wedge, function (i, p) {
        $('#wedge_selection').append($('<option></option>').val(p).html(p));
    });
    $('#s_well_selection').empty();
    $.each(sel_wells, function (i, p) {
        $('#s_well_selection').append($('<option></option>').val(p).html(p));
    });
    $('#area_selection').empty();
    $.each(sel_areas, function (i, p) {
        $('#area_selection').append($('<option></option>').val(p).html(p));
    });
    $('#forecast_selection').empty();
    $.each(sel_forecast, function (i, p) {
        $('#forecast_selection').append($('<option></option>').val(p).html(p));
    });
}


function areasub(d) {
    var sel_wedge = [];
    var sel_areas = [];
    var sel_wells = [];
    var sel_forecast = [];
    var sel = lematch(d);
    var area = document.getElementById('area_selection').value;
    sel = sel.Details;
    if (area != 'No Selection') {
        for (x in sel) {
            if (sel[x].Areas.includes(area)) {
                if (sel_wedge.indexOf(sel[x].Wedge) === -1) {
                    sel_wedge.push(sel[x].Wedge);
                }

            };

        }
        sel_wedge.sort();
        for (x in sel) {
            if (sel_wedge[0] == sel[x].Wedge) {

                sel_wells.push(sel[x].WellName);
            }
        }
        for (x in tmp) {
            if (sel_wells.includes(tmp[x].WellName) && !(sel_forecast.includes(tmp[x].ForecastName))) {
                sel_forecast.push(tmp[x].ForecastName);
            }
        }
        sel_forecast.sort();
        sel_wells.sort();
        //console.debug(sel);
        $('#wedge_selection').empty();
        $.each(sel_wedge, function (i, p) {
            $('#wedge_selection').append($('<option></option>').val(p).html(p));
        });
        $('#s_well_selection').empty();
        $.each(sel_wells, function (i, p) {
            $('#s_well_selection').append($('<option></option>').val(p).html(p));
        });
        $('#forecast_selection').empty();
        $.each(sel_forecast, function (i, p) {
            $('#forecast_selection').append($('<option></option>').val(p).html(p));
        });
    }
    else {
        subselect(d);
    }



}



function wedgesub(d) {

    var sel_wells = [];
    var sel_forecast = [];
    var sel = lematch(d);
    var area = document.getElementById('area_selection').value;
    var wedge = document.getElementById('wedge_selection').value;
    sel = sel.Details;
    if (wedge != 'No Selection') {
        for (x in sel) {
            if (sel[x].Wedge == wedge) {
                sel_wells.push(sel[x].WellName);

            };

        }
        for (x in tmp) {
            if (sel_wells.includes(tmp[x].WellName) && !(sel_forecast.includes(tmp[x].ForecastName))) {
                sel_forecast.push(tmp[x].ForecastName);
            }
        }
        sel_forecast.sort();
        sel_wells.sort();
        sel_wells.unshift('No Selection');
        //console.debug(sel);
        $('#s_well_selection').empty();
        $.each(sel_wells, function (i, p) {
            $('#s_well_selection').append($('<option></option>').val(p).html(p));
        });
        $('#forecast_selection').empty();
        $.each(sel_forecast, function (i, p) {
            $('#forecast_selection').append($('<option></option>').val(p).html(p));
        });
    }
    else {
        subselect(d);
    }



}





$('.btn').on('click', function () {
    var $this = $(this);
    $this.button('loading');
});





function colorpicker(phase) {
    switch (phase) {
        case "Gas":
            return "#F08080"
            break;
        case "Oil":
            return "#00cc00"
            break;
        case "Water":
            return "#66ccff"
            break;
        default:
            return "#001a00"
    }
};


function plot_data(d_bundle, les, area, wedge, well, phase) {
    $('.btn').button('reset');
    var LE_data = d_bundle[0];
    var PROD_data = d_bundle[1];
    var FORECAST_data = d_bundle[2];
    fdates = FORECAST_data.dates;
    fprod = FORECAST_data.production_values;
    pdates = PROD_data.dates;
    pprod = PROD_data.production_values;
    dates = LE_data.dates;
    phase = LE_data.phase;
    prod = LE_data.production_values;
    uom = LE_data.units;
    if (dates != undefined) {
        dates = dates.replace(/[\[\]']+/g, '').split(" ");
        dates = Array.from(dates);
        dray = [];
        for (i = 0; i < dates.length; i++) {
            dray.push(dates[i].replace(/^\s+|\s+$/gm, ''));
        }
        dates = dray;
    }
    LEvals = [];
    PRODvals = [];
    FORECASTvals = [];

    var options = {
        animationEnabled: true,
        exportEnabled: true,
        responsive: true,
        maintainAspectRatio: false,
        theme: "light2",
        title: {
            text: les
        },
        axisX: {
            valueFormatString: "DD MMM"
        },
        axisY: {
            title: uom
        },
        toolTip: {
            shared: true
        },
        legend: {
            cursor: "pointer",
            verticalAlign: "bottom",
            horizontalAlign: "left",
            dockInsidePlotArea: true,
            itemclick: toogleDataSeries
        },
        data: [{
            type: "line",
            showInLegend: true,
            name: "LE",
            markerType: "square",
            xValueFormatString: "DD MMM, YYYY",
            color: "#F08080",
            yValueFormatString: "#,##0",
            dataPoints: LEvals
        },
        {
            type: "line",
            showInLegend: true,
            name: "Actual",
            markerType: "triangle",
            xValueFormatString: "DD MMM, YYYY",
            color: "#00cc00",
            yValueFormatString: "#,##0",
            dataPoints: PRODvals
        },

        {
            type: "line",
            showInLegend: true,
            name: "Forecast",
            markerType: "cross",
            xValueFormatString: "DD MMM, YYYY",
            color: "#66ccff",
            yValueFormatString: "#,##0",
            dataPoints: FORECASTvals
        }]
    };
    var chart = new CanvasJS.Chart("chartContainer", options);

    function parseDataPoints() {
        if (dates != undefined) {
            for (var i = LEvals.length; i < dates.length; i++) {
                LEvals.push({
                    x: new Date(new Date(dates[i]).setHours(0, 0, 0, 0)),
                    y: prod[i]
                });
            }
            for (var i = PRODvals.length; i < pdates.length; i++) {
                PRODvals.push({
                    x: new Date(new Date(pdates[i]).setHours(0, 0, 0, 0)),
                    y: pprod[i]
                });
            }
            for (var i = FORECASTvals.length; i < fdates.length; i++) {
                FORECASTvals.push({
                    x: new Date(new Date(fdates[i]).setHours(0, 0, 0, 0)),
                    y: fprod[i]
                });
            }
        }
    };

    function addDataPoints() {
        parseDataPoints();
        chart.options.data[0].dataPoints = LEvals;
        chart.options.data[1].dataPoints = PRODvals;
        chart.options.data[2].dataPoints = FORECASTvals;
        chart.render();
    }

    addDataPoints();

}


function toogleDataSeries(e) {
    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
    } else {
        e.dataSeries.visible = true;
    }
    e.chart.render();
}








var changed = function (instance, cell, x, y, value) {
    var cellName = jexcel.getColumnNameFromId([x, y]);
    cell.style.backgroundColor = '#ffcc66';
};


function max_date(all_dates) {
    var max_dt = all_dates[0],
        max_dtObj = new Date(all_dates[0]);
    all_dates.forEach(function (dt, index) {
        if (new Date(dt) > max_dtObj) {
            max_dt = dt;
            max_dtObj = new Date(dt);
        }
    });
    return max_dt;
}


function update_summary(d){
    $("#ltext").show();
    var dlen = d.length;
    var flen = 0;
    for(i=0;i<d.length;i++){
        var body =  {
            SummaryName: sum_name[0],
            LEName: sum_le_name,
            Wedge: d[i][0],
            ForecastName: sum_fore_name,
            Midstream: d[i][10],
            Reason: d[i][11],
            Comments: d[i][12],
            UpdateUser: "Brett Rinne"
        }
        toastr.info("Updating Summary")


        fetch('/updatesummaryvalues', {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(body),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
            })
        }).then(function(){
            flen = 1 + flen

            if (dlen == flen){
                $.ajax({
                    data: {
                        les: sum_le_name,
                        forecast_selection: sum_fore_name
                    },
                    type: 'POST',
                    url: '/getsummaryvalues'
                })
                    .done(function (data) {
                        table_data(
                            data
                        );
                    })
                }

        });
    }
    $("#ltext").hide();
}



function table_data(data) {

    if(Object.keys(data).length == 0){
        jexcel.destroy(document.getElementById('summaryspreadsheet'), false);
    }

    $('.btn').button('reset');
    sum_date = [];
    sum_name = [];
    sum_wedge = [];
    sum_reason = [];
    sum_comments = [];
    sum_midstream = [];
    ann_ave_mboed = [];
    ann_gfo_mboed = [];
    ann_var_mboed = [];
    qtr_ave_mboed = [];
    qtr_gfo_mboed = [];
    qtr_var_mboed = [];
    mon_ave_mboed = [];
    mon_gfo_mboed = [];
    mon_var_mboed = [];
    for (i = 0; i < Object.keys(data).length; i++) {
        sum_date.push(data[i].SummaryDate);
    }
    mdate = max_date(sum_date)
    sum_date = [];
    for (i = 0; i < Object.keys(data).length; i++) {

        if (data[i].SummaryDate == mdate & !(sum_wedge.includes(data[i].Wedge))) {
            sum_date.push(data[i].SummaryDate);
            sum_name.push(data[i].SummaryName);
            sum_wedge.push(data[i].Wedge);
            sum_reason.push(data[i].Reason);
            sum_comments.push(data[i].Comments);
            sum_midstream.push(data[i].Midstream);
            ann_ave_mboed.push(parseFloat(data[i].AnnualAvgMBOED));
            ann_gfo_mboed.push(parseFloat(data[i].AnnualGFOMBOED));
            ann_var_mboed.push(parseFloat(data[i].AnnualVariance));
            qtr_ave_mboed.push(parseFloat(data[i].QuarterlyAvgMBOED));
            qtr_gfo_mboed.push(parseFloat(data[i].QuarterlyGFOMBOED));
            qtr_var_mboed.push(parseFloat(data[i].QuarterlyVariance));
            mon_ave_mboed.push(parseFloat(data[i].MonthlyAvgMBOED));
            mon_gfo_mboed.push(parseFloat(data[i].MonthlyGFOMBOED));
            mon_var_mboed.push(parseFloat(data[i].MonthlyVariance));

        }

    }




    var outer = [];
    for (i = 0; i < sum_date.length; i++) {
        var inner = [sum_wedge[i], ann_ave_mboed[i], ann_gfo_mboed[i], ann_var_mboed[i], qtr_ave_mboed[i], qtr_gfo_mboed[i], qtr_var_mboed[i], mon_ave_mboed[i], mon_gfo_mboed[i], mon_var_mboed[i], sum_midstream[i], sum_reason[i], sum_comments[i]];
        outer.push(inner);
    }
    if (outer.length > 0) {
        jexcel.destroy(document.getElementById('summaryspreadsheet'), false);
        var table2 = jexcel(document.getElementById('summaryspreadsheet'), {
            data: outer,
            // Allow new rows
            allowInsertRow: false,
            // Allow new rows
            allowManualInsertRow: false,
            // Allow new columns
            allowInsertColumn: false,
            // Allow new rows
            allowManualInsertColumn: false,
            // Allow row delete
            allowDeleteRow: false,
            // Allow column delete
            allowDeleteColumn: false,
            columnResize: true,
            rowResize: true,
            wordWrap: true,
            tableOverflow: true,
            csvFileName: String(sum_date[0].substring(0, 10)).concat('_' ,String(sum_name[0]),'_' ,'Summary'),
            csvHeaders: true,
            columns: [
                {
                    type: 'text',
                    title: 'Wedge',
                    width: 70,
                    readOnly: true
                },
                {
                    type: 'numeric',
                    title: 'AVG MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,
                    wordWrap: true

                },
                {
                    type: 'numeric',
                    title: 'GFO MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'VAR MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'AVG MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'GFO MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'VAR MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'AVG MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'GFO MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true,

                },
                {
                    type: 'numeric',
                    title: 'VAR MBOED',
                    width: 80,
                    mask: '[-]#,##.00',
                    decimal: '.',
                    readOnly: true

                },
                {
                    type: 'text',
                    title: 'Midstream',
                    width: 120
                },
                {
                    type: 'text',
                    title: 'Reason',
                    width: 120
                },
                {
                    type: 'text',
                    title: 'Comments',
                    width: 120
                }

            ],
            toolbar: [
                {
                    type: 'i',
                    content: 'undo',
                    onclick: function () {
                        table2.undo();
                    }
                },
                {
                    type: 'i',
                    content: 'redo',
                    onclick: function () {
                        table2.redo();
                    }
                },
                {
                    type: 'i',
                    content: 'save',
                    onclick: function (){
                        var data = table2.getData();
                        update_summary(data);
                    }
                },
            {
                type: 'i',
                content: 'system_update_alt',
                onclick: function(){
                    table_hold = table2;
                    hold_headers = table2.getHeaders();
                    table_hold.insertRow(hold_headers,0,true)
                    table_hold.download(true);
                }
            }],
            nestedHeaders: [
                {
                    title: "",
                    colspan: '1'


                },
                {
                    title: "Annual",
                    colspan: '3'


                },
                {
                    title: "Quarterly",
                    colspan: '3'


                },
                {
                    title: "Monthly",
                    colspan: '3'


                },
                {
                    title: sum_name[0],
                    colspan: '2'


                },
                {
                    title: sum_date[0].substring(0, 10),
                    colspan: '1'


                }

            ]


            ,
            onchange: changed,
            updateTable: function (instance, cell, col, row, val, label, cellName) {
                if (col == 3 || col == 6 || col == 9) {
                    if (parseFloat(label) < 0) {
                        cell.style.color = 'red';
                    } else {
                        cell.style.color = 'green';
                    }

                }
                else {
                    cell.style.color = 'black';
                }
                cell.style.fontSize = 'x-small';
            }


        });
        for (i = 0; table2.headers.length > i; i++) {
            table2.headers[i].style.fontSize = 'x-small';
            table2.headers[i].style.wordWrap = 'normal';
            table2.headers[i].style.wordBreak = 'break-all';
            table2.headers[i].style.overflowWrap = 'break-word';
        }


    }
else{
    toastr.info('No Summary Exists');
}



}





$('#ModBox').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget)
    var recipient = button.data('whatever')
    var forecast = $('#forecast_selection').val()
    var le = $('#wells_select').val()

    var modal = $(this)
    modal.find('#forecast-name').val(forecast)
    modal.find('#le-name').val(le)
  })