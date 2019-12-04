# Build:                   sudo docker build --no-cache . -t cacophony-api
# Run interactive session: sudo docker run -it cacophony-api

FROM node:12

ENV TZ=Pacific/Auckland

RUN echo $TZ > /etc/timezone \
 && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

COPY docker-entrypoint.sh /

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run apidoc

# API
EXPOSE 1080

# API - fileProcessing
EXPOSE 2008

ENTRYPOINT ["/docker-entrypoint.sh"]
