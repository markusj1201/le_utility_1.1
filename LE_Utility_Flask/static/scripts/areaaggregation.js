function wellselect(data) {
    var wells = []
    var t = "";
    var welllist = document.getElementById('well_list')
    e = document.getElementById("sl1").value;
    welllist.innerHTML = ""
    for (i = 0; i < data.length; i++) {
        if (data[i].AggregateName == e) {
            wells.push(data[i].WellName);
        }
    }
    wells.sort()

    for (i = 0; i < wells.length; i++) {
        t += "<option>" + wells[i] + "</option>";

    }
    welllist.innerHTML += t;
};

function routeselect(data) {
    var wells = []
    var t = "";
    var welllist = document.getElementById('well_list')
    e = document.getElementById("sl1").value;
    welllist.innerHTML = ""

    for (i = 0; i < data.length; i++) {
        if (data[i].AggregateName == e) {
            wells.push(data[i].WellName);
        }
    }
    wells.sort()

    for (i = 0; i < wells.length; i++) {
        t += "<option>" + wells[i] + "</option>";

    }
    welllist.innerHTML += t;

};

function holdList() {
    var select1 = document.getElementById("well_list");
    var x = document.getElementById("new_list")
    var hold_list = []
    for (var i = 0; i < x.length; i++) {
        hold_list.push(x.options[i].value)
    };


    var selected1 = [];
    for (var i = 0; i < select1.length; i++) {
        if (select1.options[i].selected && !(hold_list.includes(select1.options[i].value))) {
            var option = document.createElement("option");
            option.text = select1.options[i].value;
            x.add(option, x[0])

        }

    };



};

// Getting query string parameter
var vars = [],
    hash;
var query = document.URL.split('?')[1];
if (query != undefined) {
    query = query.split('&');
    for (var i = 0; i < query.length; i++) {
        hash = query[i].split('=');
        vars.push(hash[1]);
        populateRadios();
    }
};

// Checking radio buttons
function populateRadios() {
    $("input[type=radio]").each(function () {
        $('input[name="' + hash[0] + '"][value="' + hash[1] + '"]').prop('checked', true);
    });
};


