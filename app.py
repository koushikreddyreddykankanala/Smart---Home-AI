# =============================================
#  SMART HOME ASSISTANT — app.py  v3.0
#  Upgraded: Scenes, Automation, NLP proxy,
#  Command insights, cross-platform ready
# =============================================

import os, json, logging, requests
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Predefined scenes ─────────────────────────
SCENES = {
    "movie":   {"light": False, "fan": False, "ac": True, "tv": True, "temperature": 22},
    "sleep":   {"light": False, "fan": False, "ac": True, "tv": False, "temperature": 20},
    "party":   {"light": True,  "fan": True,  "ac": True, "tv": False, "temperature": 24},
    "work":    {"light": True,  "fan": True,  "ac": True,  "tv": False, "temperature": 23},
    "morning": {"light": True,  "fan": False, "ac": False, "tv": False, "temperature": 24},
}

def create_app():
    app = Flask(__name__, static_folder=".", static_url_path="")

    allowed_origin = os.environ.get("ALLOWED_ORIGIN", "http://localhost:5000")
    CORS(app, resources={r"/*": {"origins": allowed_origin}})

    @app.after_request
    def set_headers(r):
        r.headers["X-Content-Type-Options"] = "nosniff"
        r.headers["X-Frame-Options"] = "DENY"
        r.headers["Cache-Control"] = "no-store"
        return r

    # ── File paths ────────────────────────────
    DATA_FILE    = os.environ.get("DATA_FILE",    "devices.json")
    HISTORY_FILE = os.environ.get("HISTORY_FILE", "history.json")
    AUTO_FILE    = os.environ.get("AUTO_FILE",    "automations.json")

    DEFAULT_STATE = {"light": False, "fan": False, "ac": False, "tv": False, "temperature": 24}
    VALID_DEVICES = {"light", "fan", "ac", "tv"}

    # ── Helpers ───────────────────────────────
    def ok(data, status=200):
        return jsonify({"success": True, "data": data}), status

    def err(msg, code=400):
        return jsonify({"success": False, "error": msg}), code

    def load_json(path, default):
        try:
            if os.path.exists(path):
                with open(path) as f:
                    return json.load(f)
        except Exception:
            pass
        return default() if callable(default) else default

    def save_json(path, data):
        try:
            with open(path, "w") as f:
                json.dump(data, f, indent=2)
        except IOError as e:
            logger.error("Save failed %s: %s", path, e)

    def load_devices():  return load_json(DATA_FILE,    DEFAULT_STATE.copy)
    def load_history():  return load_json(HISTORY_FILE, list)
    def load_autos():    return load_json(AUTO_FILE,     list)

    def log_command(cmd, result):
        history = load_history()
        history.append({
            "command": cmd,
            "result":  result,
            "time":    datetime.now().isoformat(timespec="seconds"),
        })
        if len(history) > 100:
            history = history[-100:]
        save_json(HISTORY_FILE, history)

    # ── Routes ────────────────────────────────

    @app.route("/")
    def index():
        return app.send_static_file("index.html")
    
    @app.route("/dashboard")
    def dashboard():
        return app.send_static_file("dashboard.html")

    # ── Devices ──────────────────────────────
    @app.get("/devices")
    def get_devices():
        return ok(load_devices())

    @app.post("/control")
    def control_device():
        body = request.get_json(silent=True)
        if not body:
            return err("Invalid JSON")

        device = str(body.get("device", "")).lower()
        state  = str(body.get("state",  "")).lower()

        if device not in VALID_DEVICES:
            return err(f"Unknown device '{device}'")
        if state not in ("on", "off"):
            return err("State must be 'on' or 'off'")

        devices = load_devices()
        devices[device] = (state == "on")

        if device == "ac" and "temperature" in body:
            try:
                t = int(body["temperature"])
                if 16 <= t <= 30:
                    devices["temperature"] = t
            except (ValueError, TypeError):
                pass

        save_json(DATA_FILE, devices)
        log_command(f"control:{device}:{state}", "ok")
        return ok(devices)

    @app.post("/devices/reset")
    def reset_devices():
        save_json(DATA_FILE, DEFAULT_STATE.copy())
        return ok({"message": "All devices reset", "devices": DEFAULT_STATE})

    # ── Scenes ───────────────────────────────
    @app.get("/scenes")
    def list_scenes():
        return ok(list(SCENES.keys()))

    @app.post("/scenes/<name>")
    def activate_scene(name):
        scene = SCENES.get(name.lower())
        if not scene:
            return err(f"Unknown scene '{name}'. Available: {list(SCENES.keys())}")

        devices = load_devices()
        devices.update(scene)
        save_json(DATA_FILE, devices)
        log_command(f"scene:{name}", "ok")
        logger.info("Scene activated: %s", name)
        return ok({"scene": name, "devices": devices})

    # ── Automation ───────────────────────────
    @app.get("/automations")
    def get_automations():
        return ok(load_autos())

    @app.post("/automations")
    def add_automation():
        """
        Body: { "trigger": "temp>28", "action": "ac:on", "label": "Hot day AC" }
        Supported triggers: temp>N, temp<N, time==HH:MM, always
        Supported actions: device:state, scene:name
        """
        body = request.get_json(silent=True)
        if not body or not body.get("trigger") or not body.get("action"):
            return err("Required: trigger, action")

        autos = load_autos()
        rule = {
            "id":      len(autos) + 1,
            "trigger": body["trigger"],
            "action":  body["action"],
            "label":   body.get("label", body["action"]),
            "enabled": True,
            "created": datetime.now().isoformat(timespec="seconds"),
        }
        autos.append(rule)
        save_json(AUTO_FILE, autos)
        return ok(rule, 201)

    @app.delete("/automations/<int:rule_id>")
    def delete_automation(rule_id):
        autos = [a for a in load_autos() if a.get("id") != rule_id]
        save_json(AUTO_FILE, autos)
        return ok({"deleted": rule_id})

    @app.post("/automations/evaluate")
    def evaluate_automations():
        """
        Called by the frontend periodically.
        Body: { "temperature": 30, "time": "22:00" }
        Returns list of actions that fired.
        """
        body    = request.get_json(silent=True) or {}
        temp    = body.get("temperature")
        now_str = body.get("time", datetime.now().strftime("%H:%M"))

        fired   = []
        devices = load_devices()
        changed = False

        for rule in load_autos():
            if not rule.get("enabled"):
                continue
            trig = rule["trigger"]

            triggered = False
            try:
                if trig.startswith("temp>") and temp is not None:
                    triggered = float(temp) > float(trig[5:])
                elif trig.startswith("temp<") and temp is not None:
                    triggered = float(temp) < float(trig[5:])
                elif trig.startswith("time=="):
                    triggered = now_str == trig[6:]
                elif trig == "always":
                    triggered = True
            except Exception:
                continue

            if triggered:
                action = rule["action"]
                if ":" in action:
                    parts = action.split(":", 1)
                    if parts[0] in SCENES:
                        devices.update(SCENES[parts[0]])
                        changed = True
                    elif parts[0] in VALID_DEVICES:
                        devices[parts[0]] = (parts[1] == "on")
                        changed = True
                fired.append({"id": rule["id"], "label": rule["label"]})

        if changed:
            save_json(DATA_FILE, devices)

        return ok({"fired": fired, "devices": devices})

    # ── History & Insights ───────────────────
    @app.get("/history")
    def get_history():
        limit = min(int(request.args.get("limit", 20)), 100)
        return ok(load_history()[-limit:][::-1])

    @app.get("/insights")
    def get_insights():
        history = load_history()
        counts: dict = {}
        for entry in history:
            cmd = entry.get("command", "")
            counts[cmd] = counts.get(cmd, 0) + 1

        top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
        return ok({
            "total":       len(history),
            "top_commands": [{"command": c, "count": n} for c, n in top],
        })

    @app.delete("/history")
    def clear_history():
        save_json(HISTORY_FILE, [])
        return ok({"message": "History cleared"})

    # ── Weather proxy ─────────────────────────
    @app.get("/weather")
    def weather():
        api_key = os.environ.get("WEATHER_API_KEY", "")
        lat  = request.args.get("lat")
        lon  = request.args.get("lon")
        city = request.args.get("city")

        if not api_key:
            return ok({"demo": True, "city": "Demo City", "temp": 28,
                        "description": "Set WEATHER_API_KEY in .env"})
        try:
            params = ({"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}
                      if lat and lon else
                      {"q": city or os.environ.get("WEATHER_CITY", "London"),
                       "appid": api_key, "units": "metric"})

            r = requests.get("https://api.openweathermap.org/data/2.5/weather",
                             params=params, timeout=5)
            r.raise_for_status()
            d = r.json()
            return ok({"demo": False, "city": d["name"],
                        "temp": round(d["main"]["temp"]),
                        "description": d["weather"][0]["description"]})
        except requests.HTTPError:
            return err("Invalid city or API key", 502)
        except Exception:
            return err("Weather fetch failed", 500)

    # ── NLP proxy (optional AI upgrade) ──────
    @app.post("/nlp")
    def nlp_command():
        """
        Lightweight NLP endpoint.
        Body: { "text": "it's too hot" }
        Returns structured intent: { intent, device, state, scene, temperature }
        Falls back to rule-based parsing — no external AI required.
        """
        body = request.get_json(silent=True)
        text = (body or {}).get("text", "").lower().strip()
        if not text:
            return err("No text provided")

        intent = _parse_intent(text)
        log_command(text, intent.get("intent", "unknown"))
        return ok(intent)

    def _parse_intent(text: str) -> dict:
        """Rule-based NLU — maps natural language to structured actions."""
        t = text.lower()

        # Scene shortcuts
        scene_map = {
            ("movie", "cinema", "film", "netflix"):    "movie",
            ("sleep", "bed", "goodnight", "night"):    "sleep",
            ("party", "party mode", "celebrate"):      "party",
            ("work", "study", "focus", "office"):      "work",
            ("morning", "wake up", "good morning"):    "morning",
        }
        for keywords, scene in scene_map.items():
            if any(k in t for k in keywords):
                return {"intent": "scene", "scene": scene}

        # Emotional / indirect triggers
        indirect = {
            ("too hot", "very hot", "sweating", "burning", "it's hot", "feels warm"):
                {"intent": "control", "device": "ac", "state": "on"},
            ("too cold", "freezing", "shivering", "chilly"):
                {"intent": "control", "device": "ac", "state": "off"},
            ("sleepy", "tired", "feeling sleepy", "going to sleep"):
                {"intent": "scene", "scene": "sleep"},
            ("dark", "can't see", "lights please", "brighten"):
                {"intent": "control", "device": "light", "state": "on"},
            ("too bright", "dim", "lower the light"):
                {"intent": "control", "device": "light", "state": "off"},
            ("make it cooler", "cool down", "reduce temperature"):
                {"intent": "temperature", "delta": -2},
            ("make it warmer", "warm up", "increase temperature"):
                {"intent": "temperature", "delta": +2},
        }
        for phrases, action in indirect.items():
            if any(p in t for p in phrases):
                return action

        # Temperature set
        import re
        m = re.search(r"(?:set|temperature|temp)[^\d]*(\d+)", t)
        if m:
            return {"intent": "temperature", "value": int(m.group(1))}

        # Direct device commands
        device_map = {
            "light": ["light", "lights", "lamp", "bulb"],
            "fan":   ["fan", "ceiling fan"],
            "ac":    ["ac", "air conditioner", "air con", "aircon", "cooler"],
            "tv":    ["tv", "television", "telly"],
        }
        for device, keywords in device_map.items():
            if any(k in t for k in keywords):
                state = ("off" if any(w in t for w in ["off", "stop", "disable", "turn off"])
                         else "on")
                return {"intent": "control", "device": device, "state": state}

        # Status / weather / greeting
        if any(w in t for w in ["status", "what's on", "what is on"]):
            return {"intent": "status"}
        if any(w in t for w in ["weather", "temperature outside", "forecast"]):
            return {"intent": "weather"}
        if any(w in t for w in ["hello", "hi", "hey"]):
            return {"intent": "greeting"}
        if any(w in t for w in ["reset", "everything off", "all off"]):
            return {"intent": "reset"}

        return {"intent": "unknown", "original": text}

    # ── Global errors ─────────────────────────
    @app.errorhandler(404)
    def not_found(_):   return err("Not found", 404)

    @app.errorhandler(500)
    def server_err(_):  return err("Internal server error", 500)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
