<?php
//if(!defined('IN_MYBB')) {
//    define('IN_MYBB', 1);
//    chdir($root.'/forum/');
//    require('./global.php');
//    chdir($root);
//}
$user = $mybb->user;
$settings['isLoggedIn'] = $user['uid'] != 0;
$settings['uid'] = (int) $user['uid'];
$settings['username'] = $user['username'];
$settings['logoutkey'] = $user['logoutkey'];
?>