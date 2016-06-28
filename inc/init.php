<?php
define('IN_SITE', 1);
$GLOBALS['root'] = dirname(dirname(__FILE__));
$GLOBALS['local'] = $GLOBALS['root'] .'/local';
$GLOBALS['inc'] = $GLOBALS['root'] .'/inc';
$GLOBALS['templates_path'] = $GLOBALS['local'] .'/templates';
require($GLOBALS['local'] .'/settings.php');
define('TEST', !isset($_SERVER['SERVER_NAME']) || $_SERVER['SERVER_NAME'] != 'onlinesequencer.net' || isset($_COOKIE['adminpass']) && $_COOKIE['adminpass'] == $settings['adminpass']);
define('MOBILE_BROWSER', !isset($_GET['desktop']) && (strstr($_SERVER['HTTP_USER_AGENT'], 'iPhone') || strstr($_SERVER['HTTP_USER_AGENT'], 'Android')));
if(TEST)
    error_reporting(E_ALL);
else
    error_reporting(E_ALL ^ E_NOTICE ^ E_DEPRECATED);

chdir($GLOBALS['root']);
$link = mysqli_connect($settings['mysql_server'], $settings['mysql_user'], $settings['mysql_pass']);
mysqli_select_db($link, $settings['mysql_db']);

function mod($name) {
	global $inc, $root, $local, $templates_path, $settings, $userid;
	require_once($inc.'/functions.'.$name.'.php');
}

require($GLOBALS['inc']."/functions.core.php");
mod("input");
mod("error");
mod("database");
mod('vars');
mod("data");
mod("js");
mod('sequencer');
date_default_timezone_set('America/New_York');
start_buffer();
?>