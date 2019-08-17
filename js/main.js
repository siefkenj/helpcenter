// Generated by CoffeeScript 1.3.3
/*
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
*/

var DownloadManager,
    StudentEntry,
    addStudent,
    blinkElement,
    eraseStorage,
    getDataFromRange,
    getFormattedDayString,
    getHourAsDecimal,
    getStatistics,
    padd2,
    parseSearchString,
    populateStudentList,
    round,
    smartIncrement,
    sum,
    toTitleCase,
    transpose,
    typeOf,
    updateAdminPage,
    updateGraphics,
    updateStorage,
    __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments);
        };
    };

window.CONFIGURATION = {
    faculties: ["Arts and Science", "Engineering", "Other"],
    courses: [
        "MAT133",
        "MAT135",
        "MAT136",
        "MAT137",
        "MAT186",
        "MAT187",
        "MAT188",
        "MAT223"
    ]
};

/*
# Smart typeof function that will recognize builtin types as well as objects
# that are instances of those types.
*/

typeOf =
    window.typeOf ||
    function(obj) {
        var constructor, constructorName, guess, objectTypes, type;
        guess = typeof obj;
        if (guess !== "object") {
            return guess;
        }
        if (obj === null) {
            return "null";
        }
        objectTypes = {
            array: Array,
            boolean: Boolean,
            number: Number,
            string: String
        };
        for (type in objectTypes) {
            constructor = objectTypes[type];
            if (obj instanceof constructor) {
                return type;
            }
        }
        constructorName = obj.constructor.name;
        if (constructorName === "Object" || !(constructorName != null)) {
            return "object";
        }
        return constructorName;
    };

transpose = function(array) {
    var entry, i, j, ret, _i, _j, _ref, _ref1;
    ret = [];
    for (
        i = _i = 0, _ref = array[0].length;
        0 <= _ref ? _i < _ref : _i > _ref;
        i = 0 <= _ref ? ++_i : --_i
    ) {
        entry = [];
        for (
            j = _j = 0, _ref1 = array.length;
            0 <= _ref1 ? _j < _ref1 : _j > _ref1;
            j = 0 <= _ref1 ? ++_j : --_j
        ) {
            entry.push(array[j][i]);
        }
        ret.push(entry);
    }
    return ret;
};

sum = function(arr) {
    var i, ret, _i, _len;
    ret = 0;
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
        i = arr[_i];
        ret += i;
    }
    return ret;
};

round = function(n, places) {
    var shift;
    if (places == null) {
        places = 0;
    }
    shift = Math.pow(10, places);
    return Math.round(n * shift) / shift;
};

smartIncrement = function(parent, prop) {
    if (parent[prop] != null) {
        parent[prop] += 1;
    } else {
        parent[prop] = 1;
    }
    return parent[prop];
};

padd2 = function(x) {
    return ("0" + x).slice(-2);
};

getHourAsDecimal = function(date) {
    if (date == null) {
        date = new Date(0, 0);
    }
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
};

getFormattedDayString = function(date) {
    if (date == null) {
        date = new Date();
    }
    return (
        "" +
        date.getFullYear() +
        "-" +
        padd2(date.getMonth() + 1) +
        "-" +
        padd2(date.getDate())
    );
};

parseSearchString = function(s) {
    var i, pair, ret, vars, _i, _len;
    if (s == null) {
        s = window.location.search;
    }
    ret = {};
    if (s.charAt(0) === "?") {
        s = s.substring(1);
    }
    vars = s.split("&");
    for (_i = 0, _len = vars.length; _i < _len; _i++) {
        i = vars[_i];
        pair = i.split("=");
        ret[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return ret;
};

toTitleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

/*
# Various methods of downloading data to the users compuer so they can save it.
# Initially DownloadManager.download will try to bounce off download.php,
# a server-side script that sends the data it receives back with approprate
# headers.  If this fails, it will try to use the blob API to and the
# 'download' attribute of an anchor to download the file with a suggested file name.
# If this fails, a dataURI is used.
*/

DownloadManager = (function() {
    DownloadManager.prototype.DOWNLOAD_SCRIPT = "download.php";

    function DownloadManager(filename, data, mimetype) {
        this.filename = filename;
        this.data = data;
        this.mimetype =
            mimetype != null ? mimetype : "application/octet-stream";
        this.downloadDataUriBased = __bind(this.downloadDataUriBased, this);

        this.downloadBlobBased = __bind(this.downloadBlobBased, this);

        this.downloadServerBased = __bind(this.downloadServerBased, this);

        this.testDataUriAvailability = __bind(
            this.testDataUriAvailability,
            this
        );

        this.testBlobAvailability = __bind(this.testBlobAvailability, this);

        this.testServerAvailability = __bind(this.testServerAvailability, this);

        this.download = __bind(this.download, this);

        this.downloadMethodAvailable = {
            serverBased: null,
            blobBased: null,
            dataUriBased: null
        };
    }

    DownloadManager.prototype.download = function() {
        if (this.downloadMethodAvailable.serverBased === null) {
            this.testServerAvailability(this.download);
            return;
        }
        if (this.downloadMethodAvailable.serverBased === true) {
            this.downloadServerBased();
            return;
        }
        if (this.downloadMethodAvailable.blobBased === null) {
            this.testBlobAvailability(this.download);
            return;
        }
        if (this.downloadMethodAvailable.blobBased === true) {
            this.downloadBlobBased();
            return;
        }
        if (this.downloadMethodAvailable.dataUriBased === null) {
            this.testDataUriAvailability(this.download);
            return;
        }
        if (this.downloadMethodAvailable.dataUriBased === true) {
            this.downloadDataUriBased();
        }
    };

    DownloadManager.prototype.testServerAvailability = function(callback) {
        var _this = this;
        if (callback == null) {
            callback = function() {};
        }
        return $.ajax({
            url: this.DOWNLOAD_SCRIPT,
            dataType: "text",
            success: function(data, status, response) {
                if (
                    response.getResponseHeader("Content-Description") ===
                    "File Transfer"
                ) {
                    _this.downloadMethodAvailable.serverBased = true;
                } else {
                    _this.downloadMethodAvailable.serverBased = false;
                }
                return callback.call(_this);
            },
            error: function(data, status, response) {
                _this.downloadMethodAvailable.serverBased = false;
                return callback.call(_this);
            }
        });
    };

    DownloadManager.prototype.testBlobAvailability = function(callback) {
        if (callback == null) {
            callback = function() {};
        }
        if (
            (window.webkitURL || window.URL) &&
            (window.Blob || window.MozBlobBuilder || window.WebKitBlobBuilder)
        ) {
            this.downloadMethodAvailable.blobBased = true;
        } else {
            this.downloadMethodAvailable.blobBased = true;
        }
        return callback.call(this);
    };

    DownloadManager.prototype.testDataUriAvailability = function(callback) {
        if (callback == null) {
            callback = function() {};
        }
        this.downloadMethodAvailable.dataUriBased = true;
        return callback.call(this);
    };

    DownloadManager.prototype.downloadServerBased = function() {
        var form, input1, input2, input3;
        input1 = $('<input type="hidden"></input>').attr({
            name: "filename",
            value: this.filename
        });
        input2 = $('<input type="hidden"></input>').attr({
            name: "data",
            value: btoa(this.data)
        });
        input3 = $('<input type="hidden"></input>').attr({
            name: "mimetype",
            value: this.mimetype
        });
        form = $(
            '<form action="' +
                this.DOWNLOAD_SCRIPT +
                '" method="post" target="downloads_iframe"></form>'
        );
        form.append(input1)
            .append(input2)
            .append(input3);
        return form
            .appendTo(document.body)
            .submit()
            .remove();
    };

    DownloadManager.prototype.downloadBlobBased = function(errorCallback) {
        var bb, blob, buf, bufView, downloadLink, i, url, _i, _ref;
        if (errorCallback == null) {
            errorCallback = this.download;
        }
        try {
            buf = new ArrayBuffer(this.data.length);
            bufView = new Uint8Array(buf);
            for (
                i = _i = 0, _ref = this.data.length;
                0 <= _ref ? _i < _ref : _i > _ref;
                i = 0 <= _ref ? ++_i : --_i
            ) {
                bufView[i] = this.data.charCodeAt(i) & 0xff;
            }
            try {
                blob = new Blob(buf, {
                    type: "application/octet-stream"
                });
            } catch (e) {
                bb = new (window.WebKitBlobBuilder || window.MozBlobBuilder)();
                bb.append(buf);
                blob = bb.getBlob("application/octet-stream");
            }
            url = (window.webkitURL || window.URL).createObjectURL(blob);
            downloadLink = $("<a></a>").attr({
                href: url,
                download: this.filename
            });
            $(document.body).append(downloadLink);
            downloadLink[0].click();
            return downloadLink.remove();
        } catch (e) {
            this.downloadMethodAvailable.blobBased = false;
            return errorCallback.call(this);
        }
    };

    DownloadManager.prototype.downloadDataUriBased = function() {
        return (document.location.href =
            "data:application/octet-stream;base64," + btoa(this.data));
    };

    return DownloadManager;
})();

StudentEntry = (function() {
    StudentEntry.prototype.RESTORE_TIME = 30;

    StudentEntry.prototype.onremove = null;

    StudentEntry.prototype.onhelped = null;

    StudentEntry.prototype.onstatuschange = function() {
        return updateStorage();
    };

    function StudentEntry(
        name,
        faculty,
        course,
        signupTime,
        wasHelped,
        wasRemoved
    ) {
        this.name = name;
        this.faculty = faculty;
        this.course = course;
        this.signupTime = signupTime != null ? signupTime : new Date();
        this.wasHelped = wasHelped != null ? wasHelped : null;
        this.wasRemoved = wasRemoved != null ? wasRemoved : null;
        this.remove = __bind(this.remove, this);
    }

    StudentEntry.prototype.generateTableRow = function() {
        var container,
            helped,
            removed,
            td,
            _this = this;
        this.elm = $(
            "<tr><td class='tablename'>" +
                this.name +
                "</td><td class='tablefaculty'>" +
                this.faculty +
                "</td><td class='tablecourse'>" +
                this.course +
                "</td></tr>"
        );
        helped = $("<button>Helped</button>").button();
        removed = $("<button>Remove</button>").button();
        helped.click(function() {
            if (_this.onhelped) {
                _this.onhelped.call(_this);
            } else {
                _this.wasHelped = true;
                _this.helpedTime = new Date();
                _this.remove(_this.RESTORE_TIME);
            }
            if (_this.onstatuschange) {
                return _this.onstatuschange.call(_this);
            }
        });
        removed.click(function() {
            if (_this.onremove) {
                _this.onremove.call(_this);
            } else {
                _this.wasRemoved = true;
                _this.remove(_this.RESTORE_TIME);
            }
            if (_this.onstatuschange) {
                return _this.onstatuschange.call(_this);
            }
        });
        td = $("<td class='tableaction'></td>");
        container = $("<span class='action'></span>");
        container.append(helped);
        container.append(removed);
        td.append(container);
        this.elm.append(td);
        return this.elm;
    };

    StudentEntry.prototype.remove = function(timeout) {
        var restore,
            _this = this;
        if (timeout == null) {
            timeout = 0;
        }
        if (timeout === 0 && !this.preventRemove) {
            return this.elm.fadeOut(500, function() {
                return _this.elm.remove();
            });
        } else if (timeout !== 0) {
            this.preventRemove = false;
            this.elm.addClass("strike");
            this.elm.find(".action").hide();
            restore = $("<button class='restore'>Restore</button>").button();
            restore.click(function() {
                _this.preventRemove = true;
                _this.elm.removeClass("strike");
                restore.remove();
                _this.elm.find(".action").show();
                _this.wasRemoved = null;
                _this.wasHelped = null;
                if (_this.onstatuschange) {
                    return _this.onstatuschange.call(_this);
                }
            });
            this.elm
                .find(".action")
                .parent()
                .append(restore);
            return window.setTimeout(function() {
                return _this.remove(0);
            }, timeout * 1000);
        }
    };

    StudentEntry.prototype.toString = function() {
        return "[" + this.name + "," + this.course + "]";
    };

    StudentEntry.prototype.toJSON = function() {
        var ret;
        ret = {
            name: this.name,
            faculty: this.faculty,
            course: this.course,
            signupTime: this.signupTime.toJSON(),
            wasHelped: this.wasHelped,
            wasRemoved: this.wasRemoved,
            helpedTime: this.helpedTime ? this.helpedTime.toJSON() : void 0
        };
        return ret;
    };

    StudentEntry.fromJSON = function(obj) {
        var ret;
        if (typeOf(obj) === "string") {
            obj = $.parseJSON(obj);
        }
        ret = new StudentEntry(
            obj.name,
            obj.faculty,
            obj.course,
            new Date(obj.signupTime),
            obj.wasHelped,
            obj.wasRemoved
        );
        if (obj.helpedTime) {
            ret.helpedTime = new Date(obj.helpedTime);
        }
        return ret;
    };

    StudentEntry.prototype.toCSV = function() {
        var helped, removed;
        helped = this.wasHelped || false;
        removed = this.wasRemoved || false;
        return (
            "" +
            this.name +
            "," +
            this.faculty +
            "," +
            this.course +
            "," +
            helped +
            "," +
            removed +
            "," +
            getFormattedDayString(this.signupTime) +
            "," +
            getHourAsDecimal(this.signupTime) +
            "," +
            getHourAsDecimal(this.helpedTime)
        );
    };

    return StudentEntry;
})();

$(document).ready(function() {
    var allData,
        c,
        course,
        csv,
        dm,
        dumpArea,
        e,
        endDate,
        f,
        faculty,
        k,
        searchString,
        startDate,
        today,
        triggerOnEnterPress,
        _i,
        _j,
        _len,
        _len1,
        _ref,
        _ref1;
    $("button").button();
    $("#adminpage").hide();
    searchString = parseSearchString();
    if (searchString["dataDump"]) {
        $("body").empty();
        dumpArea = $(
            "<div style='white-space: pre; font-family: monospace; width:100%; height:100%'></div>"
        );
        startDate = searchString["start"];
        endDate = searchString["end"];
        allData = getDataFromRange(startDate, endDate);
        csv =
            "Name,Faculty,Course,Was Helped,Was Removed,Date,Hour Signup,Hour Helped\n";
        csv += (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = allData.length; _i < _len; _i++) {
                k = allData[_i];
                _results.push(k.toCSV());
            }
            return _results;
        })().join("\n");
        dumpArea.append(
            $(
                '<textarea style="width:90%;height:90%;font-family:monospace;"></textarea>'
            ).html(csv)
        );
        $("html").css({
            height: "100%"
        });
        $("body").css({
            height: "100%"
        });
        $(document.body).append(dumpArea);
        dm = new DownloadManager(
            "HelpCenter" + startDate + "to" + endDate + ".csv",
            csv,
            "text/csv"
        );
        dm.download();
        return;
    }
    if (searchString["admin"]) {
        $("#adminpage").show();
        $("#studentlist").hide();
        $("#studentadd").hide();
        $("#header").html("Admin Page");
        $("#fromdate").datepicker({
            defaultDate: "-1m",
            changeMonth: true,
            numberOfMonths: 3,
            onSelect: function(selectedDate) {
                $("#todate").datepicker("option", "minDate", selectedDate);
                return updateAdminPage();
            }
        });
        $("#todate").datepicker({
            defaultDate: "+1d",
            changeMonth: true,
            numberOfMonths: 3,
            onSelect: function(selectedDate) {
                $("#fromdate").datepicker("option", "maxDate", selectedDate);
                return updateAdminPage();
            }
        });
        $("#downloaddata").click(function() {
            var end, endStr, search, start, startStr;
            start = $("#fromdate").datepicker("getDate");
            if (!(start != null)) {
                blinkElement($("#fromdate"));
                return;
            }
            end = $("#todate").datepicker("getDate");
            if (!(end != null)) {
                end = new Date();
            }
            startStr = getFormattedDayString(start);
            endStr = getFormattedDayString(end);
            search = "?start=" + startStr + "&end=" + endStr + "&dataDump";
            return (window.location.search = search);
        });
        $("#cleardata").click(function() {
            var dialog;
            dialog = $(
                '<div title="Clear All Data?">\n<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>\n                You are choosing to erase all locally stored data.  This action\n                cannot be undone. Do you wish to proceed</p>\n            </div>'
            );
            $(document.body).append(dialog);
            dialog.dialog({
                modal: true,
                buttons: {
                    "Delete All Data": function() {
                        eraseStorage();
                        $(this).dialog("close");
                        return $(this).remove();
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                        return $(this).remove();
                    }
                }
            });
            dialog.dialog("open");
            return (window.d = dialog);
        });
        today = new Date();
        $("#todate").datepicker("setDate", today);
        today.setMonth((12 + today.getMonth() - 1) % 12);
        $("#fromdate").datepicker("setDate", today);
        updateAdminPage();
        return;
    }
    if (window.CONFIGURATION.faculties) {
        faculty = $("#faculty").empty();
        _ref = window.CONFIGURATION.faculties;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            f = _ref[_i];
            faculty.append("<option value='" + f + "'>" + f + "</option>");
        }
    }
    if (window.CONFIGURATION.courses) {
        course = $("#course").empty();
        _ref1 = window.CONFIGURATION.courses;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            c = _ref1[_j];
            course.append("<option value='" + c + "'>" + c + "</option>");
        }
        course.append("<option value='Other'>Other...</option>");
        course.change(function() {
            var val;
            val = course.find("option:selected").val();
            if (val === "Other") {
                return $("#courseinput").show();
            } else {
                return $("#courseinput").hide();
            }
        });
    }
    $.jStorage.reInit();
    today = new Date();
    today = getFormattedDayString(today);
    window.students = (function() {
        var _k, _len2, _ref2, _results;
        _ref2 = $.jStorage.get("log-" + today) || [];
        _results = [];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            e = _ref2[_k];
            _results.push(StudentEntry.fromJSON(e));
        }
        return _results;
    })();
    populateStudentList();
    updateGraphics();
    triggerOnEnterPress = function(e) {
        if (e.which === 13) {
            $(this).blur();
            return $("#addname")
                .focus()
                .click();
        }
    };
    $("#addname").click(addStudent);
    $("#courseinput").hide();
    $("#name").keypress(triggerOnEnterPress);
    $("#faculty").keypress(triggerOnEnterPress);
    return $("#course").keypress(triggerOnEnterPress);
});

blinkElement = function(elm) {
    var originalBackground;
    if (elm.is(":animated")) {
        return;
    }
    originalBackground = elm.css("background-color");
    return elm.animate(
        {
            backgroundColor: "#f00"
        },
        500,
        null,
        function() {
            return elm.animate(
                {
                    backgroundColor: originalBackground
                },
                500
            );
        }
    );
};

updateAdminPage = function() {
    var allData,
        breakdown,
        data,
        endDate,
        k,
        plot,
        seriesLabels,
        startDate,
        stats,
        t,
        ticks,
        v,
        val,
        w,
        _i,
        _len,
        _ref;
    startDate = getFormattedDayString($("#fromdate").datepicker("getDate"));
    endDate = getFormattedDayString($("#todate").datepicker("getDate"));
    allData = getDataFromRange(startDate, endDate);
    stats = getStatistics(allData);
    console.log(stats);
    $("#numstudentshelped").html(stats.studentsHelped);
    $("#numstudentsremoved").html(stats.studentsRemoved);
    ticks = (function() {
        var _results;
        _results = [];
        for (k in stats.coursesHelped) {
            _results.push(k);
        }
        return _results;
    })();
    data = (function() {
        var _ref, _results;
        _ref = stats.coursesHelped;
        _results = [];
        for (k in _ref) {
            v = _ref[k];
            _results.push(v);
        }
        return _results;
    })();
    $("#chart1").empty();
    plot = $.jqplot("chart1", [data], {
        seriesDefaults: {
            renderer: $.jqplot.BarRenderer,
            rendererOptions: {
                fillToZero: true
            },
            pointLabels: {
                show: true
            }
        },
        axesDefaults: {
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        },
        title: "Which courses were helped with?",
        axes: {
            xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer,
                ticks: ticks,
                label: "Course"
            },
            yaxis: {
                label: "Number of Students Helped"
            }
        }
    });
    ticks = (function() {
        var _results;
        _results = [];
        for (k in stats.facultiesHelped) {
            _results.push(k);
        }
        return _results;
    })();
    data = (function() {
        var _ref, _results;
        _ref = stats.facultiesHelped;
        _results = [];
        for (k in _ref) {
            v = _ref[k];
            _results.push(v);
        }
        return _results;
    })();
    $("#chart2").empty();
    plot = $.jqplot("chart2", [data], {
        seriesDefaults: {
            renderer: $.jqplot.BarRenderer,
            rendererOptions: {
                fillToZero: true
            },
            pointLabels: {
                show: true
            }
        },
        axesDefaults: {
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        },
        title: "Which faculties are being helped?",
        axes: {
            xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer,
                ticks: ticks,
                label: "Faculty"
            },
            yaxis: {
                label: "Number of Students Helped"
            }
        }
    });
    seriesLabels = (function() {
        var _results;
        _results = [];
        for (k in stats.facultiesHelped) {
            _results.push({
                label: k
            });
        }
        return _results;
    })();
    ticks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    breakdown = [];
    for (k in stats.facultiesHelped) {
        data = [];
        _ref = stats.studentsHelpedByWeekdayFacultyBreakdown;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            v = _ref[_i];
            val = 0;
            if (v[k] != null) {
                val = v[k];
            }
            data.push(val);
        }
        breakdown.push(data);
    }
    $("#chart3").empty();
    plot = $.jqplot("chart3", breakdown, {
        stackSeries: true,
        seriesDefaults: {
            renderer: $.jqplot.BarRenderer,
            rendererOptions: {
                fillToZero: true
            },
            pointLabels: {
                show: true
            }
        },
        axesDefaults: {
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        },
        title: "Which faculties are being helped?",
        axes: {
            xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer,
                ticks: ticks,
                label: "Day of Week"
            },
            yaxis: {
                label: "Number of Students Helped"
            }
        },
        series: seriesLabels,
        legend: {
            show: true,
            placement: "outside"
        }
    });
    $("#chart4").empty();
    data = (function() {
        var _j, _len1, _ref1, _ref2, _results;
        _ref1 = stats.waitTimes;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            (_ref2 = _ref1[_j]), (t = _ref2[0]), (w = _ref2[1]);
            _results.push([getHourAsDecimal(t), w]);
        }
        return _results;
    })();
    return (plot = $.jqplot("chart4", [data], {
        seriesDefaults: {
            showMarker: true,
            showLine: false
        },
        axesDefaults: {
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer
        },
        title: "What are the wait times?",
        axes: {
            xaxis: {
                label: "Hour of Day"
            },
            yaxis: {
                label: "Minutes Until Helped"
            }
        }
    }));
};

getStatistics = function(dataArray) {
    var elm, ret, _i, _len;
    ret = {
        coursesHelped: {},
        studentsHelped: 0,
        studentsRemoved: 0,
        facultiesHelped: {},
        studentsHelpedByWeekday: [0, 0, 0, 0, 0, 0, 0],
        studentsHelpedByWeekdayFacultyBreakdown: [{}, {}, {}, {}, {}, {}, {}],
        waitTimes: []
    };
    for (_i = 0, _len = dataArray.length; _i < _len; _i++) {
        elm = dataArray[_i];
        if (elm.wasHelped) {
            smartIncrement(ret.coursesHelped, elm.course);
            smartIncrement(ret.facultiesHelped, elm.faculty);
            ret.studentsHelped += 1;
            ret.studentsHelpedByWeekday[elm.signupTime.getDay()] += 1;
            smartIncrement(
                ret.studentsHelpedByWeekdayFacultyBreakdown[
                    elm.signupTime.getDay()
                ],
                elm.faculty
            );
            if (elm.helpedTime) {
                ret.waitTimes.push([
                    elm.signupTime,
                    (elm.helpedTime.getTime() - elm.signupTime.getTime()) /
                        60000
                ]);
            }
        }
        if (elm.wasRemoved) {
            ret.studentsRemoved += 1;
        }
    }
    return ret;
};

updateGraphics = function() {
    var courseTally,
        data,
        helpEstimate,
        k,
        plot,
        s,
        studentsHelped,
        studentsWaiting,
        ticks,
        v,
        wait,
        waitTimes,
        _i,
        _len;
    $("#courseschart").empty();
    try {
        studentsHelped = (function() {
            var _i, _len, _ref, _results;
            _ref = window.students;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                s = _ref[_i];
                if (s.wasHelped === true) {
                    _results.push(s);
                }
            }
            return _results;
        })();
        waitTimes = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = studentsHelped.length; _i < _len; _i++) {
                s = studentsHelped[_i];
                _results.push(
                    (getHourAsDecimal(s.helpedTime) -
                        getHourAsDecimal(s.signupTime)) *
                        60
                );
            }
            return _results;
        })();
        helpEstimate = "Unknown";
        if (waitTimes.length >= 6) {
            waitTimes = waitTimes.slice(-6);
            wait = sum(waitTimes) / 6;
            helpEstimate = "" + round(wait);
        }
        $("#expectedwaitminutes").html(helpEstimate);
        studentsWaiting = (function() {
            var _i, _len, _ref, _results;
            _ref = window.students;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                s = _ref[_i];
                if (s.wasHelped !== true && s.wasRemoved !== true) {
                    _results.push(s);
                }
            }
            return _results;
        })();
        courseTally = {};
        for (_i = 0, _len = studentsWaiting.length; _i < _len; _i++) {
            s = studentsWaiting[_i];
            smartIncrement(courseTally, s.course);
        }
        ticks = (function() {
            var _results;
            _results = [];
            for (k in courseTally) {
                _results.push(k);
            }
            return _results;
        })();
        data = (function() {
            var _results;
            _results = [];
            for (k in courseTally) {
                v = courseTally[k];
                _results.push(v);
            }
            return _results;
        })();
        return (plot = $.jqplot("courseschart", [data], {
            seriesDefaults: {
                renderer: $.jqplot.BarRenderer,
                rendererOptions: {
                    fillToZero: true
                },
                pointLabels: {
                    show: true
                }
            },
            axesDefaults: {
                labelRenderer: $.jqplot.CanvasAxisLabelRenderer
            },
            title: "Which courses are people waiting for?",
            axes: {
                xaxis: {
                    renderer: $.jqplot.CategoryAxisRenderer,
                    ticks: ticks,
                    label: "Course"
                },
                yaxis: {
                    label: "Number of Students Waiting"
                }
            }
        }));
    } catch (e) {
        return console.log(e);
    }
};

eraseStorage = function() {
    var i, _i, _len, _ref, _results;
    $.jStorage.reInit();
    _ref = $.jStorage.index();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        _results.push($.jStorage.deleteKey(i));
    }
    return _results;
};

updateStorage = function() {
    var day,
        month,
        student,
        today,
        todayStr,
        todaysStudents,
        year,
        _i,
        _len,
        _ref;
    updateGraphics();
    today = new Date();
    todayStr = getFormattedDayString(today);
    day = today.getDate();
    year = today.getFullYear();
    month = today.getMonth();
    todaysStudents = [];
    _ref = window.students;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        student = _ref[_i];
        if (
            student.signupTime.getDate() === day &&
            student.signupTime.getMonth() === month &&
            student.signupTime.getFullYear() === year
        ) {
            todaysStudents.push(student.toJSON());
        }
    }
    $.jStorage.reInit();
    return $.jStorage.set("log-" + todayStr, todaysStudents);
};

populateStudentList = function() {
    var item, _i, _len, _ref, _results;
    _ref = window.students;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (!(item.wasHelped || item.wasRemoved)) {
            _results.push(
                $("#studentlist table").append(item.generateTableRow())
            );
        } else {
            _results.push(void 0);
        }
    }
    return _results;
};

addStudent = function() {
    var course, entry, faculty, name;
    name = $("#name")
        .val()
        .trim()
        .replace(/[^a-zA-Z ]+/g, "");
    faculty = $("#faculty option:selected").val();
    course = $("#course option:selected").val();
    if (course === "Other") {
        course =
            $("#courseinput")
                .val()
                .trim()
                .toUpperCase() || "Other";
    }
    if (name === "") {
        blinkElement($("#name"));
        return;
    }
    name = toTitleCase(name);
    $("#courseinput").hide();
    $("#courseinput").val("");
    $("#name").val("");
    $("#faculty").val($("#faculty option:first").val());
    $("#course").val($("#course option:first").val());
    entry = new StudentEntry(name, faculty, course);
    students.push(entry);
    $("#studentlist table").append(entry.generateTableRow());
    updateStorage();
    return $("#name").focus();
};

getDataFromRange = function(startDate, endDate) {
    var allData, date, e, entries, indices, k, _i, _len, _ref;
    if (startDate == null) {
        startDate = "";
    }
    if (endDate == null) {
        endDate = "";
    }
    allData = [];
    $.jStorage.reInit();
    indices = (function() {
        var _i, _len, _ref, _results;
        _ref = $.jStorage.index();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            k = _ref[_i];
            if (k.slice(0, 4) === "log-") {
                _results.push([k, k.slice(4)]);
            }
        }
        return _results;
    })();
    for (_i = 0, _len = indices.length; _i < _len; _i++) {
        (_ref = indices[_i]), (k = _ref[0]), (date = _ref[1]);
        if (date >= startDate && date <= endDate) {
            entries = (function() {
                var _j, _len1, _ref1, _results;
                _ref1 = $.jStorage.get(k);
                _results = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    e = _ref1[_j];
                    _results.push(StudentEntry.fromJSON(e));
                }
                return _results;
            })();
            allData = allData.concat(entries);
        }
    }
    return allData;
};
