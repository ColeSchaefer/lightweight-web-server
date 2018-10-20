const http = require('http');
const url = require('url');
const fs = require('fs');
const config = require("./settings.json");
const rootDirectory = config.server.root;

http.createServer( function (request, response) {  
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    
    var fileExtArr = pathname.split('.');
    var fileExtension = fileExtArr[fileExtArr.length - 1];
    var reqFile = rootDirectory + pathname.substr(1);
    
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

console.log('Listening on port '.concat(config.server.port));

function getMimeType(extension) {
    if (config.mimetypes[extension]) return config.mimetypes[extension];
    return config.mimetypes['bin'];
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
    var stringBuilder = fs.readFileSync(config.templates.index);
    
    var dirList = '';
    var dirArr = fs.readdirSync(dir);
    if(dirArr.length > 0) {
        dirArr.forEach(function(f) {
            let fName = rootDirectory + pathname.substr(1) + '/' + f;
            let fInfo = fs.statSync(fName);
            
            console.log('File info for ' + fName + ':');
            console.log(fInfo);
            
            dirList += '<tr>';
            dirList += '<td>';
            dirList += '<a href="http://' + req.headers.host +'/'+ pathname.substr(1) + '/' + f + '">';
            dirList += f;
            dirList += '</a>';
            dirList += '</td>';
            dirList += '<td style="float:right;">'
            dirList +=  getPrettySize(fInfo.size);
            dirList += '</td>';
            dirList += '</tr>';
            if(dirArr.length > 1) dirList += "\r\n";
        });
    } else {
        dirList = '<tr><td>Directory is empty.</td></tr>';
    }
    stringBuilder = stringBuilder.toString().replace(/{{DIRECTORY}}/g, pathname);
    stringBuilder = stringBuilder.toString().replace(/{{LISTING}}/g, dirList);
    return stringBuilder;
}
function getPrettySize(size) {
    let ext = 'bytes';
    if (size > 1024) {
        ext = 'kb';
        size /= 1024;
        
        if (size > 1024) {
            ext = 'MB';
            size /= 1024;
            
            if (size > 1024) {
                ext = 'GB';
                size /= 1024;
            }
        }
    }
    return (roundTo(size, 2)).toString() + ' ' + ext.toString();
}
function roundTo(n, digits) {
    if (digits === undefined)
        digits = 0;
    
    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    var test =(Math.round(n) / multiplicator);
    return +(test.toFixed(digits));
}