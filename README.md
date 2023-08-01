# AC Control 

> This readme is currently outdated. The V2 of the project is being rewritten in Golang.

Web server to remote control an Air Conditioning unit.

Based on:
  * Raspberry Pi zero (or any other device that can interact with ANAVI Infrared pHAT) as the server device
  * [ANAVI Infrared pHAT](https://anavi.technology/files/anavi-infrared-phat.pdf) to control the AC through infrared
  * [LIRC](https://www.lirc.org/) as the sofware component of the infrared system
  * [CherryPy](https://docs.cherrypy.dev/en/latest/) for the server

## Installing
TODO

## Running

You should run the server behind a reverse proxy instance, such as Nginx.
You should also not expose this to the internet. Either use it only on your local network or expose it through a VPN such as Nebula, Tailscale or Zerotier.