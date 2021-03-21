// This code is based on https://medium.com/@amitgupta15/node-js-server-without-express-bf22903355ad

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
  '.webm': 'video/webm'
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
    handler(requestData, (statusCode = 200, data = {}) => {
      response.writeHead(statusCode);
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
  return fs.readdirSync(__dirname).filter(e=>e.endsWith(".jpg")||e.endsWith(".png")||e.endsWith(".mp4")||e.endsWith(".webm"));
}

const indexHandler = (requestData, callback) => {
  var s = "";
  var files = getMediaFiles();
  files.forEach(file => {
    var index = files.indexOf(file);
    s += '<br/><a href="view?index='+index+'&img='+file+'">'+file+'</a>\r\n';
  });
  callback(200, '<html><body>\r\n'+s+'</body></html>\r\n');
}

const redDot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

const viewHandler = (requestData, callback) => {
  var s = '<html><head><link rel="stylesheet" href="style.css"></head>\r\n';
  s+='<body>\r\n';
  //s+='<p style="text-align:center">\r\n';
  //s+='</p>\r\n';
  var files = getMediaFiles();
  var index = requestData.query.index | 0;
  var imageName = index >= 0 && index < files.length ? files[index] : redDot;
  if( imageName.endsWith(".mp4") || imageName.endsWith(".webm")) {
    s+='<video id="viewer" src="'+imageName+'" controls></video>\r\n';
  } else {
    s+='<img id="viewer" src="'+imageName+'">\r\n';
  }
  s+='<div id="left" index="'+index+'">'+imageName+'</div>\r\n'
  s+='<div id="right" index="'+index+'">'+imageName+'</div>\r\n'
  s+='<script src="script.js"></script>\r\n';
  s+='</body></html>\r\n';
  callback(200, s);
}

function moveHandler(requestData, callback) {
  var index = requestData.query.index | 0;
  var dir = (requestData.query.dir === 'true');
  var files = getMediaFiles();
  console.log('moveHandler', index, dir);

  var imageName = index >= 0 && index < files.length ? files[index] : undefined;

  if(imageName) {
    var newPath = __dirname+'/'+ (dir?"Important":"Not_Important") + '/' + imageName;
    fs.rename(__dirname+'/'+imageName, newPath, function (err) {
      if (err) 
		console.log(err);
	  else
	    console.log('Successfully moved!');
    });
  }
  callback(200, "ok");
}

server.setAllowedPaths({'/': indexHandler, '/view': viewHandler, '/move': moveHandler});
server.init();

