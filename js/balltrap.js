// Gestion des canards volants
var _x=300, _y=300, v=9, b=v*2, GlobalNumDucks=0, r=100, f=10, cx, cy;
$("#launchDuck").on('click', function(e){
   balltrapIcon();
});
function balltrapIcon() {
    if (GlobalNumDucks) {
        var divs = document.getElementsByTagName('div');
        for (var i=divs.length; i--;) {
            var curDiv = divs[i];
            if (curDiv.getAttribute('id') && curDiv.getAttribute('id').substr(0,5) == "duck-") {
                curDiv.a = 16;
                balltrap_tombe(curDiv);
                GlobalNumDucks--;
            }
            if (!GlobalNumDucks) break;
        }
        GlobalNumDucks = 0;
    }
    else {
        launchDuck('', false);
    }
}
function launchDuck(postid, is_table) {
    // alert("duck at: "+postid);
    if (GlobalNumDucks++ > (settings.value('max_ducks')-1)) return;
    var K = document.getElementById("balltrap");
    var d = K.cloneNode(true);
    d.setAttribute('id', 'duck-'+postid);
    if (is_table) { d.firstChild.src = "img/flapflap.gif"; }
    addEvent(d, "mousedown", function (){balltrap_touche(d);}, false);
    // d.onmousedown = balltrap_touche;
    d.x = ((Math.random()*(_x-(32+(2*b))))|0)+b;
    d.style.left = d.x+"px";
    d.y = (Math.random()*(_y-(32+(2*b))))+b;
    d.style.top = d.y+"px";
    d.dx = (((Math.random()*4)&1)*2)-1;
    balltrap_dir(d);
    d.c = 7;
    d.firstChild.style.right = (d.c*32)+"px";
    d.t = setInterval(function(){balltrap_move(d)},80+(Math.random()*30));
    K.parentNode.insertBefore(d,K);
}

function balltrap_move(d) {
    if ((d.dx!=1) && (d.x<b)) {
        d.dx = 1;
        d.c = 4;
        balltrap_dir(d);
    }
    else if ((d.dx==1) && ((d.x+32+b)>_x)) {
        d.dx = -1;
        d.c = 9;
        balltrap_dir(d);
    }
    if (((d.dy<0) && ((d.y<b) || ((d.dy<cy) && (cy<r)))) || ((d.dy>0) && ((d.y+32+b>_y) || ((d.y+32>cy) && (cy+r>_y))))) {
        d.dy=-d.dy;
    }
    d.c += d.dx;
    if (d.c>12) {
        d.c = 9;
        balltrap_dir(d);
    }
    else {
        if (d.c<=0) {
            d.c = 4;
            balltrap_dir(d);
        }
    }
    d.firstChild.style.right = (d.c*32)+"px";
    if ((d.c<5) || (d.c>8)) {
        d.x += d.dx*v;
        d.style.left = d.x+"px";
        d.y += d.dy;
        d.style.top = (d.y|0)+"px";
    }
}
function balltrap_tombe(d) {
    if (d.a++>15) {
        clearInterval(d.t);
        d.parentNode.removeChild(d);
    }
    else {
        d.x += d.dx*v;
        d.style.left = d.x+"px";
        d.y += 3*d.a;
        d.style.top = d.y+"px";
    }
}
function balltrap_touche(d) {
    GlobalNumDucks--;
    // alert(d);
    // ev = ev || window.event;
    // ev.stopPropagation();
    // ev.preventDefault();
    // var a = this;
    clearInterval(d.t); // clearInterval(this.t);
    // this.onmousedown = null;
    d.a = 0; // this.a = 0;
    s = d.firstChild.style; // s = this.firstChild.style;
    s.right = "416px";
    if (d.dx<0) { // if (this.dx<0) {
        s.right="0px";
    }
    var nodeId = d.getAttribute('id'); // var nodeId = this.getAttribute('id');
    balltrap_kill(nodeId.substr(5));
    d.t = setInterval(function(){balltrap_tombe(d);},80); // this.t = setInterval(function(){balltrap_tombe(a);},80);
}
function balltrap_kill(nodeId) {
    if (!nodeId || settings.value('balltrap_silent')) return;
    var board = nodeId.substr(13);
    setPalmiTrib(board);
    var d = document.getElementById(nodeId);
    // alert(nodeId + "\n"+d.innerHTML);
    var pan = '';
    if (d && d.innerHTML.toLowerCase().indexOf('<span class="canard table') != -1) {
        pan = " *tronçonneuse*";
    }
    else {
        pan = " pan ! pan !";
    }
    // insertInPalmi(getCtxtClock(nodeId)+pan);
    GlobalBoards[board].post(getCtxtClock($('#tribune li.selected').data('name'), nodeId)+pan);
}
function balltrap_dst(a, b, c) {
    a -= b;
    if (a<0) a = -a;
    return a<c;
}
function balltrap_dir(d) {
    if ((balltrap_dst(d.x, cx, 2*r)) && (balltrap_dst(d.y, cy, r))) {
        if (d.y>cy) d.dy = 5;
        else d.dy = -5;
    }
    else d.dy = 3*(1-(Math.random()*2));
}
function balltrap_mv(ev) {
    ev = ev || window.event;
    cx = ev.pageX || ev.clientX;
    cy = ev.pageY || ev.clientY;
    return false;
}
function balltrap_init() {
    addEvent(document, "mousemove", balltrap_mv, false);
    d = window;
    if (typeof(d.innerWidth) == 'number') {
        _x = d.innerWidth;
        _y = d.innerHeight;
    }
    else if ((d = document.documentElement) && d.clientWidth) {
        _x = d.clientWidth;
        _y = d.clientHeight;
    }
    else if ((d = document.body) && d.clientWidth) {
        _x = d.clientWidth;
        _y = d.clientHeight;
    }
}
