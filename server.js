const http = require('http');
const url = require('url');
const fs = require('fs');
const config = require("./config/settings.json");
const mimes = require('./config/filetypes.json');

const rootDirectory = config.SERVER_ROOT;

http.createServer( function (request, response) {  
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    
    
    var fileExtArr = pathname.split('.');
    var fileExtension = fileExtArr[fileExtArr.length - 1];
    
    fs.readFile(rootDirectory + pathname.substr(1), function (err, data) {
        if (err) {
            if(err.code == 'EISDIR') {
                fs.readFile(rootDirectory + pathname.substr(1) + '/index.html', function (errr, data) {
                    if(errr) { 
                        if(errr.code == 'ENOENT') {
                            response.writeHead(404, {'Content-Type': getMimeType('html')});
                            response.write(createDirectoryListing(rootDirectory + pathname.substr(1), pathname, request));
                            response.end();
                        }
                    } else {
                        response.writeHead(200, {'Content-Type': getMimeType('html')});
                        response.write(data.toString());
                        response.end();
                    }
                    return;
                });
            }
            if(err.code == 'ENOENT') {
                response.writeHead(404, {'Content-Type': getMimeType('html')});
                response.write('PAGE NOT FOUND.');
                response.end();
            }
        } else {
            response.writeHead(200, {'Content-Type': getMimeType(fileExtension)});
            response.write(data);	
            response.end();	
            return;
        }
    });
    
}).listen(config.SERVER_PORT);

console.log('Listening on port '.concat(config.SERVER_PORT));

function getMimeType(extension) {
    if (mimes[extension]) return mimes[extension];
    return mimes['bin'];
}
function getBetween(content, start, end) {
  let arr = content.split(start);
  if(arr[1]) {
    return arr[1].split(end)[0];
  }
  return '';
}
function logWithTimestamp(data) {
  console.log('[*] ' + new Date(Date.now()).toLocaleTimeString('en-US') + ' - ' + data);
}
function createDirectoryListing(dir, pathname, req) {
    var dirArr = fs.readdirSync(dir);
    var stringBuilder = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN"><html>' + 
                        '<head><title>Index of ' + dir.replace(rootDirectory, '/') + '</title></head>' + 
                        '<body><h1>Index of ' + dir.replace(rootDirectory, '/') + '</h1>' +
                        '<table>';
    if(dirArr.length > 0) {
        dirArr.forEach(function(f) {
            stringBuilder += '<tr><td><a href="http://' + req.headers.host + pathname.substr(1) + '/' + f + '">' + f + '</a></td></tr>';
        });
    } else {
        stringBuilder += '<tr><td>Directory is empty.</td></tr>';
    }
    stringBuilder += '</table></body></html>';
    return stringBuilder;
}