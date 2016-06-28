var $ = jQuery;
var instanceId = Math.random()*1048576|0;
var isMobile = navigator.userAgent.indexOf('Android') > -1  || navigator.userAgent.indexOf('iPhone') > -1;
var RULE_NOTE = 0;
var RULE_KEY = 1;
var RULE_SEQUENCER_KEY = 2;
var RULE_INSTRUMENT = 3;
var focused = true;
var mainStylesheet;
var zoomLevel = 1;
var grid = 1;
var autoScroll = 1;
var instrument = 0;
var instrumentLock = [];
var keyElements = [];
var keyRowElements = [];
var keyTextElements = [];

var scale = [];
var zeroClipboard;
var clipboard = [];
var clipboardTime;
var clickedButton = false;
var mouseButton = 0;
var mode = "draw"
var maxCells;
var bpm;
var lastStepTime;
var selectOpen = false;

var selectedNotes = [];
var dragNotes = [];
var clickedNote = false;
var sequencer;
var mouseX, mouseY;
var mouseClickX, mouseClickY;
var playhead;
var playTime = 0;
var playTimeoutId = 0;
var lastPlayTime = 0;
var autoplay = false;
var onLoop = null;
var scrollLeft = 0;
var targetScrollLeft = 0;
var wavesurferObj;
var wavesurferScale = 2;

function createKey(t, addHighlight) {
    var div = document.createElement('div');
    var div_t = document.createElement('div');
    div_t.innerHTML = t;
    div_t.className = 'key_text';
    if(addHighlight) {
        var div_h = document.createElement('div');
        div_h.id = 'key_highlight_'+t;
        div.appendChild(div_h);
    }
    div.appendChild(div_t);
    keyTextElements.push(div_t);
    div.className = addHighlight ? (t.length == 3 ? "key_sharp" : "key") : "sequencer_key";
    if(addHighlight) {
        div.onmousedown = function() {
            var btn = getButton(event);
            mouseButton = btn;
            playNote(instrument, t, 1);
        };
        div.onmouseover = function() {
            if(mouseButton == 1 && dragNotes.length == 0) {
                playNote(instrument, t, 1);
            }
        };
    }
    return div;
}
function displayKeys() {
    for(var i = 0; i < piano.length; i++) {
        var leftElement = createKey(piano[i], true);
        keyboard.appendChild(leftElement);
        keyElements.push(leftElement);
    }
    for(var i = 0; i < keyElements.length; i++) {
        var rowElement = createKey(piano[i], false);
        keyboard_table.appendChild(rowElement);
        keyRowElements.push(rowElement);
    }
}
function updateKeys() {
    for(var i = 0; i < keyTextElements.length; i++) {
        if(settings['numNotes'] - i - 1 >= settings['min'][instrument] && settings['numNotes'] - i - 1 <= settings['max'][instrument]) {
            if(instrument == 2)
                keyTextElements[i].innerHTML = settings['percussion'][i-8];
            else
                keyTextElements[i].innerHTML = piano[i];
            if(scale.indexOf(settings['pianoNotes'][(keyTextElements.length-i-1)%12]) > -1)
                keyRowElements[i].className = "sequencer_key highlight";
            else
                keyRowElements[i].className = "sequencer_key";
        }
        else
            keyTextElements[i].innerHTML = "";
    }
}

function playNote(instrument, name, length, delay) {
    if(window.enableSynth && instrument != 2) {
        playSynthNote(audioSystem.audioContext, name, length * song.sleepTime, 2, delay);
        return;
    }
    idx = pianoToIndex[name];
    if(settings['numNotes'] - idx - 1>= settings['min'][instrument] && settings['numNotes'] - idx - 1<= settings['max'][instrument])
        audioSystem.play(instrument, (settings['numNotes']-(idx+settings['offset'][instrument])-1), delay);
    document.getElementById('key_highlight_'+name).className='instrument'+instrument;
    window.setTimeout(function(){
        document.getElementById('key_highlight_'+name).className='';
    }, length * song.sleepTime);
}

Song.prototype.update = function(note)
{
    var noteIndex = pianoToIndex[note.type];
    var x = noteWidth * note.time;
    var y = noteHeight * noteIndex;
    var width = noteWidth * note.length;
    note.element.style.width = (width-4)+"px";
    note.element.style.top=y+"px";
    note.element.style.left=x+"px";
}

Song.prototype.setBPM = function(v)
{
    if(!isNumber(v))
        v = 110;
    v = Math.max(v, 10);
    bpm = v;
    if(bpm > 200) {
        scrollSelect.selectedIndex = autoScroll = 1;
    }
    var nps = (v*4)/60;
    this.sleepTime = (1/nps)*1000;
    this.worker.postMessage(this.sleepTime);
    updateWavesurferWidth(true);
}
Song.prototype.play = function(start) {
    this.playing = true;
    playTime = start;
    if(isMobile) {
        if(playTimeoutId)
            window.clearTimeout(playTimeoutId);
        this.playColumn(start, true, false);
    }
    else
        song.worker.postMessage('start');
    button.style.backgroundImage="url(/app/stop.gif)";
    this.playPos = start;
    playhead.style.display = "block";
    lastStepTime = new Date().getTime();
    lastPlayTime = start;
}
Song.prototype.stop = function() {
    this.playing = false;
    if(isMobile)
        window.clearTimeout(playTimeoutId);
    else
        this.worker.postMessage('stop');
    button.style.backgroundImage="url(/app/play.gif)";
    playhead.style.display = "none";
    audioSystem.stopAudioTrack();
}
var scrollIntervalId = 0;
function setScrollDelta(x) {
    setScrollLeft(scrollLeft + x);
}
function setScrollLeft(x) {
    if(autoScroll == 0) {
        targetScrollLeft = Math.min(Math.max(x, 0), container.scrollWidth - container.clientWidth);
        if(scrollIntervalId != 0)
            window.clearInterval(scrollIntervalId);
        scrollIntervalId = window.setInterval(function() {
            var d = targetScrollLeft - scrollLeft;
            if(Math.abs(d) < 2) {
                scrollLeft = container.scrollLeft = targetScrollLeft;
                window.clearInterval(scrollIntervalId);
            }
            else {
                scrollLeft += d/2;
                container.scrollLeft = Math.round(scrollLeft);
            }
        }, 66);
    } else if(autoScroll == 1) {
        scrollLeft = container.scrollLeft = Math.round(x);
    }
}
Song.prototype.playColumn = function(idx, first, single) {
    playhead.style.left = idx*noteWidth+"px";
    if(idx*noteWidth > scrollLeft + 7*clientWidth/8) {
        setScrollDelta(3*clientWidth/4);
    }
    if(idx == maxCells || idx >= song.loopTime) {
        if(onLoop == null) {
            idx = 0;
            if(idx*noteWidth < scrollLeft) {
                setScrollLeft(0);
            }
            audioSystem.playAudioTrack(0);
        }
        else {
            onLoop();
            song.stop();
        }
    }
    if(first || idx%16 == 0) {
        audioSystem.playAudioTrack(song.sleepTime * idx/1000);
    }
    if(this.noteColumns[idx] != undefined)
        this.playNotes(this.noteColumns[idx]);
    var elapsed = new Date().getTime() - lastStepTime;
    var diff = Math.min(song.sleepTime/2, Math.max(0, elapsed - song.sleepTime));
    if(!single) {
        playTimeoutId = window.setTimeout(function() {
            if(song.playing)
                song.playColumn(idx+1, false, false);
        }, this.sleepTime - diff);
    }
    lastStepTime = new Date().getTime();
    return idx + 1;
}

Song.prototype.playNotes = function(list) {
    for(var i in list) {
        var note = list[i];
        playNote(note.instrument, note.type, note.length, song.sleepTime*note.fracTime/1000);
    }
}

Song.prototype.playNextColumn = function(isWorker) {
    if(song.playing) {
        playTime = song.playColumn(playTime, false, true);
    }
}

function loadInstrument(id) {
    loading = true;
    if(!loadedInstruments[id])
        document.getElementById("loading_container").style.display="block";    
    loadedInstruments[id] = true;
    
    if(enableSynth && id != 2) {
        for(var i = settings['min'][id]; i <= settings['max'][id]; i++) {
            document.onLoadSound();
        }
    } else {
        audioSystem.loadInstrument(id);
    }
}

function setNoteSize() {
    mainStylesheet.cssRules[RULE_NOTE].style.height = (noteHeight-4)+"px";
    mainStylesheet.cssRules[RULE_NOTE].style.lineHeight = (noteHeight-4)+"px";
    mainStylesheet.cssRules[RULE_NOTE].style.fontSize = (noteHeight*0.625)+"px";
    mainStylesheet.cssRules[RULE_KEY].style.height = noteHeight+"px";
    mainStylesheet.cssRules[RULE_KEY].style.lineHeight = noteHeight+"px";
    mainStylesheet.cssRules[RULE_KEY].style.fontSize = (noteHeight*0.625)+"px";
    sequencer.style.height = (piano.length*noteHeight+2)+"px"
}
function zoom(v) {
    oldZoom = zoomLevel
    zoomLevel = v;
    document.getElementById('sequencer_background').style.zoom = v;
    noteWidth = 25 * v;
    noteHeight = 16 * v;
    setNoteSize();
    for(var note in song.notes) {
        song.update(song.notes[note]);
    }
    container.scrollTop = scrollTop = scrollTop*(zoomLevel/oldZoom);
    zoomLevel = v;
    updateWavesurferWidth(true);
}
function zoomIn() {
    zoom(zoomLevel*1.25);
}
function zoomOut() {
    zoom(zoomLevel/1.25);
}
function create() {
    mainStylesheet = document.getElementById('css_vars').sheet;
    
    scrollLeft = 0;
    scrollTop = 0;
    loadedInstruments = [];
    for(var i = 0; i < settings['instruments'].length; i++) {
        loadedInstruments.push(false);
    }
    container = document.getElementById("sequencer_main");
    clientWidth = container.clientWidth;
    sequencer = document.getElementById("sequencer_inner");
    sequencerRect = sequencer.getBoundingClientRect();
    wavesurfer = document.getElementById("wavesurfer_element");
    keyboard = document.getElementById("keyboard_element");
    keyboard_wrapper = document.getElementById("keyboard_wrapper_element");
    keyboard_table = document.getElementById("sequencer_keyboard");
    instrumentSelect = document.getElementById('instrument_select');
    keySelect = document.getElementById('key_select');
    gridSelect = document.getElementById('grid_select');
    scrollSelect = document.getElementById('scroll_select');
    audioTrackLink = document.getElementById('audio_track_link');
    audioTrackLoading = document.getElementById('audio_track_loading');
    audioTrackSelect = document.getElementById('audio_track');
    audioTrackFile = document.getElementById('audio_track_file');
    audioTrackRemove = document.getElementById('audio_track_remove');
    selectionRect = document.getElementById('selection_rect');
    copyButton = document.getElementById('btn_copy');
    
    window.onresize = function(){
        clientWidth = container.clientWidth;
    };
    
    setNoteSize();
    displayKeys();
    
    document.onLoadSound = function() {
        document.getElementById("loading").style.width=Math.round(audioSystem.getProgress()*100)+"%";
        if(audioSystem.getProgress() >= 1) {
            document.getElementById("loading_container").style.display="none";
            loading = false;
            if(autoplay && !song.playing) {
                song.play(0);
                autoplay = false;
            }
        }
    }
    audioSystem.init({force:"audioTag", audioTagTimeToLive:1000});
    if(window.enableSynth)
        initSynth(audioSystem.audioContext);
    if(audioSystem.unsupportedBrowser)
        message("Audio is not supported in your browser.");
   
    var option = document.createElement("option"); //Electric Piano
    option.value=0;
    option.innerHTML = settings['instruments'][0];
    instrumentSelect.appendChild(option);
    var option = document.createElement("option"); //Grand Piano
    option.value=8;
    option.innerHTML = settings['instruments'][8];
    instrumentSelect.appendChild(option);
    for(var i=1; i < 8; i++) {
        var option = document.createElement("option"); //Everything else
        option.value=i;
        option.innerHTML = settings['instruments'][i];
        instrumentSelect.appendChild(option);
    }
    for(var i=9; i < settings['instruments'].length; i++) {
        var option = document.createElement("option");
        option.value=i;
        option.innerHTML = settings['instruments'][i];
        instrumentSelect.appendChild(option);
    }
    var instrumentOptions1 = document.getElementById('instrument_options_1');
    var instrumentOptions2 = document.getElementById('instrument_options_2');
    var numLeftColumn = Math.ceil(instrumentSelect.children.length/2);
    for(var i = 0; i < instrumentSelect.children.length; i++) {
        var name = instrumentSelect.children[i].innerHTML;
        var id = instrumentSelect.children[i].value;
        var html = '<div class="instrument_option">';
        html += '<div id="instrument_lock_'+id+'" class="instrument_lock btn" onclick="lockInstrument('+id+')" title="Lock this instrument"></div>';
        html += '<span id="instrument_name_'+id+'" onclick="selectInstrument('+i+')">'+name+'</span></div>';
        if(i < numLeftColumn) {
            instrumentOptions1.innerHTML += html;
        } else {
            instrumentOptions2.innerHTML += html;
        }
    }
    for(var i = 0; i < settings['instruments'].length; i++) {
        instrumentLock[i] = false;
        mainStylesheet.insertRule('.instrument'+i+' {cursor: pointer; z-index: 96;}', mainStylesheet.cssRules.length);
    }
    instrumentSelect.onchange = function()
    {
        instrument = parseInt(instrumentSelect.value);
        if(!loadedInstruments[instrument])
            loadInstrument(instrument);
        updateKeys();
        for(var i = 0; i < selectedNotes.length; i++) {
            song.moveNote(selectedNotes[i], selectedNotes[i].instrument, instrument, selectedNotes[i].time, selectedNotes[i].time, selectedNotes[i].type, selectedNotes[i].type);
            select(selectedNotes[i]);
        }
        selectOpen = false;
    }
    function updateVolume() {
        audioSystem.setVolume($('#volume_slider').slider('value'));
    }
    $('#volume_slider').slider({
        max: 2,
        min: 0,
        slide: updateVolume,
        change: updateVolume,
        value: 1,
        step: 0.01
    });
    
    for(var i = 0; i < settings['scales'].length; i++) {
        var option = document.createElement("option");
        option.innerHTML = settings['scaleNames'][i];
        keySelect.appendChild(option);
    }
    keySelect.onchange = function() {
        scale = settings['scales'][keySelect.selectedIndex];
        updateKeys();
        selectOpen = false;
    }
    instrumentSelect.onmousedown = keySelect.onmousedown = function() {selectOpen = true};
    
    gridSelect.onchange = function() {
        grid = gridSelect.value;
        //mainStylesheet.cssRules[2].style.backgroundImage="url(/app/sequencer"+grid+".gif)";
    }
    
    scrollSelect.onchange = function() {
        autoScroll = scrollSelect.value;
    }
    
    audioTrackFile.addEventListener('change', function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            audioTrackSelect.style.display="none";
            audioTrackLoading.style.display="block";
            if(wavesurferObj == null) {
                wavesurferObj = Object.create(WaveSurfer);
                wavesurferObj.init({
                    audioContext: audioSystem.audioContext,
                    height: 32,
                    pixelRatio: 1,
                    interact: false,
                    container: wavesurfer,
                    waveColor: 'orange',
                    progressColor: 'orange',
                    normalize: true
                });
            }
            audioSystem.loadAudioTrack(e.target.result, function(buffer) {
                window.setTimeout(function() {
                    $('#wavesurfer_element').show();
                    wavesurferObj.loadDecodedBuffer(buffer);
                    updateWavesurferWidth(true);
                }, 0);
                audioTrackLoading.style.display="none";
                audioTrackLink.style.display="block";
            });
        };
        reader.readAsArrayBuffer(e.target.files[0]);
    }, false);
    container.onscroll = function() {
        keyboard.style.top = (-container.scrollTop+1)+"px";
        wavesurfer.style.top = container.scrollTop+"px";
        var dx = container.scrollLeft - scrollLeft;
        var dy = container.scrollTop - scrollTop;
        mouseClickX -= dx;
        mouseClickY -= dy;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        sequencerRect = sequencer.getBoundingClientRect();
        updateSelectionRectangle(mouseX, mouseY);
        updateDragNotes(mouseX, mouseY, mouseX-dx, mouseY-dy);
    };
    
    /*if(!isMobile) {
        $(window).blur(function() {
            focused = false;
            song.worker.postMessage('start');
        });
        
        $(window).focus(function() {
            focused = true;   
            song.worker.postMessage('stop');
        });
    }*/
    
    document.getElementById("sequencer_inner").style.width = length*100;
    
    document.onmouseup = onmouseup;
    sequencer.onmousedown = onmousedown;
    document.onmousemove = onmousemove;
    container.onkeypress = onkeypress;
    container.onkeydown = onkeydown;
    container.onmouseover = function() {
        if(!selectOpen)
            container.focus();
        document.oncontextmenu = function(){return false;};
    }
    container.onmouseout = function() {
        document.oncontextmenu = function(){return true;};
        updateSelection();
    }
    
    button = document.getElementById('play_small');
    button.onmousedown = function() {
        if(song.playing) {
            song.stop();
        }
        else {
            song.play(0);
        }
    };
    keyboardIcon = document.getElementById('keyboard_icon');
    keyboardOptions = document.getElementById('keyboard_options')
    keyboardIcon.onmouseover = function() {
        keyboardOptions.style.display = 'block'
    };
    keyboardIcon.onmouseout = function() {
        keyboardOptions.style.display = 'none'
    };
    playhead = document.createElement('div');
    playhead.className="playhead";
    sequencer.appendChild(playhead);
    setMode('draw');
    updateKeys();
    
    mainInit();
    
    ZeroClipboard.config({swfPath: '/resources/ZeroClipboard.swf'});
    zeroClipboard = new ZeroClipboard( document.getElementById("btn_copy") );
    zeroClipboard.on("ready", function(readyEvent){
      zeroClipboard.on("aftercopy", function(event){
          copy(true);
      });
    });
}

function lockInstrument(id) {
    instrumentLock[id] = !instrumentLock[id];
    if(instrumentLock[id]) {
        document.getElementById('instrument_name_'+id).className="instrument_name_locked";
        mainStylesheet.cssRules[RULE_INSTRUMENT+id].style.opacity='0.25';
        mainStylesheet.cssRules[RULE_INSTRUMENT+id].style.zIndex=95;
        mainStylesheet.cssRules[RULE_INSTRUMENT+id].style.cursor='default';
    } else {
        document.getElementById('instrument_name_'+id).className="instrument_name";        
        mainStylesheet.cssRules[RULE_INSTRUMENT+id].style.opacity='1';
        mainStylesheet.cssRules[RULE_INSTRUMENT+id].style.zIndex=96;
        mainStylesheet.cssRules[RULE_INSTRUMENT+id].style.cursor='pointer';
    }
}

function showHideInstrumentOptions() {
    if($('#instrument_options').is(':visible')) {
        $('#btn_instrument_options').css('backgroundImage', 'url(/app/arrow_down.png)');
    } else {
        $('#btn_instrument_options').css('backgroundImage', 'url(/app/arrow_up.png)');
    }
    $('#instrument_options').slideToggle();
}

function xPosition(x) {
    return x - sequencerRect.left;
}
function yPosition(y) {
    return y - sequencerRect.top;
}

function timeIndex(x) {
    return Math.floor(x/noteWidth/(1/grid))/grid;
}
function noteIndex(y) {
    return Math.floor(y/noteHeight);
}
function timeIndexRound(x) {
    return Math.round(x/noteWidth/(1/grid))/grid;
}
function noteIndexRound(y) {
    return Math.round(y/noteHeight);
}

function onNoteClick(event) {
    var element = document.elementFromPoint(event.clientX, event.clientY);
    if(element != undefined && element.noteData != undefined && !instrumentLock[element.noteData.instrument]) {
        var note = element.noteData;
        if(note.selected == false) {
            clearSelection();
            select(note);
        }
        dragSelection();

        playNote(note.instrument, note.type, note.length);
        window.top.confirmExit = true;
        return clickedNote = true;
    }
    else {
        clearSelection();
        return clickedNote = false;
    }
}
function mouseDownDraw(event) {
    if(!onNoteClick(event)) {
        x = xPosition(event.clientX);
        y = yPosition(event.clientY);
        if(x > 0 && y > 0 && !instrumentLock[instrument]) {
            type = piano[noteIndex(y)];
            playNote(instrument, type, 1);
            time = timeIndex(x);
            var note = new Note(song, type, time, 1/grid, instrument);
            if(time <= maxCells && type != undefined) {
                if(!loadedInstruments[instrument])
                        loadInstrument(instrument);
                song.addNote(note);
                dragNotes = [];
                dragNotes.push(note);
            }
            window.top.confirmExit = true;
        }
    }
}
function mouseDownEdit(event) {
    onNoteClick(event);
}
function mouseDownPlay(event) {
    x = xPosition(event.clientX);
    time = Math.floor(timeIndex(x));
    if(!song.playing)
        song.play(time);
    else
        song.stop();
}
function mouseDownErase(event) {
    var element = document.elementFromPoint(event.clientX, event.clientY);
    if(element.noteData != undefined && !instrumentLock[element.noteData.instrument]) {
        song.removeNote(element.noteData);
        window.top.confirmExit = true;
    }
}

function onmousedown(event) {
    if(clickedButton) {
        clickedButton = false;
        return;
    }
    var btn = getButton(event);
    mouseButton = btn;
    if(btn == 1) {
        if(mode == "draw") {
            mouseDownDraw(event);
        }
        else if(mode == "edit") {
            mouseDownEdit(event);
        }
        else if(mode == "play") {
            mouseDownPlay(event);
        }
        else if(mode == "erase") {
            mouseDownErase(event);
        }
        mouseClickX = event.clientX;
        mouseClickY = event.clientY;
    }
    else if(btn == 2) {
        mouseDownPlay(event);
        event.stopPropagation()
        event.preventDefault();
    }
    else if(btn == 3) {
        mouseDownErase(event);
    }
}
function setMode(m) {
    document.getElementById("mode_"+mode).className="btn tooltip";
    mode = m;
    document.getElementById("mode_"+mode).className="active tooltip";
}

function select(note) {
    note.element.className = 'note instrument'+note.instrument+' selected';
    if(note.selected)
        return;
    note.selected = true;
    selectedNotes.push(note);
}

function deselect(note) {
    if(!note.selected)
        return;
    note.selected = false;
    selectedNotes.splice(selectedNotes.indexOf(note), 1);
    note.element.className = 'note instrument'+note.instrument;
}
function clearSelection() {
    for(var i = 0; i < selectedNotes.length; i++) {
        selectedNotes[i].selected = false;
        selectedNotes[i].element.className = 'note instrument'+selectedNotes[i].instrument;
    }
    selectedNotes = [];
}
function deleteSelection() {
    for(var i = 0; i < selectedNotes.length; i++) {
        selectedNotes[i].selected = false;
        selectedNotes[i].element.className = 'note instrument'+selectedNotes[i].instrument;
        song.removeNote(selectedNotes[i]);
    }
    selectedNotes = [];
}
function dragSelection() {
    dragNotes = [];
    for(var i = 0; i < selectedNotes.length; i++) {
        dragNotes.push(selectedNotes[i]);
    }
}

function getCopyString(notes, minTime) {
	var string = settings['clipboardMagicString']+':'+instanceId+':';
	for(var i = 0; i < notes.length; i++) {
		string += notes[i].toString(minTime) + ';';
	}
	return string;
}

function updateSelection() {
	var minTime = 0;
    if(selectedNotes.length > 0) {
        minTime = selectedNotes[0].time;
        for(var i = 0; i < selectedNotes.length; i++) {
            if(selectedNotes[i].time < minTime) {
                minTime = selectedNotes[i].time;
                if(minTime == 0) {
                    break;
                }
            }
        }
    }
    copyButton.setAttribute('data-clipboard-text', getCopyString(selectedNotes, minTime));
}
function selectAll() {
    if(selectedNotes.length == song.notes.length)
        clearSelection();
    else {
        for(var i = 0; i < song.notes.length; i++) {
            if(!instrumentLock[song.notes[i].instrument]) {
                select(song.notes[i]);
            }
        }
        if(selectedNotes.length > 0) {
            message(selectedNotes.length+" note"+(selectedNotes.length == 1 ? "" : "s")+" selected");
        }
    }
    updateSelection();
}
function cut() {
    copy(false);
    if(selectedNotes.length == 0) {
        message("Select some notes to cut first.");
    }
    else {
        message(clipboard.length+" note"+(selectedNotes.length == 1 ? "" : "s")+" copied.");
    }
    deleteSelection();
}
function cloneNote(note) {
    return new Note(song, note.type, note.time, note.length, note.instrument);
}
function copy(showMessage) {
    clipboard = [];
    for(var i = 0; i < selectedNotes.length; i++) {
        clipboard.push(cloneNote(selectedNotes[i]));
    }
    if(showMessage) {
        if(selectedNotes.length == 0) {
            message("Select some notes to copy first.");
        }
        else {
            message(clipboard.length+" note"+(selectedNotes.length == 1 ? "" : "s")+" copied.");
        }
    }
}
function paste() {
    clearSelection();
    if(clipboard.length > 0)
        message(clipboard.length+" note"+(selectedNotes.length == 1 ? "" : "s")+" pasted. Drag them to change their position.");
    else
        message('Nothing to paste. Use Ctrl-V if pasting from another sequence.');
    for(var i = 0; i < clipboard.length; i++) {
        var note = clipboard[i];
        song.addNote(note);
        select(note);
    }
    copy(false);
}
$(document).on('paste','body',function(e) {
    var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..');
    if(text) {
        var parts = text.split(':');
        if(parts.length == 3 && parts[0] == settings['clipboardMagicString'] && parseInt(parts[1]) != instanceId) {
            clearSelection();
            song.appendData(parts[2], 0, true);
        } else {
            paste();
        }
    }
});
$(document).on('copy','body',function(e) {
    e.preventDefault();
});
function updateSelectionRectangle(mouseX, mouseY) {
    if(mouseButton == 1 && mode == "edit" && !clickedNote) {
        selectionRect.style.display = "block";
        if(mouseClickX < mouseX) {
            selectionRect.style.left = xPosition(mouseClickX)+"px";
            selectionRect.style.width = (mouseX - mouseClickX)+"px";
        }
        else {
            selectionRect.style.left = xPosition(mouseX)+"px";
            selectionRect.style.width = (mouseClickX - mouseX)+"px";
        }
        
        if(mouseClickY < mouseY) {
            selectionRect.style.top = yPosition(mouseClickY)+"px";
            selectionRect.style.height = (mouseY - mouseClickY)+"px";
        }
        else {
            selectionRect.style.top = yPosition(mouseY)+"px";
            selectionRect.style.height = (mouseClickY - mouseY)+"px";
        }
    }
}
function updateDragNotes(mouseX, mouseY, prevMouseX, prevMouseY) {
    for(var i = 0; i < dragNotes.length; i++) {
        var dragNote = dragNotes[i];
        dragNote.element.style.left = (parseInt(dragNote.element.style.left) + mouseX - prevMouseX)+"px";
        dragNote.element.style.top = (parseInt(dragNote.element.style.top) + mouseY - prevMouseY)+"px";
    }
}
function onmousemove(event) {
    if((mouseButton == 1 && mode == "erase") || mouseButton == 3)
        mouseDownErase(event);
    else
        updateSelectionRectangle(event.clientX, event.clientY);
    updateDragNotes(event.clientX, event.clientY, mouseX, mouseY);
    mouseX = event.clientX;
    mouseY = event.clientY;
    time = timeIndex(xPosition(event.clientX));
    time = (Math.floor(time/4))
}
function onmouseup(event) {
    if(mode == "edit" && !clickedNote && mouseButton == 1) {
        selectionRect.style.display = "none";
        var xPos = xPosition(event.clientX);
        var yPos = yPosition(event.clientY);
        var xClickPos = xPosition(mouseClickX);
        var yClickPos = yPosition(mouseClickY);
        
        var startX, stopX, startY, stopY
        if(xClickPos < xPos) {
            startX = timeIndex(xClickPos);
            stopX = timeIndex(xPos);
        }
        else {
            stopX = timeIndex(xClickPos);
            startX = timeIndex(xPos);
        }
        
        if(yClickPos < yPos) {
            startY = noteIndex(yClickPos);
            stopY = noteIndex(yPos);
        }
        else {
            stopY = noteIndex(yClickPos);
            startY = noteIndex(yPos);
        }
        
        clearSelection();
        for(var i = 0; i < song.notes.length; i++) {
            var note = song.notes[i];
            if(note.time >= startX && note.time <= stopX) {
                var index = pianoToIndex[note.type];
                if(index >= startY && index <= stopY && !instrumentLock[note.instrument]) {
                    select(note);
                }            
            }
        }
    }
    for(var index in dragNotes) {
        var dragNote = dragNotes[index];
        x = parseInt(dragNote.element.style.left);
        y = parseInt(dragNote.element.style.top);
        note = piano[noteIndexRound(y)];
        time = timeIndexRound(x);
        if(note != undefined && time < maxCells && time >= 0) {
            song.updateLoopTime();
            song.moveNote(dragNote, dragNote.instrument, dragNote.instrument, dragNote.time, time, dragNote.type, note);
        }
        song.update(dragNote);
    }
    dragNotes = [];
    mouseButton = 0;
}
function selectInstrument(index) {
    instrumentSelect.selectedIndex = index;
    instrumentSelect.onchange();
}
function onkeydown(event) {
    var code = event.keyCode;
    if(code == 8 || code == 46) { /* delete */
        deleteSelection();
        return false;
    } else if(code >= 49 && code <= 57) {
        selectInstrument(code - 49);
    } else if(code == 48) {
        selectInstrument(9);
    } else if(code == 189) {
        selectInstrument(10)
    } else if(code == 187) {
        selectInstrument(11);
    } else if(code == 32) { /* space */
        if(!song.playing)
            song.play(lastPlayTime);
        else
            song.stop();
        return false;
    }
}
function onkeypress(event)
{
    var scaleId = keySelect.selectedIndex == 0 ? 1 : keySelect.selectedIndex;
    var scale = settings['scales'][scaleId];
    var chr = String.fromCharCode(event.keyCode == 0 ? event.which : event.keyCode).toLowerCase();
    for(var i = 0; i < settings['typingKeyboard'].length; i++) {
        var idx = settings['typingKeyboard'][i].indexOf(chr);
        if(idx != -1) {
            var n;
            switch(instrument) {
                case 0:
                case 4:
                case 3:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 12:
                    n=i+3;
                break;
                case 2:
                case 5:
                    n=i+2;
                break;
                case 1:
                case 11:
                    n=i+4;
                break;
            }
            if(idx > settings['scaleOctaves'][scaleId] + 7) {
                n += 2;
            }
            else if(idx > settings['scaleOctaves'][scaleId]) {
                n++;
            }
            var note = scale[idx]+n;
            playNote(instrument, note, 1);
        }
    }
};

var messageTimeoutId = 0;
function message(text) {
    if(messageTimeoutId != 0)
        window.clearTimeout(messageTimeoutId);
    var messageWrapper = document.getElementById('message_wrapper');
    var messageText = document.getElementById('message_text');
    messageText.innerHTML = text;
    messageWrapper.style.display="block";
    messageTimeoutId = window.setTimeout(function() {
        messageWrapper.style.display="none";
    }, 2000);
}

function updateWavesurferWidth(redraw){ 
    if(audioSystem.audioTrack != null) {
        var renderWidth = Math.round(audioSystem.audioTrack.duration/(song.sleepTime/1000)*(noteWidth)/wavesurferScale);
        var displayWidth = Math.round(renderWidth*wavesurferScale);
        wavesurfer.style.width=Math.round(renderWidth)+"px"
        if(redraw)
            wavesurferObj.drawBuffer();
        else if(renderWidth > 32767)
            message('Waveform is too long to display. Try zooming out or lowering the BPM.');
        $('canvas').attr('style', 'position: absolute; z-index: 1337; width: '+displayWidth+'px !important; height: 32px;');
        wavesurfer.style.width = displayWidth+"px";
    }
}

function removeAudioTrack() {
    audioTrackFile.value=null
    audioSystem.removeAudioTrack();
    hideAudioTrackSelect();
    $('#wavesurfer_element').hide();
}

function showAudioTrackSelect() {
    audioTrackLink.style.display="none";
    audioTrackSelect.style.display="block";
}

function hideAudioTrackSelect() {
    audioTrackLink.style.display="block";
    audioTrackSelect.style.display="none";
}

function showCaptcha() {
    document.getElementById('captcha_frame').src="/captcha.php";
    document.getElementById('captcha_container').style.display="block";    
}

function hideCaptcha() {
        document.getElementById('captcha_frame').src="about:blank";
        document.getElementById('captcha_container').style.display="none";
}

function getErrorMessage() {
	return '<span style="color:red">Error saving, check your connection and try again. <a href="javascript:prompt(\'Copy and paste this into any program that can save text. Open a blank sequence and hit Ctrl+V (Cmd+V on Mac) to get your song back.\', getCopyString(song.notes, 0));void(0);">Save offline</a></span>';
}

function save(doExport) {
    if(song.notes.length > 0) {
        document.getElementById('share').style.display="block";
        document.getElementById('sharelink').innerHTML = 'Saving...';
        data = bpm+":";
        for(var i = 0; i < song.notes.length; i++) {
            var note = song.notes[i];
            data = data+note.toString(0)+";";
        }
        if(doExport) {
            sendPostRequest('/app/midi.php', {'data': data});
        } else {
            $.ajax({
                type: "POST",
                url: endpoint+='/save.php', 
                data: 'title='+encodeURIComponent(document.getElementById('title').value)+'&basedon='+song.basedon+'&data='+encodeURIComponent(data),
                success: function(r) {
                    if(r && r.indexOf('http://') > -1) {
                        document.getElementById('sharelink').innerHTML = r;
                    }
                    else {
                        document.getElementById('sharelink').innerHTML = getErrorMessage();
                    }
                    document.getElementById('share').style.display="block";
                },
                error: function(r) {
                    document.getElementById('sharelink').innerHTML = getErrorMessage();
                    document.getElementById('share').style.display="block";
                }
            });
        }
    }
}

function clearSong() {
    song.stop();
    song.playing = false;
    if(playTimeoutId)
        window.clearTimeout(playTimeoutId);
	while(song.notes.length > 0) {
		song.removeNote(song.notes[0]);
	}
	song.updateLoopTime();

    lastPlayTime = 0;
    selectedNotes = [];
    dragNotes = [];
    clickedNote = false;
    scrollLeft = 0;
    targetScrollLeft = 0;
}

function loadData(data) {
	var parts = data.split(":");
	bpm = parts[0];
	var notes = parts[1];
	if(typeof bpm == 'undefined' || bpm == "")
		bpm = "110";
	if(typeof notes == 'undefined')
		notes = '';
	if(typeof song != 'undefined')
		clearSong();
	song = new Song(notes);
    document.getElementById('bpm').value = bpm;
	song.setBPM(bpm);
}
