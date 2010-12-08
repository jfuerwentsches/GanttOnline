<!doctype html>
<html>
  <head>
    <title>GanttOnline Demo Seite</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

    <link rel="stylesheet" type="text/css" href="/client/css/gantt.css">

    <script src="http://www.google.com/jsapi"></script>
	<script>
		/* Load jQuery from google */
		google.load("jquery", "1.4.4");
        google.load("jqueryui", "1.8.6");
	</script>

    <script type="text/javascript" src="client/js/_lib/raphael-min.js"></script>

    <script type="text/javascript" src="client/js/_lib/jquery.ui.datepicker-de.js"></script>
    <script type="text/javascript" src="client/js/_lib/farbtastic.js"></script>

    <script type="text/javascript" src="client/js/GanttChart.js"></script>
    <script type="text/javascript" src="client/js/GanttController.js"></script>
    <script type="text/javascript" src="client/js/Task.js"></script>
    <script type="text/javascript" src="client/js/Util.js"></script>

  </head>
  <?php
    // Initiale Kalenderwoche, aktuelle KW - 1
    if (!$_REQUEST['kw'] || ($_REQUEST['kw'] < 1 || $_REQUEST['kw'] > 52)) {
        $startDate = (date("w") == 1) ? strtotime("last Monday") : strtotime("last Monday");
    } else {
        $diff = (($_REQUEST['kw'] - date("W")) * 7) - date("w") + 1;
        $startDate = mktime(0, 0, 0, date("m"), date("d") + $diff, date("Y"));
    }
  ?>
  <body>
    <script type="text/javascript">
        $(document).ready(function() {

            var height = $(window).height();

            $("#ganttChart").css('height', height + 'px');
            $("#loading").css('margin-top', (height / 2 - 60) + 'px');

            var filename = "<?php echo $_REQUEST['filename']; ?>";
            var start = <?php echo $startDate; ?>;

            // Daten vom Server laden
            var jsonString;
            $.ajax({url: "ajax_gantt_controller.php",
                    async: false,
                    data: "filename=" + filename + "&start=" + start,
                    dataTypeString: "json",
                    context: this,
                    success: function(data) { jsonString = data; }});

            // Neues Gantt Diagramm erzeugen und initialisieren
            // start ist in Sekunden angegeben, Javascript Date Objekte arbeiten in Millisekunden, daher Mulitplikation mit 1000
            var gantt = new GanttChart("ganttChart", new Date(start * 1000), 2, $(window).width() - 50, height, jsonString);

            // Funktion des Hinzufügen Buttons setzen
            var fct = function(resourceId) {
                dialog_add_open(resourceId);
            }

            gantt.setBttnAddFunction(fct);
            gantt.setEditTaskFunction(dialog_add_fillForm);

            // Benutzerdefinierte Buttons hinzufügen
            gantt.setCustomButtons([
    			{ "id" : "help", "settings" : [ "help.png", "Hilfe lesen", function() { $('#dialogHelp').dialog('open')} ] }
            ]);
        });
    </script>

    <!-- Container fuer das Gantt-Diagramm -->
    <div id="ganttChart" style="background-color: #F0F0F0; text-align: center;">
        <span id="loading">Daten werden geladen...</span>
    </div>

  </body>
</html>