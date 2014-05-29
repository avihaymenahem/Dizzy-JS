function getFileExt(fname){
    return fname.substr((~-fname.lastIndexOf(".") >>> 0) + 2);
}

function loadPage(url, callback, container){
    var fs = require('fs');
    container = container ? container : $(".mainWrapper .content");
    fs.readFile(url, 'utf-8', function(err, data){
        container.html(data);
        if(callback && window[callback])
            window[callback]();
    });
}