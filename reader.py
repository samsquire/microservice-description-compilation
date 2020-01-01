import yaml
import flask
import re
from importlib import import_module
import flask_app

data = list(yaml.safe_load_all(open("example.yml").read()))
from flask import render_template


for item in data:
    if "microservice" in item:
        microservice_name = item["microservice"]
        filename = open("microservices/" + microservice_name + ".py", "w")
        filename.close()

for item in data:
    if "choreography" in item:
        print("Choreography")
    if "microservice" in item:
        microservice_name = item["microservice"]
        for function in item["functions"]:
            name = function["name"].replace("-", "_") 
            with flask_app.app.app_context():
                impl = function["impl"]
                impl = re.sub( '^',' '*4, impl ,flags=re.MULTILINE)
                rendered = render_template("func.template", name=function["name"].replace("-", "_"), method=function["method"], impl=impl, resource=function["resource"], inputs=function["inputs"].keys())
                open("microservices/" + microservice_name + ".py", "a").write(rendered) 
                import_module("." + microservice_name, package="microservices")
flask_app.app.run(port=5001)
