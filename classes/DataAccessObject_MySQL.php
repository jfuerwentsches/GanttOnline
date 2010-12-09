<?php
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

require_once 'Util.php';

/**
 * DataAccessObject regelt alle Datenbankzugriffe und Abfragen die das
 * Resourcenmanagementtool durchfuehrt.
 *
 * @author Johannes Fuerwentsches <fuerwentsches@mehrkanal.com>
 */
class DataAccessObject_MySQL
{

    /**
     * @var sqldb	Datenbankverbindung als sqldb-Objekt
     */
    private $_db;

    /**
     * Name der Ressourcenplanungs SQL-Tabelle
     */
    const SQL_TABLE_NAME = "ressourcenplanung";

    /**
     * Erzeugt eine neue Instanz dieses DAOs.
     *
     * @param	$db_connection	sqldb	Datenbankverbindung als sqldb-Objekt
     */
    function __construct($db_connection)
    {

    	$this->_db = $db_connection;
    }


    /**
     * Gibt den Task mit der übergebenen ID als TaskDto zurück.
     *
     * @param	int			ID des Tasks
     * @return	mixed		TaskDto Objekt des gewünschten Tasks, false wenn der Task
     *						nicht vorhanden ist.
     */
    public function getTaskById($id)
    {
   		$tasks 		= $this->_db->q("SELECT t.*, j.jobname AS jobname, j.kurzname AS kunde, u.alias AS alias FROM " . self::SQL_TABLE_NAME . " AS t, jobs AS j, portal_user AS u WHERE t.id='" . $id . "' AND j.jobnr=t.jobnr AND u.id=t.id_user");
   		$taskDto 	= false;

   		foreach ($tasks as $task) {

   			$color = $this->_db->q("SELECT farbe FROM kunden_farben WHERE kurzname='" . strtolower($task['kunde']) . "'");

			/* Wenn eine Farbe für diesen Kunden hinterlegt ist übergeben wird sie dem
			 * Task zugeordnet, ansonsten setzen wir einen leeren String, damit das
			 * Diagramm die Standardfarbe verwendet.
			 */
			$color = ($color) ? $color[0]['farbe'] : "";

   			// Beschreibung wird aus Kundenkurzname und Jobname zusammengesetzt
	   		$jobDescription = utf8_encode(strtoupper($task['kunde']) . " | " . $task['jobname']);

	   		// Neues Taskobjekt mit diesen Daten erzeugen
			$taskDto = new TaskDto($task['id'], utf8_encode($task['beschreibung']), $color, utf8_encode($task['start']), utf8_encode($task['dauer']), utf8_encode($task['fortschritt']), utf8_encode($task['prioritaet']), utf8_encode($task['jobnr']), $jobDescription, $task['id_user'], utf8_encode($task['alias']), utf8_encode($task['deadline']), $task['deadline_kommentar'], $task['in_bearbeitung']);
   		}

		return $taskDto;
    }


    /**
     * Löscht den Task mti der üergebenen ID aus der Datenbank.
     *
     * @param	int			ID des Tasks
     * @void
     */
    public function deleteTaskById($id)
    {
   		$tasks = $this->_db->q("DELETE FROM " . self::SQL_TABLE_NAME . " WHERE id = '" . $id . "'");
    }


    /**
     * Fügt den übergebenen Task in die Datenbank ein.
     *
     * @param	TaskDto		Task Objekt, das in die Datenbank eingetragen werden soll
     * @return	mixed		Task Objekt, wenn das Einfügen funktioniert hat, sonst false
     */
    public function addTask($task, $resourceId)
    {

	  	$endDate = calculateEndDate($task->startDate, $task->duration);

		$this->_db->q("INSERT INTO
							" . self::SQL_TABLE_NAME . "
					   (
					   		id_ressource,
					   		id_user,
					   		jobnr,
					   		start,
					   		dauer,
					   		ende,
					   		deadline,
					   		deadline_kommentar,
					   		beschreibung,
					   		prioritaet
					   	) VALUES (
					   		'" . $resourceId . "',
					   		'" . $task->owner . "',
					   		'" . $task->jobNumber . "',
					   		'" . $task->startDate . "',
					   		'" . $task->duration . "',
					   		'" . $endDate . "',
					   		'" . $task->deadline . "',
					   		'" . $task->deadlineDescription . "',
					   		'" . $task->name . "',
					   		'" . $task->priority . "'
					   	)");
    }


	/**
	 * Aktualisiert einen Task in der Datenbank mit den übergebenen Daten.
	 *
	 * @param [..]
	 */
    public function updateTask($id, $id_ressource, $id_user, $jobnr, $start, $dauer, $prioritaet, $beschreibung, $deadline, $deadline_kommentar) {

   	  	$ende = calculateEndDate($start, $dauer);

        $this->lockTables();
    	$this->_db->q("UPDATE
    						" . self::SQL_TABLE_NAME . "
    				   SET
    				   		id_ressource='" . mysql_real_escape_string($id_ressource) . "',
    				   		id_user='" . mysql_real_escape_string($id_user) . "',
    				   		jobnr='" . mysql_real_escape_string($jobnr) . "',
    				   		start='" . mysql_real_escape_string($start) . "',
    				   		dauer='" . mysql_real_escape_string($dauer) . "',
    				   		ende='" . $ende ."',
    				   		deadline='" . mysql_real_escape_string($deadline) . "',
    				   		deadline_kommentar='" . mysql_real_escape_string($deadline_kommentar) . "',
    				   		beschreibung='" . mysql_real_escape_string($beschreibung) . "',
    				   		prioritaet='" . $prioritaet . "'
    				   WHERE
    				   		id='" . mysql_real_escape_string($id) . "'
    				   ");
        $this->unlockTables();
    }


    /**
     * Gibt alle Ressourcen (Mitarbeiter) einer Abteilung als Array zurueck.
     *
     * @param	string		Abteilungsname
     *
     * @return	Array		Array mit ResourceDto-Objekten
     */
    private function getResourcesByDepartment($department)
    {
   		$resources = $this->_db->q("SELECT * FROM portal_user WHERE abteilung = '" . $department . "' AND readonly = 0 ORDER BY sortorder, nachname ASC");

		$resourcesDTOs = array();

		foreach ($resources as $resource) {
			$resourceDto = new ResourceDto($resource['id'], $resource['vorname'] . " " . $resource['nachname']);
			$resourcesDTOs[$resource['id']] = $resourceDto;
		}

		return $resourcesDTOs;
    }


    /**
     * Gibt alle Tasks die der uebergebenen Resource ab dem uebergebenen
     * Startdatum zugeteilt sind zurueck.
     *
     * @param	ResourceDto	Resource fuer die Tasks zurueckgegeben werden sollen
     * @param	string		Startdatum als UNIX-Timestamp
     *
     * @return	Array		Array mit TaskDto-Objekten
     */
    private function getTasksForResource($resource, $startdate)
    {
        $tasks = $this->_db->q("SELECT r.*, j.jobname FROM " . self::SQL_TABLE_NAME . " AS r, jobs AS j WHERE ende >= '" . $startdate . "' AND id_ressource='" . $resource->id . "' AND r.jobnr=j.jobnr ORDER BY r.start ASC, r.prioritaet DESC");
		$taskDTOs = array();

		foreach ($tasks as $task) {
			array_push($taskDTOs, $this->getTaskById($task['id']));
		}

    	return $taskDTOs;
    }


    /**
     * Gibt alle Resourcen der uebergebenen Abteilung zurueck, wobei jeder
     * Resource bereits die Tasks ab dem uebergebenen Datum zugewiesen sind.
     *
     * @param	string		Abteilungskurzname
     * @param	string		Startdatum als UNIX-Timestamp
     *
     * @return	Array		Array mit ResourceDto-Objekte, mit gesetzten Tasks
     */
    public function getResourcesAndTasks($department, $user, $startdate)
    {

		// Farben für Abwesenheitsarten
    	$color['05_FEIERTAG'] 		= "#FEF3C1";
    	$color['10_URLAUB'] 		= "#00CC00";
    	$color['20_URLAUBSANTRAG'] 	= "#ADDD89";
    	$color['30_TERMIN_INTERN'] 	= "#00A1ED";
    	$color['40_SCHULE'] 		= "#7C6355";
		$color['45_ABWESEND'] 		= "#C0C0C0";
    	$color['50_KRANK'] 			= "#606060";
    	$color['60_TERMIN_EXTERN'] 	= "#FF004A";

		// Alle Ressourcen der gewünschten Abteilung laden
    	$resources = $this->getResourcesByDepartment($department);

		// Umsortierung des Arrays um den aktuellen Benutzer oben anzuzeigen
    	if (array_key_exists($user, $resources)) {
	    	$userResource = $resources[$user];
			unset($resources[$user]);
			array_unshift($resources, $userResource);
    	}

		$return_ressources = array();

		foreach ($resources as $resource) {

    		$resource->tasks = $this->getTasksForResource($resource, $startdate);
			if (count($resource->tasks) > 0) {
				array_push($return_ressources, $resource);
			} else {
				continue;
			}

    	    // Urlaub/Abwesenheit den Ressourcen hinzufügen
	   		$absence = $this->_db->q("SELECT
	   									id, kommentar, typ, beginnt, endet
	   								  FROM
	   								  	kalender
	   								  WHERE
	   								  	id_user = '" . $resource->id . "'
	   								  AND
	   								  	(typ='10_URLAUB'
	   								  		OR
	   								  	 typ='20_URLAUBSANTRAG'
	   								  	    OR
	   								  	 typ='40_SCHULE'
	   								  	    OR
	   								  	 typ='45_ABWESEND'
	   								  	 	OR
	   								     typ='50_KRANK')
	   								   AND
	   								     endet >= '" . $startdate . "'");

    		foreach ($absence as $ab) {
   				$duration = round(($ab['endet'] - $ab['beginnt']) / 60 / 60 / 24);
                $resource->addAbsence(new TaskDto($ab['id'], $ab['kommentar'], $color[$ab['typ']], $ab['beginnt'], $duration, 0, 0, "", "", "", "", "", "", ""));
    		}

			/* Bei der Anzeige von Terminen sollen nur Tage markiert werden
	         * wo die aufsummierte Termindauer mindestens 3 Stunden
	         * beträgt.
	         */
    		$appointment = $this->_db->q("SELECT *, SUM(ROUND(((endet-beginnt)/3600))) AS dauer, DAYOFYEAR(FROM_UNIXTIME(beginnt)) AS tag
    									  FROM kalender
    									  WHERE id_user='" . $resource->id . "' AND (typ='30_TERMIN_INTERN' OR typ='60_TERMIN_EXTERN') AND endet >= '" . $startdate . "'
    									  GROUP BY tag
    									  HAVING dauer >= 2");

    		foreach ($appointment as $ab) {
    			$start = date("d.m.Y", $ab['beginnt']);
    			$start = strtotime($start);
                $resource->addAbsence(new TaskDto($ab['id'], $ab['typ'], $color[$ab['typ']], $start, 1, 0, 0, "", "", "", "", "", "", ""));
    		}

			// Feiertage aus dem Kalender importieren
	   		$holidays = $this->_db->q("SELECT id, typ, beginnt, endet
	   								   FROM kalender
	   								   WHERE id_user='1' AND typ='05_FEIERTAG' AND beginnt >= '" . $startdate . "'");
			foreach ($holidays as $holiday) {
				$duration = round(($holiday['endet'] - $holiday['beginnt']) / 60 / 60 / 24);
				$resource->addAbsence(new TaskDto($holiday['id'], $holiday['typ'], $color[$holiday['typ']], $holiday['beginnt'], $duration, 0, 0, "", "", "", "", "", "", ""));
			}
    	}

    	return $return_ressources;
    }


    /**
     * Gibt die Daten für das Gantt-Diagramm als JSON String zurück.
     *
     * @param <type> $department
     * @param <type> $user_id
     * @param <type> $startdate
     * @return <type>
     */
    public function getChartData($department=null, $user_id=null, $startdate=null)
	{

		$resources = $this->getResourcesAndTasks($department, $user_id, $startdate);
		$dataString = json_encode($resources);

		return '{"type" : '.DISPLAY_RESOURCES.', "data" : ' . $dataString . '}';
	}

    /**
     * Setzt die Beschreibung (den Namen) des Tasks mit der uebergebenen ID.
     *
     * @param	int			ID des Tasks in der Datenbank
     * @param	string		Neue Beschreibung des Tasks
     */
	public function setTaskDescription($id, $description)
    {
        $this->lockTables();
    	$this->_db->q("UPDATE " . self::SQL_TABLE_NAME . " SET beschreibung='" . mysql_escape_string($description) . "' WHERE id='" . mysql_escape_string($id) . "'");
        $this->unlockTables();
    }


    /**
     * Setzt das Startdatum des Tasks mit der uebergebenen ID.
     *
     * @param	int			ID des Tasks in der Datenbank
     * @param	string		Datum im Format YYYY-MM-DD
     */
	public function setTaskStart($id, $date)
    {
       	$date 		= strtotime($date);
    	$task 		= $this->getTaskById($id);
		$endDate 	= calculateEndDate($date, $task->duration);

        $this->lockTables();
    	$this->_db->q("UPDATE " . self::SQL_TABLE_NAME . " SET start='" . mysql_escape_string(utf8_decode($date)) . "', ende='" . $endDate . "' WHERE id='" . mysql_escape_string(utf8_decode($id)) . "'");
        $this->unlockTables();
    }


    /**
     * Setzt die Dauer des Tasks mit der uebergebenen ID.
     *
     * @param	int			ID des Tasks in der Datenbank
     * @param	int			Dauer des Tasks
     */
	public function setTaskDuration($id, $duration)
    {
       	$task 		= $this->getTaskById($id);
 		$endDate 	= calculateEndDate($task->getStartDate(), $duration);

        $this->lockTables();
    	$this->_db->q("UPDATE " . self::SQL_TABLE_NAME . " SET dauer='" . mysql_escape_string(utf8_decode($duration)) . "', ende='" . $endDate . "' WHERE id='" . mysql_escape_string(utf8_decode($id)) . "'");
        $this->unlockTables();
    }


	/**
	 * Setzt den Fortschritt des Tasks mit der uebergebenen ID.
	 *
     * @param	int			ID des Tasks in der Datenbank
     * @param	int			Neuer Fortschritt (0-100)
	 */
	public function setTaskComplete($id, $complete)
    {
        $this->lockTables();
    	$this->_db->q("UPDATE " . self::SQL_TABLE_NAME . " SET fortschritt='" . mysql_escape_string(utf8_decode($complete)) . "' WHERE id='" . mysql_escape_string(utf8_decode($id)) . "'");
        $this->unlockTables();
    }


    /**
     * Setzt das "In Bearbeitung" Flag des übergebenen Tasks.
     *
     * @param	int			ID des Tasks in der Datenbank
     * @param	bool		Aktiv/Inaktiv
     */
   	public function setActivateTask($id, $activate)
   	{

   		$resource = $this->_db->q("SELECT * FROM " . self::SQL_TABLE_NAME . " WHERE id='" . $id . "' LIMIT 1");

   		$this->_db->q("UPDATE " . self::SQL_TABLE_NAME . " SET in_bearbeitung=0 WHERE id_ressource='" . $resource[0]['id_ressource'] . "'");

   		if ($activate == "true") {
	   		$this->_db->q("UPDATE " . self::SQL_TABLE_NAME . " SET in_bearbeitung=1 WHERE id='" . $id . "'");
   		}

   	}


    /**
     * Sperrt die Tabellen die im Bearbeitungsvorgang manipuliert werden, um
     * Inkonsistenzen durch parallele Bearbeitung zu verhindern.
     */
    private function lockTables()
    {
    	$this->_db->q("LOCK TABLES " . self::SQL_TABLE_NAME . " AS t WRITE, jobs AS j WRITE, portal_user AS u WRITE, kunden_farben WRITE, ressourcenplanung WRITE");
    }


    /**
     * Ensperrt alle Tabellen.
     */
    private function unlockTables()
    {
    	$this->_db->q("UNLOCK TABLES");
    }
}
?>