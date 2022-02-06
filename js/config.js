/************************************************************
 * OnlineCoinCoin, by Chrisix (chrisix@gmail.com)
 * Fonctions de gestion des options de configuration utilisateur
 ************************************************************/

var TYPE_INT = "int";
var TYPE_STR = "string";
var TYPE_BOOL = "bool";
var TYPE_CHOICE = "choice";
var TYPE_MULTI_CHOICE = "multichoice";
var TYPE_SOUND = "sound";

var settings = {
    options: {
        'active_boards': {
            descr: "Tribunes actives",
            type: TYPE_MULTI_CHOICE
        },
        'pinni_size': {
            descr: "Nombre max de posts",
            type: TYPE_INT
        },
        'pinni_keep': {
            descr: "Ne jamais effacer mes posts et leurs réponses",
            type: TYPE_BOOL
        },
        'default_ua': {
            descr: "User-agent",
            type: TYPE_STR
        },
        'totoz_server': {
            descr: "Serveur de totoz",
            type: TYPE_STR
        },
        'totoz_mode': {
            descr: "Affichage des totoz",
            type: TYPE_CHOICE
        },
        'default_login': {
            descr: "Login par défaut",
            type: TYPE_STR
        },
        'window_title': {
            descr: "Titre de la fenêtre",
            type: TYPE_STR
        },
        'autocomplete': {
            descr: "Autocomplétion du palmi",
            type: TYPE_BOOL
        },
        'speedaccess': {
            descr: "Accès rapide aux tribunes",
            type: TYPE_BOOL
        },
        'urlpreview': {
            descr: "Aperçu des url au survol",
            type: TYPE_BOOL
        },
        'favicon': {
            descr: "Icône de la fenêtre",
            type: TYPE_STR
        },
        'boss_mode': {
            descr: "Boss-mode",
            type: TYPE_CHOICE
        },/*
        'style': {
            descr: "Style",
            type: TYPE_CHOICE
        },*/
        'plonk': {
            descr: "Plonk-list",
            type: TYPE_STR
        },
        'balltrap': {
            descr: "Balltrap",
            type: TYPE_BOOL
        },
        'max_ducks': {
            descr: "Nombre max de canards",
            type: TYPE_INT
        },
        'balltrap_mode': {
            descr: "Mode de chasse",
            type: TYPE_CHOICE
        },
        'balltrap_silent': {
            descr: "Chasse silencieuse",
            type: TYPE_BOOL
        },/*
        'sound_enabled': {
            descr: "Sons activés",
            type: TYPE_BOOL
        },
        'sound_volume': {
            descr: "Volume (1-100)",
            type: TYPE_INT
        },
        'sound_new': {
            descr: "Arrivée de nouveaux posts",
            type: TYPE_SOUND
        },
        'sound_reply': {
            descr: "Réponse à un de mes posts",
            type: TYPE_SOUND
        },
        'sound_bigorno': {
            descr: "Bigornophone",
            type: TYPE_SOUND
        },
        'sound_zoo': {
            descr: "Zoodvinssen activé",
            type: TYPE_BOOL
        }*/
    },
    setDefault: function () {
        for (var opt in this.options) {
            this.options[opt].value = eval('DEFAULT_'+opt.toUpperCase());
        }
    },
    set: function(name, val) {
        this.options[name].value = val;
    },
    value: function (name) {
        if(typeof this.options[name].value == 'undefined') {
            this.options[name].value = eval('DEFAULT_'+name.toUpperCase());
        }
        return this.options[name].value;
    },
    save: function () {
        var tab = new Array();
        // alert("save");
        for (var opt in this.options) {
            var val = this.value(opt);
            if (this.options[opt].type == TYPE_MULTI_CHOICE) {
                val = val.join("|");
            }
            tab.push(opt+"="+val);
        }
        setCookie("settings", tab.join("\n"), 10000);
    },
    load: function () {
        var settings = getCookie("settings");
        // alert("load: "+settings);
        if (settings) {
            var pairs = settings.split("\n");
            // alert("pairs.length="+pairs.length+" ; pairs="+pairs);
            for (var i=pairs.length; i--;) {
                var opt_val = pairs[i];
                if (!opt_val) continue;
                var eqpos = opt_val.indexOf('=');
                var name = opt_val.substr(0, eqpos);
                var opt = this.options[name];
                if(typeof opt != 'undefined') {
                    var val = opt_val.substr(eqpos + 1, opt_val.length);
                    if (name == 'default_ua') { // MAJ du numéro de version dans l'UA
                        val = val.replace(/((?:ol|online)(?:cc|c²|coincoin))\/[0-9]+\.[0-9]+\.[0-9]+/i, '$1/' + VERSION);
                    }
                    // alert("name="+name+" ; val="+val);
                    switch (opt.type) {
                        case TYPE_INT:
                        case TYPE_BOOL:
                            val = eval(val);
                            break;
                        case TYPE_MULTI_CHOICE:
                            val = (val) ? val.split("|") : [];
                            break;
                    }
                    opt.value = val;
                }
            }
        } else {
            this.setDefault();
            this.save();
        }
    }
}

var GlobalBufStyle = '';

function saveConfig() {
    for (var opt in settings.options) {
        var cur_opt = settings.options[opt];
        var opt_elem = document.getElementById('config-'+opt);
        switch (cur_opt.type) {
          case TYPE_INT:
            cur_opt.value = eval(opt_elem.value);
            break;
          case TYPE_BOOL:
            cur_opt.value = opt_elem.checked;
            break;
          case TYPE_CHOICE:
            var tmpval = opt_elem.options[opt_elem.selectedIndex].value;
            if (tmpval) {  // Pour IE6 qui ne sait pas trouver les valeurs des combobox
              cur_opt.value = tmpval; 
            }
            break;
          case TYPE_STR:
          case TYPE_SOUND:
            cur_opt.value = opt_elem.value;
            if (opt == 'window_title') {
                document.title = cur_opt.value;
            }
            else if (opt == 'favicon') {
                favicon.change(cur_opt.value);
            }
            break;
          case TYPE_MULTI_CHOICE:
            if (opt == 'active_boards') {
                var res = new Array();
                for (var name in GlobalBoards) {
                    if (GlobalBoards[name].state != STATE_LOADED) {
                        res.push(name);
                    }
                }
                cur_opt.value = res;
            }
            break;
        }
    }
    settings.save();
    //if (GlobalBufStyle != settings.value('style')) {
    //    applyGlobalCSS();
    //   GlobalBufStyle = settings.value('style');
    //}
    //closeConfig();
}

function loadConfig() {
    for (var opt in settings.options) {
        var cur_opt = settings.options[opt];
        var opt_elem = $('#config-'+opt);
        switch (cur_opt.type) {
            case TYPE_INT:
                opt_elem.val(cur_opt.value);
                break;
            case TYPE_BOOL:
                opt_elem.prop('checked', cur_opt.value);
                break;
            case TYPE_CHOICE:
                opt_elem.find('option[name="'+cur_opt.value+'"]').prop('selected', true);
                break;
            case TYPE_STR:
                opt_elem.val(cur_opt.value);
                break;
            case TYPE_SOUND:
                /*cur_opt.value = opt_elem.value;
                if (opt == 'window_title') {
                    document.title = cur_opt.value;
                }
                else if (opt == 'favicon') {
                    favicon.change(cur_opt.value);
                }*/
                break;
            case TYPE_MULTI_CHOICE:
                /*if (opt == 'active_boards') {
                    var res = new Array();
                    for (var name in GlobalBoards) {
                        if (GlobalBoards[name].state != STATE_LOADED) {
                            res.push(name);
                        }
                    }
                    cur_opt.value = res;
                }*/
                break;
        }
    }
}

// Ajoute une ligne dans le tableau de configuration des tribunes actives
function addConfigLine(board, subpanel) {
    tr = document.createElement('tr');
    tr.setAttribute('id', 'config-'+board.name);
    tr.className = 'subpanel'; // setAttribute('class', "subpanel");
    // Cellule nom de la tribune
    td = document.createElement('td');
    td.className = 'panel-board tab-'+board.name; // setAttribute('class', 'panel-board');
    td.innerHTML = board.name;
    // td.style.background = board.color;
    tr.appendChild(td);
    // Cellule bouton start
    td = document.createElement('td');
    td.innerHTML = '<a href="#" class="'+(board.state == STATE_STOP ? '' : 'disabled')+'" alt="[Démarrer]" id="but-start-'+board.name+'" onclick="BoardStart(GlobalBoards['+"'"+board.name+"'"+'])"><span class="glyphicon glyphicon-play"></span></a>'
    tr.appendChild(td);
    // Cellule bouton stop
    td = document.createElement('td');
    td.innerHTML = '<a href="#" class="'+(board.state == STATE_STOP ? 'disabled' : '')+'" id="but-stop-'+board.name+'" alt="[Arrêter]" onclick="BoardStop(GlobalBoards['+"'"+board.name+"'"+'])"><span class="glyphicon glyphicon-stop"></span></a>';
    tr.appendChild(td);
    // Cellule bouton config
    td = document.createElement('td');
    td.innerHTML = '<a href="#" id="but-config-'+board.name+'" alt="[Paramètres]" onclick="configBoard('+"'"+board.name+"'"+')"><span class="glyphicon glyphicon-wrench"></span></a>';
    tr.appendChild(td);
    // Cellule bouton remove
    td = document.createElement('td');
    td.innerHTML = '<a href="#" id="but-remove-'+board.name+'" alt="[Supprimer]" onclick="configRemove('+"'"+board.name+"'"+')"><span class="glyphicon glyphicon-trash"></span></a>';
    tr.appendChild(td);
    // Cellule nombre de posts
    td = document.createElement('td');
    td.setAttribute('id', "nbposts-"+board.name);
    td.className = 'cinfo';
    td.innerHTML = board.nbPosts + " posts";
    tr.appendChild(td);
    // Cellule état
    td = document.createElement('td');
    td.setAttribute('id', "cstate-"+board.name);
    td.className = 'cstate';
    td.innerHTML = "["+board.state+"]";
    tr.appendChild(td);
    // Ajout de la ligne
    subpanel.appendChild(tr);
    tr.notified = function (notif, state) {
        var name = this.getAttribute('id').substr(7);
        var board = GlobalBoards[name];
        switch (notif) {
          case NOTIF_STATE:
            document.getElementById("cstate-"+name).innerHTML = "["+board.state+"]";
            switch (state) {
              case STATE_LOADED:
                // self destruction
                break;
              case STATE_STOP:
                $("#but-start-"+name).removeClass('disabled');
                $("#but-stop-"+name).addClass('disabled');
                break;
              default:
                  $("#but-start-"+name).addClass('disabled');
                  $("#but-stop-"+name).removeClass('disabled');
                break;
            }
            break;
          case NOTIF_NEW_POST:
            document.getElementById("nbposts-"+name).innerHTML = board.nbPosts + " posts";
            break;
        }
    };
    board.addView(tr);
}

// Affiche le panneau de configuration pour la tribune "name"
function configBoard(name) {
    var board = GlobalBoards[name];

    $("#confTribuneModal").modal('show');

    $("#preconfTribune").closest('.form-group').hide();
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
    $("#cookieTribune").val(board.cookie);
    $("#loginTribune").val(board.login);
    $("#useragentTribune").val(board.ua);

    board.tmpcookieback = board.cookie;
}

// Enlève une ligne dans le tableau de configuration des tribunes actives
function configRemove(name) {
    var board = GlobalBoards[name];
    var tab = GlobalBoardTabs[name];
    var line = document.getElementById('config-'+name);
    board.removeView(line);
    board.stop();
    $("#config-"+name).remove();
    tab.removeTab()
    var opt = settings.options['active_boards'].value;
    var idx = opt.indexOf(name);
    if(idx >= 0) {
        opt.splice(idx, 1);
        settings.save();
    }
}

// Sauvegarde la configuration de la tribune "name" et ferme son panneau de config
function saveBoardConfig(name) {
    var board = GlobalBoards[name];
    if(typeof board == 'undefined') {
        var newboard = new Board(name, true);
        GlobalBoards[name] = newboard;
        board = GlobalBoards[name];
    }
    board.color = '#'+$("#colorTribune").val();
    board.updateCSS(); // change couleur style de la board
    board.alias = $('#aliasTribune').val();
    board.login = $('#loginTribune').val();
    board.ua = $("#useragentTribune").val();
    board.cookie = $("#cookieTribune").val();
    if (board.tmpcookieback != board.cookie) { board.tmpcookie = false; }
    // board.plonk = document.getElementById('config-plonk').value;
    //board.delay = parseInt(document.getElementById('config-delay').value)*1000;
    //if (board.perso) {
    board.getUrl = $("#backendTribune").val();
    if (!board.getUrl) {
        alert("L'URL de backend ne doit pas être vide !");
        return;
    }
    board.postUrl = $("#postTribune").val();
    board.postData = $("#datapostTribune").val();
    board.slip = $('#slipTribune option:selected').val() == 1 ? SLIP_TAGS_RAW : SLIP_TAGS_ENCODED;
    //}
    board.saveConfig();
    addTabToPinni(name);
    onChangeTrib(); // pour forcer la couleur du palmipède au cas où

    var opt = settings.options['active_boards'].value;
    if(opt.indexOf(name) < 0) {
        opt.push(name);
        settings.save();
    }

    // Forcer le restart de la tribune
    board.stop();
    board.start();
}
