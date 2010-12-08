<?php
	function calculateEndDate($date, $duration) {
	
		$duration = ceil($duration);
		$endDate = strtotime("+" . ($duration - 1) . "days", $date);	
		
		$startDay = date("w", $date);
		
		if ($duration <= 5) {
			if ($duration + $startDay - 1 > 5) {
				$endDate = strtotime("+2 days", $endDate);
			}
		} else {
			$numberOfWeekends = ($duration - ($duration % 5) / 5) - 1;
			
			if ($duration % 5 == 0 && $startDay != 1) {
				$numberOfWeekends++;
			} else if ($duration % 5 != 0) {
				if (($duration % 5) + $startDay - 1 != 6) {
					$numberOfWeekends++;
				}
			}
			
			$endDate = strtotime("+" . (2 * $numberOfWeekends) . " days", $endDate);
			
			if (date("w", $endDate) == 6 || date("w", $endDate) == 0) {
				$endDate = strtotime("+2 days", $endDate);
			}
		}
		
		return $endDate;
	}
?>