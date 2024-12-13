from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from datetime import datetime

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# Email credentials
smtp_server = 'smtp.gmail.com' 
smtp_port = 587  
username = '<My email ID>' 
password = '<My EMAIL PASSWORD>'  

# Email content
sender_email = '<My email ID>'
receiver_email = '<RECEIVER EMAIL>'
subject = 'Noise Level Exceeded'
plain_text = 'As per the noise monitoring system, the detected noise level has exceeded the threshold.'

# Create a multipart message
message = MIMEMultipart('alternative')
message['From'] = sender_email
message['To'] = receiver_email
message['Subject'] = subject

# Attach plain text and HTML versions of the message
message.attach(MIMEText(plain_text, 'plain'))

app = Flask(__name__)

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table_name = 'iot_project'

try:
    table = dynamodb.Table(table_name)
    table.load()
except ClientError as e:
    if e.response['Error']['Code'] == 'ResourceNotFoundException':
        raise Exception(f"DynamoDB table '{table_name}' does not exist.")
    else:
        raise

@app.route('/', methods=['GET'])
def store_values():
    try:
        data_str = request.args.get('store')
        if not data_str:
            return jsonify({"error": "Invalid input, 'store' query parameter required."}), 400
        
        data = {}
        data['date'] = datetime.now().strftime('%Y-%m-%d::%H:%M')
        data['time'] = datetime.now().strftime('%S')
        data['db'] = data_str

        if int(data_str) >= 93:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls() 
            server.login(username, password)
            server.sendmail(sender_email, receiver_email, message.as_string())
            print("Email sent successfully!")

        response = table.put_item(Item=data)

        return jsonify({
            "message": "Data stored successfully!",
            "stored_data": data
        }), 201

    except BotoCoreError as e:
        return jsonify({"error": "Error communicating with DynamoDB", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
