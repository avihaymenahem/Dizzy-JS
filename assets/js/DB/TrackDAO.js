function TracksDAO()
{
    this.ins = openDatabase('trackDB', '1.0', 'TrackDB', 100 * 1024 * 1024);
    this.openMainTable();
    
    this.getAllSongs = function(callback){
        this.execute("SELECT * FROM m_songs", function(e){
            if(callback) callback(e);
        });
    };

    this.addSong = function(TrackObject){
        this.execute("INSERT INTO m_songs" +
            "(path, pic, track_name, artist_name, album_name, release_date, track_number, length, date_added)" +
            "VALUES" +
            "('" + TrackObject.path + "','" + TrackObject.pic + "','" + TrackObject.track_name + "','" + TrackObject.artist_name + "','" + TrackObject.album_name + "','" + TrackObject.release_date + "','" + TrackObject.track_number + "','" + TrackObject.length + "','" + TrackObject.date_added + "')");
    };

    this.checkTrackExist = function(TrackPath, callback) {
        this.execute("SELECT track_id FROM m_songs WHERE path = '" + TrackPath + "'", function(e){
            if(callback) callback(e);
        });
    };

    this.updateLastPlayedTrackID = function(trackID){
        var self = this;
        this.getLastActions(function(e){
            if(e.length)
            {
                self.execute("UPDATE m_last_actions SET last_track_id = " + trackID);
            }
            else
            {
                self.execute("INSERT INTO m_last_actions (last_track_id) VALUES('" + trackID + "')");
            }
        });
    };

    this.updateSavedVolume = function(volume){
        var self = this;
        this.getLastActions(function(e){
            if(e.length)
            {
                self.execute("UPDATE m_last_actions SET volume = " + volume);
            }
            else
            {
                self.execute("INSERT INTO m_last_actions (volume) VALUES('" + volume + "')");
            }
        });
    };

    this.getLastActions = function(callback){
        this.execute("SELECT * FROM m_last_actions", function(e){
            if(callback) callback(e);
        });
    };

    this.updateSettings = function(Settings, callback){
        var self = this;
        self.getSettings(function(e){
            console.log(e);
            if(e.length)
            {
                self.execute("UPDATE m_settings SET theme = " + Settings.theme, callback);
            }
            else
            {
                self.execute("INSERT INTO m_Settings (theme) VALUES('" + Settings.theme + "')", callback);
            }
        });
    };

    this.getSettings = function(callback){
        this.execute("SELECT * FROM m_settings", function(e){
            if(callback) callback(e);
        });
    };

    this.addTrackToPlaylist = function(trackID, playlistID, callback){
        this.execute("INSERT INTO m_playlist_tracks(playlist_id, track_id) VALUES ('" + playlistID + "', '" + trackID + "')", function(e){
            if(callback) callback(e);
        });
    };

    this.insertNewPlaylist = function(PlayListObject, callback)
    {
        this.execute("INSERT INTO m_playlist(name, date_added)" +
            "VALUES" +
            "('" + PlayListObject.name + "', '" + PlayListObject.date_added  + "')", function(e){
            if(callback) callback(e);
        });
    };

    this.getPlaylistByID = function(playlistID, callback){
        this.execute("SELECT * FROM m_playlist WHERE playlist_id = " + playlistID, function(e){
            if(callback) callback(e);
        });
    };

    this.getPlaylistTracks = function(playlistID, callback){
        this.execute("SELECT * FROM m_playlist_tracks WHERE playlist_id = " + playlistID, function(e){
            if(callback) callback(e);
        });
    };

    this.getPlaylists = function(){

    };
}

TracksDAO.prototype.execute = function(query, callback)
{
    var result = [];
    this.ins.transaction(function(tx){
            tx.executeSql(query, [], function(tx, results){
                for(var i=0; i<results.rows.length; i++) {
                    result[i] = results.rows.item(i);
                }
                if(callback) callback(result);
            })}, this.errorHandler
    );
};

TracksDAO.prototype.errorHandler = function(error){
    console.log("error", error);
};

TracksDAO.prototype.openMainTable = function()
{
    this.execute("CREATE TABLE IF NOT EXISTS m_songs (track_id  INTEGER PRIMARY KEY AUTOINCREMENT, path, pic, track_name, artist_name, album_name, release_date, track_number, length, date_added)");
    this.execute("CREATE TABLE IF NOT EXISTS m_playlist (playlist_id  INTEGER PRIMARY KEY AUTOINCREMENT, name, date_added)");
    this.execute("CREATE TABLE IF NOT EXISTS m_playlist_tracks (playlist_id, track_id)");
    this.execute("CREATE TABLE IF NOT EXISTS m_last_actions (last_track_id, last_playlist_id, volume)");
    this.execute("CREATE TABLE IF NOT EXISTS m_settings (theme)");
};