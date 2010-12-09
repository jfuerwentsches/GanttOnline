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
 * @class Task
 * Diese Klasse dient als Datencontainer fuer Task Objekte. Neben den reinen
 * Attributen enthält sie auch Logik zur Darstellung der Tasks innerhalb des
 * Gantt Diagramms. So wird die Gesamte grafische Repräsentation eines Tasks
 * mit Hilfe von Raphael Objekten verwaltet.
 *
 * @author Johannes Fürwentsches <fuerwentsches@mehrkanal.com>
 */

/**
 * @ctor
 * Konstruktor der Klasse, erzeugt eine neue Instanz.
 */
function Task() {

    /**
     * Eindeutige ID dieses Tasks.
     * @type int
     */
	this._id = null;
    /**
     * Bezeichnung des Tasks, die auch im Diagramm angezeigt wird.
     * @type string
     */
	this._name = null;
    /**
     * Farbe des Taskbalkens als RGB Hex-Wert (z.B. #000000).
     * @type string
     */
	this._color = null;
    /**
     * Startdatum des Tasks.
     * @type Date
     */
	this._startDate = null;
    /**
     * Dauer des Tasks in Manntagen.
     * @type float
     */
	this._duration = null;
    /**
     * Fortschritt der Bearbeitung des Tasks in Prozent (ganzzahlig).
     * @type int
     */
	this._complete = null;
    /**
     * Priorität des Tasks.
     * @type int
     */
	this._priority = null;


	/* -------------------------------------------------------------------------
     * Folgende Parameter sind MEHRKANAL spezifisch und müssten für einen
     * allgemenen Einsatz ggf. entfernt werden.
     * -------------------------------------------------------------------------
     */
    /**
     * Jobnummer zu der dieser Task gehört.
     * @type int
     */
	this._jobNumber = null;
    /**
     * Beschreibung des Jobs zu dem dieser Task gehört.
     * @type string
     */
	this._jobDescription = null;
    /**
     * Benutzer ID des Besitzers des Task ist derjenige der den Task erstellt
     * hat. Kommt aus der Tabelle portal_users.
     * @type int
     */
	this._owner	= null;
    /**
     * Kürzel des Besitzers (drei Buchstaben).
     * @type string
     */
	this._ownerShortname = null;
    /**
     * Eine eventuell für diesen Task vorhandene Deadline, also ein Datum bis
     * zu dem der Task abgeschlossen sein muss.
     * @type Date
     */
	this._deadline = null;
    /**
     * Beschreibung zur Deadline. Gibt den Grund bzw. die Art der Deadline
     * spezfisch an.
     * @type string
     */
	this._deadlineDescription = null;
    /**
     * TRUE, wenn dieser Task gerade aktiv bearbeitet wird.
     * @type boolean
     */
	this._active = null;


	/* -------------------------------------------------------------------------
     * Folgende Parameter dienen der Verwaltung von Hierarchien und Verbindungen
     * zwischen mehreren Tasks.
     * -------------------------------------------------------------------------
     */
    /**
     * Generation dieses Tasks.
     * @type int
     */
	this._generation = null;
    /**
     * Array mit Kindern dieses Tasks, ebenfalls Task Objekte.
     * @type Array
     */
	this._children = null;
    /**
     * Da Tasks auf 1. Ebene auch Ressourcen sein können und diese
     * Abwesenheitszeiten haben wird hier ein Array von Tasks Objekten verwaltet
     * die Abwesenheit darstellen. Task Objekte die Abwesenheit o.Ä.
     * signalisieren werden nur mit einer ID, Name, Farbe, Start und Dauer
     * befüllt.
     * @type Array
     */
	this._absence = null;
    /**
     * Vaterelement des Tasks.
     * @type Task
     */
    this._parent = null;

	/* -------------------------------------------------------------------------
     * Folgende Parameter werden für die grafische Repräsenattion benutzt.
     * Auch wenn der Task das Diagramm als ganzes nicht kennt, kennt er seine
     * eigene Position um sich z.B. selbst verschieben zu können. Außerdem
     * muss er z.B. seine Länge verändern können, nämlich dann wenn sich die
     * Dauer des Tasks ändert.
     * -------------------------------------------------------------------------
     */
    /**
     * X-Koordinate des Tasks im Diagramm.
     * @type int
     */
	this._x = null;
    /**
     * Y-Koordinate des Tasks im Diagramm.
     * @type int
     */
	this._y = null;
    /**
     * Breite des zum Task gehörenden Balkens.
     * @type int
     */
	this._width = null;
    /**
     * Höhe des zum Task gehörenden Balkens.
     * @type int
     */
	this._height = null;
    /**
     * Raphael JS Objekt für den Taskbalken.
     * @type Raphael
     */
	this._taskBar = null;
	/**
     * Raphael JS Objekt für den Fortschrittsbalken des Tasks.
     * @type Raphael
     */
    this._taskProgressBar = null;
	/**
     * Raphael JS Objekt für den Text des Tasks im Diagramm.
     * @type Raphael
     */
    this._taskText = null;
	/**
     * Raphael JS Objekt für die Prioritätsanzeige des Tasks, wie z.B. ein
     * Ausrufezeichen.
     * @type Raphael
     */
    this._taskPriority = null;
}


/**
 * Setzt die Instanzvariablen aus dem übergebenen JSON Objekt.
 *
 * @tparam  string  taskJson    JSON String Repräsentation eines Tasks.
 *
 * @treturn void
 */
Task.prototype.createFromJSON = function(taskJson) {
	this._id 					= taskJson.id;
	this._name 					= taskJson.name;
	this._color 				= taskJson.color;
	this._startDate 			= new Date(taskJson.startDate);
	this._duration 				= taskJson.duration;
	this._complete 				= taskJson.complete;	
	this._priority 				= taskJson.priority;
	this._jobNumber				= taskJson.jobNumber;
	this._jobDescription		= taskJson.jobDescription;
	this._owner					= taskJson.owner;
	this._ownerShortname		= taskJson.ownerShortname;
	if (taskJson.deadline != 0) {
		this._deadline				= new Date(taskJson.deadline);
		this._deadlineDescription 	= taskJson.deadlineDescription;				
	}
	this._active				= taskJson.active;
}


/**
 * Fügt diesem Task einen neuen Untertask hinzu.
 *
 * @tparam  Task    child       Kind das diesem Task hinzugefügt werden soll.
 *
 * @treturn void
 */
Task.prototype.addChild = function(child) {
	if (this._children == null) {
		this._children = new Array();
	}

	if (child.getParent() == null) {
		child.setParent(this);
	}

	this._children.push(child);
}


/**
 * Entfernt ein Kind von diesem Task.
 *
 * @tparam  Task    child       Kind das aus der Liste der Kinder dieses Tasks
 *                              entfernt werden soll.
 *
 * @treturn void
 */
Task.prototype.removeChild = function(child) {
	
	if (this._children != null) {

		var positionInArray = 0;
		var currentChild = this._children[0];
	
		while (currentChild.getId() != child.getId() && positionInArray < this._children.length) {
			positionInArray++;
			currentChild = this._children[positionInArray];
		}
		
		this._children.splice(positionInArray, 1);
	}
}


/**
 * Fügt diesem Task einen neuen Abwensenheits-Untertask hinzu.
 *
 * @tparam  Task    task        Task Objekt das Abwesenheit signalisiert.
 *
 * @treturn void
 */
Task.prototype.addAbsence = function(task) {
	if (this._absence == null) {
		this._absence = new Array();
	}

	this._absence.push(task);
}


/**
 * Gibt an, ob dieser Task weitere Untertasks besitzt.
 *
 * @treturn boolean TRUE, wenn Untertasks vorhanden sind.
 */
Task.prototype.hasChildren = function() {
	return (this._children != null && this._children.length > 0);
}


/**
 * Gibt an, ob dieser Task einen Obertask besitzt.
 *
 * @treturn boolean	TRUE, wenn Obertask vorhanden ist.
 */
Task.prototype.hasParent = function() {
	return this._parent != null;
}


/**
 * Gibt an, ob dieser Task eine Deadline besitzt.
 *
 * @treturn boolean	TRUE, wenn Deadline vorhanden ist.
 */
Task.prototype.hasDeadline = function() {
	return this._deadline != null;
}


/**
 * Gibt eine textuelle Repräsentation dieses Tasks wieder.
 *
 * @treturn string	Textdarstellung dieses Tasks.
 */
Task.prototype.toString = function() {
	return "[TASK] " + this._id + " | " + this._name + " | hasChildren: " +
			this.hasChildren();
}


/**
 * Gibt an, ob das übergeben Objekt das selbe ist wie dieser Task.
 *
 * @treturn boolean	TRUE, wenn der uebergebene Task der selbe ist wieder dieser.
 */
Task.prototype.equals = function(obj) {
	return (typeof obj.getType == 'function') ? 
		obj.getType() == "Task" && obj.getId() == this._id : false;
}


/**
 * Berechnet die Gesamtzahl der Kinder, inkl. Kindeskinder.
 *
 * @treturn int		Anzahl der Kinder inkl. Kindeskinder.
 */
Task.prototype.calculateTotalChildren = function() {

	var children;
	
	if (this.hasChildren()) {
		children = this._children.length;
		for (var i = 0; i < this._children.length; i++) {
			children = children + this._children[i].calculateTotalChildren();
		}
	} else {
		children = 0;
	}
	
	return children;
} 


/**
 * Blendet alle graphischen Elemente dieses Tasks aus.
 *
 * @treturn void
 */
Task.prototype.hide = function() {

	if (this._taskBar != null) {
		this._taskBar.hide();
	}
	
	if (this._taskProgressBar != null) {
		this._taskProgressBar.hide();
	}

	if (this._taskText != null && this._taskPriority != null) {
		this._taskText.hide();
		this._taskPriority.hide();
	}
}


/**
 * Verschiebt die grafische Repräsentation dieser Aufgabe an die Stelle x.
 * Dabei werden TaskBar, TaskProgressBar, TaskPriority und TaskText animiert
 * verschoben. Außerdem wird die Breite der TaskBar und der TaskProgressBar
 * angepasst.
 *
 * @tparam	int		x       Neue X-Koordinate.
 * @tparam	int		width   Neue Breite.
 *
 * @treturn void
 */
Task.prototype.updateXAndWidth = function(x, width) {

	// Pixel um die der Task verschoben wird ermitteln
	var moveWidth 		= Math.abs(this._taskBar.attr('x') - x);
	var animation_type	= "<>";
	var animation_time	= 1000;

	if (this._taskText != null && this._taskPriority != null) {
	
		if (this._width == width) {			
			textDifference		= this._taskText.attr('x') - this._taskBar.attr('x');
			priorityDifference 	= this._taskPriority.attr('x') - this._taskBar.attr('x');
		} else {
			textDifference		= width + this._taskText.attr('x') - this._taskBar.attr('x') - this._width;
			priorityDifference 	= width + this._taskPriority.attr('x') - this._taskBar.attr('x') - this._width;		
		}
	}

	/* Bei Positionsänderungen die weniger als 30 Pixel betragen wird ohne
	 * Animation verschoben.
	 */
	if (moveWidth < 30) {
		if (this._taskBar != null) {
			this._taskBar.attr({"x" : x});
		}
		if (this._taskProgressBar != null) {
			this._taskProgressBar.attr({"x" : (x + 1)});
		}
	}

	if (this._taskBar != null) {
		this._taskBar.animate({"x" : x, "width" : width}, animation_time, animation_type);
	}
	
	if (this._taskProgressBar != null) {
		this._taskProgressBar.animate({"x" : (x + 1), "width" : (width * (this._complete / 100) - 2)}, animation_time, animation_type);
	}
	

	if (this._taskText != null && this._taskPriority != null) {		
		this._taskText.animate({"x": (x + textDifference)}, animation_time, animation_type);
		this._taskPriority.animate({"x": (x + priorityDifference)}, animation_time, animation_type);		
	}
	
	this._x 	= x;
	this._width = width;
}


/**
 * Hilfsfunktion um eine geringe Typsicherheit haben zu keonnen.
 *
 * @treturn string	Typ dieses Objekts als String.
 */
Task.prototype.getType = function() {
	return "Task";
}

/* -----------------------------------------------------------------------------
 * Getter Methoden unterscheiden selbstständig, ob es sich um einen einzelnen
 * Task oder einen Obertask handelt.
 *
 * id, name			Sind eindeutig fuer jeden Task
 * color			Wenn keine Kinder vorhanden entsprechende Farbe, sonst
 *                  schwarz
 * startDate		Wenn keine Kinder vorhanden, das Startdatum aus der
 * 					Instanzvariable, ansonsten Kinder pruefen
 * duration			Wenn keine Kinder vorhanden, die Dauer nehmen die angegeben 
 *					wurde, ansonsten die Dauer berechnen, ohne dabei etwas
 *					anderes als das	Startdatum und die Dauer selbst zu verwenden
 * -----------------------------------------------------------------------------
 */

/**
 * Gibt die ID dieses Tasks zurück.
 *
 * @treturn int     ID dieses Tasks.
 */
Task.prototype.getId = function() { return this._id; }

/**
 * Gibt die Bezeichnung dieses Tasks zurück.
 *
 * @treturn string  Name dieses Tasks.
 */
Task.prototype.getName = function() { return this._name; }

/**
 * Gibt die Farbe des Tasks zurück, wobei Tasks die weitere untergeordnete Tasks
 * haben in schwarz angezeigt werden.
 *
 * @treturn	string	Farbe des Tasks in RGB Hexadezimalschreibweise.
 */
Task.prototype.getColor = function() { 
	return (this.hasChildren()) ? "#000000" : this._color;
}

/**
 * Gibt das Startdatum dieses Tasks zurück. Das Startdatum eines Obertasks ist
 * gleich dem frühesten Startdatum seiner Kinder.
 *
 * @treturn Date		Startdatum des Tasks.
 */
Task.prototype.getStartDate = function() { 
	var earliestStartDate;

	if (this.hasChildren()) {		
		var currentStartDate = this._children[0].getStartDate();
		earliestStartDate = currentStartDate;
		for (var i = 1; i < this._children.length; i++) {
			currentStartDate = this._children[i].getStartDate();
			earliestStartDate = (currentStartDate < earliestStartDate) ? 
									currentStartDate : earliestStartDate;
		}
	} else {
		earliestStartDate = this._startDate;
	}
	
	return earliestStartDate;
}

/**
 * Gibt die Dauer dieses Tasks in Arbeitstagen zurück, d.h. Wochenenden
 * werden nicht gezaehlt.
 *
 * @treturn double     Dauer des Tasks in Manntagen.
 */
Task.prototype.getDuration = function() { 

	var duration = 0;

	if (this.hasChildren()) {

		var latestEndDate = this._children[0].getEndDate();		
		var currentEndDate;
		
		for (var i = 1; i < this._children.length; i++) {
			currentEndDate = this._children[i].getEndDate();
			if (currentEndDate > latestEndDate) {
				latestEndDate = currentEndDate;
			}			
		}
		
		duration = Util.dateDifferenceWorkdays(this.getStartDate(), latestEndDate);
		
	} else {
		duration = this._duration;
	}
	
	return Number(duration);
}

/**
 * Gibt den Fortschritt der Bearbeitung dieses Tasks zurück.
 * 
 * @treturn int         Fortschritt der Bearbeitung dieses Tasks.
 */
Task.prototype.getComplete = function() { 

	var complete = 0;

	if (this.hasChildren()) {		
		complete = "-";
	} else {
		complete = this._complete;
	}

	return complete; 
}

/**
 * Gibt die Priorität dieses Tasks zurück.
 * 
 * @treturn int         Priorität dieses Tasks.
 */
Task.prototype.getPriority = function() { return this._priority; }

/**
 * Gibt die Jobnummer zurück zu der dieser Task gehört.
 *
 * @treturn int         Jobnummer dieses Tasks.
 */
Task.prototype.getJobNumber = function() { return this._jobNumber; }

/**
 * Gibt die Beschreibung des Jobs zurück zu dem dieser Task gehört.
 *
 * @treturn string      Beschreibung des Jobs zu dem dieser Task gehört.
 */
Task.prototype.getJobDescription = function() { return this._jobDescription; }

/**
 * Gibt die Generation dieses Tasks zurück.
 *
 * @treturn int         Generation dieses Tasks.
 */
Task.prototype.getGeneration = function() { return this._generation; }

/**
 * Gibt die Kinder dieses Tasks zurück.
 *
 * @treturn Array       Kinder dieses Tasks (Array von Task Objekten).
 */
Task.prototype.getChildren = function() { return this._children; }

/**
 * Abwesenheitszeiten für diesen Task. Wird genutzt wenn dieser Task eine
 * Ressource (Task auf 1. Ebene) repräsentiert.
 *
 * @treturn Array       Abwesenheitszeiträume dieses Tasks.
 */
Task.prototype.getAbsence = function() { return this._absence; }

/**
 * Gibt den Vater dieses Tasks zurück, sofern vorhanden.
 *
 * @treturn Task        Vater dieses Tasks.
 */
Task.prototype.getParent = function() { return this._parent; }

/**
 * Gibt die X-Koordinate dieses Tasks zurück.
 *
 * @treturn int         X-Koordinate dieses Tasks.
 */
Task.prototype.getX = function() { return this._x; }

/**
 * Gibt die Y-Koordinate dieses Tasks zurück.
 *
 * @treturn int         Y-Koordinate dieses Tasks.
 */
Task.prototype.getY = function() { return this._y; }

/**
 * Gibt die Breite des Balkens dieses Tasks zurück.
 *
 * @treturn int         Breite des Balkens dieses Tasks.
 */
Task.prototype.getWidth = function() { return this._width; }

/**
 * Gibt die Höhe des Balkens dieses Tasks zurück.
 *
 * @treturn int         Höhe des Balkens dieses Tasks.
 */
Task.prototype.getHeight = function() { return this._height; }

/**
 * Gibt den Balken dieses Tasks als Raphael JS Objekt zurück.
 *
 * @treturn Raphael     Balken der zu diesem Task gehört.
 */
Task.prototype.getTaskBar = function() { return this._taskBar; }

/**
 * Gibt den Fortschrittsbalken dieses Tasks als Raphael JS Objekt zurück.
 *
 * @treturn Raphael     Fortschrittsbalken der zu diesem Task gehört.
 */
Task.prototype.getTaskProgressBar = function() { return this._taskProgressBar; }

/**
 * Gibt den Text dieses Tasks als Raphael JS Objekt zurück.
 *
 * @treturn Raphael     Text der zu diesem Task gehört.
 */
Task.prototype.getTaskText = function() { return this._taskText; }

/**
 * Gibt die Priorität dieses Tasks zurück.
 *
 * @treturn int         Priorität dieses Tasks.
 */
Task.prototype.getTaskPriority = function() { return this._taskPriority; }

/**
 * Gibt den Besitzer dieses Tasks zurück.
 *
 * @treturn int         Benutzer-ID des Besitzers dieses Tasks.
 */
Task.prototype.getOwner = function() { return this._owner; }

/**
 * Gibt den Kurznamen des Besitzers dieses Tasks zurück.
 *
 * @tretrun string      Kurzname des Besitzers dieses Tasks.
 */
Task.prototype.getOwnerShortname = function() { return this._ownerShortname; }

/**
 * Gibt die Deadline dieses Tasks zurück.
 *
 * @treturn Date        Deadline dieses Tasks.
 */
Task.prototype.getDeadline = function() { return this._deadline; }

/**
 * Gibt die Beschreibung zur Deadline zurück.
 *
 * @treturn string      Beschreibung zur Deadline dieses Tasks.
 */
Task.prototype.getDeadlineDescription = function() { return this._deadlineDescription; }

/**
 * Gibt den Wert von active zurück.
 *
 * @treturn int         Gibt an ob dieser Task aktiv ist.
 */
Task.prototype.getActive = function() { return this._active; }

/**
 * Gibt an ob dieser Task aktiv bearbeitet wird.
 *
 * @treturn boolean     TRUE, wenn dieser Task gerade aktiv bearbeitet wird.
 */
Task.prototype.isActive = function() { return this._active == 1; }

/**
 * Gibt das Enddatum dieses Tasks zurueck, wobei zu beachten ist, dass das
 * Enddatum miteinbezieht, dass nur Wochentage als Arbeitstage zaehlen und
 * somit das Enddatum nicht das Startdatum zzgl. der Dauer des Tasks ist.
 * Außerdem arbeitet die Funktion rekursiv, das heißt wenn der Task weitere
 * Untertasks hat werden diese alle mit einbezogen und das Enddatum des als
 * letztes endenden Tasks wird zurückgegeben.
 *
 * @treturn Date        Enddatum dieses Tasks.
 */
Task.prototype.getEndDate = function() {

	var endDate;

	/* Wenn dieser Task Kinder hat, muss rekursiv gearbeitet werden. */
	if (this.hasChildren()) {
		var currentEndDate = this._children[0].getEndDate();
		endDate = currentEndDate;
		for (var i = 1; i < this._children.length; i++) {
			currentEndDate = this._children[i].getEndDate();
			if (currentEndDate > endDate) {
				endDate = currentEndDate;
			}
		}
	} else {
		/* Nachkomma Anteil der Dauer abspalten. */
		var decimal = this._duration * 100 % 100 / 100;

		/* Wenn die Dauer eine Dezimalzahl ist muessen die Stunden des Enddatums
		 * ebenfalls entsprechend gesetzt werden.
		 */
		if (decimal == 0) {
			endDate = Util.addDays(this.getStartDate(), this._duration - 1);
			endDate.setHours(23);
		} else {
			endDate = Util.addDays(this.getStartDate(), this._duration);
			endDate.setHours(24 * decimal - 1);

		}
		endDate.setMinutes(59);

		var startDay = this.getStartDate().getDay();

		if (this._duration <= 5) {
			/* Task geht ueber ein Wochenende */
			if (this._duration + startDay - 1 > 5) {
				endDate = Util.addDays(endDate, 2);
			}
		} else {
			/* Die Minimale Anzahl an Wochenenden entspricht der Anzahl an
			 * Arbeitswochen die vollstaendig in den Zeitraum passen. Falls die
			 * Dauer restlos in Arbeitswochen ausgedrueckt werden kann (Rest 0),
			 * ist die Mindestanzahl der Wochenenden um eine Woche geringer.
			 */
			var numberOfWeekends;
			if (this._duration % 5 == 0) {
				numberOfWeekends = Math.floor(this._duration / 5) - 1;
			} else {
				numberOfWeekends = Math.floor(this._duration / 5);
			}

			/* Enddatum um Mindestwochenendanzahl * 2 (zwei Tage pro WE) nach
			 * hinten verschieben.
			 */
			endDate = Util.addDays(endDate, 2 * numberOfWeekends);

			/* Wenn nach dem Verschieben ein Samstag oder Sonntag erreicht wurde
			 * muessen weitere zwei Tage hinzugefuegt werden.
			 */
			if (endDate.getDay() == 6 || endDate.getDay() == 0) {
				endDate = Util.addDays(endDate, 2);
			}
		}
	}

	return endDate;
}

/**
 * Gibt die eindeutige Checksumme dieses Objektes zurück.
 *
 * @treturn string      Eindeutige (md5) Checksumme für diesen Task.
 */
Task.prototype.getChecksum = function() {

	var string = this._id + this._name;
	
	if (this._color != null) { string += this._color };
	if (this._startDate != null) { string += Util.dateToSQLFormat(this._startDate) };
	if (this._duration != null) { string += this._duration };
	if (this._complete != null) { string += this._complete };
	if (this._priority != null) { string += this._priority };

	if (this._jobNumber != null) { string += this._jobNumber };
	if (this._jobDescription != null) { string += this._jobDescription };
	if (this._owner != null) { string += this._owner };	
	if (this._ownerShortname != null) { string += this._ownerShortname };	

	return Util.md5(string);
}

/**
 * Gibt die Dauer dieses Tasks inkl. Wochenendtagen zurück.
 *
 * @treturn int         Dauer dieses Tasks inkl. Wochentagen.
 */
Task.prototype.getDurationWeekends = function() {
	return Util.dateDifference(this.getStartDate(), this.getEndDate());
}

/* -----------------------------------------------------------------------------
 * Setter Methoden
 * -----------------------------------------------------------------------------
 */
Task.prototype.setId = function(id) { this._id = id; }
Task.prototype.setName = function(name) { this._name = name; }
Task.prototype.setColor = function(color) { this._color = color; }
Task.prototype.setStartDate = function(startDate) { 
	var date = new Date(startDate);
	date.setHours(0);
	this._startDate = date;	
}
Task.prototype.setDuration = function(duration) { this._duration = duration; }
Task.prototype.setComplete = function(complete) { this._complete = complete; }
Task.prototype.setPriority = function(priority) { this._priority = priority; }
Task.prototype.setJobNumber = function(jobNumber) { this._jobNumber = jobNumber; }
Task.prototype.setJobDescription = function(jobDescription) { this._jobDescription = jobDescription; }
Task.prototype.setGeneration = function(generation) { this._generation = generation; }
Task.prototype.setChildren = function(children) { this._children = children; }
Task.prototype.setAbsence = function(absence) { this._absence = absence; }
Task.prototype.setParent = function(parent) { this._parent = parent; }
Task.prototype.setX = function(x) { this._x = x; }
Task.prototype.setY = function(y) { this._y = y; }
Task.prototype.setWidth = function(width) { this._width = width; }
Task.prototype.setHeight = function(height) { this._height = height; }
Task.prototype.setTaskBar = function(taskBar) { this._taskBar = taskBar; }
Task.prototype.setTaskProgressBar = function(taskProgressBar) { this._taskProgressBar = taskProgressBar; }
Task.prototype.setTaskText = function(taskText) { this._taskText = taskText; }
Task.prototype.setTaskPriority = function(taskPriority) { this._taskPriority = taskPriority; }
Task.prototype.setOwner = function(owner) { this._owner = owner; }
Task.prototype.setOwnerShortname = function(ownerShortname) { this._ownerShortname = ownerShortname; }
Task.prototype.setDeadline = function(deadline) { this._deadline = deadline; }
Task.prototype.setDeadlineDescription = function(deadlineDescription) { this._deadlineDescription = deadlineDescription; }
Task.prototype.setActive = function(active) { this._active = active; }