

from crypt import methods
import os,cv2
from google.cloud import storage
import numpy as np
from os import umask
from flask import Flask, redirect, render_template, request, flash
import firebase_admin
import pyrebase
import json
import matplotlib.pyplot as plt
from firebase_admin import credentials, auth
from firebase_admin import firestore, initialize_app
from flask import Flask, request
from flask import *
import plotly.express as px
import plotly.graph_objects as go
from werkzeug.utils import secure_filename
app = Flask(__name__)



UPLOAD_FOLDER = 'static/upload/'
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])
app.secret_key = "secret key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
#firebase inintialization
Config = {
  "apiKey": "AIzaSyD9W9OkykmTl6O-jBiOE4_i1-ctiMSKTqc",
  "authDomain": "agro-tech-test.firebaseapp.com",
  "databaseURL": "https://agro-tech-test-default-rtdb.firebaseio.com",
  "projectId": "agro-tech-test",
  "storageBucket": "agro-tech-test.appspot.com",
  "messagingSenderId": "15923880991",
  "appId": "1:15923880991:web:3f3e1be59ec493620c612a",
  "measurementId": "G-3V29W0W68T"
}
firebase = pyrebase.initialize_app(Config)
cred = credentials.Certificate("static/config.json")
firebase_admin.initialize_app(cred)
auth = firebase.auth()
db = firestore.client()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="static/config.json"
client = storage.Client()
bucket = client.get_bucket('agro-tech-test.appspot.com')

#Table initialization
lables = ("Date-Time","Temperature","Humidity","Moisture")
@app.route('/', methods=['POST', 'GET'])
def root():
    return render_template('login.html')


@app.route('/login', methods=['POST', 'GET'])
def login():
    umsg = "Please Check Your Credentials"
    smsg = "Log In Successfull!!!"
    if(request.method == 'POST'):
        email = request.form['mail']
        password = request.form['password']
       
        try:
            auth.sign_in_with_email_and_password(email, password)
            return redirect(url_for('dashboard', smsg=smsg))
        except:
            return render_template('login.html', us =umsg)
    return render_template('login.html')
@app.route('/upload', methods=['POST', 'GET'])
def upload():
    if(request.method == 'POST'):
        fname = request.form['fname']
        lname = request.form['lname']
        mail = request.form['semail']
        pass1 = request.form['pass']
        db.collection("Users").document(fname).set({
            "Email" : mail,
            "First Name": fname,
            "Last Name": lname
        })
        try:
            auth.create_user_with_email_and_password(mail,pass1)
            msg = 'Registration Successfull'
            return render_template('login.html', s=msg)
        except:
            umsg = 'Please Check Your Email and Password !! Unable to register!!'
            return render_template('login.html', user=mail)

@app.route('/dashboard', methods=['POST', 'GET'])
def dashboard():
    docs1 = db.collection('Sensor Data').order_by(u'DateAndTime',direction=firestore.Query.DESCENDING).limit(10)
    docs = docs1.stream()
    real_time = db.collection('Sensor Data').order_by(u'DateAndTime',direction=firestore.Query.DESCENDING).limit(1)
    real = real_time.stream()
    for doc in real:
        real_dict = doc.to_dict()    
    temp=real_dict['Temperature']
    hum=real_dict['Humidity']
    mos=real_dict['Moisture']
    result = []
    for doc in docs:
        dict_1 = doc.to_dict()
        result.append(dict_1)
    data1 = [] * 4
    test = [0]*4
    for d in result:
        test[0] = d['DateAndTime']
        test[1] = d['Temperature']
        test[2] = d['Humidity']
        test[3] = d['Moisture']
        data1 = data1 + test
    len1 = len(data1)
    pump_status = ''
    if request.method == 'POST':
        if request.form.get('action1') == 'ON':
            pump_status = "Water Pump is ON!!"
        elif request.form.get('action2') == 'OFF':  
            pump_status = "Water Pump is OFF!!"  
    
    return render_template('dash.html',lables=lables, data=data1, l=len1,temperature = temp, moisture=mos, humidity = hum, pumpStatus = pump_status)
@app.route('/datav')
def datav():
    return render_template('graph.html')
@app.route('/graph', methods=['POST','GET'])
def graph():
    docs1 = db.collection('Sensor Data').order_by(u'DateAndTime',direction=firestore.Query.DESCENDING).limit(5)
    docs = docs1.stream()
    result = []
    for doc in docs:
        dict_1 = doc.to_dict()
        result.append(dict_1)
    data1 = [] * 50
    label = [] * 50
    test = [0]*1
    test1 = [0] * 1
    for d in result:
        test[0] = d['Temperature']
        test1[0] = d['DateAndTime']
        data1 = data1 + test
        label = label + test1

    fig = go.Figure([go.Bar(x=label, y=data1)])
    fig.update_xaxes(title_text = "Date And Time")
    fig.update_yaxes(title_text = "Temperature in Celsius")
    fig.show()
    return redirect(url_for('datav'))

@app.route('/humidity', methods=['POST','GET'])
def humidity():
    docs1 = db.collection('Sensor Data').order_by(u'DateAndTime',direction=firestore.Query.DESCENDING).limit(5)
    docs = docs1.stream()
    result = []
    for doc in docs:
        dict_1 = doc.to_dict()
        result.append(dict_1)
    data1 = [] * 50
    label = [] * 50
    test = [0]*1
    test1 = [0] * 1
    for d in result:
        test[0] = d['Humidity']
        test1[0] = d['DateAndTime']
        data1 = data1 + test
        label = label + test1

    fig = go.Figure([go.Bar(x=label, y=data1)])
    fig.update_xaxes(title_text = "Date And Time")
    fig.update_yaxes(title_text = "Humidity in %")
    fig.show()
    return redirect(url_for('datav'))

@app.route('/moisture', methods=['POST','GET'])
def moisture():
    docs1 = db.collection('Sensor Data').order_by(u'DateAndTime',direction=firestore.Query.DESCENDING).limit(5)
    docs = docs1.stream()
    result = []
    for doc in docs:
        dict_1 = doc.to_dict()
        result.append(dict_1)
    data1 = [] * 50
    label = [] * 50
    test = [0]*1
    test1 = [0] * 1
    for d in result:
        test[0] = d['Moisture']
        test1[0] = d['DateAndTime']
        data1 = data1 + test
        label = label + test1

    fig = go.Figure([go.Bar(x=label, y=data1)])
    fig.update_xaxes(title_text = "Date And Time")
    fig.update_yaxes(title_text = "Moisture Condition")
    fig.show()
    return redirect(url_for('datav'))

@app.route('/contact', methods = ['GET','POST'])
def contact():
    if(request.method == 'POST'):
        cname = request.form['cname']
        cemail = request.form['cemail']
        cmsg = request.form['cmsg']
        db.collection("Contact Us").document(cemail).set({
            "Name": cname,
            "Email": cemail,
            "Message": cmsg
        })
    return redirect(url_for('dashboard'))


@app.route('/image', methods= ['GET','POST'])
def image():
    return render_template('img_upload.html')

@app.route('/upload_img', methods = ['POST'])
def upload_img():
    if 'file' not in request.files:
        flash('No file part')
        return render_template('img_upload.html')
    file = request.files['file']
    if file.filename == '':
        flash('No image selected for uploading')
        return render_template('img_upload.html')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        img = cv2.imread('static/upload/'+filename,1)
        image = img
        imageBlob = bucket.blob("/")
        imagePath = "Images/" + filename 
        imageBlob = bucket.blob(filename)
        imageBlob.upload_from_filename("static/upload/"+filename)
        img[:,:,2]=0 
        cv2.imwrite(UPLOAD_FOLDER+"/"+filename+"-blue.png",img)
        img[:,:,0]=0 
        cv2.imwrite(UPLOAD_FOLDER+"/"+filename+"-red.png",img)
        green = img[:,:,1] 
        cv2.imwrite(UPLOAD_FOLDER+"/"+filename+"-green.png",green) 
        
        imageBlob = bucket.blob(filename+"-blue.png")
        imageBlob.upload_from_filename("static/upload/"+filename+"-blue.png")
        imageBlob = bucket.blob(filename+"-red.png")
        imageBlob.upload_from_filename("static/upload/"+filename+"-red.png")
        imageBlob = bucket.blob(filename+"-green.png")
        imageBlob.upload_from_filename("static/upload/"+filename+"-green.png")
        flash('Image successfully uploaded and displayed below')
        return render_template('img_upload.html', filename=filename)
    else:
        flash('Allowed image types are - png, jpg, jpeg')
        return render_template('img_upload.html')
    
 
@app.route('/display/<filename>')
def display_image(filename):
    return redirect(url_for('static', filename='upload/' + filename), code=301)

@app.route('/displayr/<filename>')
def display_red(filename):
    return redirect(url_for('static', filename='upload'+"/"+filename+"-red.png"), code=301)

@app.route('/displayg/<filename>')
def display_green(filename):
    return redirect(url_for('static', filename='upload'+"/"+filename+"-green.png"), code=301)

@app.route('/displayb/<filename>')
def display_blue(filename):
    return redirect(url_for('static', filename='upload'+"/"+filename+"-blue.png"), code=301)

if __name__ == '__main__':
    app.run(debug=True)