var http = require('http');
var url = require('url');

const routes = require('./app/routes')

var app_port = process.env.PORT || 80;

http.createServer(function(req, res) {
    //get url infomation
    var urlParts = url.parse(req.url);
 
    //direct the request to appropriate function to be processed based on the url pathname
    switch(true) {
        case urlParts.pathname === "/":
            routes.homepage(req, res);
            break;
        case urlParts.pathname === "/api/get-guide":
            routes.getGuide(req, res);
            break;
        case urlParts.pathname === "/api/download-guide":
            routes.downloadGuide(req, res);
            break;
        case urlParts.pathname === "/api/download-file":
            routes.downloadFile(req, res);
            break;
        case urlParts.pathname.match("^/file/") !== null:
            routes.getFile(req, res);
            break;
        case urlParts.pathname === "/api/save-file":
            routes.saveFile(req, res);
            break;
        case urlParts.pathname.match("^/.+(m3u8|xml|gz)$") !== null:
            routes.getFile(req, res);
            break;
        default:
            routes.homepage(req, res);
            break;
    }
}).listen(app_port);