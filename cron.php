<?php
require('inc/init.php');

$count = db_result(db_query('SELECT COUNT(id) FROM sequences WHERE deleted=0'), 0);
set_var(V_NUM_SEQUENCES, $count);
?>