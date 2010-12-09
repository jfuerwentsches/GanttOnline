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
 * Diese Klasse dient als Datencontainer fuer Task Objekte.
 * Konstruktor der Klasse, erzeugt eine neue Instanz.
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
	 * @param	id			(int)			Eindeutige ID dieses Tasks
	 * @param	name		(string)		Name des Tasks
	 * @param	color		(string)		Farbe im Gantt-Diagramm in RGB Hex (6-stellig)
	 * @param	start		(string)		Startdatum YYYY-MM-DD
	 * @param	duration	(int)			Dauer in Tagen - GanttProject unterstuetzt nur ganze Tage, es sollen jedoch auch kleinere Einheiten moeglich sein
	 * @param	complete	(int)			Fertigstellung des Tasks in Prozent
	 * @param	priority	(int)			Prioritat (0 -> niedrig | 1 -> Normal | 2 -> Hoch)
	 */
	function __construct($id, $name, $color, $start, $duration, $complete, $priority, $jobNumber, $jobDescription, $owner, $ownerShortname, $deadline, $deadlineDescription, $active)
	{
		$this->id 					= $id;
		$this->name 				= $name;
		$this->color 				= $color;
		$this->startDate			= $start;
		$this->duration 			= $duration;
		$this->complete 			= $complete;
		$this->priority 			= $priority;
		
		$this->jobNumber 			= $jobNumber;
		$this->jobDescription 		= $jobDescription;
		$this->owner 				= $owner;
		$this->ownerShortname 		= $ownerShortname;
		$this->deadline	 			= $deadline;
		$this->deadlineDescription	= $deadlineDescription;
		$this->active				= $active;
	}
	
	/**
	 * Gibt das Enddatum dieses Tasks zurueck (Start + Dauer)
	 */
	private function getEndDate($start, $duration)
	{
		return strtotime(date("Y-m-d", strtotime("$start")) . " + $duration days");
	}
	
	/**
	 * Fuegt diesem Task ein Kind hinzu.
	 */
	public function addChild($task)
	{
		if (!in_array($task, $this->children)) {
			array_push($this->children, $task);
		}
	}
}
?>