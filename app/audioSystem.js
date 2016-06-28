/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/* 

This monkeypatch library is intended to be included in projects that are
written to the proper AudioContext spec (instead of webkitAudioContext), 
and that use the new naming and proper bits of the Web Audio API (e.g. 
using BufferSourceNode.start() instead of BufferSourceNode.noteOn()), but may
have to run on systems that only support the deprecated bits.

This library should be harmless to include if the browser supports 
unprefixed "AudioContext", and/or if it supports the new names.  

The patches this library handles:
if window.AudioContext is unsupported, it will be aliased to webkitAudioContext().
if AudioBufferSourceNode.start() is unimplemented, it will be routed to noteOn() or
noteGrainOn(), depending on parameters.

The following aliases only take effect if the new names are not already in place:

AudioBufferSourceNode.stop() is aliased to noteOff()
AudioContext.createGain() is aliased to createGainNode()
AudioContext.createDelay() is aliased to createDelayNode()
AudioContext.createScriptProcessor() is aliased to createJavaScriptNode()
OscillatorNode.start() is aliased to noteOn()
OscillatorNode.stop() is aliased to noteOff()
AudioParam.setTargetAtTime() is aliased to setTargetValueAtTime()

This library does NOT patch the enumerated type changes, as it is 
recommended in the specification that implementations support both integer
and string types for AudioPannerNode.panningModel, AudioPannerNode.distanceModel 
BiquadFilterNode.type and OscillatorNode.type.

*/
(function (global, exports, perf) {
  'use strict';

  function fixSetTarget(param) {
    if (!param)	// if NYI, just return
      return;
    if (!param.setTargetAtTime)
      param.setTargetAtTime = param.setTargetValueAtTime; 
  }

  if (window.hasOwnProperty('webkitAudioContext') && 
      !window.hasOwnProperty('AudioContext')) {
    window.AudioContext = webkitAudioContext;

    if (!AudioContext.prototype.hasOwnProperty('createGain'))
      AudioContext.prototype.createGain = AudioContext.prototype.createGainNode;
    if (!AudioContext.prototype.hasOwnProperty('createDelay'))
      AudioContext.prototype.createDelay = AudioContext.prototype.createDelayNode;
    if (!AudioContext.prototype.hasOwnProperty('createScriptProcessor'))
      AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createJavaScriptNode;

    AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function() { 
      var node = this.internal_createGain();
      fixSetTarget(node.gain);
      return node;
    };

    AudioContext.prototype.internal_createDelay = AudioContext.prototype.createDelay;
    AudioContext.prototype.createDelay = function(maxDelayTime) { 
      var node = maxDelayTime ? this.internal_createDelay(maxDelayTime) : this.internal_createDelay();
      fixSetTarget(node.delayTime);
      return node;
    };

    AudioContext.prototype.internal_createBufferSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function() { 
      var node = this.internal_createBufferSource();
      if (!node.start) {
        node.start = function ( when, offset, duration ) {
          if ( offset || duration )
            this.noteGrainOn( when, offset, duration );
          else
            this.noteOn( when );
        }
      }
      if (!node.stop)
        node.stop = node.noteOff;
      fixSetTarget(node.playbackRate);
      return node;
    };

    AudioContext.prototype.internal_createDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;
    AudioContext.prototype.createDynamicsCompressor = function() {
      var node = this.internal_createDynamicsCompressor();
      fixSetTarget(node.threshold);
      fixSetTarget(node.knee);
      fixSetTarget(node.ratio);
      fixSetTarget(node.reduction);
      fixSetTarget(node.attack);
      fixSetTarget(node.release);
      return node;
    };

    AudioContext.prototype.internal_createBiquadFilter = AudioContext.prototype.createBiquadFilter;
    AudioContext.prototype.createBiquadFilter = function() { 
      var node = this.internal_createBiquadFilter();
      fixSetTarget(node.frequency);
      fixSetTarget(node.detune);
      fixSetTarget(node.Q);
      fixSetTarget(node.gain);
      return node;
    };

    if (AudioContext.prototype.hasOwnProperty( 'createOscillator' )) {
      AudioContext.prototype.internal_createOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() { 
        var node = this.internal_createOscillator();
        if (!node.start)
          node.start = node.noteOn; 
        if (!node.stop)
          node.stop = node.noteOff;
        fixSetTarget(node.frequency);
        fixSetTarget(node.detune);
        return node;
      };
    }
  }
}(window));


var audioSystem = new function(){
    this.AVG_BYTES_PER_SOUND = 16384;

    this.unsupportedBrowser = false;
    this.useSoundSprite = true;

	this.sounds = {};
    this.gainNodes = {};
    this.volumeIndex = [];
    this.masterVolume = 1;
	this.load = null;
	this.play = null;
	
    this.bytesTotal = 0;
    this.bytesReceived = 0;
    this.progress = {};
    
    this.audioTrack = null;
    this.audioTrackSource = null;
    this.audioTrackPlaying = false;
    
	this.init = function(){
		if(typeof webkitAudioContext != 'undefined') {
			this.load = this.loadWebkit;
			this.play = this.playWebkit;
			this.audioContext = new webkitAudioContext();
		} else if(typeof AudioContext != 'undefined') {
			this.load = this.loadWebkit;
			this.play = this.playWebkit;
			this.audioContext = new AudioContext();
        } else {
            this.load = function() {document.onLoadSound()};
            this.play = function() {};
            this.unsupportedBrowser = true;
        }
    };
    this.getProgress = function() {
        var bytesTotal = 0;
        var bytesReceived = 0;
        for(var instrument in audioSystem.progress) {
            if(audioSystem.progress[instrument] != undefined) {
                if(window.enableSynth && instrument != 2) {
                    bytesReceived++;
                    bytesTotal++;
                } else {
                    bytesReceived += audioSystem.progress[instrument][0];
                    bytesTotal += audioSystem.progress[instrument][1];
                }
            }
        }
        if(bytesTotal == 0) {
            return 1;
        } else {
            return bytesReceived / bytesTotal;
        }
    }
    this.setVolume = function(volume) {
        this.masterVolume = volume;
        for(var i in this.gainNodes) {
            this.gainNodes[i].gain.value = this.canUseSoundSprite(i) ?
                settings['volume'][i] * volume : 0.5 * volume;
        }
    }
	this.loadWebkit = function(instrument, note) {
        var id = this.id(instrument, note);
        var data = this.url(instrument, note);
		var request = new XMLHttpRequest();
		request.open('GET', data, true);
		request.responseType = 'arraybuffer';
		
		request.onload = function() {
		    audioSystem.audioContext.decodeAudioData(request.response, function(buffer) {
				audioSystem.sounds[id] = buffer;
                audioSystem.progress[instrument][0] += audioSystem.AVG_BYTES_PER_SOUND;
				document.onLoadSound();
			});
		};
		request.send();
	};
	this.loadSoundSpriteWebkit = function(instrument) {
        this.progress[instrument] = [0, 1];
        var data = '/app/instruments/'+instrument+'.'+window.audioFormat+'?v='+settings['audioVersion'];
		var request = new XMLHttpRequest();
		request.open('GET', data, true);
		request.responseType = 'arraybuffer';
		
		request.onload = function() {
		    audioSystem.audioContext.decodeAudioData(request.response, function(buffer) {
                audioSystem.progress[instrument] = [1, 1];
				audioSystem.sounds[instrument] = buffer;
				document.onLoadSound();
			});
		};
        
        request.onprogress = function(e) {
            if(e.lengthComputable) {
                audioSystem.progress[instrument] = [Math.min(e.total - 1, e.loaded), e.total];
                document.onLoadSound();
            }
        }
		request.send();
	};
	this.playWebkit = function(instrument, note, delay) {
        var id = this.id(instrument, note);
        delay = delay ? delay : 0;
        if(this.canUseSoundSprite(instrument) && this.sounds[instrument] != undefined) {
			var source = this.audioContext.createBufferSource();
			source.buffer = this.sounds[instrument];
            if(settings['altVolume'][instrument] != 0) {
                var tmp = settings['altVolume'][instrument];
                settings['altVolume'][instrument] = settings['volume'][instrument];
                settings['volume'][instrument] = tmp;
                this.gainNodes[instrument].gain.value = settings['volume'][instrument] * this.masterVolume;
            }
			source.connect(this.gainNodes[instrument]);
            var startTime = this.audioContext.currentTime + delay;
            var offset = 30/settings['originalBpm'][instrument] * (note - settings['min'][instrument]);
            var length = 30/settings['originalBpm'][instrument] - 0.05;
			source.start ? source.start(startTime, offset, length) : source.noteOn(startTime, offset, length);
            delete source;
        } else if(this.sounds[id] != undefined) {
			var source = this.audioContext.createBufferSource();
			source.buffer = this.sounds[id];
			source.connect(this.gainNodes[instrument]);
            var startTime = this.audioContext.currentTime + delay;
			source.start ? source.start(startTime) : source.noteOn(startTime);
            delete source;
		}
	};
    
    this.loadInstrument = function(id) {
        this.gainNodes[id] = this.audioContext.createGain();
        this.gainNodes[id].gain.value = this.canUseSoundSprite(id) ?
            settings['volume'][id] * this.masterVolume : 0.5 * this.masterVolume;
        this.gainNodes[id].connect(this.audioContext.destination);
        if(this.canUseSoundSprite(id)) {
            this.loadSoundSpriteWebkit(id);
        } else {
            this.progress[id] = [0, 0];
            var count = 0;
            for(var i = settings['min'][id]; i <= settings['max'][id]; i++)
            {
                this.load(id, i-settings['offset'][id]);
                count++;
            }
            this.progress[id] = [0, count*audioSystem.AVG_BYTES_PER_SOUND];
        }
    };
    
    this.loadAudioTrack = function(arrayBuffer, onLoad) {
        this.audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            audioSystem.audioTrack = buffer;            
            onLoad(buffer);
        }, function(e) {
            audioSystem.audioTrack = null;
            message('Error loading audio track');
            audioTrackLoading.style.display="none";
            audioTrackSelect.style.display="block"
        });
    }
    
    this.removeAudioTrack = function() {
        if(this.audioTrack != null) {
            if(this.audioTrackPlaying) {
                this.stopAudioTrack();
            }
            this.audioTrack = null;
        }
    }
    
    this.playAudioTrack = function(offset) {
        if(this.audioTrack != null) {
            if(this.audioTrackPlaying) {
                this.stopAudioTrack();
            }
            this.audioTrackPlaying = true;
            this.audioTrackSource = this.audioContext.createBufferSource();
            this.audioTrackSource.buffer = this.audioTrack;
            this.audioTrackSource.loop = false;
            this.audioTrackSource.connect(this.audioContext.destination);
            this.audioTrackSource.start(0, offset); 
        }
    }
    
    this.stopAudioTrack = function() {
        if(this.audioTrackSource != null) {
            this.audioTrackSource.stop();
            this.audioTrackSource = null;
        }
    }
    
    this.canUseSoundSprite = function(id) {
        return this.useSoundSprite && (id < 1 || id >= 8);
    }
    
    this.id = function(instrument, note) {
        return instrument+"-"+note;
    };
    
    this.url = function(instrument, note) {
        return "/app/sounds/"+this.id(instrument, note)+'.'+window.audioFormat+'?v='+settings['audioVersion'];
    };
}
