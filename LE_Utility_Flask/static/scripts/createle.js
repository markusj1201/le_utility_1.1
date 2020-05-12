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
var foreval = document.getElementById("forecast_select");
var createbutton = document.getElementById("createle_button");
var manual = document.getElementById("manualentry");
var createtemplatebutton = document.getElementById("createle_template_button");
var letext = document.getElementById('le_text');
if(letext.value == ''){
    createbutton.disabled = true;
    createtemplatebutton.disabled = true;
}
else{


if(leval.value == '' & foreval.value == ''){
    console.debug("reset");
    leval.disabled = false;
    foreval.disabled = false;
    createbutton.disabled = true;
    createtemplatebutton.disabled = false;
    manual.hidden = false;
}
else if(foreval.value == ''){
    console.debug("forecast empty");
    foreval.disabled = true;
    createbutton.disabled = false;
    createtemplatebutton.disabled = true;
    manual.hidden = true;
}
else if(leval.value == ''){
    console.debug("le empty");
    leval.disabled = true;
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





    var lename = document.getElementById("le_text").value;
    var today = new Date().toJSON().slice(0,10);
    var today = format(today);
    var intmethod = "None";
    var oil_phase = document.getElementById("oilradio");
    var phase = 'Gas';
    if(oil_phase.checked == true){
        phase = 'Oil';
    }
    var levals = document.getElementById("lespreadsheet").jexcel.getData();
    var wells = [];
    var dates = [];
    for(i=0;i<levals.length;i++){
        if (levals[i][0] != ""){
            wells.push(levals[i][0]);
            levals[i].shift()
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


    var data = {
        LEName:lename,
        LEDate:today,
        InterpolationMethod:intmethod,
        Phase:phase,
        Dates:strdate,
        Wells:wells,
        ProductionList:prodvals,
        CorpIDorWellName:"WellName",
        UpdateUser:"Travis Comer",
        Async: "True"
    }
    toastr.info("Creating LE");

    fetch('/calcletemplate', {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(data),
        cache: "no-cache",
        headers: new Headers({
            "content-type": "application/json"
        })
    }).then(function(){
        toastr.success("LE successfully created");
        redir();
    })






}




function createtemplate(){
    toastr.info('Creating Workspace');
    //TODO: Not working right now
    document.getElementById("createle_wbutton").disabled = false;

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
    var strdate = [];
    var cols = [];

    cols.push({
                    type: 'dropdown',
                    autocomplete: true,
                    source: Wells_list,
                    title: 'Well',
                    width: 200
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
    jexcel.destroy(document.getElementById('lespreadsheet'), false);
    var table3 = jexcel(document.getElementById('lespreadsheet'), {
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
                    table3.undo();
                }
            },
            {
                type: 'i',
                content: 'redo',
                onclick: function () {
                    table3.redo();
                }
            }]


    });



});

    })


}

