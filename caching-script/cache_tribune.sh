#!/bin/bash

# Usage:   cache_tribune <url of board index.tsv> <refresh delay in seconds>
# Example: cache_tribune https://linuxfr.org/board/index.tsv 15
#
# A file named /var/cache/olcc/<server_domain>.cache.tsv will be created, and
# contain the last 3 days of mouling

URL=$1
DELAY=$2

mkdir -p /var/cache/olcc
CACHE_FILE=/var/cache/olcc/$( echo $URL | awk -F[/:] '{print $4}' ).cache.tsv
echo "Cache file: ${CACHE_FILE}"
touch ${CACHE_FILE}

TAB=$'\t'

while true; do
	# retrieve new content, diff with cached content, and append the diff to the cache
	comm -13 --output-delimiter="" <(cat "${CACHE_FILE}") <(curl -s "${URL}") >> "${CACHE_FILE}.unfiltered"

  # only keep the last 3 days: beware, gruik code here
  TODAY=$(date +'%Y%m%d')
  YESTERDAY=$(date -d '1 day ago' +'%Y%m%d')
  YESTERYESTERDAY=$(date -d '2 day ago' +'%Y%m%d')

  REGEXP_DAYS="$TAB($TODAY......|$YESTERDAY......|$YESTERYESTERDAY......)$TAB"
  grep -E ${REGEXP_DAYS} "${CACHE_FILE}.unfiltered" > "${CACHE_FILE}"

	cp "${CACHE_FILE}" "${CACHE_FILE}.unfiltered"
	# wait a bit
	sleep "$DELAY"
done
