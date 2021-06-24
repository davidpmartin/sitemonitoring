# Client Dockerfile
FROM node:12-alpine as builder

# Args
ARG proxy
ARG env
ARG server
ARG apiGetData
ARG apiGetEvents

# Create app folder and move package.json
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app

# Set proxy
ENV HTTP_PROXY $proxy
ENV HTTPS_PROXY $proxy

# Set env variables
ENV EXEC_ENV $env
ENV VUE_APP_SERVER_PATH $server
ENV VUE_APP_API_ALL_DATA $apiGetData
ENV VUE_APP_API_MORE_EVENTS $apiGetEvents

# Install packages and copy to app folder
RUN npm install
COPY . /usr/src/app

# Serve content
CMD npm run serve --mode $env

# Generate build files
#COPY src ./src
#COPY dist ./dist
#RUN npm run build