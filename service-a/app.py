import os
import requests
import logging
from flask import Flask, jsonify

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

SERVICE_B_URL = os.getenv("SERVICE_B_URL", "http://localhost:5002/process")

@app.route("/start-workflow", methods=["POST"])
def start_workflow():
    logging.info("Starting workflow in Service A")
    try:
        response = requests.post(SERVICE_B_URL)
        response.raise_for_status()
        return jsonify({"status": "Success", "service_b_response": response.json()}), 200
    except requests.exceptions.RequestException as e:
        logging.error(f"Error calling Service B: {e}")
        return jsonify({"status": "Error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
