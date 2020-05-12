var sendchanges = function (d) {
    var r = document.getElementById('netreq').dataset.netreq;
    var p = document.getElementById('phreq').dataset.phreq;
    var inset = JSON.parse(r);
    var indates = [];
    var innet = [];
    var inwells = [];
    if (d.length > 0) {
        for (i = 0; i < d.length; i++) {
            indates.push(d[i][0]);
            innet.push(d[i][1]);
            inwells.push(inset.WellNames)
        }

        var body = {
            "WellName": inwells.toString(),
            "CorpID": null,
            "NettingValue": innet.toString(),
            "NettingDate": indates.toString(),
            "UpdateUser": "Brett Rinne"
        };

        if (p == 'Gas') {
            var netset = '/updategasnetting';
        }
        else {
            var netset = '/updateoilnetting';
        }
        fetch(netset, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(body),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
            })
        });

    }


};


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
    if (!document.getElementById('netspreadsheet').dataset.tabdef) {
        console.debug("first run")
    }
    else {
        tabdata = document.getElementById('netspreadsheet').dataset.tabdef;
        var obj = JSON.parse(tabdata.replace(/'/g, "\""));
        var dates = obj.dates;
        var values = obj.values;
        var outer = [];
        for (i = 0; i < dates.length; i++) {
            var inner = [dates[i], values[i]];
            outer.push(inner);
        }
        var table1 = jexcel(document.getElementById('netspreadsheet'), {
            data: outer,
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
            columns: [
                {
                    type: 'calendar',
                    title: 'Date',
                    width: 120,
                    options: { format: 'MM/DD/YYYY' },
                },
                {
                    type: 'numeric',
                    title: 'Netting Value',
                    width: 140,
                    mask: '[-]#,##.00',
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
            onchange: changed
        });
    }
});

