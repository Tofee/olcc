function writeTotoz(message) {
    var exp = /\[\:([^\t\)\]]+)\]/g;
    if (settings.value('totoz_mode') != TOTOZ_INLINE) {
        return message.replace(exp, '<span class="totoz" id="$1">[:$1]</span>');
    } else {
        return message.replace(exp, '<img title="[:$1]" src="' + settings.value('totoz_server') + '/img/$1" />');
    }
}

function writeLecon(message)
{
    var index1 = message.indexOf("<a ",0);
    var exp = new RegExp('([lL]e([cç]|&ccedil;|&Ccedil;)on[ ]*([0-9]+))', 'gi');
    if ( exp.test(message) )
    {
        if (index1 != -1)
        {
            var _message = message.substring(0,index1).replace(exp, '<a href="http://lecons.ssz.fr/lecon/$3/">$1</a>');
            var index2 = message.indexOf("</a>",index1);
            if (index2 != -1)
            {
                _message = _message + message.substring(index1,index2+4);
                _message = _message + writeLecon(message.substring(index2+4,message.length));
                return _message;
            }
        }
        else
        {
            return message.replace(exp, '<a href="http://lecons.ssz.fr/lecon/$3/">$1</a>');
        }
    }
    else
    {
        return message;
    }
}

function writeBigorno(message, board, postid, post) {
    var login_exp = (board.login) ? board.login : settings.value('default_login');
    if (login_exp) {
        var re = new RegExp("(("+login_exp+")&lt;)", "gi");
        var newmessage = message.replace(re, '<span class="bigorno">$1</span>');
        if (newmessage.indexOf('<span class="bigorno">')!=-1) {
            addClass(post, "bigorno");
            board.notify(NOTIF_BIGORNO, postid);
            return newmessage;
        }
    }
    var re = new RegExp("(moules&lt;)", "g");
    var newmessage = message.replace(re, '<span class="bigorno">$1</span>');
    if (newmessage.indexOf('<span class="bigorno">')!=-1) {
        addClass(post, "bigorno");
        board.notify(NOTIF_BIGORNO_ALL, postid);
    }
    return newmessage;
}

function writeClocks(message, board, postid, post) {
    var offset = 0;
    var indexes = new Array();

    // On recherche les indices des horloges
    var h = norloge_exp.exec(message);
    while(h && h.length > 0) {

        // Construction de la référence au format MMDDhhmmssii@board
        var ref = 'ref'
        var refclass = "clockref";
        if (h[1]) {
            ref += h[1].substr(0,2)+h[1].substr(3,2);
        }
        else {
            if (h[2]+h[3]+"00" > postid.substr(4,6)) {
                // Une horloge IPoT sans date a toutes les chances de pointer
                // en fait vers un post du jour précédent
                var theday = new Date();
                theday.setDate(parseInt(postid.substr(2,2),10));
                theday.setMonth(parseInt(postid.substr(0,2),10)-1);
                var yesterday = theday.getTime() - 24*60*60*1000;
                theday.setTime(yesterday);
                ref += pad0(theday.getMonth()+1) + pad0(theday.getDate());
            }
            else {
                ref += postid.substr(0,4);
            }
        }
        ref += h[2] + h[3];
        if (h[4]) { ref += h[4].substr(1,2); } else { ref += "--"; }
        if (h[5]) {
            switch (h[5].substr(0,1)) {
                case '¹':
                    ref += "01";
                    break;
                case '²':
                    ref += "02";
                    break;
                case '³':
                    ref += "03";
                    break;
                default:
                    ref += pad0(parseInt(h[5].substr(1,2),10));
            }
        }
        else { ref += "--"; }
        if (h[6]) {
            var refboard = getBoardFromAlias(h[6].substr(1));
            if (refboard) {
                ref += '@'+refboard;
            }
            else {
                ref += h[6];
                refclass = "unknown";
            }
        }
        else {
            ref += postid.substr(12);
        }

        // Préparation des balises à insérer autour de l'horloge, aux bons indexes dans la chaîne
        if (refclass != "unknown") {
            if (pointsToMyPost(ref)) {
                refclass += " mypost";
                addClass(post, "answer");
                board.notify(NOTIF_ANSWER, postid);
            }
        }
        var hpos = offset + h.index;
        indexes.push([hpos, '<span class="'+refclass+'" id="'+ref+'">']);
        offset = hpos + h[0].length
        indexes.push([offset, '</span>']);

        // Recherche de la prochaine occurrence de norloge
        h = norloge_exp.exec(message.substr(offset));
    }

    // Insertion des balises
    for (var i=indexes.length-1; i>=0; i--) {
        var pos_str = indexes[i];
        message = message.substr(0, pos_str[0])+pos_str[1]+message.substr(pos_str[0]);
    }
    return message;
}

function writePlonk(message, board, post, login, info) {
    if (login && settings.value('plonk').split(",").contains(login)) {
        addClass(post, "plonk");
    }
    else {
        addClass(post, "pasplonk");
    }
    return message;
}

function writeDuck(message, board, post, postid) {
    var tete = '([o0ô°øòó@]|(&ocirc;)|(&deg;)|(&oslash;)|(&ograve;)|(&oacute;))'
    var exp1 = new RegExp('(\\\\_' + tete + '&lt;)', 'gi');
    var exp2 = new RegExp('(&gt;' + tete + '_\\/)', 'gi');
    var exp3 = new RegExp('(coin ?! ?coin ?!)', 'gi');
    var exp4 = new RegExp('((flap ?flap)|(table[ _]volante))', 'gi');
    var newMessage = message.replace(exp1, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp2, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp3, '<span class="canard">$1</span>');
    newMessage = newMessage.replace(exp4, '<span class="canard table">$1</span>');
    if ((settings.value('balltrap_mode') == BALLTRAP_AUTO)
        && (newMessage.indexOf('<span class="canard') != -1)) {
        addClass(post, "canard");
        //launchDuck(postid, (newMessage.indexOf('<span class="canard table') != -1));
    }
    return newMessage;
}

function seemsToBePostedByMe(board, login, info, realId) {
    if (GlobalXPosts.contains(realId+'@'+board.name)) {
        return true;
    }
    if (login && (login != 'Anonyme')) {
        if ((board.login && login.match(new RegExp("^("+board.login+")$")))
            || (!board.login && login.match(new RegExp("^("+settings.value('default_login')+")$")))) {
            return true;
        }
    }
    else if (info && (info == board.ua || info == settings.value('default_ua'))) {
        return true;
    }
    return false;
}

function formatLogin(login, info) {
    var einfo = info.replace(/</g, "&lt;");
    einfo = einfo.replace(/>/g, "&gt;");
    einfo = einfo.replace(/"/g, "&quot;");
    if (login == '' || login == 'Anonyme') {
        if(einfo.length == 0) {
            einfo = "&nbsp;";
        }
        return '<span class="ua" title="' + einfo + '">' + einfo.substr(0,12) + '</span>'
    }
    else {
        return '<span class="login" title="' + einfo + '">' + login + '</span>'
    }
}

function hilight(node) {
    addClass(node, 'hilight');
}

function unhilight(node) {
    removeClass(node, 'hilight');
}

function hilightRef(ref) {

    var query = "//div[contains(@class,'pinni-"+ref.substr(16)+"') and starts-with(@id,'"+ref.substr(3,8)+"')]";
    var allposts = evalexp(query);

    var curDiv = null;
    var curId = null;
    for (var i=0, l=getLength(allposts); i<l; i++) {
        curDiv = getItem(allposts, i);
        curId = curDiv.getAttribute("id");
        if (curId.substr(0,8) != ref.substr(3,8)) break;
        if (pointsTo(curId, ref)) {
            hilightPost(curId, curDiv);
        }
    }
}

function hilightPost(postid, post) {
    hilight(post);
    var clone = post.cloneNode(true);
    clone.style.display = 'block'; // le highlight toujours affiché
    //GlobalPopup.appendChild(clone);
    removeClass(clone, "hilight");
    //if (GlobalPopup.style.display != 'block') {
    //    GlobalPopup.style.display = 'block';
    //}
    hilightClocksPointingTo(postid);
}

function hilightClocksPointingTo(postid) {
    var allrefs = new Array();
    allrefs.push("ref"+postid);
    allrefs.push("ref"+postid.substr(0,10)+"--"+postid.substr(12));
    allrefs.push("ref"+postid.substr(0,8)+"----"+postid.substr(12));
    if (postid.substr(10,2) == "00") {
        allrefs.push("ref"+postid.substr(0,10)+"01"+postid.substr(12));
    }
    for (var i=allrefs.length; i--;) {

        var query = "//span[contains(@class,'clockref') and contains(@id,'"+allrefs[i]+"')]";
        var allClocks = evalexp(query);

        for (var j=getLength(allClocks); j--;) {
            hilight(getItem(allClocks, j));
        }
    }
}

function getCtxtClock(dest, postid) {
    var month = parseInt(postid.substr(0,2),10);
    var day = parseInt(postid.substr(2,2),10);
    var today = new Date();
    var res = "";
    if (month != (today.getMonth()+1) || day != today.getDate()) {
        res = pad0(month)+"/"+pad0(day)+"#";
    }
    res += postid.substr(4,2)+":"+postid.substr(6,2)+":"+postid.substr(8,2);
    var i = parseInt(postid.substr(10,2),10);
    switch (i) {
        case 0:
            break;
        case 1:
            res += String.fromCharCode(185);
            break;
        case 2:
        case 3:
            res += String.fromCharCode(176+i);
            break;
        default:
            res += "^"+i;
            break;
    }
    var trib = postid.substr(13, postid.length);
    if (dest.value != trib) {
        res += "@"+trib;
    }
    return res;
}

function getTotoz(totoz) {
    var img = document.getElementById('totozImg[' + totoz + ']');
    if (!img) {
        img = document.createElement('img');
        img.style.display = 'none';
        img.setAttribute('src', settings.value('totoz_server') + '/img/' + totoz);
        img.className = 'totoz'; // setAttribute('class','totoz');
        img.setAttribute('id','totozImg[' + totoz + ']');
        document.getElementsByTagName('body')[0].appendChild(img);
    }
    return img;
}

function showTotoz(element, x, y) {
    element.style.top = (y + 10 + document.documentElement.scrollTop) + 'px';
    element.style.left = x + 'px';
    element.style.visibility = 'hidden';
    element.style.display = '';
    var final_y = y + 10 + element.clientHeight;
    if (final_y > window.innerHeight) {
        element.style.top = y + document.documentElement.scrollTop - 10 - element.clientHeight + 'px';
    }
    element.style.visibility = '';
}

function getSelectedText(){
    base = document.getElementById("message");
    return base.value.substring(base.selectionStart, base.selectionEnd);
}