<?php
//SET THE LICENSE INFO
$license_owner = 'TUNER B NEXT LTD - 1 WebApp Lic - 1 WebServer Lic';
$license_key = '33D3BD72B689BEA21EFC0D8786E8709023AEB4FD';

//DO NOT MODIFY THE FOLLOWING CODE
$timestamp = $_GET['timestamp'];;
$license_hash = hash('sha256', $license_key . $timestamp, false);
$resp = $license_owner . '|' . $license_hash;

ob_start();
ob_clean();
header('Content-type: text/plain');
echo $resp;
ob_end_flush();
exit();
?>