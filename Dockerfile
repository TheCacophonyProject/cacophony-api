FROM node:12

ENV TZ=Pacific/Auckland

RUN echo $TZ > /etc/timezone \
 && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

RUN npm install -g nodemon

COPY docker-entrypoint.sh /

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# API
EXPOSE 1080

# API - fileProcessing
EXPOSE 2008

ENTRYPOINT ["/docker-entrypoint.sh"]
