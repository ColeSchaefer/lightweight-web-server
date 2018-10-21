const config = require("./settings.json");
const http = require('http');
const url = require('url');
const fs = require('fs');

http.createServer( function (request, response) {  
    let pathname = url.parse(request.url).pathname;
    
    // Remove the trailing slash.
    if (pathname[pathname.length - 1] == '/')
        pathname = pathname.substr(0, pathname.length - 1);
    
    logWithTimestamp("Request for " + pathname + " received.");
    
    let fileExtArr = pathname.split('.');
    let fileExtension = fileExtArr[fileExtArr.length - 1];
    let reqFile = config.server.root + pathname.substr(1);
    
    fs.readFile(reqFile, function (err, data) {
        if (err) {
            if(err.code == 'EISDIR') {
                fs.readFile(reqFile + '/index.html', function (errr, data) {
                    if(errr) { 
                        if(errr.code == 'ENOENT') {
                            response.writeHead(200, {'Content-Type': getMimeType('html')});
                            response.write(createDirectoryListing(reqFile, pathname, request));
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
                let errorCode = 404;
                response.writeHead(errorCode, {'Content-Type': getMimeType('html')});
                response.write(fs.readFileSync('./templates/' + errorCode + '.html'));
                response.end();
            }
        } else {
            response.writeHead(200, {'Content-Type': getMimeType(fileExtension)});
            response.write(data);	
            response.end();	
            return;
        }
    });
    
}).listen(config.server.port);
logWithTimestamp('Listening on port '.concat(config.server.port));

function getMimeType(extension) {
    if (config.mimetypes[extension]) return config.mimetypes[extension];
    return config.mimetypes['bin'];
}
function createDirectoryListing(dir, pathname, req) {
    let stringBuilder = fs.readFileSync(config.templates.index);
    
    let dirList = '';
    let dirArr = fs.readdirSync(dir);
    
    // Add a current directory option.
    dirList += '<tr><td>';
    dirList += '<a href="http://' + req.headers.host + pathname + '/./">.</a>';
    dirList += '</td><td style="float:right;">Dir</td></tr>';
    
    // Add a previous directory option.    
    dirList += '<tr><td>';
    dirList += '<a href="http://' + req.headers.host + pathname + '/../">..</a>';
    dirList += '</td><td style="float:right;">Dir</td></tr>';
    
    
    if(dirArr.length > 0) {
        dirArr.forEach(function(f) {
            let fName = config.server.root + pathname.substr(1) + '/' + f;
            let fInfo = fs.statSync(fName);
            
            dirList += '<tr><td>';
            dirList += '<a href="http://' + req.headers.host + pathname + '/' + f + '">' + f + '</a>';
            dirList += '</td><td style="float:right;">'
            dirList +=  getPrettySize(fInfo);
            dirList += '</td></tr>';
            if(dirArr.length > 1) dirList += "\r\n";
        });
    } else {
        dirList += '<tr><td>Directory is empty.</td></tr>';
    }
    stringBuilder = stringBuilder.toString().replace(/{{DIRECTORY}}/g, pathname);
    stringBuilder = stringBuilder.toString().replace(/{{LISTING}}/g, dirList);
    return stringBuilder;
}
function getPrettySize(info) {
    // TODO: Determine if file is a directory or not.
    let size = info.size;
    let ext = 'bytes';
    let sizes = ['KB', 'MB', 'GB', 'TB'];
    for(let i = 0; i < sizes.length; i++) {
        if(size > 1024) {
            ext = sizes[i];
            size /= 1024;
        } else { 
            return (roundTo(size, 2)).toString() + ' ' + ext.toString();
        }
    }
}
function roundTo(n, digits) {
    if (digits === undefined)
        digits = 0;
    
    let multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    let test =(Math.round(n) / multiplicator);
    return +(test.toFixed(digits));
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