var Wells_list = ['preliminary'];


function redir(){
    window.location.replace(window.location.origin);

}

$(document).ready(function (){

    var startdate = new Date().toJSON().slice(0,10);
    document.getElementById("sdate_select").value = startdate;
    var enddate = new Date(new Date().setDate(new Date().getDate()+30)).toJSON().slice(0,10);
    document.getElementById("edate_select").value = enddate;

})


function selector(){
var leval = document.getElementById("wells_select");
var ariesval = document.getElementById("aries_select");
var createbutton = document.getElementById("createle_button");
var manual = document.getElementById("manualentry");
var createtemplatebutton = document.getElementById("createle_template_button");
var foretext = document.getElementById('forecast_text');
if(foretext.value == ''){
    createbutton.disabled = true;
    createtemplatebutton.disabled = true;
}
else{


if(ariesval.value == ''){
    console.debug("reset");
    ariesval.disabled = false;
    createbutton.disabled = true;
    createtemplatebutton.disabled = false;
    manual.hidden = false;
}
else if(ariesval.value != ''){
    console.debug("forecast empty");
    createbutton.disabled = false;
    createtemplatebutton.disabled = true;
    manual.hidden = true;
}
}
}

var getDateArray = function(start, end, intmethod) {

    var
      arr = new Array(),
      dt = new Date(start);

    if(intmethod.includes('Month')){
        var options = {month:'long',year:'numeric'}
        arr.push(new Intl.DateTimeFormat('en-US',options).format(new Date(dt)));
        while (dt < end) {
            dt.setMonth(dt.getMonth() + 1);
            arr.push(new Intl.DateTimeFormat('en-US',options).format(new Date(dt)));
        }


    }
    else{


      arr.push(new Date(dt));
    while (dt < end) {
        dt.setDate(dt.getDate() + 1);
        arr.push(new Date(dt));
    }
        }
    return arr;

  }


  function dateRange(startDate, endDate) {
    var start      = startDate.split('-');
    var end        = endDate.split('-');
    var startYear  = parseInt(start[0]);
    var endYear    = parseInt(end[0]);
    var dates      = [];

    for(var i = startYear; i <= endYear; i++) {
      var endMonth = i != endYear ? 11 : parseInt(end[1]) - 1;
      var startMon = i === startYear ? parseInt(start[1])-1 : 0;
      for(var j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j+1) {
        var month = j+1;
        var displayMonth = month < 10 ? '0'+month : month;
        dates.push([ displayMonth, '01', i].join('/'));
      }
    }
    return dates;
  }



function submittemplate(){
    var format = function(input) {
        var pattern = /(\d{4})\-(\d{2})\-(\d{2})/;
        if (!input || !input.match(pattern)) {
          return null;
        }
        return input.replace(pattern, '$2/$3/$1');
      };




    var lename = document.getElementById("forecast_text").value;
    var today = new Date().toJSON().slice(0,10);
    var today = format(today);
    var intmethod = "None";
    var gfosel = document.getElementById("gfosel").value;
    if(gfosel == 'on'){
        gfosel = "True";
    }
    else{
        gfosel = "False";
    }
    var intmethod = document.getElementById("intmethod").value;
    var oil_phase = document.getElementById("oilradio");
    var phase = 'Gas';
    if(oil_phase.checked == true){
        phase = 'Oil';
    }
    var levals = document.getElementById("forecastspreadsheet").jexcel.getData();
    var wells = [];
    var nfvals = [];
    var dates = [];
    for(i=0;i<levals.length;i++){
        if (levals[i][0] != ""){
            wells.push(levals[i][0]);
            nfvals.push(levals[i][1]);
            levals[i].shift();
            levals[i].shift();
        }
        else{
            delete levals[i];
        }

    }

    var prodvals = levals.filter(function (el) {
        return el != null;
      });
    var sdate = new Date(document.getElementById('sdate_select').value);
    var edate = new Date(document.getElementById('edate_select').value);
    var intmethod = document.getElementById("intmethod").value;
    var dateArr = getDateArray(sdate, edate, intmethod);
    var strdate = [];
    if(intmethod.includes('Month')){
       strdate = dateRange(sdate.toJSON().slice(0,10),edate.toJSON().slice(0,10));
    }
    else{


    for(i=0;i<dateArr.length;i++){
        strdate.push(format(dateArr[i].toJSON().slice(0,10)));

    }
        }
    if(phase == "Gas"){
        var gasnfvals = nfvals;
        var oilnfvals = new Array(nfvals.length).fill(0);
        var gasunits = "Mscf";
    }
    else{
        var oilnfvals = nfvals;
        var gasnfvals = new Array(nfvals.length).fill(0);
        var gasunits = null;
    }


    var data = {
        ForecastName:lename,
        ForecastYear:null,
        GFO: gfosel,
        InterpolationMethod:intmethod,
        Phase:phase,
        GasUnits:gasunits,
        Dates:strdate,
        OilNFs:oilnfvals,
        GasNFs:gasnfvals,
        Wells:wells,
        ProductionList:prodvals,
        CorpIDorWellName:"WellName",
        UpdateUser:"Travis Comer",
        Async: "True"
    }
    toastr.info("Creating Forecast");
    fetch('/calcforecasttemplate', {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(data),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    }).then(function(){
        toastr.success("Forecast successfully created");
        redir();
    })






}




function createtemplate(){
    toastr.info('Creating Workspace');
    //TODO: Not working right now
    document.getElementById("createforecast_wbutton").disabled = false;
    document.getElementById("populatenet_wbutton").disabled = false;


    var AREAS = [];

    $.ajax({
        data: {
            AggregateName : null,
            Area : null,
            Route : null
            }   ,
        type: 'POST',
        url: '/getareanames'
    }).then(function (data){
        AREAS = data;
    }).then(function(){
$.ajax({
    data: {
        BusinessUnit : "EAST",
        Area : null,
        Route : null
        }   ,
    type: 'POST',
    url: '/getallwells'
}).then(function (data) {
    Wells_list = Object.values(data);
    Wells_list = Wells_list.concat(AREAS);
    Wells_list.sort();
    var sdate = new Date(document.getElementById('sdate_select').value);
    var edate = new Date(document.getElementById('edate_select').value);
    var intmethod = document.getElementById("intmethod").value;
    var dateArr = getDateArray(sdate, edate,intmethod);

    var cols = [];

    cols.push({
                    type: 'dropdown',
                    autocomplete: true,
                    source: Wells_list,
                    title: 'Well',
                    width: 200
                });


    cols.push({
        type: 'numeric',
        title: 'Netting',
        width: 80,
        mask: '[-]#,##.00',
        decimal: '.'
    });

    var strdate = [];
    if(intmethod.includes("Month")){
        strdate = dateArr;

        for(i=0;i<strdate.length;i++){
            var tcol =                 {
                type: 'numeric',
                title: strdate[i],
                width: 120,
                mask: '[-]#,##.00',
                decimal: '.'

            };
            cols.push(tcol);

        }


    }
    else{


    for(i=0;i<dateArr.length;i++){
        strdate.push(dateArr[i].toJSON().slice(5,10));

    }
    for(i=0;i<strdate.length;i++){
        var tcol =                 {
            type: 'numeric',
            title: strdate[i],
            width: 80,
            mask: '[-]#,##.00',
            decimal: '.'

        };
        cols.push(tcol);

    }

        }


    welllist = Object.values(data);
    welllist.sort();
    Wells_list = welllist;
    jexcel.destroy(document.getElementById('forecastspreadsheet'), false);
    var table4 = jexcel(document.getElementById('forecastspreadsheet'), {
        data: [,,,,,],
        // Allow new rows
        allowInsertRow: true,
        // Allow new rows
        allowManualInsertRow: true,
        // Allow new columns
        allowInsertColumn: false,
        // Allow new rows
        allowManualInsertColumn: false,
        // Allow row delete
        allowDeleteRow: true,
        // Allow column delete
        allowDeleteColumn: false,
        columnResize: true,
        rowResize: true,
        wordWrap: true,
        tableWidth:'1200px',
        tableOverflow: true,
        columns: cols,
        toolbar: [
            {
                type: 'i',
                content: 'undo',
                onclick: function () {
                    table4.undo();
                }
            },
            {
                type: 'i',
                content: 'redo',
                onclick: function () {
                    table4.redo();
                }
            }]


    });



});
})



}




function populatenetting(){
    var oil_phase = document.getElementById("oilradio");
    var phase = 'Gas';
    if(oil_phase.checked == true){
        phase = 'Oil';
    }
    var wells = [];
    var levals = document.getElementById("forecastspreadsheet").jexcel.getData();
    for(i=0;i<levals.length;i++){
        if (levals[i][0] != ""){
            wells.push(levals[i][0]);
            levals[i].shift()
        }
        else{
            delete levals[i];
        }

    }

    $.ajax({
        data: {
            wells : wells,
            phase : phase
            }   ,
        type: 'POST',
        url: '/getnetting'
    }).then(function (data) {

        var invals = [];
        var levals = document.getElementById("forecastspreadsheet").jexcel.getData();
        var outwells = data.well;
        var outvals = data.values;
        for(i=0;i< levals.length;i++){
            if (levals[i][0] != ""){
                for(j=0;j< outwells.length;j++){
                    if(levals[i][0].toUpperCase() == outwells[j].toUpperCase()){
                        invals.push(outvals[j]);
                    }

                }
            }
            else{
                invals.push("");
            }
        }

        document.getElementById("forecastspreadsheet").jexcel.setColumnData(1,invals);
        });





}


