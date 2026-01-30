import flask
import requests
import sqlite3
import json
from flask import request, jsonify
app = flask.Flask(__name__)
app.config["DEBUG"] = True
DATABASE = 'USERS.db'
API_KEY = 'DEBUGGING'
