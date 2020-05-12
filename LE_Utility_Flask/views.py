"""
Routes and views for the flask application.
"""

from datetime import datetime, timedelta, date
from dateutil import parser
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_cors import CORS
import requests
import json
import uuid
import pandas as pd
from timer import Timer

# Random uid for session

app = Flask(__name__)
app.secret_key = str(uuid.uuid1())
CORS(app)
app.debug = True

# Array of header information to be set and kept within the app to
# decrease number of pulls

WELL_NAMES = []
LE_NAMES = []
FORECAST_NAMES = []


# Home page that pulls LE names and passes it to the page

@app.route('/')
@app.route('/home')
def home():
    """Renders the home page."""
    bigagg = getlenames(None, False)
    return render_template(
        'index.html',
        title='Home Page',
        year=datetime.now().year,
        lesel=bigagg
    )

# Template route. Inactive


@app.route('/contact')
def contact():
    """Renders the contact page."""
    return render_template(
        'contact.html',
        title='Contact',
        year=datetime.now().year,
        message='Your contact page.'
    )

# Template route. Inactive


@app.route('/about')
def about():
    """Renders the about page."""
    return render_template(
        'about.html',
        title='About',
        year=datetime.now().year,
        message='Your application description page.'
    )

# Pulling all wells using ajax request. Forms don't exist in html. This
# can be set in the DOM or flask.


@app.route('/getallwells', methods=['GET', 'POST'])
def getallwells():
    BU = request.form['BusinessUnit']
    Area = request.form['Area']
    Route = request.form['Route']
    data = {
        "BusinessUnit": BU,
        "Area": Area,
        "Route": Route
    }
    r = makerequest('get', '/GetAllWells', json.dumps(data))
    print(r.status_code)
    res = r.json()['Package']
    Welllist = res['WellName']

    return jsonify(Welllist)

# Route that pulls LE names and Forecast names and passes them back to the
# createle page.


@app.route('/createle')
def createle():
    """Renders the about page."""
    bigagg = getlenames(None, True)
    foreagg = FORECAST_NAMES[0]['Details']
    return render_template(
        'createle.html',
        title='About',
        year=datetime.now().year,
        lesel=bigagg,
        foresel=foreagg
    )


@app.route('/createforecast')
def createforecast():
    """Renders the about page."""
    ag = getariesnames()
    return render_template(
        'createforecast.html',
        title='About',
        year=datetime.now().year,
        ariessel=ag
    )

# Future route. Inactive.


@app.route('/utilityadjustment')
def utilityadjustment():
    """Renders the home page."""
    return render_template(
        'utilityadjustment.html',
        title='UtilityAdjustment',
        year=datetime.now().year,
    )


# Pulls and filters LE name from LE_NAMES global variable. If no filter
# exists, return all LE names.

def getlenames(namefilter, refresh):
    if(refresh):
        data = {
            "StartDate": None,
            "EndDate": None,
            "LastWeek": "False",
            "FirstOfMonth": "False",
            "WellorAreas": None,
            "Wedge": None,
            "NameFilter": None
        }
        r = makerequest('get', '/GetLE', json.dumps(data))
        res = r.json()['Package']
        bigagg2 = []
        for i in res:
            val = '' + i + ''
            bigagg2.append(res[val])
        lepack = bigagg2
    else:
        if(namefilter):
            for i in LE_NAMES:
                if namefilter == i['LEName']:
                    lepack = i
        else:
            lepack = LE_NAMES

    bigagg = lepack
    return bigagg

# Gets all forecast names


@app.route('/getforecastnames', methods=['GET', 'POST'])
def getforecastnames():
    bigagg = FORECAST_NAMES
    return jsonify(bigagg)


@app.route('/getariesnames', methods=['GET', 'POST'])
def getariesnames():

    today = date.today()
    edate = today.replace(year=today.year + 1).strftime("%m/%d/%Y")
    sdate = today.replace(year=today.year - 1).strftime("%m/%d/%Y")

    data = {
        "StartDate": sdate,
        "EndDate": edate,
        "CorpIDList": None,
        "BusinessUnit": "EAST",
        "Area": None,
        "Route": None
    }

    r = makerequest('get', '/AriesScenarios', json.dumps(data))
    bigagg = sorted(r.json()['Package']['Scenario'].values())

    return bigagg


@app.route('/getareanames', methods=['GET', 'POST'])
def getareanames():
    data = json.dumps(
        {"AggregateNames": None, "WellNames": None, "CorpIDs": None})
    r = makerequest('get', '/GetAreaDetails', data)
    res = r.json()['Package']
    bigagg = []
    aname = []
    for i in res:
        val = '' + i + ''
        bigagg.append(res[val])
    for i in bigagg:
        if i['AggregateName'].upper() not in aname:
            aname.append(i['AggregateName'].upper())
    return jsonify(aname)

# Initializes netting adjustment page. It pulls WELL NAMES and passes it
# to the html page.


@app.route('/nettingadjustment')
def nettingadjustment():

    bigagg = WELL_NAMES
    return render_template(
        'nettingadjustment.html',
        title='Netting Adjustment',
        year=datetime.now().year,
        wellsel=bigagg
    )

# Doesn't appear to be used. Need to investigate.


def dict_clean(items):
    result = {}
    for key, value in items:
        if value is None:
            value = ''
        result[key] = value
    return result

# Route for accessing productionadjustment. LE Name is passed into the
# route to filter the dropdown options.


@app.route('/setleval/<string:lename>', methods=['POST', 'GET'])
def setleval(lename):
    bigagg = getlenames(lename, False)['Details']
    return render_template(
        'productionadjustment.html',
        title='Production Adjustment',
        year=datetime.now().year,
        wellsel=bigagg
    )

# Not sure how active it still is. Need to investigate.


@app.route('/productionadjustment', methods=['POST', 'GET'])
def productionadjustment():
    # TODO: get route to display
    """Renders the home page."""
    return render_template(
        'productionadjustment.html',
        title='Production Adjustment',
        year=datetime.now().year,
        wellsel=bigagg
    )


# Initialization route for areaaggregation. Repulls area names because the page changes the list.
# TODO: Explicit EAST declaration of BU.
# Passes routes and areas into html templates.

@app.route('/areaaggregation')
def areaaggregation():
    data = json.dumps(
        {"AggregateNames": None, "WellNames": None, "CorpIDs": None})
    r = makerequest('get', '/GetAreaDetails', data)
    res = r.json()['Package']
    bigagg = []
    for i in res:
        val = '' + i + ''
        bigagg.append(res[val])

    route = json.dumps(
        {"BusinessUnit": None})
    r = makerequest('get', '/GetAllRoutes', route)
    res2 = r.json()['Package']
    BU = list(res2['business_unit'].values())
    SUB = list(res2['sub_area'].values())
    routes = []
    for i, j in enumerate(BU):
        if j == 'EAST':
            val = '' + SUB[i] + ''
            val = val.strip()
            routes.append(val)
    routes.sort(key=str.lower)
    return render_template(
        'areaaggregation.html',
        title='AreaAggregation',
        sl1=bigagg,
        sl2=bigagg,
        selroute=routes)

# Route for creating area from existing area. Takes form inputs of text
# input of new route name and existing route.


@app.route('/createarea', methods=['POST'])
def createarea():
    new_rname = request.form['new_area_route']
    old_rname = request.form['selroute']
    if len(new_rname) > 0:
        data = {
            "NewRouteName": new_rname,
            "DBRouteName": old_rname,
            "UserName": "Brett Rinne"
        }
        r = makerequest('POST', '/AreaFromRoute', data)
        print('Make New From Route', r.status_code, r.json())
    return redirect(url_for('areaaggregation'))


# Route for crud operations for named areas.
# Update: Changes well makeup of existing area.
# Create: Makes new area from list of selected wells.
# Delete: Deletes selected area from dropdown.
# Refreshes page after operation.

@app.route('/editarea', methods=['POST'])
def editareas():
    # TODO: Change Update user to logged in user.
    test = request.form['new_area']
    area = request.form['sl2']
    buttonpress = request.form['button_area']
    wlist = request.form.getlist('to[]')
    wlist = list(dict.fromkeys(wlist))
    swlist = ','.join(map(str, wlist))
    print(swlist)
    if buttonpress == 'Update' and len(wlist) > 0:
        data = {
            "AreaName": area,
            "WellNames": swlist,
            "UpdateUser": "Brett Rinne"
        }
        r = makerequest('POST', '/UpdateArea', data)
    elif buttonpress == 'Create' and len(wlist) > 0:
        data = {
            "AreaName": test,
            "WellList": swlist,
            "UpdateUser": "Brett Rinne"
        }
        r = makerequest('POST', '/CreateAreaFromWells', data)
    elif buttonpress == 'Delete':
        payload = {
            "AreaName": area,
            "WellList": None
        }
        r = makerequest('delete', '/DeleteArea', payload)

    return redirect(url_for('areaaggregation'))

# Route that pulls production for adjustment page. A pull for Adjusted and
# Actual. Feeds these back in form jexcel can take.


@app.route('/getproduction', methods=['GET', 'POST'])
def getproduction():
    lename = request.form['leselect']
    well = request.form['wells']
    phase = request.form['phase']
    start_date = request.form['start_date']
    end_date = request.form['end_date']
    print(well, phase, start_date, end_date)
    if len(start_date) > 0 and len(end_date) > 0:
        data = {
            "WellorArea": well,
            "Wedge": None,
            "StartDate": start_date,
            "EndDate": end_date,
            "LEName": lename,
            "AdjustedBool": "False",
            "Phase": phase
        }

        adj_data = data
        adj_data["AdjustedBool"] = "True"
        data = json.dumps(data)
        adj_data = json.dumps(adj_data)
        r = makerequest('GET', '/ActualProduction', data)
        r2 = makerequest('GET', '/ActualProduction', adj_data)
        ph = r.json()['Package']['phase']
        unit = r.json()['Package']['units']
        indicator = ph + ' in ' + unit
        dates = r.json()['Package']['dates']
        actual = r.json()['Package']['production_values']
        adjusted = r2.json()['Package']['production_values']
        inputdict = {}
        inputdict['dates'] = dates
        inputdict['Actual'] = actual
        inputdict['Adjusted'] = adjusted
        bigagg = getlenames(lename, False)['Details']

    return render_template(
        'productionadjustment.html',
        title='ProductionAdjustment',
        tabdef=inputdict,
        phtext=indicator,
        req=data,
        wellsel=bigagg
    )

# Route that updates production. Takes fetch request and pushes updates to
# route, then refreshes the page.


@app.route('/updateproduction', methods=['POST'])
def updateproduction():
    payload = request.get_json()
    r = makerequest('post', '/UpdateProduction', payload)
    print(r.status_code)
    print(r.json())
    return redirect(url_for('nettingadjustment'))

# Route that gets netting values based on form inputs. Returns in form
# jexcel can accept.


@app.route('/getnetting', methods=['GET', 'POST'])
def getnetting():
    wells = request.form.getlist('wells[]')
    well = request.form.getlist('wells')
    if(len(wells) > 0):
        well = wells

    print(well)
    phase = request.form['phase']
    data = {
        "WellNames": well,
        "CorpIDs": None
    }
    data = json.dumps(data)
    if phase == 'Gas':
        r = makerequest('GET', '/GetGasNF', data)
    else:
        r = makerequest('GET', '/GetOilNF', data)
    netdata = r.json()['Package']
    dates = []
    v = []
    nwell = []
    filltab = {}
    for i in netdata:
        nwell.append(netdata[i]['WellName'])
        dates.append(netdata[i]['NettingDate'])
        v.append(netdata[i]['NettingValue'])

    filltab['well'] = nwell
    filltab['dates'] = dates
    filltab['values'] = v

    bigagg = WELL_NAMES
    if(len(well) > 1):
        df = pd.DataFrame(filltab)
        df['dates'] = pd.to_datetime(df['dates'], format='%Y-%m-%d %H:%M:%S')
        df = df.merge(df.groupby('well').dates.max(), on=['well', 'dates'])
        print(df)
        filltab2 = {}
        filltab2['well'] = df['well'].tolist()
        filltab2['dates'] = df['dates'].tolist()
        filltab2['values'] = df['values'].tolist()
        return jsonify(filltab2)
    else:
        return render_template(
            'nettingadjustment.html',
            title='NettingAdjustment',
            tabdef=filltab,
            netreq=data,
            phreq=phase,
            wellsel=bigagg)

# Route for updating gas netting. Gets fetch request info and passes it to
# the api.


@app.route('/updategasnetting', methods=['POST'])
def updategasnetting():
    payload = request.get_json()
    r = makerequest('post', '/UpdateGasNF', payload)
    print(r.status_code)
    return render_template(
        'nettingadjustment.html',
        title='NettingAdjustment')

# Route for updating oil netting. Gets fetch request info and passes it to
# the api.


@app.route('/updateoilnetting', methods=['POST'])
def updateoilnetting():
    payload = request.get_json()
    r = makerequest('post', '/UpdateOilNF', payload)
    print(r.status_code)
    return render_template(
        'nettingadjustment.html',
        title='NettingAdjustment')

# Helper function to change no selection to none.


def nchange(x):
    if x == 'No Selection':
        return None
    else:
        return x

# Route for getting data for plotting graph. Pulls LE, Forecast and Actual
# production. Pushes response back to AJAX call.


@app.route('/getlevalues/<string:valtype>', methods=['GET', 'POST'])
def getlevalues(valtype):

    forecast_name = request.form['forecast_selection']
    le_name = request.form['les']
    wedge_name = nchange(request.form['wedge_selection'])
    well_name = nchange(request.form['s_well_selection'])
    n_well_name = well_name
    phase_name = nchange(request.form['phase_selection'])
    LE = getlenames(le_name, False)
    forecast_wells = []
    LES = LE['Details']
    for i in LES:
        if(well_name):
            forecast_wells.append(well_name)
        else:
            if(i['WellName'] not in forecast_wells):
                forecast_wells.append(i['WellName'])
        if(i['WellName'] == well_name):
            well_name = i['CorpID']
    data = {
        "Wedge": wedge_name,
        "CorpIDorAreas": well_name,
        "LEName": le_name,
        "WithFHM": "True",
        "Phase": phase_name
    }
    forecast_wells = list(set(forecast_wells))
    if(valtype == 'LE'):
        r = makerequest('get', '/GetLEValues', json.dumps(data))
        LE_DATA = r.json()['Package']
        return jsonify(LE_DATA)

    if(valtype == 'ACTUAL'):
        in_dates = request.form['in_dates']
        dt = in_dates[1:-1].replace("'", "").split()
        DATE = [parser.parse(x) for x in dt]
        start_date = min(DATE) + timedelta(days=1)
        end_date = max(DATE)
        if(n_well_name):
            wedge_name = None
        data2 = {
            "WellorArea": n_well_name,
            "Wedge": wedge_name,
            "StartDate": start_date.date().strftime("%Y-%m-%d"),
            "EndDate": end_date.date().strftime("%Y-%m-%d"),
            "LEName": le_name,
            "AdjustedBool": "True",
            "Phase": phase_name
        }
        r = makerequest('get', '/ActualProduction', json.dumps(data2))
        PROD_DATA = r.json()['Package']
        return jsonify(PROD_DATA)

    if(valtype == 'FORECAST'):
        in_dates = request.form['in_dates']
        dt = in_dates[1:-1].replace("'", "").split()
        DATE = [parser.parse(x) for x in dt]
        start_date = min(DATE) + timedelta(days=1)
        end_date = max(DATE)
        if(len(forecast_wells) > 0):
            fwells_string = ','.join(forecast_wells)
        else:
            fwells_string = forecast_wells[0]
        data3 = {
            "ForecastName": forecast_name,
            "WellorAreas": fwells_string,
            "Phase": phase_name
        }
        r = makerequest('get', '/GetForecastValues', json.dumps(data3))
        FORECAST_DATA = r.json()['Package']
        newdates = []
        newprod = []
        if len(FORECAST_DATA) > 0:
            for i, j in enumerate(FORECAST_DATA['dates']):
                if start_date <= (parser.parse(
                        FORECAST_DATA['dates'][i])) < end_date:
                    newdates.append(
                        (parser.parse(FORECAST_DATA['dates'][i])).strftime("%Y-%m-%d"))
                    newprod.append(FORECAST_DATA['production_values'][i])
            FORECAST_DICT = {'dates': newdates, 'production_values': newprod}
        else:
            FORECAST_DICT = {'dates': [], 'production_values': []}

        return jsonify(FORECAST_DICT)
    return jsonify({'ERROR': 'NOT LOADED'})

# Route that takes form inputs and returns summary values in a form jexcel
# can accept.


@app.route('/getsummaryvalues', methods=['POST', 'GET'])
def getsummaryvalues():
    le_sel = request.form['les']
    forecast_sel = request.form['forecast_selection']
    data = {
        "LEName": le_sel,
        "Wedge": None,
        "SummaryName": None,
        "GFOForecastName": forecast_sel
    }
    r = makerequest('get', '/GetSummary', json.dumps(data))
    SUMMARY_DATA = r.json()['Package']
    return jsonify(SUMMARY_DATA)

# Route that updates summary values and takes fetch request and pushes
# data to api.


@app.route('/updatesummaryvalues', methods=['POST'])
def updatesummaryvalues():
    payload = request.get_json()
    print(payload)
    r = makerequest('post', '/UpdateSummary', payload)
    print(r.status_code)
    return jsonify(r.json()['Package'])


# Route that takes fetch request and calculates summary based on form inputs.

@app.route('/calculatesummary', methods=['POST'])
def calculatesummary():

    payload = request.get_json()

    r = makerequest('post', '/CalculateSummary', payload)

    return jsonify(r.status_code)

# Route that takes form inputs from selected LE or Forecast and creates LE.


@app.route('/calculatelevalue', methods=['POST'])
def calculatelevalue():

    if('fore' in request.form):
        forecastsel = request.form['fore']
        lesel = None

    else:
        lesel = request.form['les']
        forecastsel = None

    lename = request.form['le_text']

    sdate = request.form['sdate_select']
    edate = request.form['edate_select']
    sdate = datetime.strptime(sdate, "%Y-%m-%d").strftime("%m/%d/%Y")
    edate = datetime.strptime(edate, "%Y-%m-%d").strftime("%m/%d/%Y")

    data = {
        "NewLEName": lename,
        "Wells": None,
        "LEDate": date.today().strftime("%m/%d/%Y"),
        "ForecastName": forecastsel,
        "OriginLEName": lesel,
        "StartDate": sdate,
        "EndDate": edate,
        "UserName": "Travis Comer",
        "Async": "True"
    }
    print(json.dumps(data))
    r = makerequest('post', '/CreateLE', json.dumps(data))
    print(r.json())

    #LE_NAMES = getlenames(None, True)

    return redirect(url_for('home'))

# Route that takes fetch request from form inputs and table to create LE.


@app.route('/calcletemplate', methods=['POST'])
def calcletemplate():
    pack = request.get_json()
    print(json.dumps(pack))
    r = makerequest('post', '/UploadLEFromTemplate', pack)

    return jsonify(r.status_code)

# Route that takes form inputs from selected LE or Forecast and creates LE.


@app.route('/calculateforecastvalue', methods=['POST'])
def calculateforecastvalue():

    # TODO: Add route specific stuff
    if('gfosel' in request.form):
        gfosel = request.form['gfosel']
        gfosel = "True"
    else:
        gfosel = "False"

    ftext = request.form['forecast_text']
    sel_aries = request.form['aries_select']
    sdate = request.form['sdate_select']
    edate = request.form['edate_select']

    sdate = datetime.strptime(sdate, "%Y-%m-%d").strftime("%m/%d/%Y")
    edate = datetime.strptime(edate, "%Y-%m-%d").strftime("%m/%d/%Y")

    data = {
        "AriesScenarioName": sel_aries,
        "ForecastName": ftext,
        "StartDate": sdate,
        "EndDate": edate,
        "ForecastYear": None,
        "Area": None,
        "BusinessUnit": "EAST",
        "GFO": gfosel,
        "CorpIDList": None,
        "UserName": "Brett Rinne",
        "Async": "True"
    }
    print(json.dumps(data))
    r = makerequest('post', '/AriesConversion', json.dumps(data))

    return redirect(url_for('home'))


@app.route('/calcforecasttemplate', methods=['POST'])
def calcforecasttemplate():

    pack = request.get_json()
    print(json.dumps(pack))
    r = makerequest('post', '/UploadForecastFromTemplate', pack)

    return jsonify(r.status_code)


# Route for interacting with backend API

def makerequest(req_method, req_suffix, payload):
    south_exceptions = ['/ActualProduction']
    if(isinstance(payload, dict)):
        payload = json.dumps(payload)

    if req_suffix in south_exceptions:
        URL = "https://leutility-backend.azurewebsites.net"
    else:
        URL = "https://leutility-backend-east.azurewebsites.net"
    t = Timer()
    tmessage = req_method + " : " + req_suffix
    t.start()
    if req_method.lower() == 'get':
        r = requests.request(
            method=req_method,
            url=URL + req_suffix,
            data=payload)
        t.stop(tmessage)
        return r
    elif req_method.lower() == 'delete':
        print("Delete Method")
        r = requests.delete(
            URL + req_suffix,
            data=payload)
        t.stop(tmessage)
        return r
    else:
        print(URL + req_suffix, payload)
        print(req_method)

        r = requests.post(
            URL + req_suffix,
            data=payload)
        t.stop(tmessage)
        return r

# Loads header information for Well names, Forecast names and LE names


def initialLoad():

    data = json.dumps(
        {"AggregateNames": None, "WellNames": None, "CorpIDs": None})
    r = makerequest('get', '/GetAreaDetails', data)
    res = r.json()['Package']
    bigagg1 = []
    for i in res:
        val = '' + i + ''
        bigagg1.append(res[val])

    data = {
        "StartDate": None,
        "EndDate": None,
        "LastWeek": "False",
        "FirstOfMonth": "False",
        "WellorAreas": None,
        "Wedge": None,
        "NameFilter": None
    }
    data = json.dumps(data)
    r = makerequest('get', '/GetLE', data)
    res = r.json()['Package']
    bigagg2 = []
    for i in res:
        val = '' + i + ''
        bigagg2.append(res[val])

    data = {
        "WellorArea": None,
        "Wedge": None,
        "NameFilter": None,
        "GFOz": "False"
    }
    data = json.dumps(data)
    r = makerequest('get', '/GetForecast', data)
    res = r.json()['Package']
    bigagg3 = []
    for i in res:
        val = '' + i + ''
        bigagg3.append(res[val])
    print("initial Load Complete")
    return bigagg1, bigagg2, bigagg3


WELL_NAMES, LE_NAMES, FORECAST_NAMES = initialLoad()


if __name__ == '__main__':
    app.run()
