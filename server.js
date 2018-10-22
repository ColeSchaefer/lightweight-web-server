const config = require("./settings.json");
const http = require('http');
const url = require('url');
const fs = require('fs');

http.createServer((request, response) => {
    let pathname = url.parse(request.url).pathname;
    
    // Remove the trailing slash
    if (pathname[pathname.length - 1] == '/')
        pathname = pathname.substr(0, pathname.length - 1);
    
    logWithTimestamp(request.method + " " + pathname + "");
    
    // Determine the file extension
    let fileExtArr = pathname.split('.');
    let fileExtension = fileExtArr[fileExtArr.length - 1];
    
    // Variable for requested resource
    let reqFile = config.server.root + pathname.substr(1);
    
    fs.readFile(reqFile, function (err, data) {
        if (err) {
            switch (err.code) {
                
                // Can't 'readFile' because it's a directory.
                case 'EISDIR':
                    
                    // Determine index file.
                    let indexFile = 'index.html';
                    let reqDir = fs.readdirSync(reqFile);
                    reqDir.forEach((f) => {
                        if (f.includes('index'))
                            indexFile = f;
                    });
                    
                    // Read the determined index file.
                    fs.readFile(reqFile + '/' + indexFile, function (errr, data) {
                        
                        // Get the index file extension.
                        let indexFileArr = indexFile.split('.');
                        let indexExt = indexFileArr[indexFileArr.length - 1];
                        if(errr) { 
                            switch (errr.code) {
                                // No index file found for directory. Display directory listing instead.
                                case 'ENOENT':
                                default:
                                    response.writeHead(200, {'Content-Type': getMimeType(indexExt)});
                                    response.write(createDirectoryListing(reqFile, pathname, request));
                                    response.end();
                                    break;
                            }
                        } else {
                            // Display the index file.
                            response.writeHead(200, {'Content-Type': getMimeType(indexExt)});
                            response.write(data.toString());
                            response.end();
                        }
                        return;
                    });
                    break;
                // Requested resource is not a directory, but was not found.
                case 'ENOENT':
                default:
                    let errorCode = 404;
                    response.writeHead(errorCode, {'Content-Type': getMimeType('html')});
                    response.write(fs.readFileSync('./templates/' + errorCode + '.html'));
                    response.end();
                    break;
            }
        // Requested resource was found! Displaying content of resource.
        } else {
            response.writeHead(200, {'Content-Type': getMimeType(fileExtension)});
            response.write(data);	
            response.end();	
            return;
        }
    });
}).listen(config.server.port);
logWithTimestamp('Listening on port '.concat(config.server.port));

// Return the mime type of a file
function getMimeType(extension) {
    if (config.mimetypes[extension]) return config.mimetypes[extension];
    return config.mimetypes['txt'];
}
// Get human-readable permissions of a file
function getFilePermissions(info) {
    let mode = info.mode;
    let modes = [
        [1, 10, 100],
        [2, 20, 200],
        [4, 40, 400]
    ];
    let modeNum = [4, 4, 4];
    
    for (let i = 0; i < modes.length; i++) {
        for (let j = 0; j < modes[i].length; j++) {
            if (mode & parseInt(modes[i][j])) modeNum[i]++;
        }
    }
    
    return modeNum.join('');
}
// Get human-readable size of a file
function getFileSize(info) {
    if(info.isDirectory()) return 'Dir';
    if(info.isFile()) {
        let size = info.size;
        let ext = 'B';
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
}
// Round a floating decimal to X digits
function roundTo(n, digits) {
    if (digits === undefined)
        digits = 0;
    
    let multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    let test =(Math.round(n) / multiplicator);
    return +(test.toFixed(digits));
}
// Get content between 2 strings
function getBetween(content, start, end) {
  let arr = content.split(start);
  if(arr[1]) {
    return arr[1].split(end)[0];
  }
  return '';
}
// A console.log with timestamps
function logWithTimestamp(data) {
  console.log('[*] ' + new Date(Date.now()).toLocaleTimeString('en-US') + ' - ' + data);
}
// Create an indexed listing for a directory
function createDirectoryListing(dir, pathname, req) {
    
    let dirList = '';
    let dirArr = fs.readdirSync(dir);
    
    // Retrieve the directory listing template
    let stringBuilder = fs.readFileSync(config.templates.index);
    
    // Add a current directory option
    dirList += '<tr><td>';
    dirList += '<a href="http://' + req.headers.host + pathname + '/./">.</a>';
    dirList += '</td><td>';
    dirList += '&nbsp;';
    dirList += '</td><td>Dir</td></tr>';
    
    // Add a previous directory option
    dirList += '<tr><td>';
    dirList += '<a href="http://' + req.headers.host + pathname + '/../">..</a>';
    dirList += '</td><td>';
    dirList += '&nbsp;';
    dirList += '</td><td>Dir</td></tr>';
    
    // If the directory has content
    if(dirArr.length > 0) {
        // Add each resource to the directory listing..
        dirArr.forEach(function(f) {
            let fName = config.server.root + pathname.substr(1) + '/' + f;
            let fInfo = fs.statSync(fName);
            
            getFilePermissions(fInfo);
            
            dirList += '<tr><td>';
            dirList += '<a href="http://' + req.headers.host + pathname + '/' + f + '">' + f + '</a>';
            dirList += '</td><td>';
            dirList +=  getFilePermissions(fInfo);
            dirList += '</td><td>';
            dirList +=  getFileSize(fInfo);
            dirList += '</td></tr>';
            if(dirArr.length > 1) dirList += "\r\n";
        });
    }
    
    // Replace the content in the directory listing template
    stringBuilder = stringBuilder.toString().replace(/{{DIRECTORY}}/g, pathname);
    stringBuilder = stringBuilder.toString().replace(/{{LISTING}}/g, dirList);
    
    return stringBuilder;
}