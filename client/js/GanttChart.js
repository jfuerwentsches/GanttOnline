/**
 * Copyright 2010 MEHRKANAL GmbH <www.mehrkanal.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @class GanttChart
 * Hauptklasse des Clients. Kapselt die gesamte Programmlogik des Clients,
 * enthält Funktionen zur Erzeugung der grafischen Benutzerschnittstelle.
 *
 * @author Johannes Fürwentsches <fuerwentsches@mehrkanal.com>
 */

/**
 * Pfad zu Bilddateien (Icons, etc.) ausgehend von der Seite in die das Diagramm
 * eingebunden wurde.
 */
const IMAGE_FOLDER_PATH = "/client/img/";

/**
 * Linie am aktuellen Zeitpunkt einzeichnen.
 */
const SHOW_TODAY_LINE = true;

/**
 * Kleinste Größe die eine Tagesspalte erreichen kann.
 */
const MIN_COLUM_WIDTH = 12;

/**
 * Einrücktiefe für Untertasks in Pixeln.
 */
const SUBTASK_INDENTION = 8;

/**
 * Ein Tag in Millisekunden (dient als Umrechnungsfaktor).
 */
const DAY_IN_MILLISECONDS = 86400001;

/**
 * Standardfarbe für Tasks, für die keine Farbe definiert ist.
 */
const DEFAULT_TASK_COLOR = "#80B5D7";

/**
 * Farbe für die Linie, die den aktuellen Tag kennzeichnet.
 */
const TODAY_LINE_COLOR = "#CC0000";

/**
 * Ressourcen auf 1. Ebene.
 */
const DISPLAY_RESOURCES = 1;

/**
 * Projekte (Obertasks) auf 1. Ebene.
 */
const DISPLAY_PROJECTS = 2;

/**
 * @ctor
 * Konstruktor der Klasse, erzeugt eine neue Instanz. Ein Objekt dieser Klasse
 * repräsentiert ein Gantt-Diagramm inkl. der Tabelle mit den Diagrammdaten.
 * Die gesamte Programmlogik (samt Interaktion) ist hier gekapselt.
 * Dazu werden dem GanttChart beim Aufruf eine Liste von Task Objekten (in
 * JSON Repräsentation) übergeben. Anhand dieser Liste berechnet das die Klasse
 * die Koordinaten der einzelnen Balken im Diagramm. Somit bestimmen die Daten
 * den Aufbau des Diagramms, alle übergebenen Daten werden auch angezeigt.
 * Lediglich der Zeitraum der angezeigt werden soll kann über den Parameter
 * showWeeks definiert werden.
 * Da die gesamte Benutzeroberfläche von dieser Klasse dynamisch erzeugt wird,
 * benötigt sie Informationen über die zur verfügungstehende Breite und Höhe
 * innerhalb des Browser Viewports.
 *
 * @tparam	int		id			ID des DOM Elements an das das Gantt-Diagramm
 *                              gehangen wird
 * @tparam	Date	start		Startdatum
 * @tparam	int		showWeeks	Anzahl Wochen
 * @tparam	int		width		Breite des gesamten Diagramms
 * @tparam	int		height		Hoehe des gesamten Diagramms
 * @tparam	string	jsonString	Daten für das Diagramm als JSON String
 * @tparam  string  filename    Dateiname der XML Datei, sofern XML als Daten-
 *                              quelle benutzt wird
 */
function GanttChart(id, start, showWeeks, width, height, jsonString, filename) {
		
	var jsonObject = JSON.parse(jsonString);

    /**
     * Eindeutige ID dieses Gantt-Diagramms.
     * @type int
     */
	this._id = id;
    /**
     * Startdatum dieses Gantt-Diagramms.
     * @type Date
     */
	this._startDate = start;
    /**
     * Gesamtbreite die zur Darstellung genutzt werden kann.
     * @type int
     */
	this._totalWidth = width;
    /**
     * Gesamthöhe die Zur Darstellung genutzt werden kann.
     * @type int
     */
	this._totalHeight = height;
    /**
     * Modus der Anzeige (nach Ressourcen oder Projekten)
     * @type int
     */
	this._displayMode = jsonObject.type;
    /**
     * HTML Container in dem das Diagramm angezeigt wird als jQuery Objekt.
     * @type jQuery
     */
	this._containerElement = $('#' + id);

	if (jsonObject.data == null) {		
		this.init(false);		
	} else {
		/* Element mit der Klasse .mkg_tableCell wird benötigt um die Höhe zu 
		 * ermitteln, wird in init() automatisch wieder entfernt.
		 */
		$('#' + id).append('<div class="mkg_tableCell"></div>');

        /**
         * Ressourcen die in diesem Diagramm dargestellt werden.
         * @type Array
         */
		this._resources = null;
        /**
         * Tasks auf 1. Ebene.
         * @type Array
         */
		this._rootTasks = Util.jsonToTaskArray(jsonObject);
        /**
         * Array aller Tasks mit ID des Tasks als Schlüsselwert. Erleichtert den
         * direkten Zugriff auf ein Taskobjekt.
         * @type Array
         */
		this._tasksById = new Array();
        /**
         * Alle Tasks dieses Diagramms als Array. Wobei die Tasks in der
         * Reuhenfolge im Array stehen in der sie auch angezeigt werden.
         * @type Array
         */
		this._tasks = this.flattenTree(this._rootTasks);
        /**
         * Speichert den aktuell markierten Task.
         * @type Task
         */
		this._activeTask = null;
        /**
         * Anzahl der Tage die angezeigt werden.
         * @type int
         */
		this._daysDisplayed	= showWeeks * 7;
		
		// Default Werte
        /**
         * Gibt an, ob die Inhalte des Diagramms verändert werden dürfen oder
         * nicht.
         * @type boolean
         */
		this._readonly = false;
        /**
         * Höhe eine Zeile innerhalb des Diagramms in Pixel.
         * @type int
         */
		this._rowHeight = $('.mkg_tableCell').outerHeight();
        /**
         * Breite der SVG Zeichenfläche in Pixel.
         * @type int
         */
		this._chartCanvasWidth = this._totalWidth * 0.6;
        /**
         * Breite einer Spalte für einen Tag.
         * @type int
         */
		this._columWidth = this._chartCanvasWidth / this._daysDisplayed;
        /**
         * Höhe der SVG Zeichenfläche in Pixel.
         * @type int
         */
		this._chartCanvasHeight = this._tasks.length * this._rowHeight + this._rowHeight +1;
        /**
         * Breite der Datentabelle in Pixel.
         * @type int
         */
		this._tableWidth = this._totalWidth - this._chartCanvasWidth - 16;
		
		/**
         * Breite der einzelnen Tabellenspalten relativ zur Gesamtbreite der 
         * Tabelle ermitteln (-1 fuer 1px Rahmen).
         * @type Array
         */
        this._columsWidth = new Array();
		this._columsWidth[0] = Math.floor(this._tableWidth * 0.6 - 1);
		this._columsWidth[1] = Math.floor(this._tableWidth * 0.15 - 1);
		this._columsWidth[2] = Math.floor(this._tableWidth * 0.15 - 1);
		this._columsWidth[3] = Math.floor(this._tableWidth * 0.1 - 1);

        /**
         * DOM Element in das die Datentabelle eingehangen wird.
         * @type jQuery
         */
		this._dataElement = null;
        /**
         * Raphael Zeichenfläche für SVG Elemente.
         * @type Raphael
         */
		this._paper = null;
		
		/**
         * Funktion zum Bearbeiten eines Task. Wird von außen gesetzt,
         * da vom Datenmodell abhängig.
         * @type string
         */
		this._editTaskFunction = function(param) { this.displayMessage("Keine Funktion zum bearbeiten von Buchungen definiert", "notice") };
		 
		/**
         * Instanz des GanttControllers.
         * @type GanttController
         */
		this._controller = new GanttController(filename);
					
		/**
         * GUI Helper für den aktiven Task einer Ressource
         * @type Array
         */
		this._resourceActiveTask = new Array();
					
		this.init(true);
	}	
}


/**
 * Wandelt die Baumstruktur der Tasks in ein flaches Array um, ohne die 
 * Reihenfolge zu zerstören. D.h. jedem Task folgen in der korrekten Reihenfolge
 * alle seine Kinder, bevor der nächste Task der gleichen Ebene kommt.
 *
 * @tparam	Array	rootElements    Array von Task Objekten mit Kindern
 *
 * @treturn	Array	Array aller Task Objekte, linear
 */
GanttChart.prototype.flattenTree = function(rootElements) {
	
	var allTasks = new Array();

	for (var i = 0; i < rootElements.length; i++) {
		pushChildren(rootElements[i], allTasks, 1);
	}	
	
	function pushChildren (task, array, generation) {
		task.setGeneration(generation);
		array.push(task);

		if (task.hasChildren()) {
			generation++;
			for (var i = 0; i < task.getChildren().length; i++) {
				pushChildren(task.getChildren()[i], array, generation);
			}
		}		
	}
	
	return allTasks;
}


/**
 * Berechnet die Koordinaten aller Tasks dieses Diagramms. Dazu wird das Array
 * der Tasks (this._tasks) durchlaufen und anhand des Startdatums die X- sowie 
 * anhand der Position des Tasks im Array die Y-Koordinate ermittelt.
 * Die ermittelten Koordinaten werden dann im Task Objekt selbst gespeichert.
 * Dies muss außerhalb des Task Objekts geschehen, da nur das GanttDiagramm die
 * Informationen über alle Tasks hat und somit die Positionsberechnung 
 * durchführen kann. Außerdem wird auf Basis der Dauer des Tasks die Breite für
 * den Balken im Diagramm berechnet und ebenfalls im Task Objekt gesetzt.
 *
 * @treturn void
 */
GanttChart.prototype.calculateAllTaskCoordinates = function() {

	var currentTask;
	
	/* Zeilenhöhe wird zweimal genommen, um die Headerzeile zu überspringen.
	 * Außerdem wird durch 4 geteilt, da ein Taskbalken eine halbe Zeilenhöhe
	 * hoch ist und er somit genau in der Mitte einer Zeile angezeigt wird.
	 */
	var y = this._rowHeight + this._rowHeight / 4;
	
	for (var i = 0; i < this._tasks.length; i++) {			

		currentTask = this._tasks[i];

		/* X-Koordinate entspricht der Differenz zwischen dem 1. Tag im Diagramm
		 * und dem Starttag des Tasks in Tagen multipliziert mit der Spaltenbreite
		 * für einen Tag.
		 */
		currentTask.setX(((currentTask.getStartDate().getTime() - this._startDate.getTime()) / (DAY_IN_MILLISECONDS)) * this._columWidth);
		currentTask.setY(y);
		currentTask.setWidth(currentTask.getDurationWeekends() * this._columWidth - 2);
		currentTask.setHeight(this._rowHeight / 2);

		y = y + this._rowHeight;
	}
}


/**
 * Berechnet die X-Koordinate und die Breite des übergebenen Tasks neu und setzt
 * sie im entsprechenden Objekt.
 * Dadurch wird auch automatisch das Diagramm aktualisiert, da die setX() und
 * setWidth() Methoden der Task Klasse automatisch ihre graphische 
 * Repräsentation anpassen, wenn diese Parameter geändert werden.
 *
 * @tparam	Task	task    Task Objekt dessen Koordinaten neu berechnet werden
 *
 * @treturn void
 */
GanttChart.prototype.calculateTaskCoordinates = function(task) {

	var x 		= ((task.getStartDate().getTime() - this._startDate.getTime()) / (DAY_IN_MILLISECONDS)) * this._columWidth;
	var width 	= task.getDurationWeekends() * this._columWidth - 2;

	task.updateXAndWidth(x, width);

	if (task.hasParent()) {
		this.calculateTaskCoordinates(task.getParent());
	}
}


/**
 * Gibt das zur übergebenen X-Koordinate gehörige Datum zurück.
 *
 * @tparam	int		x   X-Koordinate innerhalb des Gantt-Diagramms
 *
 * @treturn	Date	Datum das an der übergebenen X-Koordinate liegt
 */
GanttChart.prototype.getDateFromXCoordinate = function(x) {	
	var dayNumber = Math.floor(x / this._columWidth);	
	return Util.addDays(this._startDate, dayNumber);
}


/**
 * Initialisiert die Applikation; Erzeugt die dazu notwendigen DIV-Container,
 * baut die "Tabelle" mit den Taskdaten auf und erzeugt die Zeichenfläche für
 * das Diagramm.
 *
 * Der Aufbau gestaltet sich innerhalb des Container-Elements wie folgt:
 * <pre>
 * |----------------------------------------------------|
 * | Bedienelemente (siehe this.renderControls())       |
 * | \#mkg_controls_%this._id%                            |
 * |----------------------------------------------------|
 * | Datentabelle          | SVG Gantt-Diagramm         |
 * | \#mkg_data_%this._id%   | \#mkg_chart_%this._id%       |
 * |                       |                            |
 * |                       |                            |
 * |                       |                            |
 * |----------------------------------------------------|
 * </pre>
 * @tparam boolean     hasData     True, wenn Daten zur Anzeige vorhanden sind.
 *
 * @treturn void
 */
GanttChart.prototype.init = function(hasData) {

	// Entfernt bereits im Hauptcontainer enthaltene Elemente
	this._containerElement.children().remove();
	this._containerElement.addClass('mkg_container');
	
	// Hauptcontainer erzeugen und einhängen
	this._containerElement.append('<div id="mkg_controls_' + this._id + '" class="mkg_controls"></div>');
	this._containerElement.append('<div id="mkg_wrapper_' + this._id + '" class="mkg_wrapper">' + 
								  '  <div id="mkg_data_' + this._id + '" style="float: left;"></div>' +
								  '  <div id="mkg_chart_' + this._id + '" style="float: left;"></div>' +
								  '</div>');
	// Clearfix
	this._containerElement.append('<div style="clear:both;"></div>');

	// Wrapper bekommt eine feste Höhe zugewiesen, damit das Scrollen funktioniert
	$('#mkg_wrapper_' + this._id).css("height", (this._totalHeight - $('.mkg_controls').outerHeight(true)) + "px");

	// Fügt die Bedienelemente in den dafür vorgesehenen Container ein
	this.renderControls();

	if (hasData) {
	
		// Dialog für Sicherheitsabfrage, ob eine Buchung entfernt werden soll
		this._containerElement.append('<div id="dialogConfirmDelete" style="display: none" title="Buchung l&ouml;schen">' +
									  'M&ouml;chten Sie die ausgew&auml;hlte Buchung unwiderruflich l&ouml;schen?' + 
									  '</div>');

		// Dialog für Sicherheitsabfrage, ob eine Buchung als aktiv markiert werden soll
		this._containerElement.append('<div id="dialogConfirmProgress" style="display: none" title="Aufgabe als in Arbeit markieren">' +
									  'M&ouml;chten Sie die ausgew&auml;hlte Aufgabe als die aktuell bearbeitete markieren? Es kann immer nur eine Aufgabe markiert sein!' + 
									  '</div>');

	
		this._dataElement = $('#mkg_data_' + this._id);
		this._dataElement.append('<div id="mkg_headline_' + this._id + '></div>');
			
		// Kopfzeile mit Überschriften einhängen
		targetElement = $('#mkg_headline_' + this._id);
		targetElement.append('<div style="width: ' + this._columsWidth[0] + 'px;" class="mkg_tableHeadline"><b>Buchung</b></div>');
		targetElement.append('<div style="width: ' + this._columsWidth[1] + 'px;" class="mkg_tableHeadline"><b>Start</b></div>');
		targetElement.append('<div style="width: ' + this._columsWidth[2] + 'px;" class="mkg_tableHeadline"><b>Dauer</b></div>');
		targetElement.append('<div style="width: ' + this._columsWidth[3] + 'px;" class="mkg_tableHeadline"><b></b></div>');

		var currentTask = null;
		for (var i = 0; i < this._tasks.length; i++) {
	
			currentTask = this._tasks[i];
	
			this.renderTableRow(currentTask);
			
			// Array der Form TaskID => Task wird für weitere Interaktion benötigt
			// TODO: Andere Methode überlegen die dieses Array obsolet macht, da es zu
			// größerem Speicherbedarf kommen kann, wenn die IDs höher werden
			// --> liegt an der Methode mit der Arrays in JS gespeichert werden
			this._tasksById[currentTask.getId()] = currentTask;
			
			if (currentTask.isActive()) {
				this._resourceActiveTask[currentTask.getParent().getId()] = currentTask.getId();
			}
		}
	
		// Sorgt dafür, dass die Tabellenzeilen wechselnde Hintergrundfarben haben
		this._dataElement.find(".mkg_tableRow:even").children().addClass("even");
		
		/* Falls das Diagramm editiert werden darf, wird die Logik zur Interaktion 
		 * der Tabelle mittels jQuery hinzugefügt
		 */
		if (!this._readonly) {
			this.addTableInteraction();
		}
		
		// Mittels Raphael.js SVG/VML Zeichenflaeche erstellen
		this._paper = Raphael('mkg_chart_' + this._id, this._chartCanvasWidth, this._chartCanvasHeight);
		
		// Zeichnet das Gantt-Diagramm
		this.drawGanttChart();		
		
	} else {
		$('#mkg_wrapper_' + this._id).append('<div id="nodata">Keine Daten vorhanden.</div>');
	}	
}


/**
 * Erzeugt die Bedienelemente fuer das Diagramm und haengt sie in den DOM ein.
 * Dazu wird die Zeile mit den Bedienelementen noch ein mal geteilt, wobei
 * die linke Spalte so breit ist, wie die Datentabelle und die rechte die Breite
 * des Diagramms hat.
 *
 * Die linke Spalte beinhaltet Button für verschiedene funktionen, sowie die
 * Zoom-Steuerung. In der rechten Spalte werden Statusmeldungen ausgegeben.
 *
 * @treturn void
 */
GanttChart.prototype.renderControls = function() {

	/* Neue Referenz auf den Scope, damit er auch innerhalb der jQuery Methoden
	 * zur Verfügung steht.
	 */
	var t 		= this;
	var ctrl 	= $('#mkg_controls_' + this._id);
	
	ctrl.append('<div class="left"></div>');
	ctrl.append('<div class="right"><div id="mkg_message" style="display: none;"></div>');
	
	var buttonBar = ctrl.find(".left");
	buttonBar.css('width', this._tableWidth);
	
	
	/* ----------------------------------------------------------------------------
	 * Falls das Diagramm editiert werden darf, wird der Button zum hinzufügen
	 * einer neuen Aufgabe und zum löschen vorhandener Aufgaben eingehangen.
	 * Außerdem befindet sich der aktualisieren Button in diesem Abschnitt
	 * ----------------------------------------------------------------------------
	 */
	if (!this._readonly) {
		buttonBar.append('<img id="bttnAdd" src="' + IMAGE_FOLDER_PATH + 'add.png" title="Neue Buchung" />');
		$('#bttnAdd').click(function() { 
			t.displayMessage("F&uuml;r diesen Button wurde keine Funktion definiert!", "error");
		});
	}

	if (!this._readonly) {
		buttonBar.append('<img id="bttnRemove" src="' + IMAGE_FOLDER_PATH + 'remove.png" title="Ausgew&auml;hlte Buchung entfernen" />');
		$('#bttnRemove').click(function() { 
			t.deleteTask(t._activeTask);
		});
	}

	buttonBar.append('<img id="bttnReload" src="' + IMAGE_FOLDER_PATH + 'reload.png" title="Angezeigte Buchungen aktualisieren" />');
	$('#bttnReload').click(function() { t.reloadCurrentView() });


	/* ----------------------------------------------------------------------------
	 * Anzeige ab Kalenderwoche, öffnet Datepicker in dem auch Wochen ausgewählt
	 * werden können.
	 * ----------------------------------------------------------------------------
	 */
	buttonBar.append('<div class="seperator"></div>');
	buttonBar.append('<span>KW</span>');
	buttonBar.append('<img id="bttnWeekBack" src="' + IMAGE_FOLDER_PATH + 'back.png" title="Eine Woche zur&uuml;ck" />');
	buttonBar.append('<input id="inputStartDate" type="text" style="width: 24px; text-align: center;" value="' + this._startDate.getWeek() + '" />');
	buttonBar.append('<img id="bttnWeekForward" src="' + IMAGE_FOLDER_PATH + 'forward.png" title="Eine Woche weiter" />');
	buttonBar.append('<img id="bttnWeekCalendar" src="' + IMAGE_FOLDER_PATH + 'cal.png" title="Woche aus Datepicker ausw&auml;hlen" />');
	buttonBar.append('<img id="bttnCurrentWeek" src="' + IMAGE_FOLDER_PATH + 'clock.png" title="Zur aktuellen KW springen" />');	
	$('#inputStartDate').change(function() {
		if (isNaN(Number($(this).val()))) {
			$(this).val(this._startDate.getWeek());
			t.displayMessage("Es d&uuml;rfen nur Zahlen eingegeben werden.", "error");
		} else if (Number($(this).val()) >= 1 && Number($(this).val()) <= 52) {
			if (!document.location.search) {
				document.location.assign(document.location.href + '?kw=' + $(this).val());
			} else if (document.location.search.search(/kw=/) == -1) {
				document.location.assign(document.location.href + '&kw=' + $(this).val());
			} else {
				var regex = /kw=([0-9]+)/;
				regex.exec(document.location.search);
				var replaceString = RegExp.$1;
				document.location.assign(document.location.search.replace(replaceString, $(this).val()));				
			}
		} else {
			$(this).val(t._startDate.getWeek());
			t.displayMessage("Die Kalenderwoche muss zwischen 1 und 52 liegen.", "error");
		}
	});
	$('#bttnWeekBack').click(function() {		
		var inputWeek 	= $('#inputStartDate');
		var week 		= Number(inputWeek.val());
		if (week < 52 && week > 1) {
			inputWeek.val(week - 1);
		}		
		inputWeek.change();
	});
	$('#bttnWeekForward').click(function() {
		var inputWeek 	= $('#inputStartDate');
		var week 		= Number(inputWeek.val());
		if (week < 52 && week > 1) {
			inputWeek.val(week + 1);
		}		
		inputWeek.change();
	});
	$('#bttnWeekCalendar').click(function() {
		var element = $('#inputStartDate');
		
		if (element.hasClass('hasDatepicker')) {
			element.datepicker('destroy');
		} else {

			function findWeek(dateText) {
				tmp = dateText.split(".");
				var week = (new Date(tmp[2], tmp[1] - 1, tmp[0])).getWeek();
				$(this).val(week);
				$('#inputStartDate').change();
			}

			element.datepicker({ beforeShowDay: $.datepicker.noWeekends, onSelect: findWeek, highlightWeek: true, showWeek: true }).unbind('focus');
			element.datepicker('show');
		}
	});
	$('#bttnCurrentWeek').click(function() {		
		var inputWeek 	= $('#inputStartDate');
		var currentWeek = (new Date()).getWeek();

		if (currentWeek != inputWeek.val()) {
			inputWeek.val(currentWeek);
			inputWeek.change();
		} else {
			t.displayMessage("Die aktuelle Kalenderwoche wird bereits angezeigt.", "notice");
		}
	});


	/* ----------------------------------------------------------------------------
	 * Zeitraum der angezeigt werden soll
	 * ----------------------------------------------------------------------------
	 */
	var weeksDisplayed = Math.floor(this._daysDisplayed / 7);
	if (isNaN(weeksDisplayed)) {
		weeksDisplayed = 0;
	}
	buttonBar.append('<div class="seperator"></div>');
	buttonBar.append('<span>Wochen</span>');
	buttonBar.append('<img id="bttnWeekLess" src="' + IMAGE_FOLDER_PATH + 'down.png" title="Eine Woche weniger anzeigen" />');
	buttonBar.append('<input id="inputZoomFactor" type="text" style="width: 24px; text-align: center" value="' + weeksDisplayed + '" />');	
	buttonBar.append('<img id="bttnWeekMore" src="' + IMAGE_FOLDER_PATH + 'up.png" title="Weitere Woche anzeigen" />');
	$('#inputZoomFactor').change(function() {
		
		var weeksDisplayed = Math.floor(t._daysDisplayed / 7);
		
		if (isNaN(Number($(this).val()))) {
			$(this).val(weeksDisplayed);
			t.displayMessage("Es d&uuml;rfen nur Zahlen eingegeben werden.", "error");
		} else if (Number($(this).val()) > 0) {
			if (!t.setDaysDisplayed(Math.floor($(this).val()) * 7)) {
				$(this).val(weeksDisplayed);			
			}
		} else {
			$(this).val(weeksDisplayed);
			t.displayMessage("Es muss mindestens eine Woche angezeigt werden.", "error");
		}
	});
	$('#bttnWeekLess').click(function() {		
		var inputZoomFactor = $('#inputZoomFactor');
		var weeks = Number(inputZoomFactor.val());

		if (weeks > 1) {
			inputZoomFactor.val(weeks - 1);
		}		
		inputZoomFactor.change();
	});
	$('#bttnWeekMore').click(function() {		
		var inputZoomFactor = $('#inputZoomFactor');
		var weeks = Number(inputZoomFactor.val());

		if (weeks < 52) {
			inputZoomFactor.val(weeks + 1);
		}		
		inputZoomFactor.change();
	});

	/* ----------------------------------------------------------------------------
	 * Abschließender Seperator, ab hier kommen ggf. extern eingehangene Buttons
	 * ----------------------------------------------------------------------------
	 */
	buttonBar.append('<div id="beforeCustomButtons" class="seperator"></div>');
}


/**
 * Hängt eventuell von außerhalb dieser Klasse erzeugte Buttons in die 
 * Menüleiste ein und setzt deren Funktionalität. Für weitere Details
 * siehe auch setCustomButtons()-Methode.
 *
 * @treturn void
 */
GanttChart.prototype.renderCustomButtons = function() {

	if (this._customButtons != null) {
		
		var insert = $('#beforeCustomButtons');
		var currentButton;
		
		for (var i = 0; i < this._customButtons.length; i++) {
			currentButton = this._customButtons[i];
			
			insert.after('<img id="' + currentButton.id + '" src="' + IMAGE_FOLDER_PATH + currentButton.settings[0] + '" title="' + currentButton.settings[1] + '" />');
			$('#' + currentButton.id).click(currentButton.settings[2]);
		}
	}
}


/**
 * Erzeugt eine neue Zeile für die Datentabelle und hängt diese in den DOM
 * ein. Dabei werden Tasks auf verschiedenen Ebenen bzw. bei verschiedenen
 * Darstellungsmodi unterschiedlich erzeugt.
 *
 * @tparam	Task	currentTask     Task-Objekt für das eine Tabellenzeile
 *                                  erzeugt werden soll.
 * @treturn void
 */
GanttChart.prototype.renderTableRow = function(currentTask) {
	
	this._dataElement.append('<div id="tableRow_' + currentTask.getId() +'" class="mkg_tableRow"></div>');	

	var newRow = $('#tableRow_' + currentTask.getId());
	var indention = currentTask.getGeneration() * SUBTASK_INDENTION;

	/* Bildnamen, sowie Klassen für Tasks der verschiedenen Ebenen, bzw. bei
	 * verschiedenen Darstellungsmodi setzen. 
	 */
	var imgName;
	var descriptionClass 	= "readonly";
	var dateClass			= "readonly";
	var durationClass		= "readonly";
	var completeClass		= "readonly";
	
	if (this._displayMode == DISPLAY_RESOURCES && currentTask.getGeneration() == 1) {
		imgName 			= "resource.png";
		descriptionClass 	= "bold";
	} else if (currentTask.getGeneration() == 1) {
		imgName 			= "task.png";
	} else {
		imgName 			= "leaf.png";
		descriptionClass 	= "taskDescription";
		dateClass			= "taskDate";
		durationClass		= "taskDuration";		
		completeClass		= "taskComplete";
	}

    // Der derzeit aktive Task hat ein anderes Bild vor der Bezeichnung.
	if (currentTask.isActive()) {
		imgName 			= "leaf_active.png";
	}
	
    /* Wenn ein Task abgeschlossen ist (100% erreicht) bekommt er die CSS
     * Klasse done zugewiesen um anders dargestellt werden zu können.
     */
    if (currentTask.getComplete() == 100) {
		descriptionClass 	+= " done";
		dateClass			+= " done";
		durationClass		+= " done";
		completeClass		+= " done";
	}

	/* Dauer in Deutsche Schreibweise überführen (Punkt durch Komma ersetzen)
	 * und zwei Nachkommastellen erzwingen.
	 */
	var duration = Number(currentTask.getDuration());
	duration = duration.toFixed(2);
	duration = duration.replace(/\./, ","); // Punkt durch Komma ersetzen

	// Fortschritt um Prozentzeichen ergänzen sofern Fortschritt gesetzt.
	var complete = (currentTask.getComplete() == "-") ? "-" : currentTask.getComplete() + "%";
	
	var description;
	if (currentTask.getName() == "") {
		description = "Kein Titel";		
	} else {
		description = currentTask.getName().replace(new RegExp("\"", "g"), "&quot;");
	}
	
	if (currentTask.getPriority() == 0) {
		descriptionClass += " italic";
	}
	
	// Spalte: Titel
	newRow.append('<div style="width: ' + (this._columsWidth[0] - indention) + 'px; padding-left: ' + indention + 'px;"' + 'class="mkg_tableCell">' + 
				  '<img id="activate_' + currentTask.getId() + '" src="' + IMAGE_FOLDER_PATH + imgName + '" style="float: left;" class="leaf" />' + 
				  '<input type="text" id="taskDescription_' + currentTask.getId() + '" class="' + descriptionClass + '" value="' + description + '" readonly/>' + 
				  '</div>');

	// Spalte: Startdatum
	newRow.append('<div style="width: ' + this._columsWidth[1] + 'px; text-align: center;" class="mkg_tableCell">' + 
				  '<input id="taskDate_' + currentTask.getId() + '" class="' + dateClass + '" type="text" readonly value="' + Util.dateToGermanFormat(currentTask.getStartDate()) + '"/>' + 
				  '</div>');
				  
	// Spalte: Dauer
	newRow.append('<div style="width: ' + (this._columsWidth[2] - 2) + 'px; text-align: right; padding-right: 2px;" class="mkg_tableCell">' + 
				  '<input id="taskDuration_' + currentTask.getId() + '" class="' + durationClass + '" type="text" readonly value="' + duration + ' MT" />' + 
				  '</div>');
				  
	// Spalte: Fortschritt
	newRow.append('<div style="width: ' + this._columsWidth[3] + 'px; text-align: center;" class="mkg_tableCell">' + 
				  '<input id="taskComplete_' + currentTask.getId() + '" class="' + completeClass + '" type="text" readonly value="' + complete + '" />' + 
				  '</div>');
	
	if (currentTask.isActive()) {
		newRow.children().addClass('progress');
	}

	
	// Task auf oberster Ebene der weitere Kinder hat
	if (currentTask.getGeneration() == 1) {
		newRow.css('font-weight','bold');
	}
}


/**
 * Aktualisiert die zum übergebenen Task gehörige Tabellenzeile. D.h. es werden
 * Name, Startdatum, Dauer und Fortschritt erneut vom Task-Objekt erfragt und
 * mittels jQuery als Value der entsprechenden Textfelder gesetzt.
 *
 * @tparam  Task    currentTask     Task-Objekt dessen Tabellenzeile
 *                                  aktualisiert werden soll.
 *
 * @treturn void
 */
GanttChart.prototype.refreshTableRow = function(currentTask) {

	$('#taskDescription_' + currentTask.getId()).attr('value', currentTask.getName());

	$('#taskDate_' + currentTask.getId()).attr('value', Util.dateToGermanFormat(currentTask.getStartDate()));

	duration = Number(currentTask.getDuration());
	duration = duration.toFixed(2);
	duration = duration.replace(/\./, ","); // Punkt durch Komma ersetzen
	$('#taskDuration_' + currentTask.getId()).attr('value', duration + ' MT');

	var complete = (currentTask.getComplete() == "-") ? "-" : currentTask.getComplete() + "%";	
	$('#taskComplete_' + currentTask.getId()).attr('value', complete);

    // Tabellenzeile dieses Tasks als done markieren, bzw. Markierung aufheben
	if (currentTask.getComplete() == 100) {
		$('#taskDescription_' + currentTask.getId()).addClass('done');
		$('#taskDate_' + currentTask.getId()).addClass('done');
		$('#taskDuration_' + currentTask.getId()).addClass('done');
		$('#taskComplete_' + currentTask.getId()).addClass('done');
	} else {
		$('#taskDescription_' + currentTask.getId()).removeClass('done');
		$('#taskDate_' + currentTask.getId()).removeClass('done');
		$('#taskDuration_' + currentTask.getId()).removeClass('done');
		$('#taskComplete_' + currentTask.getId()).removeClass('done');
	}

    // Tabellenzeile des übergeordneten Tasks ebenfalls aktualisieren
	if (currentTask.hasParent()) {
		this.refreshTableRow(currentTask.getParent());
	}
}


/**
 * Zeichnet das Gantt-Diagramm. Dazu werden zunächst die Koordinaten aller Tasks
 * berechnet, Wochenenden, sowie die Kopfzeile und anschließend alle Tasks
 * nacheinander eingezeichnet. Sofern die Ressourcen Ansicht aktiviert ist, wird
 * zusätzlich die Abwesenheit der Ressourcen eingezeichnet. Außerdem kann auf
 * Wunsch eine Linie eingezeichnet werden, die den aktuellen Zeitpunkt markiert.
 *
 * @treturn void
 */
GanttChart.prototype.drawGanttChart = function() {

	// Zeichenflaeche saeubern
	this._paper.clear();	
	this.calculateAllTaskCoordinates();
	if (this._displayMode == DISPLAY_RESOURCES) {
		this.drawAbsence();
	}
	this.drawWeekends();
	this.drawHeader();	
	if (SHOW_TODAY_LINE) { 
		this.drawToday(); 
	}

	var y 			= this._rowHeight * 2;	
	var borderColor = $(".mkg_tableHeadline:first").css('border-left-color');
	var currentTask;

	for (var i = 0; i < this._tasks.length; i++) {

		currentTask = this._tasks[i];
	
		// Zeilen Trennlinien einzeichnen
		this._paper.path("M0 " + y + "L" + this._chartCanvasWidth + " " + y).attr({stroke : borderColor,	"stroke-width" : "1px"});

		// Aktuellen Task einzeichnen
		if (!this.isMarkedTaskAsDelted(currentTask)) {
			this.drawTask(currentTask);
		}		
		
		y += this._rowHeight;
	}

	// Linie unter letztem Task zeichnen
	this._paper.path("M0 " + (y - this._rowHeight) + "L" + this._chartCanvasWidth + " " + (y - this._rowHeight)).attr({stroke : borderColor, "stroke-width" : "1px"});
	
	// Linke Randlinie (zur Tabelle hin) zeichnen
	this._paper.path("M0 0 L 0 " + this._chartCanvasHeight).attr({stroke : borderColor, "stroke-width" : "1px"});
}


/**
 * Zeichnet einen Task ins Diagramm ein. Dabei wird zwischen übergeordneten 
 * Tasks (also ein Task der weitere Kinder hat) und "normalen" Tasks 
 * unterschieden.
 * Der Unterschied besteht darin, dass normale Tasks zusätzlich einen
 * Fortschrittsbalken haben, sowie per Drag & Drop manipuliert werden können.
 *
 * @tparam	Task	currentTask     Task-Objekt das in das Diagramm
 *                                  eingezeichnet werden soll
 * @treturn void
 */
GanttChart.prototype.drawTask = function(currentTask) {
	
	if (!currentTask.hasChildren()) {

		// Wenn keine Farbe hinterlegt ist nehmen wir die definierte Standardfarbe
		var taskColor = (currentTask.getColor() == "") ? DEFAULT_TASK_COLOR : currentTask.getColor();

		currentTask.setTaskBar(this._paper.rect(currentTask.getX(), currentTask.getY(), currentTask.getWidth(), currentTask.getHeight()).attr({fill: taskColor}));

		// Deadline einzeichnen
		if (currentTask.hasDeadline()) {

			var markerWidth 		= 2;
			var markerHeight 		= this._rowHeight;
			var deadlineXCoordinate = (((currentTask.getDeadline().getTime() - this._startDate.getTime()) / (DAY_IN_MILLISECONDS)) * this._columWidth) + this._columWidth - markerWidth;
			var deadlineMarker 		= this._paper.rect(deadlineXCoordinate, currentTask.getY() - this._rowHeight / 4, markerWidth, markerHeight);

			deadlineMarker.attr({ fill : "#CC0000", "stroke-width" : 0, opacity: 0.7 });
			
			$(deadlineMarker.node).attr('title', Util.dateToGermanFormat(currentTask.getDeadline()) + " | " + currentTask.getDeadlineDescription());
		}	

		// Fortschritt visualisieren
		currentTask.setTaskProgressBar(this._paper.rect(currentTask.getX() + 1, currentTask.getY() + 1, currentTask.getWidth() * (currentTask.getComplete() / 100) - 2, currentTask.getHeight() - 2));
		currentTask.getTaskProgressBar().attr({fill: '#fff', "stroke-width": 0, "fill-opacity": 0.5});

		// Prioritaet einzeichnen (Prioritaet 1-3)
		var priority = "";
		var textMargin = 4;
		if (currentTask.getPriority() == 2) {
			priority = "!";
			textMargin = 10;
		}
		currentTask.setTaskPriority(this._paper.text(currentTask.getX() + currentTask.getWidth() + 3, currentTask.getY() + 4, priority).attr({"text-anchor": "start",  "fill-opacity": 1, fill: "#cc0000", "font-weight" : "bold", "font-size" : "14px"}));

		// Text der Buchung setzen
		if (currentTask.getOwnerShortname() != "") {
			var text = "[" + currentTask.getOwnerShortname() + "] " + currentTask.getName();
		} else {
			var text = currentTask.getName();
		}
		currentTask.setTaskText(this._paper.text(currentTask.getX() + currentTask.getWidth() + textMargin, currentTask.getY() + 4, text).attr({"text-anchor": "start",  "fill-opacity": 1}));

		// Wenn die Buchung auf "bevorstehend" steht, wird der Text in grau dargestellt
		if (currentTask.getPriority() == 0) {
			currentTask.getTaskText().attr({"fill": "#999999"});
		}

		// Task der gerade bearbeitet wird, wird mit fetter Schrift und in orange dargestellt
		if (currentTask.isActive()) {
			currentTask.getTaskText().attr({ fill : "#CC6600", "font-weight" : "bold" });
		}

		// Wenn die Buchung erledigt wurde (100%), wird der Text in grün dargestellt
		if (currentTask.getComplete() == 100) {
			currentTask.getTaskText().attr({"fill": "#669933"});
		}

		/* Falls das Diagramm editiert werden darf, wird den Balken eine Drag & Drop
		 * Funktionalität gegeben.
		 */
		if (!this._readonly) {
			// Move Cursor für Taskbalken
			$(currentTask.getTaskBar().node).css('cursor', 'move');
			$(currentTask.getTaskProgressBar().node).css('cursor', 'move');

			/* Neue Referenz auf den Scope, damit er auch innerhalb der jQuery Funktionen
			 * benutzt werden kann.
			 */
			var t = this;
	
			// Drag and Drop
			var start = function () {
			
				// Start-Koordinaten zwischenspeichern
			    this.taskBarX 			= currentTask.getTaskBar().attr('x');
			    this.taskProgressBarX 	= currentTask.getTaskProgressBar().attr('x');
			    this.taskPriorityX 		= currentTask.getTaskPriority().attr('x');
			    this.taskTextX 			= currentTask.getTaskText().attr('x');
			    
			    t.setActiveTask(currentTask.getId());
			},
			move = function (dx, dy) {

			    this.moved = true;

				// Neue X-Koodinate der Taskbar speichern, wird bei drop benötigt
				this.newX = (this.taskBarX + dx);
				
				// Alle vier Komponenten verschieben
				currentTask.getTaskBar().attr({x : this.newX});
				currentTask.getTaskProgressBar().attr({x : (this.taskProgressBarX + dx)});
				currentTask.getTaskPriority().attr({x : (this.taskPriorityX + dx)});
				currentTask.getTaskText().attr({x : (this.taskTextX + dx)});								
			},
			up = function () {		
			
				if (this.moved) {
				    var date = t.getDateFromXCoordinate(this.newX);
				    
				    if (Util.isWeekendDay(date)) {
				    	currentTask.setX(this.ox);
						t.displayMessage("Buchungen d&uuml;rfen nicht an einem Wochenende beginnen.", "error");		    	
					} else if (currentTask.hasDeadline() && date >= currentTask.getDeadline()) {
				    	currentTask.setX(this.ox);
						t.displayMessage("Buchung darf nicht nach Ende der Deadline beginnen.", "error");		    	
				    } else {
						try {					
							var newDate = Util.dateToSQLFormat(date);				
							if (t._controller.changeTaskValue(currentTask.getId(), currentTask.getChecksum(), "start", newDate) == true) {						
								currentTask.setStartDate(newDate);
							}
						} catch (e) {
							t.displayMessage(e, "notice");
						}
				    }
			    	t.refreshTableRow(currentTask);
					t.calculateTaskCoordinates(currentTask);

				    this.moved 				= false;
				    this.taskBarX 			= 0;
				    this.taskProgressBarX 	= 0;
				    this.taskPriorityX 		= 0;
				    this.taskTextX 			= 0;
				}
			};
	
			currentTask.getTaskBar().drag(move, start, up);
			currentTask.getTaskProgressBar().drag(move, start, up);
			
			currentTask.getTaskBar().dblclick(function() {
				t._editTaskFunction(currentTask);
			});
			currentTask.getTaskProgressBar().dblclick(function() {
				t._editTaskFunction(currentTask);
			});			
		}

		// Jobnummer und Beschreibung als Title
		// Util.dateToGermanFormat(currentTask.getStartDate()) + " | "
		var titleText = currentTask.getJobNumber() + " | " + currentTask.getJobDescription()
		if (currentTask.hasDeadline()) {
			titleText += " | Deadline: " + Util.dateToGermanFormat(currentTask.getDeadline()) + " (" + currentTask.getDeadlineDescription() + ")";
		}
		
		
		$(currentTask.getTaskBar().node).attr('title', titleText);
		$(currentTask.getTaskProgressBar().node).attr('title', titleText);
		
	} else {
		currentTask.setTaskBar(this._paper.rect(currentTask.getX(), currentTask.getY(), currentTask.getWidth(), currentTask.getHeight()).attr({fill: '#000000', "fill-opacity": 0.6}));
	}
}

/**
 * Zeichnet die Abwesenheitstage einer Ressource in das Gantt-Diagramm ein. Zwar
 * handelt es sich bei den Abwesenheits-Objekten ebenfalls um Task-Objekte, 
 * jedoch werden diese nicht wie ein Task als Balken dargestellt. Bei
 * Abwesenheit werden die betroffenen Tage über die gesamte Höhe die die 
 * Ressource im Diagramm einnimmt eingezeichet.
 * Die Farbe für die Art der Abwesenheit wird aus dem Task-Objekt entnommen.
 *
 * @treturn void
 */
GanttChart.prototype.drawAbsence = function() {

	var currentResource;
	var currentResourceAbsence;

	// Iteration über die Resourcen (Tasks auf 1. Ebene)
	for (var i = 0; i < this._rootTasks.length; i++) {
	
		currentResource 			= this._rootTasks[i];
		currentResourceAbsenceArray = currentResource.getAbsence();

		if (currentResourceAbsenceArray != null) {

			// Höhe der einzuzeichnenden Abwesenheit (+1 für die Ressource selbst)
			var height = (currentResource.calculateTotalChildren() + 1) * this._rowHeight;
			var width;
			var currentAbsence;
			
			for (var j = 0; j < currentResourceAbsenceArray.length; j++) {

				currentAbsence 	= currentResourceAbsenceArray[j];
				width			= currentAbsence.getDuration() * this._columWidth;
				x 				= (currentAbsence.getStartDate().getTime() - this._startDate.getTime()) / DAY_IN_MILLISECONDS * this._columWidth;
				
				this._paper.rect(x, currentResource.getY() - (this._rowHeight / 4), width, height).attr({fill: currentAbsence.getColor(), "fill-opacity": 0.6, "stroke-width":0});
			}
		}		
	}
}


/**
 * Zeichnet eine rote Linie, die den aktuellen Zeitpunkt anzeigt, in das
 * Diagramm ein.
 *
 * @treturn void
 */
GanttChart.prototype.drawToday = function() {

	var d = ((new Date()).getTime() - this._startDate.getTime()) / DAY_IN_MILLISECONDS;;	
	this._paper.path("M" + (this._columWidth * d) + " " + this._rowHeight + " L " + (this._columWidth * d) + " " + this._chartCanvasHeight).attr({ stroke : TODAY_LINE_COLOR,	"stroke-width" : "1px", opacity : "0.5"	});
}

/**
 * Zeichnet den Header des Gantt-Diagramms. Dabei werden je nach Spaltenbreite
 * entweder Kalenderwochen zusammengefasst, oder einzelne Tage eingezeichnet.
 *
 * @treturn void
 */
GanttChart.prototype.drawHeader = function() {

	var currentDate 	= new Date(this._startDate.getTime());

	// Farben der Headerzeile analog zu Farben der CSS Klasse .mkg_tableHeadline
	var source			= $(".mkg_tableHeadline:first");
	var backgroundColor	= source.css('background-color');
	var borderColor 	= source.css('border-left-color');
	var textColor 		= source.css('color');	
	
	// Je nach Breite der Tagesspalten werden Wochen oder einzelne Tage angezeit
	if (this._columWidth >= 30) {
		// Tagestrenner
		for (var i = 0; i <= this._daysDisplayed; i++) {			
			this._paper.rect(i * this._columWidth, 0, this._columWidth, this._rowHeight).attr({stroke : borderColor, fill : backgroundColor, "stroke-width" : 1});		
			this._paper.text(this._columWidth * i + 2, this._rowHeight / 2, currentDate.getDate() + "." + (currentDate.getMonth() + 1) + ".").attr({"text-anchor": "start", "fill-opacity": 1, fill: textColor});
			
			currentDate = Util.addDays(currentDate, 1);
		}		
	} else if (this._columWidth >= 5) {
		// Wochentrenner				
		for (var i = 0; i <= this._daysDisplayed; i+=7) {			
			this._paper.rect(i * this._columWidth, 0, 7 * this._columWidth, this._rowHeight).attr({stroke : borderColor, fill : backgroundColor, "stroke-width" : 1});
			this._paper.text(this._columWidth * i + 2, this._rowHeight / 2, "KW " + currentDate.getWeek()).attr({"text-anchor": "start", "fill-opacity": 1, fill: textColor});

			currentDate = Util.addDays(currentDate, 7);
		}
	}
}


/**
 * Zeichnet die Wochenenden in das Gantt-Diagramm ein, wobei die 
 * Hintergrundfarbe der in der CSS-Klasse .mkg_tableCell.even
 * definierten entspricht.
 *
 * @treturn void
 */	
GanttChart.prototype.drawWeekends = function() {
	
	var currentDayOfTheWeek = this._startDate.getDay();						
	var backgroundColor 	= $('.mkg_tableCell.even:first').css('background-color');

	for (var i = 0; i <= this._daysDisplayed; i++) {
		
		if (currentDayOfTheWeek == 6 || currentDayOfTheWeek == 0) {
			this._paper.rect(this._columWidth * i, 0, this._columWidth, this._chartCanvasHeight).attr({fill : backgroundColor, "stroke-width": 0, "stroke":"#FFF"});
		}

		currentDayOfTheWeek++;
		if (currentDayOfTheWeek == 7) {
			currentDayOfTheWeek = 0;
		}
	}	
}


/**
 * Fragt mittels des GanttControllers beim Server an, ob sich an den aktuell
 * dargestellten Daten (Tasks) etwas geändert hat.
 * Wenn sich etwas geändert hat, wird das Array der veränderten Tasks
 * durchlaufen und die entsprechenden Objekte aktualisiert. Außerdem wird
 * ein Hinweis ausgegeben, der angibt wieviele Aufgaben sich geändert haben.
 *
 * @treturn void
 */
GanttChart.prototype.reloadCurrentView = function() {
	
	var sendData	= "{";
	var currentTask	= null;
	
	// JSON String zusammenbauen
	for (var i = 0; i < this._tasks.length; i++) {
		currentTask = this._tasks[i];

		if (currentTask.hasParent() && !this.isMarkedTaskAsDelted(currentTask)) {
			sendData += '"' + currentTask.getId() + '" : "' + currentTask.getChecksum() + '", ';
		}		
	}

	sendData = sendData.substring(0, sendData.length - 2);
	sendData += "}";

	var changesReturn = this._controller.checkForChanges(sendData);
	
	if (changesReturn.changes != null || changesReturn.deleted != null) {
		var updatedTasks 		= JSON.parse(changesReturn.changes);
		var deletedTasks 		= JSON.parse(changesReturn.deleted);
		var updatedTask			= null;
		var	taskObject			= null;
		var countChanges		= 0;
		var countDateChanges	= 0;
		
		for (var i in updatedTasks) {
	
			updatedTask = updatedTasks[i];
		
			taskObject = this._tasksById[updatedTask.id];
			taskObject.setName(updatedTask.name);

			if ((new Date(updatedTask.startDate)) != taskObject.getStartDate()) {
				taskObject.setStartDate(updatedTask.startDate);
				countDateChanges++;
			}
			
			taskObject.setDuration(updatedTask.duration);
			taskObject.setComplete(updatedTask.complete);
			
			this.refreshTableRow(taskObject);
			this.calculateTaskCoordinates(taskObject);
			countChanges++;
		}
		
		for (var j in deletedTasks) {
			this.markTaskAsDelted(this._tasksById[deletedTasks[j]]);
			countChanges++;			
		}
		
		if (countDateChanges > 3) {
			this.displayMessage("Es wurden <b>" + countChanges + "</b> Buchungen aktualisiert. Seite neu laden um Sortierung zu aktualisieren.", "notice");		
		} else if (countChanges > 1) {
			this.displayMessage("Es wurden <b>" + countChanges + "</b> Buchungen aktualisiert.", "notice");
		} else {
			this.displayMessage("Es wurde <b>eine</b> Buchung aktualisiert", "notice");
		}
		
	} else {
		this.displayMessage("Die dargestellten Daten sind auf dem neuesten Stand!", "notice");
	}
}


/**
 * Setzt die Anzahl der Tage die auf der X-Achse angezeigt werden. Dazu wird
 * geprüft ob die minimale Spaltenbreite erreicht wird, falls nicht, werden
 * die benötigten Werte neu berechnet und die Anzeige wird aktualisiert.
 *
 * @tparam  int     days    Anzahl der Tage die auf der X-Achse angezeigt
 *                          werden.
 *
 * @treturn boolean TRUE, wenn Zoom durchgeführt wurde.
 */
GanttChart.prototype.setDaysDisplayed = function(days) {

	var newWidth = this._chartCanvasWidth / days;
	var returnBoolean;
		
	if (newWidth > MIN_COLUM_WIDTH) {
		this._columWidth = newWidth;
		this._daysDisplayed = days;
		returnBoolean = true;

		this.calculateAllTaskCoordinates();
		this.drawGanttChart();		
	} else {
		returnBoolean = false;
		this.displayMessage("Die minimale Spaltenbreite wurde erreicht, es sind keine weiteren Wochen darstellbar.", "notice");
	}
	
	return returnBoolean;
}


/**
 * Setzt die Spaltenbreite (entspricht einem Tag) so, dass die Anzahl der
 * übergebenen Tage dargestellt werden kann.
 *
 * @tparam	int		days    Anzahl der Tage die auf der X-Achse angezeigt
 *                          werden.
 * @treturn void
 */
GanttChart.prototype.displayDays = function(days) {
	this._columWidth = Math.floor(this._chartCanvasWidth / days);
}


/**
 * Zeigt die übergebene Nachricht als Hinweis bzw. Fehlermeldung an.
 *
 * @tparam	string	message     Nachricht die angezeigt werden soll.
 * @tparam	string	type        Typ der Meldung (error|notice).
 * @treturn void
 */
GanttChart.prototype.displayMessage = function(message, type) {	
	
	var element = $('#mkg_message').removeClass('error').removeClass('notice');

	element.addClass(type).html(message).slideDown();
	
	// Nachricht wird nach 3 Sekunden wieder ausgeblendet
	setTimeout(function() { element.slideUp(); }, 3000);	
}

/**
 * Setzt den aktiven Task auf den Task mit der übergebenen ID, sofern dieser
 * vorhanden ist.
 *
 * @tparam	int		id      ID des Tasks der als aktiv markiert werden soll.
 * @treturn void
 */
GanttChart.prototype.setActiveTask = function(id) {

	if (this._tasksById[id] != "undefined" && this._tasksById[id].hasParent()) {
		$('.mkg_tableCell').removeClass('active');
		this._activeTask = this._tasksById[id];
		$('#tableRow_' + id).addClass('active');		
		$('#tableRow_' + id).children().addClass('active');		
	}
}

/**
 * Prüft ob der übergebene Task als gelöscht markiert wurde.
 *
 * @tparam 	Task		task    Task Objekt.
 *
 * @treturn	boolean		TRUE, wenn die Tabellenzeile des Tasks als gelöscht
 *                      markiert wurde.
 */
GanttChart.prototype.isMarkedTaskAsDelted = function(task) {
	return $('#tableRow_' + task.getId()).hasClass('deleted');
}


/** 
 * Markiert den Task mit der übergebenen ID in der Tabelle und im Diagramm
 * als gelöscht. In der Tabelle wird er durchgestrichen und die Handler
 * zur Interaktion werden entfernt.
 * Außerdem wird er aus den Arrays this._tasks und this._tasksById entfernt.
 *
 * @tparam  Task    deleteTask      Task der als gelöscht markiert werden soll.
 *
 * @treturn void
 */
GanttChart.prototype.markTaskAsDelted = function(deleteTask) {

	if (deleteTask != null) {
		var tableRow = $('#tableRow_' + deleteTask.getId());
	
		tableRow.addClass('deleted');
		tableRow.children().removeClass('active even').addClass('deleted').unbind();
		tableRow.children().children().unbind();

		deleteTask.hide();
			
		if (deleteTask.hasParent() && deleteTask.getParent().calculateTotalChildren() > 1) {
			this.calculateTaskCoordinates(deleteTask.getParent());
			this.refreshTableRow(deleteTask.getParent());
		}
	}	
}


/**
 * Löscht den Task mit der übergebenen ID aus dem Diagramm und markiert ihn in
 * der Tabelle als gelöscht. Bevor die Aufgabe gelöscht wird, wird ein Dialog
 * mit einer Sicherheitsabfrage angezeigt.
 *
 * @tparam	int		deleteTask      ID des zu löschenden Tasks.
 *
 * @treturn void
 */
GanttChart.prototype.deleteTask = function(deleteTask) {

	if (deleteTask != null) {
	
		var t = this;
	
		$("#dialogConfirmDelete").dialog({
			resizable: false,
			height: 140,
			modal: true,
			buttons: {
				'Ja': function() {
					try {
						if (t._controller.deleteTask(deleteTask.getId(), deleteTask.getChecksum())) {							
							if (deleteTask.hasParent()) {
								deleteTask.getParent().removeChild(deleteTask);
							}
			
							// Anzeige updaten
							t.markTaskAsDelted(deleteTask);
											
							deleteTask = null;
						}
					} catch (e) {
						t.displayMessage("Error " + e, "notice");
					}
					$(this).dialog('close');
				},
				'Nein': function() {
					$(this).dialog('close');
				}
			}
		});
	
	} else {
		this.displayMessage("Bitte w&auml;hlen Sie einen Task aus, um ihn zu l&ouml;schen.", "notice");	
	}
}


/**
 * Setzt die Funktion des "Hinzufügen"-Buttons der Controlbar.
 *
 * @tparam	string      fct     Funktion für den Hinzufügen-Button als String.
 * 
 * @treturn void
 */
GanttChart.prototype.setBttnAddFunction = function(fct) {

	var t = this;
	$('#bttnAdd').unbind('click').click(function () {

		if (t._activeTask != null) {
		
			if (t._activeTask.hasParent()) {
				parent = t._activeTask;
				while (parent.hasParent()) {
					parent = t._activeTask.getParent();	
				}
			}
			var resourceId = parent.getId();
		
			fct(resourceId);
		} else {
			fct(0);
		}	
	});
}


/**
 * Setzt die Funktion die zum Bearbeiten eines Task ausgeführt werden soll.
 * Die übergebene Funktion sollte mit einem Parameter definiert sein, der die
 * ID der Buchung aufnimmt.
 *
 * @tparam	string      fct     Funktion zum Bearbeiten eines Tasks als String.
 * @treturn void
 */
GanttChart.prototype.setEditTaskFunction = function(fct) {
	this._editTaskFunction = fct;
}


/** 
 * Erlaubt es von außerhalb diese Klasse individuelle Buttons in  die Menüleiste
 * einzufügen. Dazu wird ein JSON String mit dem folgenden Aufbau erwartet:
 *
 * [{ "id" : <ID_des_Buttons>, 
 * "settings" : [<Pfad_zum_Icon>, <Title Attribut>, <Funktion_des_Buttons>]}]
 *
 * @tparam  string      buttons     JSON String mit der Beschreibung der
 *                                  individuellen Buttons.
 *
 * @treturn void
 */
GanttChart.prototype.setCustomButtons = function(buttons) {
	this._customButtons = buttons;
	this.renderCustomButtons();
}


/**
 * Fügt mittels jQuery Interaktionsmöglichkeiten zur Tabelle hinzu.
 *
 * @treturn void
 */
GanttChart.prototype.addTableInteraction = function() {

	// Referenz des Objekt-Scopes, um Zugriff innerhalb der jQuery Methoden zu
    // ermöglichen
	var t = this;

	// Tabellenezeile anwählen
	// -------------------------------------------------------------------------
	$('.mkg_tableRow').click(function() {

		var element = $(this);
		id = new String(element.attr('id'));
		id = id.substr((id.indexOf("_") + 1));
	
		if (!element.hasClass('deleted')) {
			t.setActiveTask(id);
		}	
	});


	// Keyhandler um aktiven Task zu löschen
	// -------------------------------------------------------------------------
	$('#mkg_wrapper_' + this._id).keypress(function(e) {
		if ((e.keyCode || e.which) == 46) {				// Entf. Taste
		
			if (!$('.active > input').hasClass('editmode')) {
				t.deleteTask(t._activeTask);
			}
		}
	});

	
	// Task als aktiv (in Bearbeitung) markieren
	// -------------------------------------------------------------------------
	$('.leaf').click(function() {
		
		var element = $(this);
	   	element.removeAttr("readonly").toggleClass("editmode");	
	
		id = new String(element.attr('id'));
		id = id.substr((id.indexOf("_") + 1));
		var currentTask = t._tasksById[id];

		var oldActive 	= t._resourceActiveTask[currentTask.getParent().getId()];
		var activate 	= true;
		
		if (oldActive == id) {
			activate = false;
		}
				
		try {
			if (t._controller.changeTaskValue(id, currentTask.getChecksum(), "activate", activate) == true) {

				if (oldActive > 0) {
					$('#activate_' + oldActive).attr('src', IMAGE_FOLDER_PATH + 'leaf.png');
					oldTask = t._tasksById[oldActive];
					oldTask.setActive(0);
					oldTask.getTaskText().attr({ fill : "#000000", "font-weight" : "normal" });
				}							

				if (oldActive != id) {
					$('#activate_' + currentTask.getId()).attr('src', IMAGE_FOLDER_PATH + 'leaf_active.png');

					t._resourceActiveTask[currentTask.getParent().getId()] = currentTask.getId();
				
					currentTask.setActive(1);
					currentTask.getTaskText().attr({ fill : "#CC6600", "font-weight" : "bold" });
				} else {
					t._resourceActiveTask[currentTask.getParent().getId()] = 0;
				}
			}
		} catch (e) {
			t.displayMessage(e, "notice");
		}		
				
	}).css('cursor', 'pointer').attr('title', 'Diese Buchung als aktiv markieren');
	// -------------------------------------------------------------------------


	// Task Titel bearbeiten
	// -------------------------------------------------------------------------
	$('.taskDescription').dblclick(function() {
		
		var element = $(this);
		
		element.removeAttr("readonly").toggleClass("editmode");
		
		element.keypress(function(e) {		
			if ((e.keyCode || e.which) == 13) {			// Enter
				endEdit(element);
			} else if ((e.keyCode || e.which) == 27) {	// Escape
				cancelEdit(element);
			}
		});
		
		element.blur(function() {
			endEdit(element);
			element.unbind('blur');
			element.unbind('keypress');
		});		
	});

	function endEdit(jqryElement) {
		jqryElement.toggleClass('editmode').attr("readonly", "readonly");

		id = new String(jqryElement.attr('id'));
		id = id.substr((id.indexOf("_") + 1));

		var currentTask = t._tasksById[id];
		var newName = jqryElement.attr('value');

		if (newName != currentTask.getName()) {
			try {			
				if (t._controller.changeTaskValue(id, currentTask.getChecksum(), "name", newName) == true) {
					currentTask.setName(newName);
					if (currentTask.getTaskText() != null && currentTask.getOwnerShortname() != null) {
    					if (currentTask.getOwnerShortname() != "") {
							currentTask.getTaskText().attr({"text": "[" + currentTask.getOwnerShortname() + "] " + newName});
						} else {
							currentTask.getTaskText().attr({"text": newName});
						}
					}
				}					
			} catch (e) {
				jqryElement.attr('value', currentTask.getName());
				t.displayMessage(e, "notice");
			}				
		}	
	}
		
	function cancelEdit(jqryElement) {
		jqryElement.toggleClass('editmode').attr("readonly", "readonly");
	
		id = new String(jqryElement.attr('id'));
		id = id.substr((id.indexOf("_") + 1));
		jqryElement.attr('value', t._tasksById[id].getName());
	}
	// Ende: Task Titel bearbeiten
	// -------------------------------------------------------------------------


	// Task Datum bearbeiten
	// -------------------------------------------------------------------------
	$('.taskDate').dblclick(function() {
	
		var element = $(this);
	
		element.datepicker({
			onClose: function(dateText, inst) { 

				id = new String(element.attr('id'));
				id = id.substr((id.indexOf("_") + 1));
				var currentTask = t._tasksById[id];
				
				// Wenn sich das Datum geändert hat...
				if (dateText != Util.dateToGermanFormat(currentTask.getStartDate())) {
					try {					
						var newDate = Util.dateToSQLFormat(element.datepicker("getDate"));
					
						if (t._controller.changeTaskValue(id, currentTask.getChecksum(), "start", newDate) == true) {						
							currentTask.setStartDate(newDate);							
						}
					} catch (e) {
						t.displayMessage(e, "notice");
					}
					t.calculateTaskCoordinates(currentTask);
				}
				
				element.blur();
			},
			showWeek: true,
			beforeShowDay: $.datepicker.noWeekends
		}).unbind('focus');
	
     	element.removeAttr("readonly").toggleClass("editmode");
		element.datepicker('show');	
		
		element.blur(function() {
			element.toggleClass('editmode').attr("readonly", "readonly");
			element.unbind('blur');
		});			
	});		
	// Ende: Task Datum bearbeiten
	// -------------------------------------------------------------------------


	// Task Dauer bearbeiten
	// -------------------------------------------------------------------------
	$('.taskDuration').dblclick(function() {
	
		var element = $(this);
	   	element.removeAttr("readonly").toggleClass("editmode");	
	
		id = new String(element.attr('id'));
		id = id.substr((id.indexOf("_") + 1));
		var currentTask = t._tasksById[id];		
		
		var oldDuration = element.attr('value');
		duration = oldDuration.replace(/ MT/, "");
		element.attr('value', duration);
	
		element.keypress(function(e) {			
			if ((e.keyCode || e.which) == 13) {			// Enter
				element.blur();
			} else if ((e.keyCode || e.which) == 27) {	// Escape
				element.toggleClass('editmode').attr("readonly", "readonly");		
				element.attr('value', oldDuration);
			}
		});
		
		element.blur(function() {
		
			var newDuration = element.attr('value');
			newDuration = Number(newDuration.replace(/,/, "."));

			if (!isNaN(newDuration) && newDuration > 0 && newDuration % 0.25 == 0) {
				if (oldDuration != newDuration) {			
					try {										
						if (t._controller.changeTaskValue(id, currentTask.getChecksum(), "duration", newDuration) == true) {						
							currentTask.setDuration(newDuration);
							if (currentTask.getComplete() > 0) {
								t.displayMessage("Bitte auch den prozentualen Fortschritt entsprechend anpassen!", "notice");
							}
						}
					} catch (e) {
						t.displayMessage(e, "notice");						
					}
				}
			} else {
				if (isNaN(newDuration)) {
					t.displayMessage("Ung&uuml;ltige Eingabe! Bitte nur Zahlen und \",\" eingeben.", "notice");					
				} else if (newDuration < 0.25) {
					t.displayMessage("Ung&uuml;ltige Eingabe! Die k&uuml;rzeste Buchungsdauer betr&auml;gt 0,25 Manntage.", "notice");	
				} else {
					t.displayMessage("Ung&uuml;ltige Eingabe! Als Nachkommastellen sind nur ,25 ,50 und ,75 zugelassen.", "notice");	
				}
			}

			t.refreshTableRow(currentTask);
			t.calculateTaskCoordinates(currentTask);
			element.toggleClass('editmode').attr("readonly", "readonly");
			
			element.unbind('blur');
			element.unbind('keypress');	
		});			
	});		
	// Ende: Task Dauer bearbeiten
	// -------------------------------------------------------------------------


	// Fortschritt bearbeiten
	// -------------------------------------------------------------------------
	$('.taskComplete').dblclick(function() {
	
		var element = $(this);
	   	element.removeAttr("readonly").toggleClass("editmode");	
	
		id = new String(element.attr('id'));
		id = id.substr((id.indexOf("_") + 1));
		var currentTask = t._tasksById[id];		
		
		var oldComplete = element.attr('value');
		complete = oldComplete.replace(/%/, "");
		element.attr('value', complete);
		
		element.keypress(function(e) {		
			if ((e.keyCode || e.which) == 13) {			// Enter
				element.blur();
			} else if ((e.keyCode || e.which) == 27) {	// Escape
				element.toggleClass('editmode').attr("readonly", "readonly");		
				element.attr('value', oldComplete);
			}
		});	

        // Funktion die ausgeführt wird, wenn das bearbeiten beendet wird
		element.bind('blur', function() {
		
			var newComplete = Number(element.attr('value'));

			if (!isNaN(newComplete) && newComplete >= 0 && newComplete <= 100) {
				if (oldComplete != newComplete) {
					try {
                        // Wertänderung an den Controller übermitteln, und nur
                        // wenn diese Serverseitig erfolgt ist, auch die
                        // Oberfläche anpassen.
						if (t._controller.changeTaskValue(id, currentTask.getChecksum(), "complete", newComplete) == true) {						
							currentTask.setComplete(newComplete);
						}
					} catch (e) {
						t.displayMessage(e, "error");						
					}
				}
			} else {
				t.displayMessage("Ung&uuml;ltige Eingabe! Der Fortschritt muss zwischen 0 und 100% liegen.", "error");
			}

			t.refreshTableRow(currentTask);
            /* Aufruf der calculateTaskCoordinates damit der Fortschrittsbalken
             * des Task entsprechend angepasst wird.
             *
             * @TODO Ggf. Aktualisierung der GUI in Task.setComplete() vornehmen
             * dadurch könnte auf den Aufruf verzichtet werden.
             */
            t.calculateTaskCoordinates(currentTask);
			element.toggleClass('editmode').attr("readonly", "readonly");

			element.unbind('blur');
			element.unbind('keypress');			
		});
	});		
	// Ende: Fortschritt bearbeiten
	// -------------------------------------------------------------------------
}


/**
 * Hilfsmethode um den Objekt-Typ zu erfragen.
 *
 * @treturn string Name der Klasse als String.
 */
GanttChart.prototype.getType = function() {
	return "GanttChart";
}