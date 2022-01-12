const path = require('path')
const fs = require('fs')
const http = require("http")
const https = require('https')
const zlib = require("zlib")
const request = require('request');

const constants = require('./constants');

module.exports.download = function(uri, filename, callback) {
    request.head(uri, function(err, res) {
        err = res.statusCode === 200 
                ? null 
                : 'Status code was sent not equals 200 in response to ' + uri;
        if (err) {
            callback(err);
        } else {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        }
    });
}

module.exports.getGzipped = function(uri, filename, callback) {
    // buffer to store the streamed decompression
    var buffer = [];

    (uri.match("^https") !== null ? https : http).get(uri, function(res) {
        // pipe the response into the gunzip to decompress
        var gunzip = zlib.createGunzip();            
        res.pipe(gunzip);

        gunzip.on('data', function(data) {
            // decompression chunk ready, add it to the buffer
            buffer.push(data.toString())

        }).on("end", function() {
            fs.writeFileSync(filename, buffer.join(""));
            // response and decompression complete, join the buffer and return
            callback(); 

        }).on("error", function(e) {
            callback(e);
        })
    }).on('error', function(e) {
        callback(e)
    });
}

module.exports.getProgrammes = function(channel) {
    const guidePath = constants.DIR_FILES + constants.GUIDE_IPTV_MANAGER;
    const data = fs.readFileSync(guidePath, 'utf8');
    const regex = new RegExp('<programme.+channel="(' + channel + ')"(.|\r\n|\n|\r|\t)+?<\/programme>', 'gm');
    const matches = data.match(regex);
    let result = '';
    if (matches) {
        result = matches.map(line => line.replace(/<icon.*\/>/gm, '')).join('\n');
        result = formatProgramme(result);
    }
    return result;
}

module.exports.isFileExist = function(path) {
    return fs.existsSync(path);
}

module.exports.getFile = function(res, filePath) {
    const fileName = filePath.split('/').pop();
    const stat = fs.statSync(filePath);

    let headers = {
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=0',
        'Content-Description': 'File Transfer',
        'Content-Transfer-Encoding': 'binary',
        'Content-Disposition': 'attachment; filename="' + fileName + '"',
        'Content-Type': 'text/txt; charset=utf-8',
        'Content-Length': stat.size,
        'Last-Modified': new Date(stat.mtimeMs).toUTCString()
    };

    switch (true) {
        case fileName.endsWith('.xml'):
            headers = {
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
                'Access-Control-Allow-Headers': 'Range',
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
                ...headers
            }
            break;
        case fileName.endsWith('.gz'):
            headers = {
                ...headers,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
                'Access-Control-Allow-Headers': 'Range',
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
                'Content-Type': 'application/octet-stream'
            }
            break;
        case fileName.endsWith('.png'):
            headers = {
                ...headers,
                'Cache-Control': 'public, max-age=2592000',
                'Content-Type': 'image/png'
            }
            if (headers.hasOwnProperty('Content-Description')) {
                delete headers['Content-Description'];
            }
            if (headers.hasOwnProperty('Content-Transfer-Encoding')) {
                delete headers['Content-Transfer-Encoding'];
            }
            if (headers.hasOwnProperty('Content-Disposition')) {
                delete headers['Content-Disposition'];
            }
            break;
        default:
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
}

module.exports.readFile = function(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

module.exports.saveFile = function(headers, body) {
    let data = '';
    const filePath = constants.DIR_FILES + headers.file;
    if (headers.insert !== 'true' && fs.existsSync(filePath)) {
        data = fs.readFileSync(filePath, 'utf8');
    }
    fs.writeFileSync(filePath, data + body);

    if (headers.zipped !== 'true') {
        const fileContents = fs.createReadStream(filePath);
        const writeStream = fs.createWriteStream(filePath + '.gz');
        const zip = zlib.createGzip();
        fileContents.pipe(zip).pipe(writeStream);
    }
}

module.exports.formatGuide = function(filePath) {
    let data = fs.readFileSync(filePath, 'utf8');
    data = data.replace(/(\r\n|\n|\r|\t)/gm, '')
                .replace(/<\/channel>/gm, '</channel>\n')
                .replace(/<\/programme>/gm, '</programme>\n')
                .replace(/^\s*/gm, '');
    fs.writeFileSync(filePath, data);
}

var formatProgramme = function(data) {
    return data.replace(/(\r\n|\n|\r|\t)/gm, '')
                .replace(/<\/channel>/gm, '</channel>\n')
                .replace(/<\/programme>/gm, '</programme>\n')
                .replace(/^\s*/gm, ''); 
}