<noscript><div class="sitemessage">This site requires JavaScript to be enabled in your browser settings to work properly.</div></noscript>
	<div id="container">
<!--		<div id="header">-->
<!--            <div id="login">-->
<?php
//if(defined('MOBILE_BROWSER') && MOBILE_BROWSER) {
//    echo 'Mobile site is incomplete.<br/><a href="?desktop=true">Desktop site (for tablets)</a>';
//}
//?>
<!--</div>-->
<!--<div id="nav">-->
<!--				<ul>-->
<!--                    <li id="logo"><a href="/">Online Sequencer</a></li>-->
<?php
//if(!function_exists('showNavLink'))
//{
//    function showNavLink($url, $name, $extra="")
//    {
//        $class = stristr($_SERVER["REQUEST_URI"], $url) ? ' class="active"' : '';
//        echo '<li'.$class.'><a href="'.$url.'"'.$extra.'>'.$name.'</a></li>';
//    }
//}
//showNavLink('/sequences', 'All Sequences');
//showNavLink('/import', 'Import MIDI');
//showNavLink('/app/sequencer.php?frame=1&id='.(isset($id)?$id:'0'), 'Full Screen View');
//showNavLink('javascript:;', 'Chat', ' onclick="showChat();"');
//showNavLink('/forum/', 'Forum');
//showNavLink('/experiments', 'Experiments');
//?>
<!--</ul>-->
<!--<div id="bar">-->
<!--    <div style="float:right; padding-right: 10px;">-->
<!--        <div id="user_guest" style="display: --><?php //echo $settings['isLoggedIn'] ? 'none' : 'block'; ?><!--">-->
<!--            <div id="login_fields">-->
<!--                <input type="text" id="username" name="username" />-->
<!--                <input type="password" id="password" name="password" />-->
<!--            </div>-->
<!--            <a id="login_button" class="linkbutton" href="javascript:;">Login</a> -->
<!--            <a id="registerbutton" class="linkbutton" href="/forum/member.php?action=register" target="_blank">Register</a>-->
<!--            </span>-->
<!--        </div>-->
<!--        <div id="user_member" style="display: --><?php //echo $settings['isLoggedIn'] ? 'block' : 'none'; ?><!--">-->
<!--            Welcome back <span id="member_username"><a href="/members/--><?php //echo $settings['uid']; ?><!--">--><?php //echo $settings['username']; ?><!--</a></span>! <a id="member_logout" class="linkbutton" href="javascript:;">Log out</a>-->
<!--        </div>-->
<!---->
<!--        <div id="affiliate_link">Professional sequencing software: <a href="http://www.amazon.com/gp/product/B00CHZG1FE/ref=as_li_tf_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B00CHZG1FE&linkCode=as2&tag=onlinseque-20">FL Studio</a><img src="https://ir-na.amazon-adsystem.com/e/ir?t=onlinseque-20&l=as2&o=1&a=B00CHZG1FE" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" /></div>-->
<!--    </div>-->
<!--    <span id="nav_right">--><?php //if(isset($nav_right)) echo $nav_right; ?><!--</span>-->
<!--</div>-->
<!--			</div>-->
<!--		</div>-->
        
		<div id="main">
		<div id="page_bg"></div>
			<div id="page" <?php if(!function_exists('show_left')) echo ' style="width: 100%"'; ?>>
			<?php if(function_exists('show_left')) { ?>
			<div id="page_left">
			<?php show_left(); ?>
			</div>
			<?php } ?>
			<div id="page_right"<?php if(!function_exists('show_left')) echo ' style="width: 100%;"'; ?>>
