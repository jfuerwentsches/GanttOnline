<?php
/**
 * Diese Klasse dient als Datencontainer fuer Resource Objekte.
 * Konstruktor der Klasse, erzeugt eine neue Instanz.
 *
 * @author Johannes Fuerwentsches <fuerwentsches@mehrkanal.com>
 */
class ResourceDto {

	private $_id;
	private $_name;
	private $_tasks = array(); 		// Array mit Untertasks
	private $_absence = array(); 	// Array mit Tasks die Urlaub oder Abwesenheit repraesentieren

	/**
	 * Erzeugt eine neue Task Instanz.
	 *
	 * @param	id			(int)			Eindeutige ID dieser Resource
	 * @param	name		(string)		Name der Resource
	 */
	function __construct($id, $name)
	{
		$this->_id = $id;
		$this->_name = $name;
	}

	/**
	 * Fuegt dieser Resource einen Task hinzu.
	 */
	public function addTask($task)
	{
		if (getType($task) == "object"  && !in_array($task, $this->_tasks)) {
			array_push($this->_tasks, $task);
		}
	}
	
	/**
	 * Fuegt einen Abwesenheitstask hinzu.
	 */
	public function addAbsence($task)
	{
		if (!in_array($task, $this->_absence)) {
			array_push($this->_absence, $task);
		}
	}	

	/**
	 * Gibt die JSON Repraesentation dieses Objektes zurueck.
	 */
	public function toJSON()
	{
		$jsonString = '';
		
		$jsonString .= '{';
		$jsonString .= '"id" : ' . $this->_id . ', ';
		$jsonString .= '"name" : "' . $this->_name . '", ';
		if ($this->hasTasks()) {
			$jsonString .= '"tasks" : [';
			foreach ($this->_tasks as $task) {

				$jsonString .= $task->toJSON();
				$jsonString .= ", ";
			}
			// Letztes Komma ist zuviel --> entfernen
			$jsonString = substr($jsonString, 0, strlen($jsonString) - 2); 
			$jsonString .= '] ,';			
		} else {
			$jsonString .= '"tasks" : null, ';
		}
		
		if ($this->hasAbsence()) {
			$jsonString .= '"absence" : [';
			foreach ($this->_absence as $task) {
				$jsonString .= $task->toJSON();
				$jsonString .= ", ";
			}
			// Letztes Komma ist zuviel --> entfernen
			$jsonString = substr($jsonString, 0, strlen($jsonString) - 2); 
			$jsonString .= '] ';
		} else {
			$jsonString .= '"absence" : null';
		}
		$jsonString .= '}';
		
		return $jsonString;
	}
	
	public function hasTasks()
	{
		return count($this->_tasks) > 0;
	}

	public function hasAbsence()
	{
		return count($this->_absence) > 0;
	}

	public function getId()
	{
		return $this->_id;
	}

	public function getName()
	{
		return $this->_name;
	}
	
	public function setTasks($tasks)
	{
		$this->_tasks = $tasks;
	}

	public function setAbsence($absence)
	{
		$this->_absence = $absence;
	}
}
?>