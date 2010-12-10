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

/**
 * Diese Klasse dient als Datencontainer fuer Task Objekte. Sie wird nur
 * verwendet um die Datensätze komfortabel mittels json_encode in JSON Notation
 * überführen zu können und besitzt keine weitere Programmlogik.
 *
 * @author Johannes Fuerwentsches <fuerwentsches@mehrkanal.com>
 */
class TaskDto {

	public $id 					= null;
	public $name				= null;
	public $color 				= null;
	public $startDate 			= null;
	public $duration 			= null;
	public $complete 			= null;
	public $priority 			= null;
	
	public $jobNumber 			= null;
	public $jobDescription 		= null;
	public $owner 				= null;
	public $ownerShortname 		= null;
	public $deadline		 	= null;
	public $deadlineDescription	= null;	
	public $active				= null;	
		
	public $children = array(); 	// Array mit Kindern

	/**
	 * Erzeugt eine neue Task Instanz
	 *
	 * @param	int		$id			Eindeutige ID dieses Tasks
	 * @param	string	$name		Name des Tasks
	 * @param	string	$color		Farbe im Gantt-Diagramm in RGB Hex (6-stellig)
	 * @param	string	$start		Startdatum YYYY-MM-DD
	 * @param	int		$duration	Dauer in Tagen - GanttProject unterstuetzt nur ganze Tage, es sollen jedoch auch kleinere Einheiten moeglich sein
	 * @param	int		$complete	Fertigstellung des Tasks in Prozent
	 * @param	int		$priority	Prioritat (0 -> niedrig | 1 -> Normal | 2 -> Hoch)
	 */
	function __construct($id, $name, $color, $start, $duration, $complete, $priority, $jobNumber, $jobDescription, $owner, $ownerShortname, $deadline, $deadlineDescription, $active)
	{
		$this->id 					= (int) $id;
		$this->name 				= (string) $name;
		$this->color 				= (string) $color;
		$this->startDate			= (int) $start;
		$this->duration 			= (float) $duration;
		$this->complete 			= (int) $complete;
		$this->priority 			= (int) $priority;
		
		$this->jobNumber 			= (int) $jobNumber;
		$this->jobDescription 		= (string) $jobDescription;
		$this->owner 				= (int) $owner;
		$this->ownerShortname 		= (string) $ownerShortname;
		$this->deadline	 			= (int) $deadline;
		$this->deadlineDescription	= (string) $deadlineDescription;
		$this->active				= (int) $active;
	}
	
	/**
	 * Gibt das Enddatum dieses Tasks zurück (Start + Dauer)
	 */
	private function getEndDate($start, $duration)
	{
		return strtotime(date("Y-m-d", strtotime("$start")) . " + $duration days");
	}
	
	/**
	 * Fügt diesem Task ein Kind hinzu.
	 */
	public function addChild($task)
	{
		if (!in_array($task, $this->children)) {
			array_push($this->children, $task);
		}
	}

	/**
	 * Gibt einen MD5 Hash zurück, der diesen Task eindeutig identifiziert.
	 *
	 * @return string Checksumme für diesen Task.
	 */
	public function getChecksum()
	{
		return md5($this->id . 
					$this->name .
					$this->color .
					date("Y-m-d", $this->startDate) .
					$this->duration . $this->complete .
					$this->priority . $this->jobNumber .
					$this->jobDescription .
					$this->owner .
					$this->ownerShortname);
	}
}
?>