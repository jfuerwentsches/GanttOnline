<?php
define('DISPLAY_RESOURCES', 1);
define('DISPLAY_PROJECTS', 2);

/* Art der Datenhaltung (XML, MySQL)
 */
$conf['resources']['storage_type'] = "XML";

/* Verzeichnis in dem die XML Daten gespeichert werden (absoluter Pfad).
 */
$conf['resources']['xml_data_directory'] = $_SERVER['DOCUMENT_ROOT'] . "/server/data/";

/* Include Skript, dass die Datenbankverbindung herstellt (absoluter Pfad).
 */
$conf['resources']['db_init_script'] = $_SERVER["DOCUMENT_ROOT"].'/common/scripts/_prepend.inc.php';

/* Pfad zum Verzeichnis in dem die Klassen liegen.
 */
$conf['resources']['classpath'] = $_SERVER["DOCUMENT_ROOT"].'/classes/';
?>