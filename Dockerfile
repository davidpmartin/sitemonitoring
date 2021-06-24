FROM [omitted]/sitemonitoring/node:12

# Setup environment
ARG env
ARG proxy
ARG server
ARG db
ARG port
ARG api_url
ARG ep_post
ARG home_site_code

ENV EXEC_ENV $env
ENV HTTP_PROXY $proxy
ENV HTTPS_PROXY $proxy
ENV DB_HOST $db
ENV SERVER_PORT $port
ENV API_URL $api_url
ENV EP_POST $ep_post
ENV HOME_SITE_CODE $home_site_code

RUN mkdir -p /usr/src/app/server
WORKDIR /usr/src/app

# Install powershell dependencies
RUN apt-get -o Acquire::http::proxy=$proxy update
RUN apt-get -o Acquire::http::proxy=$proxy install -y curl gnupg apt-transport-https
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-debian-stretch-prod stretch main" > /etc/apt/sources.list.d/microsoft.list'

# Update the list of products and install pwsh
RUN apt-get -o Acquire::http::proxy=$proxy update
RUN apt-get -o Acquire::http::proxy=$proxy install -y powershell

# Copy configuration files and install server dependencies
COPY server/package.json ./server
RUN npm install --prefix ./server

# Copy src data across
COPY . ./

# Transpile TS files
RUN npm run --prefix ./server build

# Default start command (if not set in docker-compose)
CMD [ "npm", "run", "--prefix", "./server", "start" ]