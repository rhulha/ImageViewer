var left = document.getElementById("left");
left.addEventListener("click", click);

var right = document.getElementById("right");
right.addEventListener("click", click);

function click(event) {
    var index = event.target.getAttribute("index") | 0;
    var dir = event.target == right;
    console.log(index, dir);
    if( event.shiftKey ) {
        fetch("/move?index="+index+"&dir="+dir).then(e=>{
            window.location = "view?index=" + index;
        });
    } else {
        window.location = "view?index=" + (index+ (dir?+1:-1));
    }
}

var viewer = document.getElementById("viewer");

function positionImage() {
	var halfW = window.innerWidth/2;
	var halfH = window.innerHeight/2;
	
	if( viewer.width > window.innerWidth ) {
		console.log("viewer.width > window.innerWidth");
		var ratio = window.innerWidth/viewer.width;
		console.log("ratio: " + ratio);
		viewer.width *= ratio;
		viewer.height *= ratio;
	}
	if( viewer.height > window.innerHeight ) {
		console.log("viewer.height > window.innerHeight");
		var ratio = window.innerHeight/viewer.height;
		console.log("ratio: " + ratio);
		viewer.height *= ratio;
		//viewer.width *= ratio;
	}

	var mediaHalfW = viewer.width/2;
	var mediaHalfH = viewer.height/2;
	viewer.style.left = (halfW-mediaHalfW)+"px";
	viewer.style.top = (halfH-mediaHalfH)+"px";
}
if( viewer.complete ) {
  positionImage();
} else {
  viewer.addEventListener('load', positionImage)
}


function positionVideo() {
	var halfW = window.innerWidth/2;
	var halfH = window.innerHeight/2;
	
	if( viewer.videoWidth > window.innerWidth ) {
		var ratio = window.innerWidth/viewer.videoWidth;
		viewer.videoWidth *= ratio;
		viewer.videoHeight *= ratio;
	}
	if( viewer.videoHeight > window.innerHeight ) {
		var ratio = window.innerHeight/viewer.videoHeight;
		viewer.videoWidth *= ratio;
		viewer.videoHeight *= ratio;
	}

	var mediaHalfW = viewer.videoWidth/2;
	var mediaHalfH = viewer.videoHeight/2;
	viewer.style.left = (halfW-mediaHalfW)+"px";
	viewer.style.top = (halfH-mediaHalfH)+"px";
}

viewer.addEventListener('loadedmetadata', function() {
   positionVideo();
}, false);
viewer.addEventListener('loaded', function() {
   positionVideo();
}, false);

viewer.ondragstart = function() { return false; };

document.body.addEventListener("wheel", e=>{
    viewer.width = viewer.width - e.deltaY;
});

var md = false;
var mdTarget, mdTargetPos, mdPageX, mdPageY, mdLeft, mdTop;

document.body.addEventListener("mousedown", function(e) {
    mdTarget = e.target;
    mdPageX = e.pageX;
    mdPageY = e.pageY;
    mdLeft = viewer.style.left ? parseFloat(viewer.style.left) : 0; // remove px
    mdTop = viewer.style.top ? parseFloat(viewer.style.top) : 0; // remove px
    md = true;
    //console.log("mousedown", mdPageX, mdPageY, mdLeft, mdTop);
});

document.body.addEventListener("mouseup", e=>md=false);

document.body.addEventListener("mousemove", function(e) {
    if( md) {
        //console.log("mousemove", e.pageX-mdPageX, e.pageY-mdPageY);
        viewer.style.left = (mdLeft + e.pageX-mdPageX) + "px";
        viewer.style.top = (mdTop + e.pageY-mdPageY) + "px";
    }
});