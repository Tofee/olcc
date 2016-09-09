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

window.notified = function (notif) {
    if (GlobalWindowFocus) return;
    var titre = document.title.substr(0,1);
    switch (notif) {
        case NOTIF_NEW_POST:
            if (titre != "#" && titre != "@" && titre != "<") {
                favicon.change("../img/ico_new.png", "* " + settings.value('window_title'));
            }
            break;
        case NOTIF_ANSWER:
            favicon.change("../img/ico_reply.png", "# " + settings.value('window_title'));
            //if (settings.value('sound_enabled')) {
                // alert("coin");
            //    sound_play("../sound/"+settings.value('sound_reply'));
            //}
            break;
        case NOTIF_BIGORNO_ALL:
            if (titre != "@") {
                favicon.change("../img/ico_bigoall.png", "< " + settings.value('window_title'));
            }
            //if (settings.value('sound_enabled')) {
                // alert("meuh");
            //    sound_play("../sound/"+settings.value('sound_bigorno'));
            //}
            break;
        case NOTIF_BIGORNO:
            favicon.change("../img/ico_bigorno.png", "@< " + settings.value('window_title'));
            //if (settings.value('sound_enabled')) {
                // alert("meuh");
            //    sound_play("../sound/"+settings.value('sound_bigorno'));
            //}
            break;
    }
}

function onBlur(event) {
    var target = event.target || event.srcElement;
    if (target == window || target == document) {
        GlobalWindowFocus = false;
    }
}
addEvent(window, 'blur', onBlur, false);

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
    var trib = $("#tribune").val(); //TODO remplir
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

function toPinniBottom() {
    var test1 = GlobalPinni.scrollHeight;
    if (test1 > 0) {
        GlobalPinni.scrollTop = GlobalPinni.scrollHeight;
    }
    else {
        GlobalPinni.scrollTop = GlobalPinni.offsetHeight;
    }
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

    for (var i=boards.length; i--;) {
        var name = boards[i];
        if (!GlobalBoards[name]) {
            var board = new Board(name, true);
            board.loadConfig();
            GlobalBoards[name] = board;
        }
        addTabToPinni(name);
    }
    dispAll();

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

function sendPost() {
    var dest = $("#tribune").val();
    var palmi = document.getElementById('message');
    GlobalBoards[dest].post(palmi.value);
    palmi.value = '';
}

function pointsTo(postid, ref) {
    if (postid.substr(13) != ref.substr(16)) return false;
    if (postid.substr(0,8) != ref.substr(3,8)) return false;
    var postsec = postid.substr(8,2);
    var refsec = ref.substr(11,2);
    if (refsec == "--") return true;
    if (postsec != refsec) return false;
    var posti = postid.substr(10,2);
    var refi = ref.substr(13,2);
    if (refi == "--" || (refi == "01" && posti == "00")) return true;
    if (posti != refi) return false;
    return true;
}

function dispAll() {
    for (var name in GlobalBoardTabs) {
        var boardTab = GlobalBoardTabs[name];
        if (boardTab.board.state != STATE_LOADED) {
            boardTab.display();
        }
    }
    toPinniBottom();
}

function onMouseOver(event) {
    // Enlève le hilight
    var allhi = evalexp("//*[contains(@class,'hilight')]");

    for (var i=getLength(allhi); i--;) {
        unhilight(getItem(allhi, i));
    }
    //GlobalPopup.style.display = 'none';
    //GlobalPopup.innerHTML = '';

    var target = event.target || event.srcElement;
    // var name = target.nodeName.toLowerCase();
    var targetClass = target.className; // getAttribute('class');
    var targetId = target.getAttribute('id');
    if (!targetClass) return;
    if (targetClass.indexOf('clockref') != -1) {
        hilightRef(targetId);
    }
    else if (targetClass.indexOf('clock') != -1) {
        hilightPost(target.parentNode.parentNode.getAttribute('id'), target.parentNode.parentNode);
    }
    else if (targetClass.indexOf('totoz') != -1) {
        if (settings.value('totoz_mode') != TOTOZ_INLINE) {
            var totoz = getTotoz(targetId);
            showTotoz(totoz, event.clientX, event.clientY);
        }
    }
}

function onMouseOut(event) {
    var target = event.target || event.srcElement;
    var targetClass = target.className; // getAttribute('class');
    var targetId = target.getAttribute('id');
    if (!targetClass) return;
    if (targetClass.indexOf('totoz') != -1) {
        document.getElementById('totozImg[' + targetId + ']').style.display = 'none';
    }
}

function onClick(event) {
    var target = event.target || event.srcElement;
    var nodeClass = target.className;

    // Enlève la marque de notification
    GlobalWindowFocus = true;
    // document.title = settings.value('window_title');
    favicon.change(settings.value('favicon'), settings.value('window_title'));

    // Enlève le style newpost sur les DIVs
    var allDivs = evalexp("//div[contains(@class,'newpost')]");

    for (var i=getLength(allDivs); i--;) {
        var curdiv = getItem(allDivs, i);
        var dclass = getStyleClass('pinni-'+curdiv.getAttribute('id').split("@")[1]);
        if (curdiv.style.display != 'none' && (dclass && dclass.style.display != 'none')) {
            removeClass(curdiv, 'newpost');
        }
    }

    // Click sur un canard
    if (nodeClass.indexOf('canard') != -1) {
        var root = target.parentNode;
        while (root && root.nodeName.toLowerCase() != 'div') root = root.parentNode;
        // alert(root.getAttribute('id') + "\n" + root.parentNode.getAttribute('id'));
        // alert(settings.value('balltrap_mode'));
        switch (settings.value('balltrap_mode')) {
            case BALLTRAP_ONCLICK:
                // alert(root.parentNode.getAttribute('id'));
                launchDuck(root.parentNode.getAttribute('id'), (nodeClass.indexOf('table') != -1));
                break;
            case BALLTRAP_KILL:
                balltrap_kill(root.parentNode.getAttribute('id'));
                break;
        }
    }

    // Click sur un login
    else if (nodeClass.indexOf('login') != -1) {
        insertInPalmi(target.innerHTML.strip()+"< ");
    }

    // Click sur une norloge-référence
    else if (nodeClass.indexOf('clockref') != -1) {
        var ref = target.getAttribute('id');

        var query = "//div[contains(@class,'pinni-"+ref.substr(16)+"') and starts-with(@id,'"+ref.substr(3,8)+"')]";
        var allposts = evalexp(query);

        var curDiv = null;
        var curId = null;
        for (var i=getLength(allposts); i--;) {
            curDiv = getItem(allposts, i);
            curId = curDiv.getAttribute("id");
            if (pointsTo(curId, ref)) {
                GlobalPinni.scrollTop = document.getElementById(curId).offsetTop-event.clientY+GlobalPinni.offsetTop+6;
                //flash(document.getElementById(curId));
                break;
            }
        }
    }

    // Click sur la norloge d'un post
    else if (nodeClass.indexOf('clock') != -1) {
        var nodeId = target.parentNode.parentNode.getAttribute('id');
        console.log(nodeId.substr(13));
        setPalmiTrib(nodeId.substr(13));
        insertInPalmi(getCtxtClock(document.getElementById('tribune'), nodeId)+' ');
    }
}

function setPalmiTrib(trib) {
    var list = document.getElementById('tribune');
    console.log(list.value);
    if (trib == list.value) return;
    console.log('pouet');
    for (var i=list.options.length; i--;) {
        if (trib == list.options[i].value) {
            list.selectedIndex = i;
            onChangeTrib();
            break;
        }
    }
}

function insertInPalmi(text, pos) {
    var palmi = document.getElementById('message');
    if (pos) {
        insertTextAtCursor(palmi, text, pos);
    }
    else {
        insertTextAtCursor(palmi, text, text.length);
    }
}

function insertTextAtCursor(element, text, pos) {
    if (!pos) {
        pos = text.length;
    }
    var selectionEnd = element.selectionStart + pos;
    element.value = element.value.substring(0, element.selectionStart) + text +
        element.value.substr(element.selectionEnd);
    element.focus();
    element.setSelectionRange(selectionEnd, selectionEnd);
}

function onKeyDown(event) {
    var target = event.target || event.srcElement ;
    /*if (event.keyCode == 27) {
        bossMode();
    }
    else */if (target.id == 'message') {
        if (event.altKey) {
            var keychar = String.fromCharCode(event.keyCode).toLowerCase();
            switch(keychar) {
                case 'o':
                    insertInPalmi('_o/* <b>BLAM</b>! ');
                    break;
                case 'm':
                    insertInPalmi('====> <b>Moment ' + getSelectedText() +'</b> <====', 16);
                    break;
                case 'f':
                    insertInPalmi('#fortune ');
                    break;
                case 'b':
                    insertInPalmi('<b>' + getSelectedText()+'</b>', 3);
                    break;
                case 'i':
                    insertInPalmi('<i>' + getSelectedText()+'</i>', 3);
                    break;
                case 'u':
                    insertInPalmi('<u>' + getSelectedText()+'</u>', 3);
                    break;
                case 's':
                    insertInPalmi('<s>' + getSelectedText()+'</s>', 3);
                    break;
                case 't':
                    insertInPalmi('<tt>' + getSelectedText()+'</tt>', 4);
                    break;
                case 'p':
                    insertInPalmi('_o/* <b>paf!</b> ');
                    break;
//              case 'c':
//                insertInPalmi('\\o/ chauvounet \\o/');
//                break;
                case 'n':
                    insertInPalmi('ounet');
                    break;
                case 'g':
                    insertInPalmi('Ta gueule pwet');
                    break;
                case 'z':
                    insertInPalmi('Daubian is dying');
                    break;
            }
            switch(keychar) {
                case 'o':
                case 'm':
                case 'f':
                case 'b':
                case 'i':
                case 'u':
                case 's':
                case 't':
                case 'p':
//              case 'c':
                case 'n':
                case 'g':
                case 'z':
                    event.stopPropagation();
                    event.preventDefault();
            }
        }
    }
}

$(document).ready(function(){

    $(".pick-a-color").pickAColor();

    for (var name in GlobalBoards) {
        $("#preconfTribune").append('<option value="'+name+'">'+name+'</option>');
    }

    $("#preconfTribune").on("change", function(){
        var name = $(this).val();
        var board = GlobalBoards[name];
        $("#backendTribune").val(board.getUrl);
        $("#colorTribune").val(board.color.substr(1)).trigger('blur');
        $("#aliasTribune").val(board.alias);
        $("#nameTribune").val(board.name);
        $("#postTribune").val(board.postUrl);
        if(board.slip == SLIP_TAGS_RAW) {
            $("#slipTribune option[value=1]").prop('selected', true);
        } else {
            $("#slipTribune option[value=2]").prop('selected', true);
        }
        $("#datapostTribune").val(board.postData);

    });

    $("#confTribune").on('submit', function(e){
        e.preventDefault();
        saveBoardConfig($("#nameTribune").val());
        saveConfig();
        $("#confTribuneModal").modal('hide');
    });

    $("#config-form").on('submit', function(e){
        e.preventDefault();
        saveConfig();
        $(this).closest('.modal').modal('hide');
    });

    $("#confModal").on('show.bs.modal', function(e){
        loadConfig();
    });

    getSoundList();
    settings.setDefault();
    settings.load();

    //addEvent(document.getElementById('palmi-list'), "change", onChangeTrib, false);
    initPage();
    //applyGlobalCSS();
    favicon.change(settings.value('favicon'), settings.value('window_title'));

    addEvent(GlobalPinni, 'mouseover', onMouseOver, false);
    addEvent(GlobalPinni, 'mouseout', onMouseOut, false);
    addEvent(GlobalPinni, 'click', onClick, false);
    addEvent(document, 'keydown', onKeyDown, false);
    $("#form-message").on('submit', function(e){
        e.preventDefault();
        sendPost();
    });
    //addEvent(document.getElementById('post-form'), 'submit', onSubmit, false);
    //addEvent(document.getElementById('totoz-form'), 'submit', onSubmit, false);
    //balltrap_init();
    // window.onresize = balltrap_init;
    //addEvent(window, 'resize', balltrap_init, false);

    /** Smartphones specificities */
    //PreventGhostClick(GlobalPinni);
    //allow text selection
    delete Hammer.defaults.cssProps.userSelect;
    var mc = new Hammer.Manager(GlobalPinni);

    // Tap recognizer with minimal 2 taps
    mc.add( new Hammer.Tap({ event: 'doubletap', taps: 2 }) );
    // Single tap recognizer
    mc.add( new Hammer.Tap({ event: 'singletap' }) );

    mc.add( new Hammer.Swipe({event: 'swipe'}));

    // we want to recognize this simulatenous, so a quadrupletap will be detected even while a tap has been recognized.
    mc.get('doubletap').recognizeWith('singletap');
    // we only want to trigger a tap, when we don't have detected a doubletap
    mc.get('singletap').requireFailure('doubletap');


    /* Single tap on post : highlight ref post */
    mc.on('singletap', function(ev) {
        var target = $(ev.target);
        if(!target.hasClass('clockref')) {//évite la double sélection
            var parent = target.closest('.post-container');
            hilightPost(parent.attr('id'), parent[0]);
        }
    });
    mc.on('doubletap', function(ev) {
    });

    mc.on('swipe', function(ev) {
        if(ev.direction == Hammer.DIRECTION_LEFT && $("#wrapper").hasClass("toggled")) {
            $("#menu-toggle").trigger('click');
        } else if(ev.direction == Hammer.DIRECTION_RIGHT && !$("#wrapper").hasClass("toggled")) {
            $("#menu-toggle").trigger('click');
        }
    });

    var mc2 = new Hammer.Manager(document.getElementById("sidebar-wrapper"));
    mc2.add( new Hammer.Swipe({event: 'swipe'}));
    mc2.on('swipe', function(ev) {
        if(ev.direction == Hammer.DIRECTION_LEFT && $("#wrapper").hasClass("toggled")) {
            $("#menu-toggle").trigger('click');
        } else if(ev.direction == Hammer.DIRECTION_RIGHT && !$("#wrapper").hasClass("toggled")) {
            $("#menu-toggle").trigger('click');
        }
    });
});
