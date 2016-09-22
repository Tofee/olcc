/************************************************************
 * OnlineCoinCoin, by Chrisix (chrisix@gmail.com)
 * Définition de la classe Board, gérant une tribune
 ************************************************************/

function Board(name, perso) {
  // Données statiques
  this.name = name;
  this.perso = perso;
  this.getUrl = '';
  this.postUrl = '';
  this.postData = 'message=%m';
  this.slip = SLIP_TAGS_ENCODED;
  
  // Données configurables
  this.color = '#dac0de';
  this.alias = '';
  this.delay = DEFAULT_TIMEOUT;
  this.login = '';
  this.ua = '';
  this.cookie = '';
  this.lastModified = null;
  this.initstate = STATE_IDLE;
  // this.plonk = '';
  
  // Données dynamiques
  this.lastId = 0;
  this.state = STATE_LOADED;
  this.timer = null;
  this.nbPosts = 0;
  
  this.views = new Array();
}

// Board est un observable
Board.prototype.addView = function (view) {
    if (!this.views.contains(view)) {
        this.views.push(view);
    }
}
Board.prototype.removeView = function (view) {
    this.views.remove(view);
}
Board.prototype.notify = function () {
    var args = arguments;
    for(var i=this.views.length; i--;) {
        this.views[i].notified.apply(this.views[i], args);
    }
}

// Mise à jour de la css de la board (couleur de fond)
function BoardUpdateCSS(board) {
    var bclass = "background: "+board.color+";";
    /*var css = addCSSClass("tab-"+board.name, bclass);
    css.style.background = board.color;*/

    var bcolor = "transparent";

    bclass += "border-color:"+bcolor+";";
    css = addCSSClass("pinni-"+board.name, bclass);
    css.style.background = board.color;
    css.style.borderColor = board.color;
}
Board.prototype.updateCSS = function () { BoardUpdateCSS(this); };

// Change l'état de la tribune, affiche l'éventuel indicateur correspondant
function BoardSetState(board, state) {
    board.state = state;
    board.notify(NOTIF_STATE, state);
}
Board.prototype.setState = function (state) { BoardSetState(this, state); };

// Chargement de la config
function BoardLoadConfig(board) {
    var settings = getCookie(board.name);
    if (settings) {
        var pairs = settings.split("\n");
        for (var i=pairs.length; i--;) {
            var opt_val = pairs[i];
            var eqpos = opt_val.indexOf('=');
            var opt = opt_val.substr(0, eqpos);
            var val = opt_val.substr(eqpos+1, opt_val.length);
            switch(opt) {
              case "getUrl":
                board.getUrl = val;
                break;
              case "postUrl":
                board.postUrl = val;
                break;
              case "postData":
                board.postData = val;
                break;
              case "slip":
                board.slip = val;
                break;
              case "color":
                board.color = val;
                break;
              case "login":
                board.login = val;
                break;
              case "ua":
                board.ua = val;
                break;
              case "cookie":
                board.cookie = val;
                break;
              case "alias":
                board.alias = val;
                break;
              case "delay":
                board.delay = eval(val)*1000;
                break;
              case "initstate":
                board.initstate = val;
                break;
            }
        }
    }
}
Board.prototype.loadConfig = function () { BoardLoadConfig(this); };

// Sauvegarde des données configurables
function BoardSaveConfig(board) {
    var tab = new Array();
    tab.push("login="+board.login);
    tab.push("ua="+board.ua);
    tab.push("color="+board.color);
    tab.push("cookie="+board.cookie);
    tab.push("alias="+board.alias);
    tab.push("delay="+(board.delay/1000));
    tab.push("initstate="+board.state);
    if (board.perso) {
        tab.push("getUrl="+board.getUrl);
        tab.push("postUrl="+board.postUrl);
        tab.push("postData="+board.postData);
        tab.push("slip="+board.slip);
    }
    setCookie(board.name, tab.join("\n"), 10000);
}
Board.prototype.saveConfig = function () { BoardSaveConfig(this); };

// Démarre une tribune (lancement du timer d'auto-refresh)
function BoardStart(board) {
    if (board.state == STATE_LOADED) {
        return;
    }
    board.setState(STATE_IDLE);
    if (!board.timer) {
        board.refresh();
    }
}
Board.prototype.start = function () { BoardStart(this); };

// Arrête une tribune (annule l'auto-refresh)
function BoardStop(board) {
    if (board.state == STATE_LOADED) {
        return;
    }
    if (board.timer) {
        window.clearTimeout(board.timer);
        board.timer = null;
    }
    board.setState(STATE_STOP);
}
Board.prototype.stop = function () { BoardStop(this); };

// Refresh immédiat de la tribune
function BoardRefresh(board) {
    if (board.state == STATE_LOADED) {
        return;
    }
    if (board.timer) {
        window.clearTimeout(board.timer);
        board.timer = null;
    }
    board.getBackend();
}
Board.prototype.refresh = function () { BoardRefresh(this); };

function BoardProcessBackend(board, xhr) {
    try {
        var status = xhr.status;
    }
    catch(err) {
        board.setState(STATE_HTTP_ERROR);
        board.timer = window.setTimeout(function () { BoardRefresh(board); }, board.delay);
        return;
    }
    if (status == 200) {
        board.setState(STATE_PARSE);
        // alert(xhr.getAllResponseHeaders());
        var cookie = xhr.getResponseHeader("X-Olcc-Set-Cookie");
        // alert(cookie);
        if (cookie && !board.cookie) board.cookie = cookie;
        board.lastModified = xhr.getResponseHeader("X-Olcc-Last-Modified");
        var res = xhr.responseText;
        if (res.substr(0,6) == 'Error:') {
            board.setState(STATE_HTTP_ERROR);
        }
        else {
            var slip = loadXML(res);
            if (no_xpath) {
                var postNodes = slip.getElementsByTagName("post");
                var i = postNodes.length;
            }
            else {
                var postNodes = evalXPath(slip, '//post[@id > ' + board.lastId + ']');
                var i = getLength(postNodes); // snapshotLength
            }
            var toScroll = false;
            var hasNews = false;
            if (i > 0) {
                // Test si le dernier post du pinni est visible, pour savoir si on
                // aura besoin de scroller après avoir inséré les nouveaux posts
                var allposts = GlobalPinni.getElementsByTagName("div");
                if (allposts.length > 0) {
                    var yLastPost = allposts[allposts.length-1].offsetTop;
                    var toScroll = (yLastPost < (GlobalPinni.scrollTop + window.innerHeight - 40));
                }
                else {
                    toScroll = true;
                }
                // alert("tribune "+board.name+": "+i+" posts dans le backend");
            }
            while (--i >= 0) {
                var postNode = getItem(postNodes, i);
                var currentId = parseInt(postNode.getAttribute('id'));
                if (currentId > board.lastId) {
                    var timestamp = postNode.getAttribute('time');
                    var hour = timestamp.substring(8);
                    var clock = hour.substr(0,2) + ':' + hour.substr(2,2) + ':' + hour.substr(4,2); 
                    var login = getNodeText(postNode.getElementsByTagName('login')[0]);
                    var info = getNodeText(postNode.getElementsByTagName('info')[0]);
                    var msgNode = postNode.getElementsByTagName('message')[0];
                    if (board.slip == SLIP_TAGS_ENCODED) {
                        message = getNodeText(msgNode);
                    }
                    else {
                        message = serializeNodes(msgNode, "message");
                    }
                    var post = document.createElement('div');
                    // Construction de l'id interne du post au format MMDDhhmmssii@board
                    var postid = timestamp.substr(4, timestamp.length)+'99@'+board.name;
                    post.setAttribute("id", postid);
                    addClass(post, "pinni-"+board.name);
                    addClass(post, "newpost");
                    addClass(post, "post-container");
                    insertToPinni(post, postid, board, clock, login, info, message, currentId);
                    board.nbPosts++;
                    board.lastId = currentId;
                    board.notify(NOTIF_NEW_POST, postid, post);
                    hasNews = true;
                }
            }
            if (toScroll) {
                toPinniBottom();
            }
            /*if (!GlobalWindowFocus && hasNews && settings.value('sound_enabled')) {
                // alert(GlobalIsPlaying);
                sound_play("sound/"+settings.value('sound_new'));
            }*/
            board.setState(STATE_IDLE);
        }
    }
    else if (status == 304) { /* Not Modified */
      board.setState(STATE_IDLE);
    }
    else {
      board.setState(STATE_HTTP_ERROR);
    }
    board.timer = window.setTimeout(function () { BoardRefresh(board); }, board.delay);
}
Board.prototype.process = function (xhr) { BoardProcessBackend(this, xhr); };

function BoardGetBackend(board) {
    board.setState(STATE_HTTP);
    var xhr = new XMLHttpRequest();
    // Le paramètre random est là pour IE6 qui ne tient pas compte des directives de cache
    var get_url = 'backend.php?r='+Math.random();
    if (board.cookie) get_url += '&cookie='+escape(board.cookie);
    if (board.lastModified) get_url += '&lastModified=' + escape(board.lastModified);
    get_url += '&url='+to_url(board.getUrl.replace("%i", board.lastId || ""));
    xhr.open('GET', get_url, true);
    xhr.onreadystatechange = function() {
        switch (xhr.readyState) {
          case 4:
            BoardProcessBackend(board, xhr);
            break;
          default:
            // inprogress(xhr);
            break;
        }
      }
    try {
        xhr.send(null);
    }
    catch(err) {
        board.setState(STATE_HTTP_ERROR);
        board.timer = window.setTimeout(function () { BoardRefresh(board); }, board.delay);
    }
}
Board.prototype.getBackend = function () { BoardGetBackend(this); };

function BoardPost(board, msg) {
    board.setState(STATE_HTTP);
    var message = msg.replace(/\+/g, "#{plus}#");
    message = message.replace(/\&/g, "#{amp}#");
    message = message.replace(/\;/g, "#{dcomma}#");
    message = message.replace(/\%/g, "#{percent}#");
    var postdata = board.postData.replace("%m", message);
    var data = 'ua=' + to_url(board.ua || settings.value('default_ua'))
             + '&cookie=' + escape(board.cookie)
             + '&posturl=' + escape(board.postUrl)
             + '&postdata=' + to_url(postdata);

    $.post('post.php', data, function(data, status, xhr){
        BoardPostResult(board, xhr);
    }).fail(function(xhr, status, error){
        if(xhr.status != 302 ) {
            $("#message").popover({
                html: true,
                placement: 'top',
                trigger: 'focus',
                content: error
            }).popover('show');
        } else {
            BoardPostResult(board, xhr);
        }
    });

}
Board.prototype.post = function (msg) {
    BoardPost(this, msg);
};

function BoardPostResult(board, xhr) {
    try {
        //alert("Post status="+xhr.status);
        //alert(xhr.responseText);
        if (xhr.status == 200) {
            var res = eval(xhr.responseText);
            // alert(""+res);
            if (res['SetCookie'] && !(board.cookie)) {
               // board.tmpcookie = true;
               board.cookie = res['SetCookie'];
            }
            if (res['XPostId']) {
                GlobalXPosts.push(res['XPostId']+'@'+board.name);
            }
        }
    }
    catch(err) {
        board.setState(STATE_HTTP_ERROR);
    }
    board.refresh();
}
Board.prototype.postResult = function (xhr) { BoardPostResult(this, xhr); };

/****************************************************
 * L'onglet matérialisant une tribune active
 ****************************************************/

function BoardTab(board) {
    this.board = board;
    this.visible = false;
}

function BoardTabAddTab (boardTab) {
    var board = boardTab.board;
    if (boardTab.tab()) {
        return;
    }
    // Ajout de l'onglet
    board.loadConfig();
    board.updateCSS();
    var tab = $('<li id="'+"tab-"+board.name+'" class="'+"tab tab-"+board.name+'"><a href="#"><span class="glyphicon glyphicon-check"></span> '+board.name+' </a></li>');

    //TODO gérer ailleurs
    addEvent(tab[0], "click", function (e) { clickBoard(board.name, e); }, false);
    //visible
    boardTab.visible = true;

    var icon = $('<img src="img/stop.png">');
    tab.find('a').append(icon);

    var notif = $('<span class="tab-notif" id="tab-notif-'+board.name+'"></span>');
    tab.find('a').append(notif);

    var tabtab = $('<span class="tab-color">&nbsp;</span>');
    tabtab.css('background-color', board.color);
    tab.find('a').append(tabtab);

    $("#tabs-boards").append(tab);

    board.addView(boardTab);
    board.addView(window);
    // Mise à jour de l'état
    board.setState(STATE_STOP);
    // Ajout de la tribune dans la liste du palmipède

    var palmilist = $('#tribune');

    var opt = $('<li data-name="'+board.name+'"><a href="#">'+board.name+'</a></li>');
    palmilist.append(opt);
}
BoardTab.prototype.addTab = function () { BoardTabAddTab(this); };

BoardTab.prototype.tab = function () {
    return document.getElementById("tab-"+this.board.name);
}
BoardTab.prototype.icon = function () {
    return document.getElementById("tab-"+this.board.name).getElementsByTagName("img")[0];
}
BoardTab.prototype.text = function () {
    return document.getElementById("tab-notif-"+this.board.name); //.getElementsByTagName("span")[0];
}

function BoardTabNotified(boardTab, notif, arg) {
    switch (notif) {
      case NOTIF_STATE:
        switch (arg) {
          case STATE_LOADED:
            break;
          case STATE_STOP:
            boardTab.icon().src = "img/stop.png";
            break;
          case STATE_IDLE:
            // _log.debug("mais pouet quoi");
            boardTab.icon().src = "img/blank.gif";
            break;
          case STATE_HTTP:
            boardTab.icon().src = "img/refresh.png";
            break;
          case STATE_PARSE:
            boardTab.icon().src = "img/parse.png";
            break;
          case STATE_POST:
            boardTab.icon().src = "img/sendpost.png";
            break;
          case STATE_HTTP_ERROR:
            boardTab.icon().src = "img/error.png";
            break;
          case STATE_PARSE_ERROR:
            // AFR ajout icone erreur parsing
            break;
          case STATE_POST_ERROR:
            // AFR ajout icone post fail
            break;
        }
        break;
      case NOTIF_NEW_POST:
        var notifzone = boardTab.text();
        var char1 = notifzone.innerHTML.substr(0,1);
        if (char1 != "#" && char1 != "@" && char1 != "&") {
            if (!boardTab.visible) {
                var notifzone = boardTab.text();
                notifzone.innerHTML = "*";
                notifzone.setAttribute("title", "Il y a des nouveaux posts");
            }
        }
        break;
      case NOTIF_ANSWER:
        if (!boardTab.visible) {
            var notifzone = boardTab.text();
            notifzone.innerHTML = "#";
            notifzone.setAttribute("title", "Nouvelle réponse à "+getCtxtClock(arg));
        }
        break;
      case NOTIF_BIGORNO_ALL:
        if (!boardTab.visible) {
            var notifzone = boardTab.text();
            notifzone.innerHTML = "&lt;";
            notifzone.setAttribute("title", "On appelle en "+getCtxtClock(arg));
        }
        break;
      case NOTIF_BIGORNO:
        if (!boardTab.visible) {
            var notifzone = boardTab.text();
            notifzone.innerHTML = "@&lt;";
            notifzone.setAttribute("title", "On appelle en "+getCtxtClock(arg));
        }
        break;
    }
}
BoardTab.prototype.notified = function (notif, arg) { BoardTabNotified(this, notif, arg); };

function BoardTabDisplay(boardTab) {
    var css = getStyleClass("pinni-"+boardTab.board.name);
    if (css) {
        css.style.display = 'block';
        $(boardTab.tab()).find('span.glyphicon').addClass('glyphicon-check').removeClass('glyphicon-ban-circle');
    }
    boardTab.visible = true;
    //boardTab.text().innerHTML = '';
}
BoardTab.prototype.display = function () { BoardTabDisplay(this); };

function BoardTabHide(boardTab) {
    var css = getStyleClass("pinni-"+boardTab.board.name);
    if (css) {
        css.style.display = 'none';
        $(boardTab.tab()).find('span.glyphicon').removeClass('glyphicon-check').addClass('glyphicon-ban-circle');
    }
    boardTab.visible = false;
}
BoardTab.prototype.hide = function () { BoardTabHide(this); };

function BoardTabToggle(boardTab) {
    boardTab.visible ? boardTab.hide() : boardTab.display();
}
BoardTab.prototype.toggle = function () { BoardTabToggle(this); };

function BoardTabRemoveTab(boardTab) {
    if (boardTab.tab()) {
        // on retire le tab des vues de la board
        boardTab.board.removeView(boardTab);
        boardTab.board.removeView(window);
        document.getElementById("tabs-boards").removeChild(boardTab.tab());
        var posts = evalexp("//div[contains(@class,'pinni-"+boardTab.board.name+"')]");

        for (var i=getLength(posts); i--;) {
            GlobalPinni.removeChild(getItem(posts, i));
        }
        // On retire la tribune de la liste du palmipède
        $('#tribune li[data-name="'+boardTab.board.name+'"]').remove();
        // mise à jour de l'état
        boardTab.board.setState(STATE_LOADED);
        boardTab.board.lastPost = "0";
    }
}
BoardTab.prototype.removeTab = function () { return BoardTabRemoveTab(this); };

