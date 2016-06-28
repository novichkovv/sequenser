function doLogin() {
    var username = jQuery('#username').val();
    var password = jQuery('#password').val();
    jQuery.get('/ajax/login.php?user='+encodeURIComponent(username)+'&pass='+encodeURIComponent(password), function(data) {
        var result = JSON.parse(data);
        if(result == false) {
            alert('Incorrect username or password.');
        } else {
            jQuery.post('/forum/member.php', 'action=do_login&remember=yes&url='+encodeURIComponent(window.location.href)+'&username='+encodeURIComponent(username)+'&password='+encodeURIComponent(password), function() {
                settings['username'] = result['username'];
                settings['uid'] = parseInt(result['uid']);
                settings['logoutkey'] = result['logoutkey'];
                jQuery('#member_username').html(result['username']);
                userMember.css('display', 'block');
                userGuest.css('display', 'none');
            });
        }
    });
}

function submitOnEnter(e) {
    if(e.which == 13) {
        doLogin();
        e.preventDefault();
    }
}

function mainInit() {
    userGuest = jQuery('#user_guest');
    userMember = jQuery('#user_member');
    loginbutton = jQuery('#login_button');
    logoutbutton = jQuery('#member_logout');
    loginfields = jQuery('#login_fields');
    if(loginbutton) {
        loginbutton.click(function() {
            if(loginfields.css('display') == "none") {
                loginfields.css('display', 'inline-block');
                return false;
            } else {
                doLogin();
            }
            return false;
        });
    }
    if(logoutbutton) {
        logoutbutton.click(function() {
            jQuery.get('/forum/member.php?action=logout&logoutkey='+settings['logoutkey'], function() {
                settings['username'] = '';
                settings['uid'] = 0;
                settings['logoutkey'] = '';
                userMember.css('display', 'none');
                userGuest.css('display', 'block');
            });
        });
    }
    $('#username').keypress(submitOnEnter);
    $('#password').keypress(submitOnEnter);
    $('.btn, .active, #play_small, #audio_track_link').tooltipster({
        arrow: false, 
        onlyOne: true,
        position: 'bottom',
        delay: 100,
        speed: 100
    });
    $('.preview').tooltipster({
        arrow: true, 
        onlyOne: true,
        position: 'right',
        delay: 100,
        speed: 100
    });
}

window.onload = mainInit;

//Stuff for sequencer page only
    window.confirmExit = false;
    window.onbeforeunload = function(e)
    {
        if(window.confirmExit) {
            var msg = "Are you sure you want to close this window? You will lose any unsaved changes.";
             
            if (!e) { e = window.event; }
            if (e) { e.returnValue = msg; }
             
            return msg;
        }
    }
    function showExitWarning() {
        return confirm('Are you sure you want to close this window? You will lose any unsaved changes.');
    }
    
    var sortType = "random";
    function sort(type)
    {
        if(sortType == type)
            return;
        else
        {
            document.getElementById(sortType).style.display="none";
            document.getElementById(sortType+"_link").style.fontWeight="normal";
            sortType = type;
            document.getElementById(sortType).style.display="block";
            document.getElementById(sortType+"_link").style.fontWeight="bold";
        }
    }
    function updateSidebar() {
        $.get('/ajax/random.php?id='+window.location.hash.substr(1), function(result){$('#sidebar_dynamic').html(result); mainInit();});
        sort('random');
    }
    
    function setSequence(id) {
        $('#loading_overlay').css('display', 'block');
        if(id == 0 && window.location.pathname != '/')
            id = parseInt(window.location.pathname.substr(1));
        if(id != 0) {
            $.get('/ajax/load.php?id='+id, function(result) {
                var data = JSON.parse(result);
                loadData(data['data']);
                $('#loading_overlay').css('display', 'none');
                var playbutton = document.getElementById('playbutton');
                    document.title = 'Online Sequencer / '+data['windowTitle'];
                    $('#title').val(data['title']);
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
                    $('#nav_right').html(data['navRight']);
            });
        } else {
            loadData('');
            $('#nav_right').html('');
            document.title = 'Online Sequencer / Make music online';
            playbutton.style.display="none";
            $('#loading_overlay').css('display', 'none');
        }
        updateSidebar();
    }
    
    function onSequenceLinkClick(event, id) {
        var btn = getButton(event);
        if(btn == 1) {
            navigate(id);
            return false;
        } else {
            return true;
        }
    }
    
    var settingHash = false;
    function navigate(id) {
        if(!window.confirmExit || showExitWarning()) {
            window.confirmExit = false;
            settingHash = true;
            window.location.hash = id == 0 ? '' : id;
            setSequence(id);
            $('#stats').html("<sc"+"ript type='text/javascript' src='" +scJsHost+
        "statcounter.com/counter/counter.js'></"+"script>");
        }
    }
    window.onhashchange = function() {
        if(settingHash) {
            settingHash = false;
        }
        else {
            navigate(window.location.hash == "" ? 0 : parseInt(window.location.hash.substring(1)));
            settingHash = false;
        }
    }
    if(window.location.hash != '' && !isNaN(window.location.hash.substr(1)))
        window.location = ('/'+parseInt(window.location.hash.substring(1)));
