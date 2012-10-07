###
#    Copyright (c) 2012 Jason Siefken
#
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
###

window.CONFIGURATION =
    faculties: ['Engineering', 'Science', 'Other']
    courses: ['MATH 100', 'MATH 101', 'MATH 102', 'MATH 120','MATH 151','MATH 161','MATH 200','MATH 201','MATH 211','MATH 236','STAT 252','STAT 255','STAT 260']

###
# Smart typeof function that will recognize builtin types as well as objects
# that are instances of those types.
###
typeOf = window.typeOf or (obj) ->
    guess = typeof obj
    if guess != 'object'
        return guess
    if obj == null
        return 'null'

    # if we got 'object', we have some more work to do
    objectTypes =
        'array': Array
        'boolean': Boolean
        'number': Number
        'string': String
    for type, constructor of objectTypes
        if obj instanceof constructor
            return type

    # if we are not one of the builtin types, check to see if we have a named constructor
    constructorName = obj.constructor.name
    # If we truely are a plain-old object type, handle this now
    if constructorName == 'Object' or not constructorName?
        return 'object'
    return constructorName

transpose = (array) ->
    ret = []
    for i in [0...array[0].length]
        entry = []
        for j in [0...array.length]
            entry.push array[j][i]
        ret.push entry
    return ret

sum = (arr) ->
    ret = 0
    for i in arr
        ret += i
    return ret

round = (n, places=0) ->
    shift = Math.pow(10, places)
    return Math.round(n*shift) / shift
# increment parent[prop] by one if it exists,
# otherwise create it and then increment by 1
smartIncrement = (parent, prop) ->
    if parent[prop]?
        parent[prop] += 1
    else
        parent[prop] = 1
    return parent[prop]

padd2 = (x) ->
    return ("0"+x).slice(-2)
getHourAsDecimal = (date=new Date(0,0)) ->
    return date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600
getFormattedDayString = (date = new Date) ->
    return "#{date.getFullYear()}-#{padd2(date.getMonth()+1)}-#{padd2(date.getDate())}"
parseSearchString = (s=window.location.search) ->
    ret = {}
    if s.charAt(0) is '?'
        s = s.substring(1)
    vars = s.split('&')
    for i in vars
        pair = i.split('=')
        ret[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
    return ret

toTitleCase = (str) ->
  str.replace /\w\S*/g, (txt) ->
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()

###
# Various methods of downloading data to the users compuer so they can save it.
# Initially DownloadManager.download will try to bounce off download.php,
# a server-side script that sends the data it receives back with approprate
# headers.  If this fails, it will try to use the blob API to and the
# 'download' attribute of an anchor to download the file with a suggested file name.
# If this fails, a dataURI is used.
###
class DownloadManager
    DOWNLOAD_SCRIPT: 'download.php'
    constructor: (@filename, @data, @mimetype='application/octet-stream') ->
    # a null status means no checks have been performed on whether that method will work
        @downloadMethodAvailable =
            serverBased: null
            blobBased: null
            dataUriBased: null

    # run through each download method and if it works,
    # use that method to download the graph.  @downloadMethodAvailable
    # starts as all null and will be set to true or false after a test has been run
    download: () =>
        if @downloadMethodAvailable.serverBased == null
            @testServerAvailability(@download)
            return
        if @downloadMethodAvailable.serverBased == true
            @downloadServerBased()
            return

        if @downloadMethodAvailable.blobBased == null
            @testBlobAvailability(@download)
            return
        if @downloadMethodAvailable.blobBased == true
            @downloadBlobBased()
            return

        if @downloadMethodAvailable.dataUriBased == null
            @testDataUriAvailability(@download)
            return
        if @downloadMethodAvailable.dataUriBased == true
            @downloadDataUriBased()
            return

    testServerAvailability: (callback = ->) =>
        $.ajax
            url: @DOWNLOAD_SCRIPT
            dataType: 'text'
            success: (data, status, response) =>
                if response.getResponseHeader('Content-Description') is 'File Transfer'
                    @downloadMethodAvailable.serverBased = true
                else
                    @downloadMethodAvailable.serverBased = false
                callback.call(this)
            error: (data, status, response) =>
                @downloadMethodAvailable.serverBased = false
                callback.call(this)

    testBlobAvailability: (callback = ->) =>
        if (window.webkitURL or window.URL) and (window.Blob or window.MozBlobBuilder or window.WebKitBlobBuilder)
            @downloadMethodAvailable.blobBased = true
        else
            @downloadMethodAvailable.blobBased = true
        callback.call(this)

    testDataUriAvailability: (callback = ->) =>
        # not sure how to check for this ...
        @downloadMethodAvailable.dataUriBased = true
        callback.call(this)

    downloadServerBased: () =>
        input1 = $('<input type="hidden"></input>').attr({name: 'filename', value: @filename})
        # encode our data in base64 so it doesn't get mangled by post (i.e., so '\n' to '\n\r' doesn't happen...)
        input2 = $('<input type="hidden"></input>').attr({name: 'data', value: btoa(@data)})
        input3 = $('<input type="hidden"></input>').attr({name: 'mimetype', value: @mimetype})
        # target=... is set to our hidden iframe so we don't change the url of our main page
        form = $('<form action="'+@DOWNLOAD_SCRIPT+'" method="post" target="downloads_iframe"></form>')
        form.append(input1).append(input2).append(input3)

        # submit the form and hope for the best!
        form.appendTo(document.body).submit().remove()

    downloadBlobBased: (errorCallback=@download) =>
        try
            # first convert everything to an arraybuffer so raw bytes in our string
            # don't get mangled
            buf = new ArrayBuffer(@data.length)
            bufView = new Uint8Array(buf)
            for i in [0...@data.length]
                bufView[i] = @data.charCodeAt(i) & 0xff

            try
                # This is the recommended method:
                blob = new Blob(buf, {type: 'application/octet-stream'})
            catch e
                # The BlobBuilder API has been deprecated in favour of Blob, but older
                # browsers don't know about the Blob constructor
                # IE10 also supports BlobBuilder, but since the `Blob` constructor
                # also works, there's no need to add `MSBlobBuilder`.
                bb = new (window.WebKitBlobBuilder || window.MozBlobBuilder)
                bb.append(buf)
                blob = bb.getBlob('application/octet-stream')

            url = (window.webkitURL || window.URL).createObjectURL(blob)

            downloadLink = $('<a></a>').attr({href: url, download: @filename})
            $(document.body).append(downloadLink)
            # trigger the file save dialog
            downloadLink[0].click()
            # clean up when we're done
            downloadLink.remove()
        catch e
            @downloadMethodAvailable.blobBased = false
            errorCallback.call(this)

    downloadDataUriBased: () =>
        document.location.href = "data:application/octet-stream;base64," + btoa(@data)

class StudentEntry
    RESTORE_TIME: 30     # seconds that the 'Restore' button is available after a student is helped or removed
    # executed whenever 'Remove' is clicked
    onremove: null
    # executed whenever 'Help' is clicked
    onhelped: null
    # executed after either 'Help' or 'Remove' is clicked
    onstatuschange: -> updateStorage()
    constructor: (@name, @faculty, @course, @signupTime=new Date, @wasHelped=null, @wasRemoved=null) ->
    generateTableRow: ->
        @elm = $("<tr><td class='tablename'>#{@name}</td><td class='tablefaculty'>#{@faculty}</td><td class='tablecourse'>#{@course}</td></tr>")
        helped = $("<button>Helped</button>").button()
        removed = $("<button>Remove</button>").button()
        helped.click =>
            if @onhelped
                @onhelped.call(this)
            else
                @wasHelped = true
                @helpedTime = new Date
                @remove(@RESTORE_TIME)
            if @onstatuschange
                @onstatuschange.call(this)
        removed.click =>
            if @onremove
                @onremove.call(this)
            else
                @wasRemoved = true
                @remove(@RESTORE_TIME)
            if @onstatuschange
                @onstatuschange.call(this)
        td = $("<td class='tableaction'></td>")
        container = $("<span class='action'></span>")
        container.append helped
        container.append removed
        td.append container
        @elm.append td
        
        return @elm

    # if a non-zero timeout is specified, we apply 
    # a strikethrough to the row and set up an undo
    # button.  If the undo button is not pressed,
    # the row will dissapear after timeout has elapsed,
    # otherwise the row is restored to its original condition
    #
    # timeout is in seconds
    remove: (timeout=0) =>
        if timeout is 0 and not @preventRemove
            @elm.fadeOut(500, => @elm.remove())
        else if timeout isnt 0
            @preventRemove = false
            @elm.addClass('strike')
            @elm.find('.action').hide()
            restore = $("<button class='restore'>Restore</button>").button()
            restore.click =>
                # prevent the timer from removing the row
                @preventRemove = true
                # restore everything to look like normal
                @elm.removeClass('strike')
                restore.remove()
                @elm.find('.action').show()
                @wasRemoved = null
                @wasHelped = null
                # our status changes when we hit restore, so don't forget to call the callback!
                if @onstatuschange
                    @onstatuschange.call(this)
                
            @elm.find('.action').parent().append restore
            window.setTimeout((=> @remove(0)), timeout*1000)
    toString: ->
        return "[#{@name},#{@course}]"

    toJSON: ->
        ret =
            name: @name
            faculty: @faculty
            course: @course
            signupTime: @signupTime.toJSON()
            wasHelped: @wasHelped
            wasRemoved: @wasRemoved
            helpedTime: if @helpedTime then @helpedTime.toJSON() else undefined
        return ret

    @fromJSON: (obj) ->
        if typeOf(obj) is 'string'
            obj = $.parseJSON(obj)
        ret = new StudentEntry(obj.name, obj.faculty, obj.course, new Date(obj.signupTime), obj.wasHelped, obj.wasRemoved)
        ret.helpedTime = new Date(obj.helpedTime) if obj.helpedTime
        return ret
    toCSV: ->
        helped = @wasHelped or false
        removed = @wasRemoved or false
        return "#{@name},#{@faculty},#{@course},#{helped},#{removed},#{getFormattedDayString(@signupTime)},#{getHourAsDecimal(@signupTime)},#{getHourAsDecimal(@helpedTime)}"

            

$(document).ready ->
    $('button').button()
    $('#adminpage').hide()
    
    # searchString stores everything entered in the url after a '?'.
    # Various pages and views are activated by adding searchstring options
    # (this way we have access to local storage since our URL hasn't changed)
    searchString = parseSearchString()
    if searchString['dataDump']
        $('body').empty()
        dumpArea = $("<div style='white-space: pre; font-family: monospace; width:100%; height:100%'></div>")
        startDate = searchString['start']
        endDate = searchString['end']
        allData = getDataFromRange(startDate, endDate)
        # add the csv header describing what each column is
        csv = 'Name,Faculty,Course,Was Helped,Was Removed,Date,Hour Signup,Hour Helped\n'
        csv += (k.toCSV() for k in allData).join('\n')
        dumpArea.append($('<textarea style="width:90%;height:90%;font-family:monospace;"></textarea>').html(csv))
        $('html').css({'height':'100%'})
        $('body').css({'height':'100%'})
        $(document.body).append(dumpArea)

        dm = new DownloadManager("HelpCenter#{startDate}to#{endDate}.csv", csv, "text/csv")
        dm.download()
        return
    if searchString['admin']
        $('#adminpage').show()
        $('#studentlist').hide()
        $('#studentadd').hide()
        $('#header').html('Admin Page')
        $('#fromdate').datepicker
            defaultDate: '-1m'
            changeMonth: true
            numberOfMonths: 3
            onSelect: (selectedDate) ->
                $('#todate').datepicker('option', 'minDate', selectedDate)
                updateAdminPage()
        $('#todate').datepicker
            defaultDate: '+1d'
            changeMonth: true
            numberOfMonths: 3
            onSelect: (selectedDate) ->
                $('#fromdate').datepicker('option', 'maxDate', selectedDate)
                updateAdminPage()
        $('#downloaddata').click ->
            start = $('#fromdate').datepicker('getDate')
            if not start?
                blinkElement($('#fromdate'))
                return
            end = $('#todate').datepicker('getDate')
            if not end?
                end = new Date

            startStr = getFormattedDayString(start)
            endStr = getFormattedDayString(end)

            search = "?start=#{startStr}&end=#{endStr}&dataDump"
            window.location.search = search
        $('#cleardata').click ->
            # set up a confirmation dialog to confirm clearing all data
            dialog = $("""<div title="Clear All Data?">
	        <p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>
                You are choosing to erase all locally stored data.  This action
                cannot be undone. Do you wish to proceed</p>
            </div>""")
            $(document.body).append dialog
            dialog.dialog
                modal: true
                buttons:
                    "Delete All Data": ->
                        eraseStorage()
                        $(this).dialog('close')
                        $(this).remove()
                    "Cancel": ->
                        $(this).dialog('close')
                        $(this).remove()
            dialog.dialog('open')
            window.d = dialog
        today = new Date
        $('#todate').datepicker('setDate', today)
        today.setMonth((12 + today.getMonth() - 1) % 12)
        $('#fromdate').datepicker('setDate', today)
        updateAdminPage()
        return
    
    
    if window.CONFIGURATION.faculties
        faculty = $('#faculty').empty()
        for f in window.CONFIGURATION.faculties
            faculty.append("<option value='#{f}'>#{f}</option>")
    if window.CONFIGURATION.courses
        course = $('#course').empty()
        for c in window.CONFIGURATION.courses
            course.append("<option value='#{c}'>#{c}</option>")
        # set up a special 'Other...' option that will let the user manually
        # enter a course
        course.append("<option value='Other'>Other...</option>")
        course.change ->
            val = course.find('option:selected').val()
            if val is 'Other'
                $('#courseinput').show()
            else
                $('#courseinput').hide()


    # read what we have from local storage
    $.jStorage.reInit()
    today = new Date
    today = getFormattedDayString(today)
    window.students = (StudentEntry.fromJSON(e) for e in ($.jStorage.get("log-#{today}") or []))
    populateStudentList()
    updateGraphics()

    # set up the usual interface
    triggerOnEnterPress = (e) ->
        if e.which is 13
            $(this).blur()
            $('#addname').focus().click()
    $('#addname').click addStudent
    $('#courseinput').hide()
    $('#name').keypress triggerOnEnterPress
    $('#faculty').keypress triggerOnEnterPress
    $('#course').keypress triggerOnEnterPress

# blinks the background color of an element to red and then back again
blinkElement = (elm) ->
    # don't do anything if we're already in an animation loop...
    if elm.is(':animated')
        return
    originalBackground = elm.css('background-color')
    elm.animate({ backgroundColor: '#f00' }, 500, null, -> elm.animate({backgroundColor: originalBackground},500))

# update all the charts and graphics on the admin page
updateAdminPage = ->
    startDate = getFormattedDayString($('#fromdate').datepicker('getDate'))
    endDate = getFormattedDayString($('#todate').datepicker('getDate'))
    allData = getDataFromRange(startDate, endDate)

    stats = getStatistics(allData)
    console.log stats

    $('#numstudentshelped').html(stats.studentsHelped)
    $('#numstudentsremoved').html(stats.studentsRemoved)

    # make a pretty chart
    ticks = (k for k of stats.coursesHelped)
    data = (v for k,v of stats.coursesHelped)
    $('#chart1').empty()
    plot = $.jqplot('chart1', [data],
        seriesDefaults:
            renderer: $.jqplot.BarRenderer
            rendererOptions:
                fillToZero: true
            pointLabels:
                show: true
        axesDefaults:
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        title: 'Which courses were helped with?'
        axes:
            xaxis:
                renderer: $.jqplot.CategoryAxisRenderer
                ticks: ticks
                label: 'Course'
            yaxis:
                label: 'Number of Students Helped'
        )
    
    ticks = (k for k of stats.facultiesHelped)
    data = (v for k,v of stats.facultiesHelped)
    $('#chart2').empty()
    plot = $.jqplot('chart2', [data],
        seriesDefaults:
            renderer: $.jqplot.BarRenderer
            rendererOptions:
                fillToZero: true
            pointLabels:
                show: true
        axesDefaults:
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        title: 'Which faculties are being helped?'
        axes:
            xaxis:
                renderer: $.jqplot.CategoryAxisRenderer
                ticks: ticks
                label: 'Faculty'
            yaxis:
                label: 'Number of Students Helped'
    )
    seriesLabels = ({label: k} for k of stats.facultiesHelped)
    ticks = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    breakdown = []
    for k of stats.facultiesHelped
        data = []
        for v in stats.studentsHelpedByWeekdayFacultyBreakdown
            val = 0
            if v[k]?
                val = v[k]
            data.push val
        breakdown.push(data)
    $('#chart3').empty()
    plot = $.jqplot('chart3', breakdown,
        stackSeries: true
        seriesDefaults:
            renderer: $.jqplot.BarRenderer
            rendererOptions:
                fillToZero: true
            pointLabels:
                show: true
        axesDefaults:
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        title: 'Which faculties are being helped?'
        axes:
            xaxis:
                renderer: $.jqplot.CategoryAxisRenderer
                ticks: ticks
                label: 'Day of Week'
            yaxis:
                label: 'Number of Students Helped'
        series: seriesLabels
        legend:
            show: true
            placement: 'outside'
    )
    $('#chart4').empty()
    data = ([getHourAsDecimal(t),w] for [t,w] in stats.waitTimes)
    plot = $.jqplot('chart4', [data],
        seriesDefaults:
            showMarker: true
            showLine: false
        axesDefaults:
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        title: 'What are the wait times?'
        axes:
            xaxis:
                label: 'Hour of Day'
            yaxis:
                label: 'Minutes Until Helped'
    )

# generate all useful statistics from a dataArray
getStatistics = (dataArray) ->
    ret =
        coursesHelped: {}
        studentsHelped: 0
        studentsRemoved: 0
        facultiesHelped: {}
        studentsHelpedByWeekday: [0,0,0,0,0,0,0]
        studentsHelpedByWeekdayFacultyBreakdown: [{},{},{},{},{},{},{}]
        waitTimes: []

    for elm in dataArray
        if elm.wasHelped
            smartIncrement(ret.coursesHelped, elm.course)
            smartIncrement(ret.facultiesHelped, elm.faculty)
            ret.studentsHelped += 1
            ret.studentsHelpedByWeekday[elm.signupTime.getDay()] += 1
            smartIncrement(ret.studentsHelpedByWeekdayFacultyBreakdown[elm.signupTime.getDay()], elm.faculty)
            if elm.helpedTime
                ret.waitTimes.push [elm.signupTime, (elm.helpedTime.getTime()-elm.signupTime.getTime())/60000]
        if elm.wasRemoved
            ret.studentsRemoved += 1
    return ret

# update the charts/graphics
updateGraphics = ->
    $('#courseschart').empty()
    try
        # estimate the waiting time for being helped by averaging the previous 6 help
        # times
        studentsHelped = (s for s in window.students when s.wasHelped == true)
        waitTimes = ((getHourAsDecimal(s.helpedTime) - getHourAsDecimal(s.signupTime))*60 for s in studentsHelped)
        helpEstimate = 'Unknown'
        if waitTimes.length >= 6
            waitTimes = waitTimes.slice(-6)
            wait = sum(waitTimes) / 6
            helpEstimate = "#{round(wait)}"
        $('#expectedwaitminutes').html(helpEstimate)

        # update the "Who's waiting" graphic
        studentsWaiting = (s for s in window.students when s.wasHelped != true and s.wasRemoved != true)
        courseTally = {}
        for s in studentsWaiting
            smartIncrement(courseTally, s.course)
        # make a pretty chart
        ticks = (k for k of courseTally)
        data = (v for k,v of courseTally)
        plot = $.jqplot('courseschart', [data],
            seriesDefaults:
                renderer: $.jqplot.BarRenderer
                rendererOptions:
                    fillToZero: true
                pointLabels:
                    show: true
            axesDefaults:
                labelRenderer: $.jqplot.CanvasAxisLabelRenderer
            title: 'Which courses are people waiting for?'
            axes:
                xaxis:
                    renderer: $.jqplot.CategoryAxisRenderer
                    ticks: ticks
                    label: 'Course'
                yaxis:
                    label: 'Number of Students Waiting'
            )
    catch e
        console.log e

eraseStorage = ->
    $.jStorage.reInit()
    for i in $.jStorage.index()
        $.jStorage.deleteKey(i)

updateStorage = ->
    # TODO: shouldnt do this here, it isnt part of storage, but update the graphics
    # whenever something saveworthy happens!
    updateGraphics()

    today = new Date
    todayStr = getFormattedDayString(today)
    day = today.getDate()
    year = today.getFullYear()
    month = today.getMonth()

    todaysStudents = []
    for student in window.students
        if student.signupTime.getDate() == day and student.signupTime.getMonth() == month and student.signupTime.getFullYear() == year
            todaysStudents.push student.toJSON()
    $.jStorage.reInit()
    $.jStorage.set("log-#{todayStr}", todaysStudents)
    
# initialize the student list with the contents of window.students
populateStudentList = ->
    for item in window.students
        # only initialize the list with people who 
        # havent been helped or removed from the list
        if not (item.wasHelped or item.wasRemoved)
            $('#studentlist table').append(item.generateTableRow())


addStudent = ->
    name = $('#name').val().trim().replace(/[^a-zA-Z ]+/g,'')
    faculty = $('#faculty option:selected').val()
    course = $('#course option:selected').val()
    if course is 'Other'
        course = $('#courseinput').val().trim().toUpperCase() or 'Other'
    
    # verify the form is filled out correctly
    if name is ''
        blinkElement($('#name'))
        return

    # format the name to look good...
    name = toTitleCase(name)


    # make sure everything is reset to defaults
    $('#courseinput').hide()
    $('#courseinput').val('')
    $('#name').val('')
    $('#faculty').val($('#faculty option:first').val())
    $('#course').val($('#course option:first').val())

    entry = new StudentEntry(name, faculty, course)
    students.push entry
    $('#studentlist table').append(entry.generateTableRow())
    updateStorage()

    # put the focus back to the name entry
    $('#name').focus()

getDataFromRange = (startDate='', endDate='') ->
    allData = []
    $.jStorage.reInit()
    # Whenever we store student data, we prefix it with 'log-<date>' so
    # find all of those occurances
    indices = ([k,k.slice(4)] for k in $.jStorage.index() when k.slice(0,4) == 'log-')
    for [k, date] in indices
        if date >= startDate and date <= endDate
            entries = (StudentEntry.fromJSON(e) for e in $.jStorage.get(k))
            allData = allData.concat entries
    return allData
