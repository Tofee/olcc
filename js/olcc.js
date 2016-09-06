var GlobalBoards = {};
var GlobalBoardTabs = {};
var GlobalMyPosts = new Array();
var GlobalXPosts = new Array();
var GlobalCurTrib = '';
var GlobalPinni = null;
var GlobalPopup = null;
var GlobalProcessing = false;
var GlobalWindowFocus = true;
var GlobalFilters = new Array();

var norloge_exp = new RegExp("((?:1[0-2]|0[1-9])/(?:3[0-1]|[1-2][0-9]|0[1-9])#)?((?:2[0-3]|[0-1][0-9])):([0-5][0-9])(:[0-5][0-9])?([¹²³]|[:\^][1-9]|[:\^][1-9][0-9])?(@[A-Za-z0-9_]+)?", "");

function pointsToMyPost(ref) {
    for (var i=GlobalMyPosts.length; i--;) {
        if (pointsTo(GlobalMyPosts[i], ref)) {
            return true;
        }
    }
    return false;
}

function insertToPinni(post, postId, board, clock, login, info, message, realId) {
    var allposts = GlobalPinni.getElementsByTagName("div") || [];
    var curDiv = null;
    var curId = null;
    for (var i=allposts.length; i--;) {
        curDiv = allposts[i];
        curId = curDiv.getAttribute("id");
        if ((curId != "") && (curId < postId)) break;
        curId = null;
    }
    if (curId == null) {
        GlobalPinni.insertBefore(post, GlobalPinni.firstChild); //appendChild(post);
    }
    else {
        var next = curDiv.nextSibling;
        if (next) {
            GlobalPinni.insertBefore(post, next);
        }
        else {
            GlobalPinni.appendChild(post);
        }
    }
    var ind = 0;
    var prevPost = post.previousSibling;
    if (prevPost && (prevPost.nodeName.toLowerCase() == "div")) {
        var prevId = prevPost.getAttribute("id");
        if ((prevId.substr(0,10) == postId.substr(0,10)) &&
            (prevId.substr(13) == postId.substr(13))) {
            ind = parseInt(prevId.substr(10,2),10) + 1;
            if (ind == 1) {
                // L'indice est 1, ce qui signifie qu'un post de même horloge et
                // d'indice 0 existe juste avant, il faut donc mettre l'indice de
                // ce post à 1 et incrémenter à 2 l'indice du post courant
                var newPrevId = prevId.substr(0,10)+"01"+prevId.substr(12);
                prevPost.setAttribute("id", newPrevId);
                ind++;
                if (GlobalMyPosts.contains(prevId)) {
                    GlobalMyPosts.remove(prevId)
                    GlobalMyPosts.push(newPrevId);
                }
            }
        }
    }
    var newId = postId.substr(0,10) + pad0(ind) + postId.substr(12);
    post.setAttribute("id", newId);
    var fmessage = message;
    [writeClocks, writeBigorno, writeTotoz, writeLecon].each(function(f){fmessage = f(fmessage, board, newId, post);});
    fmessage = writePlonk(fmessage, board, post, login, info);
    if (settings.value('balltrap')) {
        fmessage = writeDuck(fmessage, board, post, newId);
    }
    var cclass = "clock";
    if (seemsToBePostedByMe(board, login, info, realId)) {
        cclass += " mypost";
        GlobalMyPosts.push(newId);
        addClass(post, "mypost");
    }
    post.innerHTML = '\n<div class="post"><span class="'+cclass+'" title="'+realId+' ['+board.name+']">' + clock + '</span> '
        + formatLogin(login, info) + ' <span class="message">' + fmessage + '</span></div>\n';
    if (GlobalFilters.length > 0) {
        var pclass = post.className; // getAttribute('class');
        post.style.display = 'none';
        for (var i=GlobalFilters.length; i--;) {
            if (pclass.indexOf(GlobalFilters[i]) != -1) {
                post.style.display = '';
                break;
            }
        }
    }
    // Toujours ouvrir les urls dans un autre onglet
    var urls = post.getElementsByTagName('a');
    for (i=0; i<urls.length;i++) {
        urls[i].setAttribute('target','_blank');
    }
    board.notify(NOTIF_NEW_POST, postId, post);
    // Effacement des posts en cas de dépassement de la taille maxi du pinnipède
    if (allposts.length > (2 * settings.value('pinni_size'))) {
        var i=0;
        if (settings.value('pinni_keep')) {
            // On n'efface pas les posts importants pour l'user
            while (i<allposts.length && allposts[i].className.match(/(mypost|answer|bigorno)/)) i += 2;
        }
        GlobalPinni.removeChild(allposts[i]);
    }
}

function getBoardFromAlias(alias) {
    var name = null;
    for (name in GlobalBoards) {
        if (alias.toLowerCase() == name) return name;
        if (GlobalBoards[name].alias.split(",").contains(alias.toLowerCase())) return name;
    }
    return null;
}

function onChangeTrib() {
    var trib = $("#tribune").val();
    var palmi = $('#message')[0];
    palmi.style.background = GlobalBoards[trib].color;
    // update des @tribune des horloges dans le palmi
    var message = palmi.value;
    var offset = 0;
    var indexes = new Array();
    // On recherche les indices des horloges
    var h = norloge_exp.exec(message);
    while(h && h.length > 0) {
        offset += h.index + h[0].length;
        if (h[6]) {
            var refboard = getBoardFromAlias(h[6].substr(1));
            if (refboard == trib) {
                indexes.push([offset, h[6].length]);
            }
        }
        else {
            if (trib != GlobalCurTrib) {
                indexes.push([offset, "@"+GlobalCurTrib]);
            }
        }
        // Recherche de la prochaine occurrence de norloge
        h = norloge_exp.exec(message.substr(offset));
    }
    // MAJ des references @tribune
    for (var i=indexes.length-1; i>=0; i--) {
        var pos_str = indexes[i];
        if (typeof(pos_str[1]) == 'number') {
            // effacement d'un @tribune devenu inutile
            message = message.substr(0, pos_str[0]-pos_str[1])+message.substr(pos_str[0]);
        }
        else {
            // ajout d'un @tribune
            message = message.substr(0, pos_str[0])+pos_str[1]+message.substr(pos_str[0]);
        }
    }
    palmi.value = message;
    // Mémorisation de la tribune courante
    GlobalCurTrib = trib;
}

function addTabToPinni(name) {
    var board = GlobalBoards[name];
    if (!board.getUrl) {
        alert("board "+name+" n'a pas d'url définie");
        return;
    }
    var tab = new BoardTab(board);
    GlobalBoardTabs[board.name] = tab;
    tab.addTab();
    (board.initstate == STATE_STOP) ? board.stop() : board.refresh();
    return board;
}

function initPage() {
    // Numéro de version
    //document.getElementById('version').innerHTML = VERSION;
    GlobalPinni = document.getElementById("pinnipede");
    //GlobalPopup = document.getElementById("popup");
    var boards = settings.value('active_boards');
    console.log(boards);
    for (var i=boards.length; i--;) {
        var name = boards[i];
        if (!GlobalBoards[name]) {
            var board = new Board(name, true);
            board.loadConfig();
            GlobalBoards[name] = board;
        }
        addTabToPinni(name);
    }
    // Ajout des onglets spéciaux
/*    var filters = {
        'mypost': "mes posts",
        'answer': "réponses",
        'bigorno': "bigorno&lt;",
        'newpost': "nouveaux",
        'pasplonk': "plonk"
    };
    var filter = null;
    for (var f in filters) {
        filter = document.createElement("div");
        filter.setAttribute('id', "filter-"+f);
        filter.className = "filter";
        filter.innerHTML = filters[f];
        document.getElementById("tabs-filters").appendChild(filter);
        addEvent(filter, "click", function(e){var z=e.target || e.srcElement; toggleFilter(z.getAttribute('id').substr(7));}, false);
    }*/
    // Ajout de la fenêtre d'aide au premier lancement si on est pas sur mobile
    //var help = document.getElementById('help');
    if (boards.length <= 0) {
        if (! (document.location.href.match(/iphone.html/) || document.location.href.match(/mobile.html/) )) {
            //help.style.display = 'block';
        }
        //dispConfig();
    }
    else {
        //help.style.display = 'none';
        onChangeTrib();
    }
}


$(document).ready(function(){

    getSoundList();
    settings.setDefault();
    settings.load();

    //addEvent(document.getElementById('palmi-list'), "change", onChangeTrib, false);
    initPage();
    //applyGlobalCSS();
    favicon.change(settings.value('favicon'), settings.value('window_title'));
    //addEvent(GlobalPinni, 'mouseover', onMouseOver, false);
    //addEvent(GlobalPinni, 'mouseout', onMouseOut, false);
    //addEvent(GlobalPinni, 'click', onClick, false);
    //addEvent(document, 'keydown', onKeyDown, false);
    //addEvent(document.getElementById('post-form'), 'submit', onSubmit, false);
    //addEvent(document.getElementById('totoz-form'), 'submit', onSubmit, false);
    //balltrap_init();
    // window.onresize = balltrap_init;
    //addEvent(window, 'resize', balltrap_init, false);

});
