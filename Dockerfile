FROM node:12

ENV TZ=Pacific/Auckland

RUN echo $TZ > /etc/timezone \
 && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# API
EXPOSE 1080

# API - fileProcessing
EXPOSE 2008

COPY docker-entrypoint.sh /

ENTRYPOINT ["/docker-entrypoint.sh"]
