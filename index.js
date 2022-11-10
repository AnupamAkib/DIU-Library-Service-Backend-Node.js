var cors = require('cors')
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}

require('dotenv').config()

var express = require('express');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var multer = require('multer');
var md5 = require('md5');
var app = express();
var multer = multer();

app.use(cors()); //no coresOption is used

app.use(bodyParser.json());
app.use(multer.array()); //for parsing multiple/form-data


const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log("Server Started");
})

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

var URL = "mongodb+srv://anupam:HdqblhYsM4y0ePwo@cluster0.vnrs1.mongodb.net?retryWrites=true&w=majority";

var config = { useUnifiedTopology: true };

MongoClient.connect(URL, config, function (err, myMongoClient) {
    if (err) {
        console.log("connection failed");
    }
    else {
        console.log("connection success");
        //backend code for controlling database

        app.get("/test", function(req, res){
            res.send({name:"akib", id:"191-35-2640"});
        })

        // for students
        //------------- CRUD on Books --------------
        app.get("/library/allBooks", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("books");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })

        app.post("/library/addBook", function(req, res){
            const _data = req.body;
            try {
                myMongoClient.db("DIU_Library_Service").collection("books").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.post("/library/editBook", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("books");
            let id = new ObjectId(req.body._id); //make id as object
            let _title = req.body.title;
            let _writer = req.body.writer;
            let _description = req.body.description;
            let _tags = req.body.tags;
            collection.updateOne(
                { _id: id }, //targeted data
                {
                    $set: {
                        title: _title,
                        writer: _writer,
                        description: _description,
                        tags : _tags
                    }
                },
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.post("/library/deleteBook", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("books");
            let id = new ObjectId(req.body._id); //make id as object
            collection.deleteOne(
                { _id: id }, //targeted data
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.post("/library/searchIndividualBook", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("books");
            let id = new ObjectId(req.body._id);
            collection.find(id).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })


        //------------ CRUD on Booklist -------------

        app.post("/student/viewBookList", function(req, res){
            const student_id = req.body.studentID;
            
            var collection = myMongoClient.db("DIU_Library_Service").collection("students");
            collection.find({studentID: student_id}).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"failed"});
                    }
                    else{
                        const savedBooks = data[0].savedBooks;
                        //res.send(savedBooks);
                        var collection1 = myMongoClient.db("DIU_Library_Service").collection("books");
                        collection1.find().toArray(function (err, bdata) {
                            if (err) {
                                console.log("Error selecting data");
                                res.send({ status: "failed" });
                            }
                            else {
                                let ret = [];
                                for(let i=0; i<savedBooks.length; i++){
                                    for(let j=0; j<bdata.length; j++){
                                        let tmp = bdata[j]._id;
                                        tmp = tmp.toString();
                                        if(tmp == savedBooks[i]){
                                            ret.push(bdata[j]);
                                        }
                                    }
                                }
                                res.send({ status: "done", studentID:student_id, result: ret });
                            }
                        })
                    }
                }
            })
        })


        app.post("/student/addInBookList", function(req, res){
            const student_id = req.body.studentID;
            const book_id = req.body.bookID;

            var collection = myMongoClient.db("DIU_Library_Service").collection("students");
            collection.find({studentID: student_id}).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"failed"});
                    }
                    else{
                        const savedBooks = data[0].savedBooks;
                        savedBooks.push(book_id);
                        //update savedBooks
                        var collection1 = myMongoClient.db("DIU_Library_Service").collection("students");
                        collection1.updateOne(
                            { studentID: student_id }, //targeted data
                            {
                                $set: {
                                    savedBooks : savedBooks
                                }
                            },
                            function (err, data) {
                                if (err) {
                                    res.send({ status: "failed" })
                                }
                                else {
                                    res.send({ status: "done" })
                                }
                            }
                        )
                    }
                }
            })
        })

        app.post("/student/removeFromBookList", function(req, res){
            const student_id = req.body.studentID;
            const book_id = req.body.bookID;

            var collection = myMongoClient.db("DIU_Library_Service").collection("students");
            collection.find({studentID: student_id}).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"failed"});
                    }
                    else{
                        const savedBooks = data[0].savedBooks;
                        const newBookList = [];
                        for(let i=0; i<savedBooks.length; i++){
                            if(savedBooks[i] != book_id){
                                newBookList.push(savedBooks[i]);
                            }
                        }
                        //update savedBooks
                        var collection1 = myMongoClient.db("DIU_Library_Service").collection("students");
                        collection1.updateOne(
                            { studentID: student_id }, //targeted data
                            {
                                $set: {
                                    savedBooks : newBookList
                                }
                            },
                            function (err, data) {
                                if (err) {
                                    res.send({ status: "failed" })
                                }
                                else {
                                    res.send({ status: "done" })
                                }
                            }
                        )
                    }
                }
            })
        })


        app.post("/student/checkInBookList", function(req, res){
            const student_id = req.body.studentID;
            const book_id = req.body.bookID;
            var collection = myMongoClient.db("DIU_Library_Service").collection("students");
            collection.find({studentID: student_id}).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"failed"});
                    }
                    else{
                        const savedBooks = data[0].savedBooks;
                        let found = false;
                        for(let i=0; i<savedBooks.length; i++){
                            if(savedBooks[i] == book_id){
                                found = true;
                                break;
                            }
                        }
                        if(found){
                            res.send({status:"found"});
                        }
                        else{
                            res.send({status:"not found"});
                        }
                    }
                }
            })
        })


        //----------- Student Login Registration Authentication API -------------
        app.post("/student/registration", function(req, res){
            const _data = req.body;
            try {
                myMongoClient.db("DIU_Library_Service").collection("students").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.post("/student/individualStudentInfo", function(req, res){
            const studentID = req.body.studentID;
            var collection = myMongoClient.db("DIU_Library_Service").collection("students");
            collection.find({studentID}).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"not found"});
                    }
                    else{
                        res.send({ status: "done", result: data });
                    }
                }
            })
        })

        app.post("/student/changePassword", function(req, res){
            const studentID = req.body.studentID;
            const newPassword = req.body.newPassword;
            var collection = myMongoClient.db("DIU_Library_Service").collection("students");
                collection.updateOne(
                    { studentID }, //targeted data
                    {
                        $set: {
                            password : newPassword
                        }
                    },
                    function (err, data) {
                        if (err) {
                            res.send({ status: "failed" })
                        }
                        else {
                            res.send({ status: "done", studentID, newPassword })
                        }
                    }
                )
        })


        //--------------- System Mailer ----------------
        app.post("/system/send_mail", function (req, res) {
            var _to = req.body.sendTo;
            var _subject = req.body.subject;
            var _body = req.body.emailBody;

            const nodemailer = require('nodemailer');
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'diu.library.service@gmail.com',
                    pass: 'kduvqkzrvdkljvad'
                }
            });
            
            let mailDetails = {
                from: '"DIU Library Service" <diu.library.service@gmail.com>',
                to: _to,
                subject: _subject,
                html: _body
            };
            
            mailTransporter.sendMail(mailDetails, function(err, data) {
                if(err) {
                    res.send({ result: "failed" });
                } else {
                    res.send({ result: "done" });
                }
            });
        })






        //for security guard
        app.post("/guards/individualGuardInfo", function(req, res){
            const guardEmpID = req.body.guardEmpID;
            var collection = myMongoClient.db("DIU_Library_Service").collection("guards");
            collection.find({guardEmpID:guardEmpID}).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"not found"});
                    }
                    else{
                        res.send({ status: "done", result: data });
                    }
                }
            })
        })

        app.post("/guards/allGuardInfo", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("guards");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"not found"});
                    }
                    else{
                        res.send({ status: "done", result: data });
                    }
                }
            })
        })

        app.post("/guards/addGuard", function(req, res){
            const _data = req.body;
            try {
                myMongoClient.db("DIU_Library_Service").collection("guards").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.post("/guards/deleteGuard", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("guards");
            let id = new ObjectId(req.body._id); //make id as object
            collection.deleteOne(
                { _id: id }, //targeted data
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })


        //Locker Entity CRUD
        app.post("/guards/giveLockerKey", function(req, res){ //add in locker entity
            const _data = req.body;
            try {
                myMongoClient.db("DIU_Library_Service").collection("locker_entity").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.post("/guards/markLockerKeyReturn", function(req, res){ //add in locker entity
            const keyNumber = req.body.keyNumber;
            const returnTime = req.body.returnTime;
            const RT_milliseconds = req.body.RT_milliseconds;

            var collection = myMongoClient.db("DIU_Library_Service").collection("locker_entity");
            collection.updateOne(
                { keyNumber:keyNumber, RT_milliseconds:"-"}, //targeted data
                {
                    $set: {
                        returnTime : returnTime,
                        RT_milliseconds : RT_milliseconds
                    }
                },
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.post("/guards/allLockerEntity", function(req, res){
            var collection = myMongoClient.db("DIU_Library_Service").collection("locker_entity");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    if(data.length==0){
                        res.send({status:"not found"});
                    }
                    else{
                        let ret_data = [];
                        const minute_convert = 1000 * 60;
                        for(let i=0; i<data.length; i++){
                            let tmp = {};
                            if(data[i].RT_milliseconds != "-"){
                                let taken_time = parseInt(data[i].HT_milliseconds);
                                let return_time = parseInt(data[i].RT_milliseconds);
                                let taken_time_min = Math.round(parseInt(taken_time) / minute_convert);
                                let return_time_min = Math.round(parseInt(return_time) / minute_convert);
                                let duration = return_time_min - taken_time_min;

                                let hour = Math.floor(duration / 60);
                                let minute = duration % 60;

                                let duration_string = "";
                                if(hour){
                                    duration_string = hour.toString();
                                    if(hour>1) duration_string += " hours, ";
                                    else duration_string += " hour, ";
                                }
                                duration_string += minute.toString();
                                if(minute>1) duration_string += " minutes";
                                else duration_string += " minute";

                                tmp = {
                                    studentID : data[i].studentID,
                                    keyNumber : data[i].keyNumber,
                                    handoverTime : data[i].handoverTime,
                                    returnTime : data[i].returnTime,
                                    duration : duration_string
                                }
                            }
                            else{
                                tmp = {
                                    studentID : data[i].studentID,
                                    keyNumber : data[i].keyNumber,
                                    handoverTime : data[i].handoverTime,
                                    returnTime : data[i].returnTime,
                                    duration : "-"
                                }
                            }
                            ret_data.push(tmp);
                        }
                        //console.log(ret_data)
                        res.send({ status: "done", result: ret_data }); //duration returning in minute only
                    }
                }
            })
        })



        app.post("/admin/readAllAdmin", function(req, res){ //read all admin information
            var collection = myMongoClient.db("DIU_Library_Service").collection("admin");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })

        app.post("/admin/addAdmin", function(req, res){ //add admin
            const _data = req.body;
            try {
                myMongoClient.db("DIU_Library_Service").collection("admin").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.post("/admin/editAdmin", function(req, res){ //edit admin
            var collection = myMongoClient.db("DIU_Library_Service").collection("admin");
            let id = new ObjectId(req.body._id); //make id as object
            let _name = req.body.name;
            let _password = req.body.password;
            let _access = req.body.access;
            collection.updateOne(
                { _id: id }, //targeted data
                {
                    $set: {
                        name: _name,
                        password: _password,
                        access: _access
                    }
                },
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.post("/admin/deleteAdmin", function(req, res){ //delete admin
            var collection = myMongoClient.db("DIU_Library_Service").collection("admin");
            let id = new ObjectId(req.body._id); //make id as object
            collection.deleteOne(
                { _id: id }, //targeted data
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })
    }
})

app.get("/", function (req, res) {
    res.send("<div style='padding: 25px 5px 20px 5px; font-family:arial'><meta name='viewport' content='width=device-width, initial-scale=1.0'><center><img src='https://daffodilvarsity.edu.bd/template/images/diulogoside.png' width='250'/><h1>DIU Library Service</h1>Server made by <b>Mir Anupam Hossain Akib</b> - 2022</center></div>");
})