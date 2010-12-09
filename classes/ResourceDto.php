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
 * Diese Klasse dient als Datencontainer fuer Resource Objekte.
 * Konstruktor der Klasse, erzeugt eine neue Instanz.
 *
 * @author Johannes Fuerwentsches <fuerwentsches@mehrkanal.com>
 */
class ResourceDto {

	public $id;
	public $name;
	public $tasks	= array(); 		// Array mit Untertasks
	public $absence = array(); 		// Array mit Tasks die Urlaub oder Abwesenheit repraesentieren

	/**
	 * Erzeugt eine neue Task Instanz.
	 *
	 * @param	id			(int)			Eindeutige ID dieser Resource
	 * @param	name		(string)		Name der Resource
	 */
	function __construct($id, $name)
	{
		$this->id 	= (int) $id;
		$this->name = utf8_encode($name);
	}

	/**
	 * Fuegt dieser Resource einen Task hinzu.
	 */
	public function addTask($task)
	{
		if (getType($task) == "object"  && !in_array($task, $this->tasks)) {
			array_push($this->tasks, $task);
		}
	}
	
	/**
	 * Fuegt einen Abwesenheitstask hinzu.
	 */
	public function addAbsence($task)
	{
		if (!in_array($task, $this->absence)) {
			array_push($this->absence, $task);
		}
	}
}
?>