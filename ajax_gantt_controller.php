<?php

    // Debug
    //error_reporting(E_ERROR);
    //ini_set("display_errors", FALSE);

    // Modulkonfiguration laden
    require_once("conf.inc.php");

	// Benötigte Klassen für die Ressourcenplanung
	require_once $conf['resources']['classpath'].'TaskDto.php';
	require_once $conf['resources']['classpath'].'ResourceDto.php';

    // Verschiedene Initialisierungen des Datenzugriffobjektes je nach Art
    // der Datenhaltung.
    if ($conf['resources']['storage_type'] == "MySQL") {

        // MEHRKANAL Intranet Prepend Skript (Datenbankverbindung)
        require_once $conf['resources']['db_init_script'];
       	require_once $conf['resources']['classpath'].'DataAccessObject_MySQL.php';
        // $db wird im Prepend Skript gesetzt
        $dao = new DataAccessObject_MySQL($db);
    } elseif ($conf['resources']['storage_type'] == "XML") {

        require_once $conf['resources']['classpath'].'DataAccessObject_XML.php';
        // $filename muss vom Aufrufenden Javascript übermittelt werden
        $dao = new DataAccessObject_XML($_REQUEST['filename']);
    }

    // -------------------------------------------------------------------------
	// Aufruf mit init Parameter: Daten zur Visualisierung laden
	// -------------------------------------------------------------------------
	if (isset($_REQUEST['action']) && $_REQUEST['action'] == "init") {

		echo $dao->getChartData($_REQUEST['abteilung'], $_REQUEST['user'], $_REQUEST['start']);
	    die();
   	// -------------------------------------------------------------------------
	// Neuen Task hinzufügen / vorhandenen speichern
    // -------------------------------------------------------------------------
	} else if (!empty($_REQUEST['jobNumber'])) {

		if ($_REQUEST['id'] == 0 || $_REQUEST['id'] == "") {

			$task = new TaskDto(0, urldecode($_REQUEST['description']), "", (urldecode($_REQUEST['start']) / 1000), urldecode($_REQUEST['duration']), 0, urldecode($_REQUEST['priority']), urldecode($_REQUEST['jobNumber']), "",  $_REQUEST['owner'], "", urldecode($_REQUEST['deadline']) / 1000, urldecode($_REQUEST['deadlineDescription']), 0);

			$dao->addTask($task, $_REQUEST['resource']);
			echo json_encode(array("status" => "ok"));
		} else {

			$task = $dao->getTaskById($_REQUEST['id']);

			// Prüfe Checksumme
			if ($task->getChecksum() == $_REQUEST['checksum']) {
				$dao->updateTask(urldecode($_REQUEST['id']), urldecode($_REQUEST['resource']), urldecode($_REQUEST['owner']), urldecode($_REQUEST['jobNumber']), urldecode($_REQUEST['start'] / 1000), urldecode($_REQUEST['duration']), urldecode($_REQUEST['priority']), urldecode($_REQUEST['description']), urldecode($_REQUEST['deadline']) / 1000, urldecode($_REQUEST['deadlineDescription']));

				echo json_encode(array("status" => "ok"));
			} else {
				echo json_encode(array("status" => "error", "message" => "Diese Buchung wurde von einem anderen Benutzer geändert."));
			}
		}
		die();
	// -------------------------------------------------------------------------
	// Einzelnen Taskparameter editieren
    // -------------------------------------------------------------------------
	} else if (!empty($_REQUEST['id'])) {

		$task = $dao->getTaskById($_REQUEST['id']);

		// Prüfe Checksumme
		if ($task->getChecksum() == $_REQUEST['checksum']) {

			// Verarbeite Request
			if (!empty($_REQUEST['name'])) {
				$dao->setTaskDescription($_REQUEST['id'], urldecode($_REQUEST['name']));
				echo json_encode(array("status" => "ok"));
			} else if (!empty($_REQUEST['start'])) {
				$dao->setTaskStart($_REQUEST['id'], $_REQUEST['start']);
				echo json_encode(array("status" => "ok"));
			} else if (!empty($_REQUEST['duration'])) {
				$dao->setTaskDuration($_REQUEST['id'], $_REQUEST['duration']);
				echo json_encode(array("status" => "ok"));
			} else if (isset($_REQUEST['complete'])) {
				$dao->setTaskComplete($_REQUEST['id'], $_REQUEST['complete']);
				echo json_encode(array("status" => "ok"));
			} else if (isset($_REQUEST['activate'])) {
				$dao->setActivateTask($_REQUEST['id'], $_REQUEST['activate']);
				echo json_encode(array("status" => "ok"));
			}

		} else {
			echo json_encode(array("status" => "error", "message" => "Diese Buchung wurde von einem anderen Benutzer geändert."));
		}
		die();
    // -------------------------------------------------------------------------
	// Task löschen
    // -------------------------------------------------------------------------
	} else if (!empty($_REQUEST['delete'])) {

		$task = $dao->getTaskById($_REQUEST['delete']);

		// Pruefe Checksumme
		if ($task->getChecksum() == $_REQUEST['checksum']) {
			$dao->deleteTaskById($_REQUEST['delete']);
			echo json_encode(array("status" => "ok"));
		} else {
			echo json_encode(array("status" => "error", "message" => "Diese Buchung wurde von einem anderen Benutzer geändert."));
		}
		die();
    // -------------------------------------------------------------------------
	// Aktualisieren der übergebenen Daten
    // -------------------------------------------------------------------------
	} else if (!empty($_REQUEST['checkdata'])) {

		$data = json_decode(stripslashes($_REQUEST['checkdata']), true);

		if (is_array($data)) {

			$changedData 	= "[";
			$changedCount	= 0;
			$deleteData 	= "[";
			$deleteCount	= 0;

			foreach ($data as $id => $checksum) {

				$task = $dao->getTaskById($id);

				if ($task !== false && $task->getChecksum() != $checksum) {
					$changedData .= $task->toJSON() . ", ";
					$changedCount++;
				} elseif ($task === false) {
					$deleteData .= $id . ", ";
					$deleteCount++;
				}

				unset($task);
			}

			$changedData = substr($changedData, 0, strlen($changedData) - 2);
			$changedData .= "]";

			$deleteData = substr($deleteData, 0, strlen($deleteData) - 2);
			$deleteData .= "]";

			$returnArray = array("status" => "ok", "changes" => null, "deleted" => null, "message" => null);

			if ($changedCount > 0) {
				$returnArray['changes'] = $changedData;
			}

			if ($deleteCount > 0) {
				$returnArray['deleted'] = $deleteData;
			}

			echo json_encode($returnArray);
		} else {
			echo json_encode(array("status" => "error", "message" => "Es wurde kein Array übergeben, sondern ein " . gettype($_REQUEST['checkdata'])));
		}
	}
?>