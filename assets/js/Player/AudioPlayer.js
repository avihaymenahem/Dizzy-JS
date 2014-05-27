(function() {
    var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    this.AudioPlayer = (function() {

        AudioPlayer.States = {
            Ready: 0,
            Playing: 1,
            Loading: 2,
            Error: 3
        };

        function AudioPlayer(options) {
            this.setOptions(options);
        }

        AudioPlayer.prototype.setOptions = function(options) {
            var key, value;
            if (options == null) {
                options = {};
            }
            for (key in options) {
                value = options[key];
                this[key] = value;
            }
            if (options.el) {
                return this.setEl(options.el);
            }
        };

        AudioPlayer.prototype.setEl = function(el) {
            if (this.el) {
                this._unbindEvents();
            }
            this.el = el;
            return this._bindEvents();
        };

        AudioPlayer.prototype.updateState = function(e) {
            var state, _ref;
            state = this.isErrored() ? AudioPlayer.States.Error : this.isLoading() ? AudioPlayer.States.Loading : this.isPlaying() ? AudioPlayer.States.Playing : AudioPlayer.States.Ready;
            if (this.state !== state) {
                this.state = state;
                return (_ref = this.ui) != null ? _ref.AudioPlayerUpdateState(state) : void 0;
            }
        };

        AudioPlayer.prototype.isPlaying = function() {
            return this.el && !this.el.paused;
        };

        AudioPlayer.prototype.isPaused = function() {
            return this.el && this.el.paused;
        };

        AudioPlayer.prototype.isLoading = function() {
            if (!this.state && this.isEmpty()) {
                return false;
            }
            return this.el.networkState === this.el.NETWORK_LOADING && this.el.readyState < this.el.HAVE_FUTURE_DATA;
        };

        AudioPlayer.prototype.isErrored = function() {
            return this.el.error || this.el.networkState === this.el.NETWORK_NO_SOURCE;
        };

        AudioPlayer.prototype.isEmpty = function() {
            return this.el.readyState === this.el.HAVE_NOTHING;
        };

        AudioPlayer.prototype.play = function() {
            var _ref;
            if (this.isEmpty()) {
                if ((_ref = this.ui) != null) {
                    _ref.AudioPlayerUpdateState(AudioPlayer.States.Loading);
                }
            }
            return this.el.play();
        };

        AudioPlayer.prototype.pause = function() {
            return this.el.pause();
        };

        AudioPlayer.prototype.load = function() {
            return this.el.load();
        };

        AudioPlayer.prototype.duration = function() {
            return this.el.duration;
        };

        AudioPlayer.prototype.seekTo = function(time) {
            return this.el.currentTime = parseInt(time, 10);
        };

        AudioPlayer.prototype.volume = function(lvl) {
            if(lvl < 0) lvl = 0;
            if(lvl > 1) lvl = 1;
            if(this.el) return this.el.volume = lvl;
        };

        AudioPlayer.prototype.percentComplete = function() {
            var number;
            number = ~~((this.el.currentTime / this.el.duration) * 10000);
            return number / 10000;
        };

        AudioPlayer.prototype.percentVolComplete = function() {
            var number;
            number = ~~((this.el.volume) * 10000);
            return number / 100;
        };

        AudioPlayer.prototype.handleEvent = function(event) {
            var _ref;
            if (_ref = event.type, __indexOf.call(this.audioPlayerEvents, _ref) >= 0) {
                return this.updateState(event);
            } else if (event.type === "timeupdate") {
                return this._timeUpdate(event);
            } else if(event.type === "volumechange") {
                return this._volumeUpdate(event);
            }
        };

        AudioPlayer.prototype.destroy = function() {
            this.ui = null;
            return this._unbindEvents();
        };

        AudioPlayer.prototype._bindEvents = function() {
            var eventName, _i, _len, _ref;
            this.audioPlayerEvents || (this.audioPlayerEvents = ["abort", "error", "play", "playing", "seeked", "pause", "ended", "canplay", "loadstart", "loadeddata", "canplaythrough", "seeking", "stalled", "waiting", "progress"]);
            _ref = this.audioPlayerEvents;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                eventName = _ref[_i];
                this.el.addEventListener(eventName, this);
            }
            this.el.addEventListener("volumechange", this);
            return this.el.addEventListener("timeupdate", this);
        };

        AudioPlayer.prototype._unbindEvents = function() {
            var eventName, _i, _len, _ref;
            _ref = this.audioPlayerEvents;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                eventName = _ref[_i];
                this.el.removeEventListener(eventName, this);
            }
            this.el.removeEventListener("volumechange", this);
            return this.el.removeEventListener("timeupdate", this);
        };

        AudioPlayer.prototype._timeUpdate = function(e) {
            var _ref;
            if (!this.isLoading()) {
                return (_ref = this.ui) != null ? typeof _ref.AudioPlayerTimeUpdated === "function" ? _ref.AudioPlayerTimeUpdated(this.percentComplete()) : void 0 : void 0;
            }
        };

        AudioPlayer.prototype._volumeUpdate = function(e) {
            var _ref;
            if (!this.isLoading()) {
                return (_ref = this.ui) != null ? typeof _ref.AudioPlayerVolumeUpdated === "function" ? _ref.AudioPlayerVolumeUpdated(this.percentVolComplete()) : void 0 : void 0;
            }
        };

        return AudioPlayer;

    })();

}).call(this);