const functions = require('./functions')
const constants = require('./constants')

module.exports.homepage = function(req, res) {
    res.end("TV Team Parser App - downloads playlist.m3u8 and guide.xml, then remove unnecessary data");
}

module.exports.getGuide = function(req, res) {
    try {
        const channel = req.url.split('?channel=').pop();
        const result = functions.getProgrammes(channel);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(result);
    } catch (ex) {
        res.statusCode = 404;
        res.end(JSON.stringify(ex));
    }
}

module.exports.downloadGuide = function(req, res) {
    const guidePath = constants.DIR_FILES + constants.GUIDE_IPTV_MANAGER;
    const path = req.url.split('?path=').pop();
    console.log(1);
    if (path.match("gz$") != null) {
        console.log(2);
        functions.getGzipped(path, guidePath, function(err) {
            console.log(3);
            functions.formatGuide(guidePath);
            console.log(4);
            res.statusCode = 200;
            res.end(JSON.stringify({
                isSuccess: !err,
                error: err
            }));
        });
    } else {
        console.log(5);
        functions.download(path, guidePath, function(err) {
            console.log(6);
            //functions.formatGuide(guidePath);
            console.log(7);
            res.statusCode = 200;
            res.end(JSON.stringify({
                isSuccess: !err,
                error: err
            }));
        });
    }
}

module.exports.downloadFile = function(req, res) {
    const playlistPath = constants.DIR_FILES + constants.PLAYLIST_IPTV_MANAGER;
    const path = req.url.split('?path=').pop();
    functions.download(path, playlistPath, function(err) {
        try {
            const result = functions.readFile(playlistPath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(result);
        } catch (ex) {
            res.statusCode = 404;
            res.end(JSON.stringify(ex));
        }
    });
}

module.exports.getFile = function(req, res) {
    const filePath = constants.DIR_FILES + req.url.replace('/file/', '');
    if (functions.isFileExist(filePath)) {
        functions.getFile(res, filePath);
    } else {
        res.statusCode = 404;
        res.end();
    }
}

module.exports.saveFile = function(req, res) {
    if (req.method == 'POST') {
        
        const headers = req.headers;
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            let result = {
                isSuccess: true
            };
            try {
                functions.saveFile(headers, body);
            } catch (err) {
                result = {
                    isSuccess: false,
                    error: err
                };
            }
            
            res.writeHead(200, 'OK', {'Content-Type': 'text/plain; charset=utf-8'})
            res.end(JSON.stringify(result));
        })
    }
}