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