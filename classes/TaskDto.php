<?php
/**
 * Diese Klasse dient als Datencontainer fuer Task Objekte.
 * Konstruktor der Klasse, erzeugt eine neue Instanz.
 *
 * @author Johannes Fuerwentsches <fuerwentsches@mehrkanal.com>
 */
class TaskDto {

	private $_id 					= null;
	private $_name					= null;
	private $_color 				= null;
	private $_startDate 			= null;
	private $_duration 				= null;
	private $_complete 				= null;
	private $_priority 				= null;
	
	private $_jobNumber 			= null;
	private $_jobDescription 		= null;
	private $_owner 				= null;
	private $_ownerShortname 		= null;
	private $_deadline		 		= null;
	private $_deadlineDescription	= null;	
	private $_active				= null;	
		
	private $_children = array(); 	// Array mit Kindern

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
		$this->_id 					= $id;
		$this->_name 				= $name;
		$this->_color 				= $color;
		$this->_startDate			= $start;
		$this->_duration 			= $duration;
		$this->_complete 			= $complete;
		$this->_priority 			= $priority;
		
		$this->_jobNumber 			= $jobNumber;
		$this->_jobDescription 		= $jobDescription;
		$this->_owner 				= $owner;
		$this->_ownerShortname 		= $ownerShortname;
		$this->_deadline	 		= $deadline;
		$this->_deadlineDescription	= $deadlineDescription;
		$this->_active				= $active;
	}
	
	/**
	 * Gibt das Enddatum dieses Tasks zurueck (Start + Dauer)
	 */
	private function _getEndDate($start, $duration)
	{
		return strtotime(date("Y-m-d", strtotime("$start")) . " + $duration days");
	}
	
	/**
	 * Fuegt diesem Task ein Kind hinzu.
	 */
	public function addChild($task)
	{
		if (!in_array($task, $this->_children)) {
			array_push($this->_children, $task);
		}
	}

	/**
	 * Gibt die JSON Repraesentation dieses Objektes zurueck.
	 */
	public function toJSON()
	{
		$jsonString = '';
		
		$jsonString .= '{';
		$jsonString .= '"id" : ' . json_encode($this->_id) . ', ';
		$jsonString .= '"name" : ' . json_encode($this->_name) . ', ';
		$jsonString .= '"color" : ' . json_encode($this->_color) . ', ';
		$jsonString .= '"startDate" : ' . json_encode($this->_startDate * 1000) . ', ';
		$jsonString .= '"duration" : ' . $this->_duration . ', ';
		$jsonString .= '"complete" : ' . json_encode($this->_complete) . ', ';
		$jsonString .= '"priority" : ' . json_encode($this->_priority) . ', ';
		$jsonString .= '"jobNumber" : ' . json_encode($this->_jobNumber) . ', ';
		$jsonString .= '"jobDescription" : ' . json_encode($this->_jobDescription) . ', ';
		$jsonString .= '"owner" : ' . json_encode($this->_owner) . ', ';
		$jsonString .= '"ownerShortname" : ' . json_encode($this->_ownerShortname) . ', ';
		$jsonString .= '"deadline" : ' . json_encode($this->_deadline * 1000) . ', ';
		$jsonString .= '"deadlineDescription" : ' . json_encode($this->_deadlineDescription) . ', ';
		$jsonString .= '"active" : ' . json_encode($this->_active) . ', ';		
		if ($this->hasChildren()) {
			$jsonString .= '"children" : [';
			foreach ($this->_children as $child) {
				$jsonString .= $child->toJSON();
				$jsonString .= ", ";
			}
			// Letztes Komma ist zuviel --> entfernen
			$jsonString = substr($jsonString, 0, strlen($jsonString) - 2); 
			$jsonString .= ']';			
		} else {
			$jsonString .= '"children" : null';
		}		
		$jsonString .= '}';
		
		return $jsonString;
	}
	
	public function hasChildren()
	{
		return count($this->_children) > 0;
	}
	
	public function getChecksum()
	{
		return md5($this->_id . $this->_name .	$this->_color . date("Y-m-d", $this->_startDate) .	$this->_duration . $this->_complete . $this->_priority . $this->_jobNumber .	$this->_jobDescription . $this->_owner . $this->_ownerShortname);
	}

	public function getId()
	{
		return $this->_id;
	}

	public function getName()
	{
		return $this->_name;
	}
	
	public function getColor()
	{
		return $this->_color;
	}

	public function getStartDate()
	{
		return $this->_startDate;
	}
	
	public function getDuration()
	{
		return $this->_duration;
	}

	public function getComplete()
	{
		return $this->_complete;
	}

	public function getPriority()
	{
		return $this->_priority;
	}

	public function getJobNumber()
	{
		return $this->_jobNumber;
	}

	public function getJobDescription()
	{
		return $this->_jobDescription;
	}
	public function getOwner()
	{
		return $this->_owner;
	}	
	public function getOwnerShortname()
	{
		return $this->_ownerShortname;
	}	
	public function getDeadline()
	{
		return $this->_deadline;
	}	
	public function getDeadlineDescription()
	{
		return $this->_deadlineDescription;
	}
	public function isActive()
	{
		return $this->_active == 1;
	}
}
?>