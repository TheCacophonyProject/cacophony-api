# Build:                   sudo docker build --no-cache . -t cacophony-api
# Run interactive session: sudo docker run -it cacophony-api

FROM ubuntu:18.04

ENV TZ=Pacific/Auckland

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    apt-utils \
    tzdata \
    curl \
    wget \
    sudo \
    make \
    build-essential \
    g++ \
    postgis \
    postgresql-server-dev-10 \
 && rm -rf /var/lib/apt/lists/*

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
 && apt-get install -y nodejs \
 && npm install -g nodemon \
 && rm -rf /var/lib/apt/lists/*

# https://minio.io/downloads.html#download-server-linux-x64
# https://docs.minio.io/docs/minio-client-complete-guide
RUN wget --no-verbose https://dl.minio.io/server/minio/release/linux-amd64/minio \
 && chmod +x minio \
 && wget --no-verbose https://dl.minio.io/client/mc/release/linux-amd64/mc \
 && chmod +x mc

RUN echo $TZ > /etc/timezone \
 && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

RUN echo "listen_addresses = '*'" >> /etc/postgresql/10/main/postgresql.conf \
 && echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/10/main/pg_hba.conf \
 && echo "host all all ::/0 md5" >> /etc/postgresql/10/main/pg_hba.conf

COPY docker-entrypoint.sh /

WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY . /app/
RUN npm run apidoc

WORKDIR /

# API
EXPOSE 1080

# API - fileProcessing
EXPOSE 2008

# Minio
EXPOSE 9001

# PostgreSQL
EXPOSE 5432

ENTRYPOINT ["/docker-entrypoint.sh"]
