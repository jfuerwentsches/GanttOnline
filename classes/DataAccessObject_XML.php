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
 * Importiert eine GanttProject XML-Datei.
 *
 * Dabei wird zwischen Projekt- und Resourcenansicht unterschieden. Um
 * welche Art der Ansicht es sich handelt wird automatisch ermittelt.
 * Wenn Ressourcen in der XML Datei angegeben sind und Ressourcen und
 * Tasks miteinander verknuepft sind wird die Resourcenansicht verwendet,
 * ansonsten die Projektansicht.
 *
 * Es wird ein JSON String zurueckgegeben, der anzeigt um welche Ansicht es
 * sich handelt und die entsprechenden Task bzw. Resourcen Objekte
 * repraensentiert.
 *
 * { type : 1, data : [ %DATA% ] }
 *
 * Type kann entweder 1 (Resourcen) oder 2 (Projekt) sein. Data enthaelt die
 * erste Ebene der Daten, d.h. entweder ein Array mit Resource-Objekten
 * (die wiederum ihre Tasks beinhalten) oder ein Array mit Task-Objekten.
 */
class DataAccessObject_XML {

    private $xml_file;
    
    private $xml_object;

	const XML_DATA_DIRECTORY = "/var/www/vhosts/ganttonline.de/subdomains/demo/httpdocs/01_XML-Data/";

    /**
     *
     * @param <type> $filename
     */
    public function __construct($filename)
    {
		$this->xml_file = DataAccessObject_XML::XML_DATA_DIRECTORY . $filename;

        $this->xml_object = simplexml_load_file($this->xml_file);
    }

	/**
	 *
	 */
	private function getTaskNodeById($id)
	{
		$tasklevel = "";
		while (count($task_node) <= 0) {
			$tasklevel .= "/task";
			$task_node = $this->xml_object->xpath('/project/tasks'.$tasklevel.'[@id='.$id.']');			
		}
		
		return $task_node[0];
	}


    /**
     * Erzeugt ein Task Objekt aus einem Task in XML Repraesentation.
     */
    private function taskNodeToObject($node)
    {

        $start = strtotime((string) $node['start']) . "<br />";
        $task = new TaskDTO((string) $node['id'], (string) $node['name'], (string) $node['color'], $start, (string) $node['duration'], (string) $node['complete'], (string) $node['priority'], "", "", "", "", "", "", 0);

        foreach ($node->children() as $child) {
            if ($child->getName() != "notes") {
                $task->addChild($this->taskNodeToObject($child));
            }
        }

        return $task;
    }

	/**
	 *
	 */
	public function getChartData($department=null, $user_id=null, $startdate=null)
	{

		$resources = $this->getResourcesAndTasks($department, $user_id, $startdate);

		if ($resources != false) {

			$type = DISPLAY_RESOURCES;
			$dataString = json_encode($resources);
		    
		} else {
		
			$tasks = $this->getTasks();

			if ($tasks != false) {

				$type = DISPLAY_PROJECTS;
				$dataString = json_encode($tasks);

			} else {
				$dataString = false;
			}		
		}
		
		return '{"type" : '.$type.', "data" : ' . $dataString . '}';
	}
	
	/**
	 * Gibt alle Tasks aus dieser XML Datei zurück.
	 *
	 * @return
	 */
	private function getTasks()
	{
        $tasks = $this->xml_object->xpath('/project/tasks/task');
        
        foreach ($tasks as $task) {
			$taskIdArray[((int) $task['id'])] = $this->taskNodeToObject($task);
        }

		return (count($taskIdArray) > 0) ? $taskIdArray : false;
	} 

    /**
     * Gibt alle Ressourcen mit ihren dazugehörigen Tasks und eventuellem Urlaub
     * zurück. Wenn keine Ressourcen in der XML Datei angegeben sind wird false
     * zurückgegeben.
     *
     * @return mixed	Array mit ResourceDto Objekten, sofern Ressourcen in der
     *					XML Datei angegeben sind, ansonsten FALSE.
     */
    private function getResourcesAndTasks($department=null, $user_id=null, $startdate=null)
    {

        $resources      = $this->xml_object->xpath('/project/resources/resource');
        $allocations    = $this->xml_object->xpath('/project/allocations/allocation');
        $tasks          = $this->xml_object->xpath('/project/tasks/task');

        if (count($resources) > 0 && count($allocations) >= count($tasks)) {

            $vacations = $this->xml_object->xpath('/project/vacations/vacation');

            foreach ($resources as $resource) {
                $resIdArray[((int) $resource['id'])] = new ResourceDTO(100 + $resource['id'], $resource['name']);
            }

            foreach ($vacations as $vacation) {
                $duration = abs(strtotime($vacation['start']) - strtotime($vacation['end'])) / 86400 + 1;
                $resIdArray[((int) $vacation['resourceid'])]->addAbsence(new TaskDTO(1, "Urlaub", "#6BCD1B", strtotime((string) $vacation['start']), $duration, 0, 0, "", "", "", "", "", "", 0));
            }

            foreach ($tasks as $task) {
                $taskIdArray[((int) $task['id'])] = $this->taskNodeToObject($task);
            }

            foreach ($allocations as $allocation) {
                $resIdArray[((int) $allocation['resource-id'])]->addTask($taskIdArray[((int) $allocation['task-id'])]);
            }

        } else {
            return false;
        }

        return $resIdArray;
    }
    
    
    public function getTaskById($id)
    {
    	
    	// XML Datei in Simple XML Objekt laden
		return $this->taskNodeToObject($this->getTaskNodeById($id));
    }
    
    
    /**
     * Setzt das Startdatum des Tasks mit der uebergebenen ID.
     *
     * @param	int			ID des Tasks in der Datenbank
     * @param	string		Datum im Format YYYY-MM-DD	
     */
	public function setTaskStart($id, $date)
	{

		$task_node = $this->getTaskNodeById($id);
		$task_node['start'] = $date;
	
		// Änderungen an der XML Datei speichern
		$this->xml_object->asXML($this->xml_file);
	}


	/**
     * Setzt die Beschreibung des Tasks mit der uebergebenen ID.
     *
     * @param	int			ID des Tasks in der Datenbank
     * @param	string		Neue Beschreibung für diesen Task
     */
	public function setTaskDescription($id, $description)
	{

		$task_node = $this->getTaskNodeById($id);
		$task_node['name'] = $description;
	
		// Änderungen an der XML Datei speichern
		$this->xml_object->asXML($this->xml_file);
	}
	
	public function setTaskDuration($id, $duration)
	{
		$task_node = $this->getTaskNodeById($id);
		$task_node['duration'] = (int) floor($duration);
	
		// Änderungen an der XML Datei speichern
		$this->xml_object->asXML($this->xml_file);
	}
	
	public function setTaskComplete($id, $complete)
	{
		$task_node = $this->getTaskNodeById($id);
		$task_node['complete'] = (int) $complete;
	
		// Änderungen an der XML Datei speichern
		$this->xml_object->asXML($this->xml_file);
	}
	
	/**
	 * Löscht den Task mit der übergebenen ID aus der XML Datei.
	 */
    public function deleteTaskById($id)
    {	
	    $task_node = $this->getTaskNodeById($id);
		$dom=dom_import_simplexml($task_node);
        $dom->parentNode->removeChild($dom);

		// Änderungen an der XML Datei speichern
		$this->xml_object->asXML($this->xml_file);    	
    }
}
?>