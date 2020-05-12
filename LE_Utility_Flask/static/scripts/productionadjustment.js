var sendchanges = function (d) {
    var r = document.getElementById('req').dataset.req;
    var inset = JSON.parse(r);
    var indates = [];
    var inprod = [];
    if (d.length > 0) {
        for (i = 0; i < d.length; i++) {
            indates.push(d[i][0]);
            inprod.push(d[i][2]);
        }
        var g = null;
        var o = null;
        var w = null;
        if (inset.Phase == "Gas") { g = inprod.toString() }
        if (inset.Phase == "Water") { w = inprod.toString() }
        if (inset.Phase == "Oil") { o = inprod.toString() }
        var body = {
            "LEName": "DataPull",
            "CorpID": null,
            "WellorArea": inset.WellorArea,
            "ProductionGas": g,
            "ProductionOil": o,
            "ProductionWater": w,
            "Dates": indates.toString(),
            "UserName": "Brett Rinne"
        };
        console.debug(body);
        fetch('/updateproduction', {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(body),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
            })
        })

    }

    window.location.reload(true);
};


$('.btn').on('click', function () {
    var $this = $(this);
    $this.button('loading');
});


var comparechanges = function (d) {
    var output = [];
    for (i = 0; i < d.length; i++) {
        if (d[i][1] != d[i][2]) {
            output.push(d[i])
        }

    }
    sendchanges(output);
};

var changed = function (instance, cell, x, y, value) {
    var cellName = jexcel.getColumnNameFromId([x, y]);
    cell.style.backgroundColor = '#ffcc66';
};

$(document).ready(function () {
    var tabdata = 0
    if (!document.getElementById('spreadsheet').dataset.tabdef) {
        console.debug("first run")
    }
    else {
        tabdata = document.getElementById('spreadsheet').dataset.tabdef
        var obj = JSON.parse(tabdata.replace(/'/g, "\""));
        var dates = obj.dates;
        var actual = obj.Actual;
        var adjusted = obj.Adjusted;
        var outer = [];
        for (i = 0; i < dates.length; i++) {
            var inner = [dates[i], actual[i], adjusted[i]];
            outer.push(inner);
        }
        var table1 = jexcel(document.getElementById('spreadsheet'), {
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
            columns: [
                {
                    type: 'calendar',
                    title: 'Date',
                    width: 120,
                    readOnly: true,
                    options: { format: 'MM/DD/YYYY' },
                },
                {
                    type: 'numeric',
                    title: 'Actual Production',
                    width: 140,
                    readOnly: true,
                    mask: '#,##.00',
                    decimal: '.'
                },
                {
                    type: 'numeric',
                    title: 'Adjusted Production',
                    width: 140,
                    mask: '#,##.00',
                    decimal: '.'
                },
            ],
            toolbar: [
                {
                    type: 'i',
                    content: 'undo',
                    onclick: function () {
                        table1.undo();
                    }
                },
                {
                    type: 'i',
                    content: 'redo',
                    onclick: function () {
                        table1.redo();
                    }
                },
                {
                    type: 'i',
                    content: 'save',
                    onclick: function () {
                        var data = table1.getData();
                        comparechanges(data);
                    }
                }],
            onchange: changed,
            pagination: 25
        });
    }
});
