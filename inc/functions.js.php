<?php
	function show_js($files, $showSettings=true) {
        echo '<script type="text/javascript" src="/resources/1.js"></script>'."\n";
        return;
		global $root;
        $hash = '';
        if($showSettings)
            $hash .= filemtime($root.'/local/settings.php');
        foreach($files as $file) {
            $path = $root.'/'.$file.'.js';
            if(file_exists($path))
                $hash .= $file.filemtime($path);
        }
        $md5 = md5($hash);
        $cpath = $root.'/resources/c/'.$md5.'.js';
        if(!file_exists($cpath)) {
            require_once('JSMin.php');
            $text = '';
            if($showSettings)
                $text .= settings_js();
            foreach($files as $file) {
                $path = $root.'/'.$file.'.js';
                if(file_exists($path))
                    $text .= file_get_contents($path)."\n\n";
            }
            if(TEST)
                $js = $text;
            else
                $js = JSMin::minify($text);
            file_put_contents($cpath, $js);
        }
		echo '<script type="text/javascript" src="/resources/c/'.$md5.'.js"></script>'."\n";
	}
    function show_css($files) {
        echo '<link rel="stylesheet" href="/resources/1.css" />'."\n";
        return;
		global $root;
        $hash = '';
        foreach($files as $file) {
            $path = $root.'/'.$file.'.css';
            $hash .= $file.filemtime($path);
        }
        $md5 = md5($hash);
        $cpath = $root.'/resources/c/'.$md5.'.css';
        if(!file_exists($cpath)) {
            require_once('CSSMin.php');
            $text = '';
            foreach($files as $file) {
                $path = $root.'/'.$file.'.css';
                $text .= file_get_contents($path)."\n\n";
            }
            if(TEST)
                $css = $text;
            else
                $css = CSSMin::minify($text);
            file_put_contents($cpath, $css);
        }
		echo '<link rel="stylesheet" href="/resources/c/'.$md5.'.css" />'."\n";
	}
?>
