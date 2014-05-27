(function() {

    this.AudioPlayerUI = (function() {

        AudioPlayerUI.prototype.transitionEvents = ["transitionend", "webkitTransitionEnd", "MSTransitionEnd", "oTransitionEnd"];

        function AudioPlayerUI(options) {
            if (options == null) {
                options = {};
            }
            this.setOptions(options);
            this.audioPlayer = new AudioPlayer({
                ui: this
            });
            this._createAudioEl();
            this._createImageEl();
            if (options.el) {
                this.setEl(options.el);
            }
            if(this.songs.length)
            {
                this.goToSong(this.lastPlayedTrack);
            }
            this.setVolume(this.savedVolume, true);
        }

        AudioPlayerUI.prototype.setOptions = function(options) {
            var key, value, _results;
            _results = [];
            for (key in options) {
                value = options[key];
                _results.push(this[key] = value);
            }
            return _results;
        };

        AudioPlayerUI.prototype.addSong = function(song){
            return this.songs.push(song);
        };

        AudioPlayerUI.prototype.setEl = function(el) {
            this._unbindEvents();
            this.el = el;
            this.$el = $(this.el);
            this.$el.append(this.audioEl);
            this.$imageContainer = this.$el.find(".PlayerAlbumCover");
            this.$imageContainer.append(this.image);
            this.$progressTime = this.$el.find(".TrackProgress");
            this.$progressContainer = this.$el.find(".PlayerProgression .progress");
            this.$progressBar = this.$el.find(".PlayerProgression .progress-bar");
            this.$volContainer = this.$el.find(".PlayerVolume .progress");
            this.$volBar = this.$el.find(".PlayerVolume .progress-bar");
            this.$button = this.$el.find(".fa-play");
            this.$backButton = this.$el.find(".fa-step-backward");
            this.$nextButton = this.$el.find(".fa-step-forward");
            this.$name = this.$el.find(".TrackName");
            this.$artist = this.$el.find(".ArtistName");
            return this._bindEvents();
        };

        AudioPlayerUI.prototype.togglePlayPause = function() {
            if (this.audioPlayer.isPlaying()) {
                this.$button.removeClass("fa-pause").addClass("fa-play");
                return this.audioPlayer.pause();
            } else {
                this.$button.removeClass("fa-play").addClass("fa-pause");
                return this.audioPlayer.play();
            }
        };

        AudioPlayerUI.prototype.goToSong = function(index) {
            var wasPlaying;
            this.currentSong = index;
            wasPlaying = this.audioPlayer.isPlaying();
            this._updateSourceAttributes(index);
            this._updateImageAttributes(index);
            this.$name[0].innerHTML = this.songs[index].track_name.length > 25 ? this.songs[index].track_name.substring(0,22) + "..." : this.songs[index].track_name;
            this.$artist[0].innerHTML = this.songs[index].artist_name.length > 25 ? this.songs[index].artist_name.substring(0,22) + "..." : this.songs[index].artist_name;
            if(this.songChanged) this.songChanged(index);
            this.audioPlayer.setEl(this.audioEl);
            this.$progressBar.css({
                width: 0
            });
            this.audioPlayer.load();
            if (wasPlaying) {
                return this.audioPlayer.play();
            }
        };

        AudioPlayerUI.prototype.nextSong = function() {
            if (this.currentSong === this.songs.length - 1) {
                return this.goToSong(0);
            } else {
                return this.goToSong((+this.currentSong) + 1);
            }
        };

        AudioPlayerUI.prototype.previousSong = function() {
            if (this.currentSong === 0) {
                return this.goToSong(this.songs.length - 1);
            } else {
                return this.goToSong((+this.currentSong) - 1);
            }
        };

        AudioPlayerUI.prototype.seek = function(e) {
            var duration, offset, percent, seekTo, _ref;
            if (offset = e.offsetX || ((_ref = e.originalEvent) != null ? _ref.layerX : void 0)) {
                percent = offset / this.$progressContainer.width();
                duration = this.audioPlayer.duration();
                seekTo = duration * percent;
                return this.audioPlayer.seekTo(seekTo);
            }
        };

        AudioPlayerUI.prototype.setVolume = function(e, trueNumber)
        {
            var offset, percent, _ref;
            if(trueNumber)
            {
                percent = e;
            }
            else
            {
                if (offset = e.offsetX || ((_ref = e.originalEvent) != null ? _ref.layerX : void 0)) {
                    percent = offset / this.$volContainer.width();
                    TDB.updateSavedVolume(percent);
                }
            }

            return this.audioPlayer.volume(percent);
        };

        AudioPlayerUI.prototype.AudioPlayerUpdateState = function() {
            this.$el.toggleClass("error", this.audioPlayer.isErrored());
            this.$progressContainer.toggleClass("loading", this.audioPlayer.isLoading());
            if (this.audioPlayer.isPlaying()) {
                return this.$button.removeClass("icon-play").addClass("icon-pause");
            } else {
                return this.$button.removeClass("icon-pause").addClass("icon-play");
            }
        };

        AudioPlayerUI.prototype.AudioPlayerTimeUpdated = function(percentComplete) {
            var CurrentTime = "",
                TotalTime = "",
                durationTotal = moment.duration(this.audioPlayer.el.duration, "seconds"),
                durationCurrent = moment.duration(this.audioPlayer.el.currentTime, "seconds");

            var hoursTotal = durationTotal.hours();
            var hoursCurrent = durationCurrent.hours();

            if (hoursTotal > 0) { TotalTime = hoursTotal + ":" ; }
            if (hoursCurrent > 0) { CurrentTime = hoursCurrent + ":" ; }

            var durationTotalSeconds = durationTotal.seconds().toString();
            if(durationTotalSeconds.length == 1) durationTotalSeconds = "0" + durationTotalSeconds;

            var durationTotalMinutes = durationTotal.minutes().toString();
            if(durationTotalMinutes.length == 1) durationTotalMinutes = "0" + durationTotalMinutes;

            var durationCurrentSeconds = durationCurrent.seconds().toString();
            if(durationCurrentSeconds.length == 1) durationCurrentSeconds = "0" + durationCurrentSeconds;

            var durationCurrentMinutes = durationCurrent.minutes().toString();
            if(durationCurrentMinutes.length == 1) durationCurrentMinutes = "0" + durationCurrentMinutes;

            TotalTime = TotalTime + durationTotalMinutes + ":" + durationTotalSeconds;
            CurrentTime = CurrentTime + durationCurrentMinutes + ":" + durationCurrentSeconds;

            this.$progressTime.html(CurrentTime + " / " + TotalTime);

            if(percentComplete * 100 == 100)
            {
                this.audioPlayer.pause();
                this.nextSong();
                this.audioPlayer.play();
                return true;
            }

            return this.$progressBar.css({
                width: "" + (percentComplete * 100) + "%"
            });
        };

        AudioPlayerUI.prototype.AudioPlayerVolumeUpdated = function(percent) {
            return this.$volBar.css({
                width: "" + percent + "%"
            });
        };

        AudioPlayerUI.prototype._createImageEl = function() {
            return this.image = document.createElement("img");
        };

        AudioPlayerUI.prototype._createAudioEl = function() {
            return this.audioEl = document.createElement("audio");
        };

        AudioPlayerUI.prototype._updateSourceAttributes = function(index) {
            var sourceEl, _results;
            while (this.audioEl.firstChild) {
                this.audioEl.removeChild(this.audioEl.firstChild);
            }
            _results = [];
            sourceEl = document.createElement("source");
            sourceEl.setAttribute("src", this.songs[index].path);
            _results.push(this.audioEl.appendChild(sourceEl));
            return _results;
        };

        AudioPlayerUI.prototype._updateImageAttributes = function(index) {
            var callback, secondImage,
                _this = this;
            callback = function() {
                _this.image.removeAttribute("class");
                $(_this.image).off(_this.transitionEvents.join(" "));
                _this.image.setAttribute("src", _this.songs[index].pic);
                return setTimeout(function() {
                    if (secondImage) {
                        return _this.$imageContainer[0].removeChild(secondImage);
                    }
                }, 500);
            };
            if (this.$imageContainer && this.image.getAttribute("src")) {
                secondImage = document.createElement("img");
                secondImage.setAttribute("src", this.songs[index].pic);
                this.image.setAttribute("class", "fading");
                this.$imageContainer.html(secondImage);
                return $(this.image).on(this.transitionEvents.join(" "), callback);
            } else {
                return callback();
            }
        };

        AudioPlayerUI.prototype._bindEvents = function() {
            this.$button.on("click", $.proxy(this, "togglePlayPause"));
            this.$backButton.on("click", $.proxy(this, "previousSong"));
            this.$nextButton.on("click", $.proxy(this, "nextSong"));
            this.$volContainer.on("mouseup", $.proxy(this, "setVolume"))
            return this.$progressContainer.on("mouseup", $.proxy(this, "seek"));
        };

        AudioPlayerUI.prototype._unbindEvents = function() {
            var _ref, _ref1, _ref2, _ref3;
            if ((_ref = this.$button) != null) {
                _ref.off("click", this.togglePlayPause);
            }
            if ((_ref1 = this.$backButton) != null) {
                _ref1.off("click", this.previousSong);
            }
            if ((_ref2 = this.$nextButton) != null) {
                _ref2.off("click", this.nextSong);
            }
            return (_ref3 = this.$progressContainer) != null ? _ref3.off("mouseup", this.seek) : void 0;
        };

        return AudioPlayerUI;

    })();

}).call(this);