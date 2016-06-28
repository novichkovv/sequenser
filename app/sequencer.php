<?php
function show_sequencer($id, $autoplay, $import=false) {
if($import) {
    require_once 'import.php';
    $play = false;
}
else if($id != 0) {
	$row = mysqli_fetch_array(db_query('SELECT * FROM sequences WHERE id="'.$id.'"'));
	db_query('UPDATE sequences SET accesscount=accesscount+1 WHERE id="'.$id.'"');
	$data = explode(':', str_replace(array('<', '>', '"', "'"), '', $row['data']));
	$bpm = $data[0];
    $title = htmlspecialchars($row['title']);
    $basedon = $id;
	$notes = $data[1];
	$play = true;
}
else
{
	$bpm = 110;
    $title = 'Untitled';
    $basedon = 0;
	$notes = "";
	$play = false;
}
$enableSynth = isset($_GET['synth']);
$isIE = stristr($_SERVER['HTTP_USER_AGENT'], 'MSIE') || stristr($_SERVER['HTTP_USER_AGENT'], 'Trident');
$isEdge = stristr($_SERVER['HTTP_USER_AGENT'], 'Edge');
$isChrome = stristr($_SERVER['HTTP_USER_AGENT'], 'Chrome');
$isSafari = stristr($_SERVER['HTTP_USER_AGENT'], 'Safari') && !$isChrome;
$format = ($isIE || $isEdge || $isSafari) ? 'mp3' : 'ogg';
?>
<script type="text/javascript">
window.audioFormat = '<?php echo $format; ?>';
window.enableSynth = <?php echo $enableSynth ? 'true' : 'false'; ?>;
loading = true;
window.onload = function()
{
	create();
    $('#loading_overlay').css('display', 'none');
	var data = "<?php echo $notes; ?>";
	<?php
		if($notes == '')
			echo 'loadInstrument(0);';
	?>
	song = new Song(data);
    song.basedon = <?php echo $basedon; ?>;
	song.setBPM(<?php echo $bpm; ?>);
    <?php if(isset($autoplay) && $autoplay == true) { ?>
    autoplay = true;
    onLoop = function() {
        window.parent.location.reload();
        return false;
    };
	<?php } else if($play){ ?>
	var playbutton = document.getElementById('playbutton');
	playbutton.style.display="block";
	playbutton.onclick = function()
	{
        playbutton.style.display = "none";
        if(!loading) {
            song.play(0);
        }
        else {
            autoplay = true;
        }
		return false;
	}
	<?php } ?>
	container.scrollTop = container.scrollHeight/2-200;
};
</script>
<div id="preload" style="display:none">
    <img src="/app/sequencer1.gif" />
    <img src="/app/row_highlight.png" />
</div>
<div id="sequencer">
<div id="loading_container">
    Loading sounds...
    <div id="loading_bar">
        <div id="loading"></div>
    </div>
</div>
<div id="keyboard_wrapper_element">
    <div id="keyboard_element"></div>
</div>
<div id="playbutton"></div>
<div id="loading_overlay"></div>
<div id="captcha_container">
    <div id="captcha_box">
        <a href="javascript:;" onclick="hideCaptcha()">Close</a>
        <iframe id="captcha_frame" src="about:blank"></iframe>
    </div>
</div>
<div id="toolbar_element">
    <div id="play_small" class="play" title="Play"></div> 
    <div class="box_label">
        BPM <div class="box_input">
            <input type="text" id="bpm" size="3" maxlength="3" value="<?php echo $bpm;?>" onchange="song.setBPM(document.getElementById('bpm').value);"/>
            </div>
    </div>  
    <div class="box_label" style="margin-right: 8px" >
        Title <div class="box_input">
            <input type="text" id="title" size="32" maxlength="128" value="<?php echo $title;?>"/>
            </div>
    </div>
    <div class="btn" id="mode_draw" onclick="setMode('draw')" title="Draw"></div>
    <div class="btn" id="mode_edit" onclick="setMode('edit')" title="Select"></div>
    <div class="btn" id="mode_erase" onclick="setMode('erase')" title="Erase"></div>
    <div class="btn" id="mode_play" onclick="setMode('play')" title="Play from here"></div>
    <div class="spacer"></div>
    <div class="box_label" style="position:relative">Instrument
        <div class="box_input">
            <select id="instrument_select"></select>
        </div>
        <div class="btn" id="btn_instrument_options" onclick="showHideInstrumentOptions()" title="Show options"></div>
        <div class="btn" id="btn_select_this" onclick="for(var i = 0; i < song.notes.length; i++) {if(song.notes[i].instrument==instrument){select(song.notes[i])}}" title="Highlight this one"></div>
        <div id="instrument_options" style="display: none">
            <div id="instrument_options_1" class="column">
            
            </div>
            <div id="instrument_options_2" class="column">

            </div>
        </div>
    </div>
    <div class="spacer"></div>
    <div class="btn" id="btn_cut" onclick="cut()" title="Cut"></div>
    <div class="btn" id="btn_copy" onclick="copy(true)" data-clipboard-text="" title="Copy"></div>
    <div class="btn" id="btn_paste" onclick="paste()" title="Paste"></div>
    <div class="btn" id="btn_selectall" onclick="selectAll()" title="Select all"></div>
    <div class="spacer"></div>
    <div class="btn" id="btn_zoomOut" onclick="zoomOut()" title="Zoom out"></div>
    <div class="btn" id="btn_zoomIn" onclick="zoomIn()" title="Zoom in"></div>
    <a class="toolbar_button" id="savelink" href="javascript:;" onclick="save()">Save/Share/Export</a>
    <div id="share" style="display: none"><div class="btn" id="btn_close" onclick="$('#share').hide();"> </div>Link to this sequence: <span id="sharelink"><?php if($id) echo $id; ?></span></div>
    <div class="btn" id="btn_8bit" onclick="window.enableSynth = !window.enableSynth" title="8 Bit Remix (Experimental)"></div>
</div>
<div id="message_wrapper">
    <span id="message_text"></span>
</div>
    <div id="sequencer_main" tabindex="0">
    <div id="sequencer_inner">
        <div id="sequencer_background">
            <div id="sequencer_keyboard">
            </div>
        </div>
        <div id="selection_rect"></div>
        <div id="wavesurfer_element" style="display:none"></div>
    </div>
</div>
<div id="bottom_left">
<div id="keyboard_icon">

</div>
<div id="keyboard_options">
    Use a typing keyboard to play along!
</div>
</div>
</div>
<div id="bottom">
<div id="volume">
    <div id="volume_slider"></div>
    Volume
</div>
<div id="links">
<!--<strong>OnlineSequencer.net</strong> is an online music sequencer. Make tunes in your browser and share them with friends!<br/>-->
<!--Shortcuts: Left click to place and move notes, right click to erase, middle click or space to play from a specific time, delete to erase selected notes<br/>-->
<!--Made by <a href="http://buildism.net" target="_blank">Jacob Morgan</a> and <a href="http://en.wikipedia.org/wiki/George_P._Burdell" target="_blank">George Burdell</a> &middot;-->
<?php //$count = get_var(V_NUM_SEQUENCES);
//echo 'Hosting '.number_format($count).' sequences since 2013';
//?>
<!--</div>-->
<div id="menus">
<div class="item">
    Grid: <select id="grid_select">
        <option value="0.5">1/2</option>
        <option value="1" selected="selected">1/4</option>
        <option value="2">1/8</option>
        <option value="4">1/16</option>
    </select>
</div>
<div class="item">
    Key (<a href="javascript:;" onclick="updateScale(song.notes);">Auto Detect</a>): <select id="key_select"></select>
</div>
<div class="item">
    Auto Scroll: <select id="scroll_select">
        <option value="0">Smooth</option>
        <option value="1" selected="selected">Fast</option>
        <option value="2">Off</option>
    </select>
</div>
<div class="item">
    <div id="audio_track_link" title="You can play an audio file along with your sequence. It won't be saved, but can help you transcribe a song.">
        <a class="toolbar_button" style="float: left" href="javascript:;" onclick="showAudioTrackSelect()">Add Audio Track</a>
    </div>
    <div id="audio_track_loading" style="display:none">Loading audio file...</div>
    <div id="audio_track" style="display:none">
        <input id="audio_track_file" type="file" accept="audio/*" class="button">
        <div id="audio_track_remove">
            <a class="toolbar_button" href="javascript:;" onclick="$('#wavesurfer_element').toggle();">Show/hide waveform</a>
            <a class="toolbar_button" href="javascript:;" onclick="removeAudioTrack()">Remove</a>
        </div>
    </div>
</div>
</div>
</div>
<?php }
if(isset($_GET['frame'])) {
    require('../inc/init.php');
    ?><html>
    <head>
    <style id="css_vars">
    .note {

    }
    .key, .key_sharp, .key div, .key_sharp div, .sequencer_key {

    }
    .sequencer_key {
        background-image:url(/app/sequencer1.gif);
    }

    </style>
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
    <?php show_js(array('resources/jquery.tooltipster.min',
'resources/ZeroClipboard.min',
'resources/main',
'app/wavesurfer.min',
'app/audioSystem',
'app/lib',
'app/synth',
'app/sequencer'));
        show_css(array('app/sequencer'));
        echo '
        <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css">
        </head><body style="margin:0">';
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        show_sequencer($id, false, isset($_GET['import']) ? $_GET['import'] : '');
    ?>
    </body>
    </html>
<?php
}
?>