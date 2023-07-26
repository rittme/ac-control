import os
import hashlib
import cherrypy
from dotenv import load_dotenv
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()
scheduler = BackgroundScheduler()
scheduler.start()

temp_command = os.getenv(
    "READ_HTU21D", "/home/pi/anavi-examples/sensors/HTU21D/c/HTU21D"
)
acmodel = os.getenv("LIRCD_REMOTE", "acmitsubishi")


def getTemp():
    vals = os.popen(temp_command).read()
    spl = vals.split()
    if not spl or len(spl) < 2: 
        return {"temp": 'N/A', "humidity": 'N/A'}
    return {"temp": spl[0], "humidity": spl[1]}


allowed_commands = ["23C_STRONG", "28C", "smart", "dry", "off"]
ir_command = f"irsend SEND_ONCE {acmodel}"


def setCommand(command):
    print(f"Running command {command}")
    if command in allowed_commands:
        os.system(f"{ir_command} {command}")


# set the priority according to your needs if you are hooking something
# else on the 'before_finalize' hook point.
@cherrypy.tools.register("before_finalize", priority=60)
def secureheaders():
    headers = cherrypy.response.headers
    headers["X-Frame-Options"] = "DENY"
    headers["X-XSS-Protection"] = "1; mode=block"
    headers["Content-Security-Policy"] = "default-src 'self';"


class Root(object):
    @cherrypy.expose
    def index(self):
        try:
            t = getTemp()
            temp = t["temp"]
            hum = t["humidity"]
        except Exception:
            temp = "N/A"
            hum = "N/A"
        index = open("index.html", "r").read()
        index = (
            index.replace("@temp@", temp)
            .replace("@hum@", hum)
        )
        job = scheduler.get_job("offtimer")
        return index

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def temp(self):
        try:
            return getTemp()
        except Exception as e:
            raise cherrypy.HTTPError(500, e)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def command(self, command="off"):
        message = ""
        if command != "none":
            if setCommand(command):
                message = f"Command {command} sent"
            else:
                message = "Command does not exist"
        return {"message": message}

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def schedule(self, time="0"):
        minutes = int(time)
        if minutes < -1 or -1 < minutes < 0 or minutes > 1440:
            return {"error": f"Off timer minutes out of bounds: {minutes}"}
        if minutes == -1:
            scheduler.remove_all_jobs()
            return {"message": "done"}
        elif minutes == 0:
            setCommand("off")
            scheduler.remove_all_jobs()
            return {"message": "done"}
        else:
            scheduler.remove_all_jobs()
            run_at = datetime.now() + timedelta(minutes=minutes)
            scheduler.add_job(
                setCommand,
                trigger="date",
                kwargs={"command": "off"},
                id="offtimer",
                name=f"turn off in {time} minutes",
                max_instances=1,
                run_date=run_at,
            )
            return {"id": "offtimer", "run_at": run_at.isoformat()}

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def gettimer(self):
        job = scheduler.get_job("offtimer")
        if not job:
            return {"error": "no job"}
        return {"id": job.id, "run_at": job.next_run_time.isoformat(), "name": job.name}


if __name__ == "__main__":
    cherrypy.config.update(
        {
            # "environment": "production",
            "server.socket_host": os.getenv("HOST", "127.0.0.1"),
            "server.socket_port": int(os.getenv("PORT", "8080")),
            "tools.secureheaders.on": True,
            "tools.proxy.on": True,
            "tools.proxy.base": os.getenv("PROXY_BASE"),
            "tools.auth_basic.on": False,
            "engine.autoreload.on": False,
        }
    )
    cherrypy.quickstart(
        Root(),
        "/",
        {
            "/": {
                "tools.staticdir.root": os.path.abspath(os.getcwd()),
            },
            "/static": {"tools.staticdir.on": True, "tools.staticdir.dir": "./public"},
        },
    )
