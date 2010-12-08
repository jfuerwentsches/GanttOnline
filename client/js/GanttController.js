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
 * @class GanttController
 * Diese Klasse bildet den GUI-Controller und dient als Client/Server
 * Schnittstelle. Geänderte Daten werden hier Serialisiert und an den
 * Server gesendet.
 *
 * @author Johannes Fürwentsches <fuerwentsches@mehrkanal.com>
 */

const PHP_CONTROLLER_SCRIPTNAME = "ajax_gantt_controller.php";

/**
 * @ctor Leerer Konstruktur.
 */
function GanttController(filename) {
	this._filename = filename;
}

/**
 * Diese Methode speichert den Task mit der ueberbenen Id, sofern sich
 * dieser in der Zwischenzeit nicht bereits geaendert hat.
 * Die Checksumme ist ein eindeutiger Hash derjenigen Beschreibung die
 * vor der Aenderung auf dem Client angezeigt wurde.
 *
 * @tparam  int     id          Eindeutige ID des Tasks.
 * @tparam  string  checksum    Eindeutige MD5 Checksumme des Tasks.
 * @tparam  string  key         Schlüssel der geändert werden soll.
 * @tparam  string  value       Neuer Wert für <pre>Key</pre>.
 *
 * @treturn boolean	TRUE, wenn Änderung serverseitig erfolgt ist
 */
GanttController.prototype.changeTaskValue = function(id, checksum, key, value) {

	var returnBool = false;

	var sendData = {"id" : id, "checksum" : checksum, "filename" : this._filename};
	// String escapen bevor er verschickt wird. Das "+" Zeichen wird manuell in HEX gewandelt
	sendData[key] = escape(value).replace(new RegExp( "\\+", "g" ), "%2B");

	$.ajax({url: PHP_CONTROLLER_SCRIPTNAME,
			async: false,
			type: 'POST',
			data: sendData,
			dataType: 'json',
			success: function (response) {
				if (response.status == "ok") {
					returnBool = true;
				} else {
					throw response.message;
				}
			}
	});

	return returnBool;
}

/**
 * Diese Methode löscht den Task mit der übergebenen ID aus der Datenbank.
 *
 * @tparam  int     id          Eindeutige ID des Tasks.
 * @tparam  string  checksum    Eindeutige MD5 Checksumme des Tasks.
 *
 * @treturn	boolean	TRUE, wenn Löschvorgang serverseitig durchgeführt wurde
 */
GanttController.prototype.deleteTask = function(id, checksum) {

	var returnBool = false;

	var sendData = {"delete" : id, "checksum" : checksum, "filename" : this._filename};

	$.ajax({url: PHP_CONTROLLER_SCRIPTNAME,
			async: false,
			type: 'POST',
			data: sendData,
			dataType: 'json',
			success: function (response) {
				if (response.status == "ok") {
					returnBool = true;
				} else {
					throw response.message;
				}
			}
	});

	return returnBool;
}

/**
 * Sendet die ID's und Checksummen aller aktuell dargestellten Tasks an den
 * Server, um zu prüfen ob sich etwas geändert hat.
 * Der JSON String der zum Server gesendet wird, sieht aus wie folgt:
 *
 *	{"checkdata" : [ <id> : <checksum>, <id> : <checksum> ]}
 *
 * @tparam  string  checkData   JSON String.
 *
 * @treturn	mixed	FALSE, wenn sich nichts geändert hat -
 *					JSON String mit allen geänderten Objekten
 */
GanttController.prototype.checkForChanges = function(checkData) {

	var returnValue;
	var sendData = {"checkdata" : checkData, "filename" : this._filename};

	$.ajax({url: PHP_CONTROLLER_SCRIPTNAME,
			async: false,
			type: 'POST',
			data: sendData,
			dataType: 'json',
			success: function (response) {
				if (response.status == "ok") {
					returnValue = response;
				} else {
					throw response.message;
				}
			}
	});

	return returnValue;
}