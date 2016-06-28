<?php
header('Content-type: text/plain');
require('../inc/init.php');
require_once $root."/inc/init_forum.php";
require_once $root."/forum/inc/functions_user.php";
$user = $_GET["user"];
$password = $_GET["pass"];
if(username_exists($user))
{
	$user_array = validate_password_from_username($user, $password);
	if($user_array)
		echo json_encode(array('username' => $user_array['username'], 'uid' => $user_array['uid'], 'logoutkey' => $user_array['logoutkey']));
	else
		echo 'false';
}
else
	echo 'false';
?>