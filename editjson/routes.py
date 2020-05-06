import json
# from os.path import basename, join, exists
from . import app, startup
from flask import render_template, request

@app.route('/', methods=['GET'])
def index():
    data = None
    if startup['json_file'] is not None:
        with open(startup['json_file'], 'r') as json_file:
            data = json.load(json_file)
    return render_template('index.html', json_string=data)


@app.route('/', methods=['POST'])
def save():
    # request.form
    return {}