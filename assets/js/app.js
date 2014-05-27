var TDB = new TracksDAO();
var ap,init,tl = [];

var gui = require('nw.gui'),
    win = gui.Window.get();

document.addEventListener('dragover', function(e){
    e.preventDefault();
    e.stopPropagation();
    return false;
}, false);

document.addEventListener('drop', function(e){
    e.preventDefault();
    e.stopPropagation();
    uploadTrackToLib(e.dataTransfer.files);
    return false;
}, false);

$(function(){
    TDB.getSettings(function(e){
        e = e ? e[0] : null;
        setUIBySettings(e);
        attachEvents();
        loadMainPage();
        loadPage("assets/tpl/Main.html", null);
    });
});

function setUIBySettings(settings)
{
    if(!settings) { settings = Settings; }
    $("link[data-theme=true]").remove();
    switch(+settings.theme)
    {
        case Themes.Light:
            $(document).find("head").append('<link rel="stylesheet" href="assets/css/white_theme.css" data-theme="true">');
            break;
    }
}

function attachEvents()
{
    $("#ActionButtonMinimize").click(function() { win.minimize() });
    $("#ActionButtonExpand").click(function() { toggleFullscreen($(this)) });
    $("#ActionButtonClose").click(function() { win.close() });
    $("#addTracks").click(function(){ openUploadPopup() });
    $("#Popup .close").click(function(){ $("#Popup").fadeOut("fast") });
    $(".sidebar li:not(.selfLinked)").click(function(){ menuItemClick($(this)) });
    $("#AddSongInput").change(function(){uploadTrackToLib()});
    $("body").on("click", ".SongBox", function(e){ ap.goToSong($(this).attr("data-index"), songDoesntExistsCallback); $(".fa-play").click() });
    $(".searchInput").keyup(function(){ search() });
    $(".SmallPlayer").click(function(){ moveToSmallPlayer() });
}

function songDoesntExistsCallback(index)
{
    alert("The file does not exist anymore");
    tl.splice(index);
    var trackElement = $(".SongBox[data-index=" + index + "]"),
        trackID = trackElement.attr("data-trackid");
    trackElement.remove();
    TDB.removeSong(trackID);
}

function moveToSmallPlayer()
{
    var body = $("body");
    if(body.hasClass("smallP"))
    {
        $("header").show();
        body.removeClass("smallP");
        win.setResizable(true);
        win.setMinimumSize(674, 541);
        win.resizeTo(674, 541);
        win.setPosition("center");
    }
    else
    {
        $("header").hide();
        win.setMinimumSize(674, 86);
        win.resizeTo(674, 86);
        win.setResizable(false);
        body.addClass("smallP");
    }
}

function search()
{
    var searchInput = $(".searchInput"),
        value = searchInput.val().toLowerCase();

    if(value)
    {
        $(".SongBox").each(function(){
            if($(this).find(".SongName").attr("data-fullname").toLowerCase().indexOf(value) >= 0 || $(this).find(".SongArtist").attr("data-artist").toLowerCase().indexOf(value) >= 0)
            {
                $(this).show();
            }
            else
            {
                $(this).hide();
            }
        });
    }
    else
    {
        $(".SongBox").show();
    }
}

function toggleFullscreen(btn)
{
    if(!btn.hasClass("maximized"))
    {
        btn.addClass("maximized");
        win.maximize();
    }
    else
    {
        btn.removeClass("maximized");
        win.unmaximize();
    }
}

function menuItemClick(element)
{
    $(".sidebar li:not(.selfLinked)").removeClass("active");
    element.addClass("active");
    var pageItem = +element.attr("data-id");
    if(pageItem && PAGES[pageItem])
    {
        var current = PAGES[pageItem];
        loadPage(current.url, current.click);
    }
}

function loadPage(url, callback, container)
{
    var fs = require('fs');
    container = container ? container : $(".mainWrapper .content");
    fs.readFile(url, 'utf-8', function(err, data){
        container.html(data);
        if(callback && window[callback])
            window[callback]();
    });
}

function openUploadPopup()
{
    $("#AddSongInput").click();
    return true;
    var popup = $("#Popup"),
        popupContent = popup.find(".PopupContent .con");
    popup.fadeToggle();
    loadPage("assets/tpl/uploadChoose.html", function(){
        alert("loaded");
    }, popupContent);
    
}

function uploadTrackToLib(files)
{
    files = files && files.length ? files : document.getElementById("AddSongInput").files;
    if(files.length)
    {
        for(var i in files)
        {
            addNewTrack(files[i].path);
        }
    }
}

function getFileExt(fname)
{
    return fname.substr((~-fname.lastIndexOf(".") >>> 0) + 2);
}

function addNewTrack(path)
{
    if(path != undefined && path && path.length)
    {
        var allowedFileExt = ["mp3", "wav", "wma", "ogg", "flac", "mp4" ];
        var fileName = path.replace(/^.*(\\|\/|\:)/, '');
        var fileExt = getFileExt(path);

        if(allowedFileExt.indexOf((fileExt)) < 0)
        {
            alert(fileName + " is not a valid/supported music file");
            return false;
        }
        return TDB.checkTrackExist(path, function(e){
            if(!e.length)
            {
                fileName = fileName.substr(0, fileName.lastIndexOf('.'));

                getTrackDetails(fileName, path, function(Track){
                    TDB.addSong(Track);
                    var lastID = ap.addSong(Track);
                    Track.track_id = lastID;
                    ap.addSong(Track);
                    appendTrackToDom(Track, lastID);
                });
            }
            else
            {
                alert(fileName + " already exists!");
            }
        });
    }
}

function getTrackDetails(name, path, callback)
{
    var nameEdited = name.replace(/\(.*?\)/g, " ").replace(" ", "+");
    var result = {};
    var searchUrl = "https://itunes.apple.com/search?term=" + nameEdited;
    $.ajax({
        url: searchUrl,
        dataType: 'json',
        success: function(data){
            if(data.resultCount > 0)
            {
                var response = data.results[0];
                result = {
                    artist_name     : response.artistName,
                    album_name      : response.collectionName,
                    track_name      : response.trackName,
                    release_date    : response.releaseDate,
                    genre           : response.primaryGenreName,
                    date_added      : Date.now(),
                    pic             : response.artworkUrl100.replace("100x100", "200x200"),
                    track_number    : response.trackNumber,
                    path            : path,
                    length          : response.trackTimeMillis
                };
            }
            else
            {
                result = {
                    track_name: name,
                    path: path,
                    date_added: Date.now(),
                    pic : "assets/img/cover.jpg"
                };
            }

            callback(result);
        }
    });
}

function appendTracksToDom()
{
    for(var i in tl)
    {
        var currentIterated = tl[i];
        appendTrackToDom(currentIterated, i);
    }
}

function appendTrackToDom(Track, index)
{
    var Wrapper = $(".MusicList"),
        TrackName = Track.track_name,
        ArtistName = Track.artist_name ? Track.artist_name : "Unknown Artist",
        cloned = Wrapper.find(".SongBoxForClone").clone(false, false).attr("data-index", index);
        TrackName = TrackName.length > 25 ? TrackName.substring(0,21) + "..." : TrackName;
        ArtistName = ArtistName.length > 25 ? ArtistName.substring(0,21) + "..." : ArtistName;

        cloned.removeClass("SongBoxForClone").addClass("SongBox");
        cloned.find(".AlbumCover img").attr({
            src : Track.pic,
            title : TrackName
        });
        cloned.find(".SongName").attr("data-fullname", Track.track_name).text(TrackName);
        cloned.find(".SongArtist").attr("data-artist", Track.artist_name).text(ArtistName);
        cloned.attr("data-trackid", Track.track_id);

        Wrapper.append(cloned);
}

function initAudioPlayer(list, lastPlayedTrack, volume)
{
    init = true;
    ap = new AudioPlayerUI({
        el: document.getElementById("PlayerElement"),
        lastPlayedTrack: lastPlayedTrack,
        songs: list,
        savedVolume: (volume != 'undefined') ? volume : 1,
        songChanged: function(index){
            TDB.updateLastPlayedTrackID(tl[index].track_id);
        }
    });
}

function loadMainPage()
{
    TDB.getAllSongs(function(tracks){
        if(tracks)
        {
            TDB.getLastActions(function(e){
                var vol = e.length ? e[0].volume : 1;
                var lastPlayedTrack = e.length ? e[0].last_track_id : 0;
                var lastPlayedTrackIndex = 0;
                for(var i in tracks)
                {
                    var iteratedTrack = tracks[i];
                    tl[i] = {};
                    for(var x in iteratedTrack)
                    {
                        if(x == 'track_id' && lastPlayedTrack == iteratedTrack[x]) lastPlayedTrackIndex = i;
                        tl[i][x] = iteratedTrack[x];
                    }
                }
                if(!init)
                {
                    initAudioPlayer(tl, lastPlayedTrackIndex, vol);
                }
                appendTracksToDom();
            });
        }
    });
}