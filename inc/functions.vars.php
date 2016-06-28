<?php
define('V_NUM_SEQUENCES', 0);
function get_var($id) {
    $result = db_query('SELECT value FROM vars WHERE id='.$id);
    return db_result($result, 0);
}
function set_var($id, $value) {
    db_query('UPDATE vars SET value='.$value.' WHERE id='.$id);
}
?>