# SiteMonitoring

This web application was built to collect, store and present real-time monitoring data from critical services and systems across educational sites, allowing proactive resolution and remediation of outages and faults.

The frontend is a responsive web ui showing alerts, counters, and other relevant information about the current status of sites. On page load a web socket is opened with the backend server and the client listens for alerts that new data is available, at which point it GET's the new data to update the page.

The backend consists of a Node/Express server which periodically executes a Powershell script to performs checks across dozens of sites. This script then POST's its results through to the Node server, at which point the data is processed, stored, and listeners are notified of new data.

The version presented in this repository is just for demonstrative purposes as it is missing key components that contained sensitive and private data/logic.


## Built using
* NEMV stack (Node.js, Express.js, MongoDB, Vue.js) - Web application front/backend
* Powershell Core - Cross-platform scripting
* Gitlab CE - Development environment and CICD
* Docker- Deployment environment

