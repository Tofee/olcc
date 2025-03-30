Simple cache for tribune mouling
================================

Il est parfois frustrant de ne pas avoir un historique un peu long de la tribune. Dans certains cas, la longueur, ça compte.
Ce script sans grande ambition permet de récupérer en continu le contenu de la tribune, et ne garde que les 3 derniers jours.

Ce cache est stocké dans /var/cache/olcc/, et le nom du fichier est <domain>.cache.tsv. Pour linuxfr, ce fichier sera donc `/var/cache/olcc/linuxfr.org.cache.tsv` .

Un service systemd d'exemple est livré dans ce même répertoire.

Il faut bien sûr que le serveur web permette l'accès public à ce cache, sinon le coincoin ne pourra pas le lire.

Voici un exemple de redirection basique pour nginx:

```
location /olcc-cache {
    alias /var/cache/olcc;
    default_type "text/tab-separated-values; charset=utf-8";
}
```

Puis faire pointer le coincoin sur le tsv suivant: `https://moulingserver.org/olcc-cache/linuxfr.org.cache.tsv`


