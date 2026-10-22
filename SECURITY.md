# Security notice: PHP engine RCE (21 October 2026)

Advisory: https://www.php.net/archive/2026.php (21 October 2026)

- CVE-2026-109618 / GHSA-w8hw-w9fx-j79w
- CVE-2026-109619 / GHSA-6wmf-4rv5-p3rp

Unauthenticated remote code execution in the PHP engine / request lifecycle. It affects web SAPIs including PHP-FPM and mod_php. Exploitation can happen before any application code runs.

| PHP branch | Fixed version |
|------------|---------------|
| 8.2        | 8.2.35        |
| 8.3        | 8.3.36        |
| 8.4        | 8.4.27        |
| 8.5        | 8.5.12        |

## Status of this repository

This repository has no managed runtime image. This document is **not** a deployed fix and does not patch any PHP runtime. No current deployment of this application has been verified.

## Operator actions

- If you run this application, update the web PHP runtime (mod_php / PHP-FPM) to a fixed version on a supported branch, or have your hosting provider do so, and restart/reload the web server or workers where required.
- Repository changes and CLI `php -v` do not prove a patched web SAPI.
- Vendor-backported builds may keep an older version number; ask the vendor for evidence instead of comparing version numbers blindly.
- Do not create public `phpinfo()` files to check the version.

## Compatibility limitation

The code contains legacy `mysql_*` calls. PHP 8 compatibility has **not** been verified, and no framework or database migration was done as part of this urgent engine-CVE notice. Test and plan any migration separately before moving to a fixed PHP 8.x branch.
