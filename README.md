Lightweight Web Server (LWS)
=========

A _super_ lightweight way to run a web server in Node.js

**v0.1.0**

## About
This is a super lightweight web server (~1,000kb) built using Node.js.
I may update this in the future, but for now, it is as complete as it
needs to be. This is nowhere near complete enough to run a production
site. It was designed solely for small scripts/sites to run without any
extra bulk.

## Features
The Lightweight Web Server is as light as it is because it is amazingly
barebones. There are no added/extra features built into the web server.
Lightweight Web Server offers:
* File/directory support.
* `index.html` directory indexes.
* A basic 404 error.

## Requirements
* A computer with Node.js installed.

## Known Issues
Currently, the Lightweight Web Server does not run PHP scripts. This is
**not** likely subject to change, considering the nature of LWS.

## Installation 
Installing the Lightweight Web Server is amazingly easy.
Use the commands below to clone the repository and install LWS.

	git clone https://github.com/coleschaefer/lightweight-web-server.git
    cd lightweight-web-server/
    npm install
    
    
## Usage

The standard port for the LWS is port `80` and by default it will use
`./www/` as the working directory for any hosted files. Both the port
and root are changeable inside `./config/settings.json`. If you don't
wish to change these variables, you can immediately begin using LWS by
dropping any files into the `./www` folder.

## Contribute

Contribute by cloning the repository and start making changes to make
it better. This is by absolutely no means a be-all-end-all web server.
This was solely created for light projects and as a learning example
for Node.js and web request handling.

If you want to make a donation, feel free to do so to my PayPal account: coleschaefer1@gmail.com.
Coffee is always appreciated and it certainly helps to keep the motivation going.
