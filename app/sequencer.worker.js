// DIRTY HACK
// window.setInterval is limited to ~1 tick per second in inactive tabs, but not in Web Workers.
// For simplicity, this script just sends messages to the main script at the appropriate interval
var playing = false;
var delay;
var timeout;
var lastStepTime;
self.addEventListener('message', function(e){
    switch (e.data) {
        case 'start':
            if (!playing) {
                playing = true;
                var sendMessage = function() {
                    self.postMessage('tick');
                    if(playing) {
                        var elapsed;
                        if(lastStepTime == null)
                            elapsed = delay;
                        else
                            elapsed = new Date().getTime() - lastStepTime;
                        timeout = setTimeout(sendMessage, delay - Math.min(delay/2, Math.max(0, elapsed - delay)));
                    }
                    lastStepTime = new Date().getTime();
                };
                if(timeout != null) {
                    clearTimeout(timeout);
                    lastStepTime = null;
                }
                sendMessage();
            }
            break;
        case 'stop':
            playing = false;
            if(timeout != null)
                clearTimeout(timeout);
            break;
        default:
            delay = parseInt(e.data);
            break;
    };
}, false);