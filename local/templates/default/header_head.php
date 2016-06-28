<?php
global $settings, $cname;
if(isset($cname)) {
    echo '<link rel="canonical" href="'.$settings['domain'].'/'.$cname.'" />'."\n";
    echo '<meta property="og:url" content="'.$settings['domain'].'/'.$cname.'" />'."\n";
    echo '<meta property="og:image" content="'.$settings['domain'].'/preview.php?v=2&id='.$cname.'" />'."\n";
} else {
    echo '<meta property="og:image" content="'.$settings['domain'].'/resources/logo.png" />';
}
?>
<meta charset="utf-8"> 
<meta name="description" content="OnlineSequencer.net is an online music sequencer. Make tunes in your browser and share them with friends!" />
<?php
if(MOBILE_BROWSER)
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
?>
<meta property="og:title" content="<?php echo $title; ?>" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Online Sequencer" />
<meta property="og:description" content="OnlineSequencer.net is an online music sequencer. Make tunes in your browser and share them with friends!" />
<meta property="fb:app_id" content="1512952002290893" />
<style id="css_vars">
.note {

}
.key, .key_sharp, .key div, .key_sharp div {

}
.sequencer_key {
    background-image:url(/app/sequencer1.gif);
}

</style>
<?php
global $headhtml;
if(isset($headhtml))
	echo $headhtml;
?>
<link href='//fonts.googleapis.com/css?family=PT+Sans:400,700' rel='stylesheet' type='text/css'>
<?php
$css = array('resources/tooltipster',
'resources/fonts',
'resources/style',
'app/sequencer');
if(MOBILE_BROWSER) {
    $css[] = 'resources/style.mobile';
}
show_css($css); 
?>
<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css">
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
<?php
show_js(array('resources/jquery.tooltipster.min',
'resources/ZeroClipboard.min',
'resources/main',
'/forum/jscripts/ajaxchat_index',
'app/wavesurfer.min',
'app/audioSystem',
'app/lib',
'app/synth',
'app/sequencer'));
?>
<script type="text/javascript">
settings['uid'] = <?php echo json_encode($settings['uid']); ?>;
settings['username'] = <?php echo json_encode($settings['username']); ?>;
settings['logoutkey'] = <?php echo json_encode($settings['logoutkey']); ?>;
</script>
