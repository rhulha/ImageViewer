/* eslint-env es6 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const server = {};

const baseDir = __dirname; // path.join(__dirname, '../');

const mimeTypes = {
    '.html': 'text/html',
    '.jpg': 'image/jpeg',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.webp': 'image/webp',
    '.glb': 'model/gltf-binary'
};

server.getContentType = url => {
    let contentType = 'application/octet-stream';
    const extname = path.extname(url);
    console.log(extname)
    for (let key in mimeTypes) {
        if (mimeTypes.hasOwnProperty(key)) {
            if (extname === key) {
                contentType = mimeTypes[key];
            }
        }
    }
    return contentType;
};

server.serveStaticContent = (pathname, response) => {
    pathname = decodeURI(pathname);
    console.log(pathname)
    const contentType = server.getContentType(pathname);
    console.log(contentType)
    response.setHeader('Content-Type', contentType);
    fs.readFile(`${baseDir}${pathname}`, (error, data) => {
        if (!error) {
            response.writeHead(200);
            response.end(data);
        } else {
            response.writeHead(404);
            response.end('404 - File Not Found');
        }
    });
};

let allowedPaths = {};

server.getAllowedDynamicPath = path => {
    for (const key in allowedPaths) {
        if (allowedPaths.hasOwnProperty(key)) {
            if (path === key) {
                return path;
            }
        }
    }
    return false;
};

server.serveDynamicContent = (request, response) => {
    const method = request.method.toLowerCase();
    const parsedUrl = url.parse(request.url, true);
    const { pathname, query } = parsedUrl;
    response.setHeader('Cache-Control', "no-cache");

    let buffer = [];
    request.on('error', error => {
        console.log('Error Occurred', error);
        response.writeHead(500);
        response.end('Error occurred:', error);
    });
    request.on('data', chunk => {
        buffer.push(chunk);
    });
    request.on('end', () => {
        buffer = Buffer.concat(buffer);

        const requestData = {
            method,
            pathname,
            query,
            buffer,
        };
        const handler = allowedPaths[pathname];
        handler(requestData, (statusCode = 200, contentType, data = {}) => {
            response.writeHead(statusCode, {
                'Content-Length': Buffer.byteLength(data),
                'Content-Type': contentType
            });
            response.end(data);
        });
    });
};
const httpServer = http.createServer((request, response) => {
    const pathname = url.parse(request.url, false).pathname;
    const dynamicPath = server.getAllowedDynamicPath(pathname);
    if (dynamicPath) {
        server.serveDynamicContent(request, response);
    } else {
        server.serveStaticContent(pathname, response);
    }
});
server.setAllowedPaths = paths => {
    allowedPaths = paths;
};

server.init = (port = 3000, host = '127.0.0.1') => {
    httpServer.listen(port, host, () => {
        console.log(`Server is listening at http://${host}:${port}`);
    });
};

/// APP CODE STARTS HERE:

function getMediaFiles() {
    return fs.readdirSync(__dirname).filter(e => e.endsWith(".glb"));
}

const indexHandler = (requestData, callback) => {
    fs.readFile("index.html", (error, data) => {
        if (!error) {
            callback(200, 'text/html', data);
        } else {
            callback(404, 'text/html', '404 - File Not Found');
        }
    });

}

const getFileList = (requestData, callback) => {
    var files = getMediaFiles();
    callback(200, 'application/json', JSON.stringify(files));
}

server.setAllowedPaths({ '/': indexHandler, '/getFileList': getFileList });
server.init();
