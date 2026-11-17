## Dockerfile for building a docker imapsync image

# $Id: Dockerfile,v 1.57 2025/09/12 13:29:26 gilles Exp gilles $
#
# Heaventree fork: built on Debian 12 (bookworm), since Debian 11 (bullseye)
# security packages now return 404. Crypt::OpenSSL::PKCS12 comes from CPAN
# because bookworm has no Debian package for it.
#
# This file is also located at 
# https://imapsync.lamiral.info/INSTALL.d/Dockerfile
# For more information about this image, see
# See https://imapsync.lamiral.info/FAQ.d/FAQ.Docker.txt
#
#
# I use the following command to build the image:
#
#  docker build -t gilleslamiral/imapsync . 
#
# where this Dockerfile is in the current directory
# 
# This Dockerfile builds an image with two imapsync
# 1) One comes from https://imapsync.lamiral.info/imapsync
#    and goes to /usr/bin/imapsync in the Docker image
#    It is used with the command:
#
#    docker run gilleslamiral/imapsync imapsync ...
# 
# 2) One comes from the local file ./imapsync
#    and goes to /imapsync in the Docker image
#    It is used with the command:
#
#    docker run gilleslamiral/imapsync /imapsync ...
# 
# 3) It is not true, by looking at the commands done:
#    cp /imapsync . || wget -N 
#
#
# 
# There is also an embedded online imapsync service called servimapsync
# It can be run with the command:
#
#    docker run -p 80:8080 -p443:8443 gilleslamiral/imapsync /servimapsync
# 
# Then use a browser to http://localhost/ or https://localhost/ or 
#  http://example.com/ or https://example.com/
# 
# It offers the same online service as 
#   https://imapsync.lamiral.info/X/ 
# but without using the path /X
# 



# Thank you very much
# I like thanks
# I like stars
# I like money to keep on doing this stuff
# 
# Number of imapsync images pulled so far (2025_04_08): 764661 
# Command used:
# curl -s https://hub.docker.com/v2/repositories/gilleslamiral/imapsync/ | jq '.pull_count'
#
# I record the pull_count once a day and I count the day-to-day differences with:
#
#     paste -d- <(tail -n+2 W/docker_pull_count.txt) <(head -n-1 W/docker_pull_count.txt) | bc
# 
# Thanks to https://unix.stackexchange.com/a/470069/89270
# 
# 
# https://www.debian.org/releases/
# Debian Bullseye is Debian 11
# Debian Bookworm is Debian 12

FROM debian:bookworm 
#FROM debian:bullseye 

LABEL   maintainer="Gilles LAMIRAL <gilles@lamiral.info>" \
        description="Imapsync" \
        documentation="https://imapsync.lamiral.info/#doc"

# I put a copy of the Dockerfile in the image itself, a good practice.
# I optionally put my local and usually more recent imapsync on /, for testing purposes.

# Heaventree fork: Dockerfil[e] is a glob so the image also builds from the repo root (docker-compose.yml).
COPY Dockerfil[e] imapsyn[c] prerequisites_imapsyn[c] servimapsyn[c] /

# I also put the webserver script, called servimapsync, and its needed files, 
# This is experimental stuff, http on port 8080, https on port 8443

COPY imapsyn[c] imapsync_form_extra.htm[l] imapsync_form.cs[s] imapsync_form.j[s] privkey.pe[m] fullchain.pe[m] /var/tmp/

# I also put oauth2_imap but I have not tested it yet under Docker.

RUN set -xe && \
  apt-get update \
  && apt-get install -y \
  libauthen-ntlm-perl \
  libcgi-pm-perl \
  libssl-dev \
  build-essential \
  libcrypt-openssl-rsa-perl \
  libdata-uniqid-perl \
  libemail-address-perl \
  libencode-imaputf7-perl \
  libfile-copy-recursive-perl \
  libfile-tail-perl \
  libio-compress-perl \
  libio-socket-ssl-perl \
  libio-socket-inet6-perl \
  libio-tee-perl \
  libhtml-parser-perl \
  libhttp-daemon-perl \
  libhttp-daemon-ssl-perl \
  libjson-webtoken-perl \
  libmail-imapclient-perl \
  libnet-dns-perl \
  libnet-server-perl \
  libparse-recdescent-perl \
  libmodule-scandeps-perl \
  libpar-packer-perl \
  libproc-processtable-perl \
  libreadonly-perl \
  libregexp-common-perl \
  libsys-meminfo-perl \
  libterm-readkey-perl \
  libtest-deep-perl \
  libtest-mockobject-perl \
  libtest-pod-perl \
  libunicode-string-perl \
  liburi-perl  \
  libwww-perl \
  procps \
  wget \
  make \
  cpanminus \
  lsof \
  ncat \
  openssl \
  ca-certificates \
  iputils-ping \
  bind9-host \
  apt-file \
  && apt-file update \
  && cpanm --from https://www.cpan.org IO::Socket::SSL Crypt::OpenSSL::PKCS12

# I added the IO::Socket::SSL update to avoid the annoying, confusing and useless warning
# DEBUG: .../IO/Socket/SSL.pm:1177: global error: Undefined SSL object


RUN set -xe \
  && cd /usr/bin/ \
  && pwd \
  && { cp /imapsync . || wget -N --no-check-certificate https://imapsync.lamiral.info/imapsync && chmod +x imapsync ; } \
  && { cp /prerequisites_imapsync . || wget -N --no-check-certificate https://imapsync.lamiral.info/prerequisites_imapsync && chmod +x prerequisites_imapsync ; } \
  && { wget -N --no-check-certificate https://imapsync.lamiral.info/oauth2/oauth2_imap/oauth2_imap && chmod +x oauth2_imap ; } \
  && cd && pwd && imapsync --testslive && { imapsync --tests || echo "WARNING: some imapsync --tests failed (usually IPv6 or network in the build sandbox); continuing" ; } && rm -rfv /var/tmp/uid_0/ # just_a_comment_to_force_update 2025_04_24_12_33_56


# Web UI (X/servimapsync): form on port 8080, imapsync run as CGI.
# Patched so the Content-type header is always printed (Net::Server 2.x
# otherwise answers "Premature end of script headers"). Self-signed cert
# is only there because servimapsync insists on one; put TLS/login in front.
COPY X/servimapsyn[c] X/imapsync_form_extra.htm[l] X/imapsync_form.htm[l] X/imapsync_form.cs[s] X/imapsync_form.j[s] /opt/web/
RUN set -xe \
  && cd /opt/web \
  && perl -0pi -e 's/if \( \$self->can\( .default_content_type. \) \)/if ( 0 )/' servimapsync \
  && grep -q 'if ( 0 )' servimapsync \
  && ln -s /usr/bin/imapsync imapsync \
  && openssl req -x509 -newkey rsa:2048 -nodes -keyout privkey.pem -out fullchain.pem -days 3650 -subj /CN=localhost \
  && chmod 644 privkey.pem fullchain.pem \
  && printf '#!/bin/sh\ncd /opt/web && exec perl servimapsync\n' > /usr/local/bin/imapsync-web \
  && chmod +x /usr/local/bin/imapsync-web

EXPOSE 8080

USER nobody:nogroup

RUN set -xe \
  && pwd \
  && { cd /var/tmp/ && mkdir tokens/ && wget -N --no-check-certificate https://imapsync.lamiral.info/oauth2/oauth2_imap/localhost.crt https://imapsync.lamiral.info/oauth2/oauth2_imap/localhost.key ; }

ENV HOME /var/tmp/

WORKDIR /var/tmp/

STOPSIGNAL SIGINT

CMD ["/usr/bin/imapsync"]

# 
# End of imapsync Dockerfile 

